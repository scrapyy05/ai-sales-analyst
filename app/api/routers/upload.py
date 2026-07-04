from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
import pandas as pd
from io import StringIO
from app.db.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.models.customer import Customer
from app.models.product import Product
from app.models.sale import Sale
from app.core.cache import query_cache

router = APIRouter(prefix="/upload", tags=["Data Upload"])

def _reset_table_data_and_ids(db: Session):
    """Wipes table records and resets primary key autoincrement ID sequences back to 1."""
    if db.bind.dialect.name == "postgresql":
        db.execute(text("TRUNCATE TABLE sales, products, customers RESTART IDENTITY CASCADE;"))
    else:
        db.query(Sale).delete(synchronize_session=False)
        db.query(Product).delete(synchronize_session=False)
        db.query(Customer).delete(synchronize_session=False)
        try:
            db.execute(text("DELETE FROM sqlite_sequence WHERE name IN ('sales', 'products', 'customers');"))
        except Exception:
            pass

@router.post("/csv")
async def upload_csv(
    file: UploadFile = File(...),
    overwrite: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) # Only logged in users can upload data
):
    # 1. Validate file extension
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")
    
    # 2. Read the file into memory
    contents = await file.read()
    
    # 3. Parse with Pandas
    try:
        df = pd.read_csv(StringIO(contents.decode('utf-8')))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading CSV: {str(e)}")

    # 4. Validate Columns
    required_cols = {'customer_name', 'customer_email', 'product_name', 'price', 'quantity'}
    if not required_cols.issubset(df.columns):
        raise HTTPException(status_code=400, detail=f"CSV must contain columns: {required_cols}")

    # If overwrite is True, clear existing sales records and reset ID sequences!
    if overwrite:
        try:
            _reset_table_data_and_ids(db)
            db.commit()
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to overwrite existing sales: {str(e)}")

    records_inserted = 0
    
    # 5. Process row by row
    for _, row in df.iterrows():
        # -- Check if Customer exists, if not create --
        customer = db.query(Customer).filter(Customer.email == row['customer_email']).first()
        if not customer:
            customer = Customer(name=row['customer_name'], email=row['customer_email'])
            db.add(customer)
            db.commit()
            db.refresh(customer)
            
        # -- Check if Product exists, if not create --
        product = db.query(Product).filter(Product.name == row['product_name']).first()
        if not product:
            product = Product(
                name=row['product_name'], 
                price=row['price'],
                category=row.get('category', 'General')
            )
            db.add(product)
            db.commit()
            db.refresh(product)
            
        # -- Log the Sale --
        total_amount = float(row['price']) * int(row['quantity'])
        sale = Sale(
            user_id=current_user.id, # Logged against the user who uploaded the file!
            customer_id=customer.id,
            product_id=product.id,
            quantity=int(row['quantity']),
            total_amount=total_amount
        )
        db.add(sale)
        records_inserted += 1

    # Commit all the sales at once at the very end
    db.commit()
    query_cache.clear() # ⚡ Wipes Redis cache clean because new CSV data arrived!
    
    return {"message": "Data successfully ingested", "records_inserted": records_inserted, "overwritten": overwrite}

@router.delete("/clear")
def clear_all_data(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Wipes all sales, products, and customer records from the database and resets ID sequences back to 1."""
    try:
        _reset_table_data_and_ids(db)
        db.commit()
        query_cache.clear()
        return {"message": "All sales, products, and customers have been cleared and ID sequences reset back to 1."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database deletion failed: {str(e)}")



