from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.database import get_db
from app.models.sale import Sale
from app.models.product import Product
from app.models.customer import Customer
from app.api.dependencies import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/summary")
def get_summary(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    total_rev = db.query(func.sum(Sale.total_amount)).scalar() or 0.0
    total_sales = db.query(func.count(Sale.id)).scalar() or 0
    total_cust = db.query(func.count(Customer.id)).scalar() or 0
    total_prod = db.query(func.count(Product.id)).scalar() or 0
    return {
        "total_revenue": total_rev,
        "total_sales": total_sales,
        "total_customers": total_cust,
        "total_products": total_prod
    }

@router.get("/total-revenue")
def get_total_revenue(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    total = db.query(func.sum(Sale.total_amount)).scalar()
    return {"total_revenue": total or 0.0}

@router.get("/top-products")
def get_top_products(limit: int = 5, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # Join Products and Sales, group by product name, sum the revenue, order descending
    results = (
        db.query(Product.name, func.sum(Sale.total_amount).label("revenue"))
        .join(Sale, Product.id == Sale.product_id)
        .group_by(Product.name)
        .order_by(func.sum(Sale.total_amount).desc())
        .limit(limit)
        .all()
    )
    return [{"product": r.name, "revenue": r.revenue} for r in results]

@router.get("/revenue-by-category")
def get_revenue_by_category(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # Join Products and Sales, group by product category, sum the revenue
    results = (
        db.query(Product.category, func.sum(Sale.total_amount).label("revenue"))
        .join(Sale, Product.id == Sale.product_id)
        .group_by(Product.category)
        .all()
    )
    return [{"category": r.category, "revenue": r.revenue} for r in results]

@router.get("/top-customers")
def get_top_customers(limit: int = 5, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # Join Customers and Sales, group by customer name, sum the revenue
    results = (
        db.query(Customer.name, func.sum(Sale.total_amount).label("revenue"))
        .join(Sale, Customer.id == Sale.customer_id)
        .group_by(Customer.name)
        .order_by(func.sum(Sale.total_amount).desc())
        .limit(limit)
        .all()
    )
    return [{"customer": r.name, "revenue": r.revenue} for r in results]
