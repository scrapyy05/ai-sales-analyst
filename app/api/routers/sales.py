from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.sale import Sale
from app.schemas.sale import SaleCreate, SaleResponse
from app.api.dependencies import get_current_user
from app.models.user import User
from app.core.cache import query_cache

router = APIRouter(prefix="/sales", tags=["Sales"])

@router.post("/", response_model=SaleResponse)
def create_sale(
    sale_in: SaleCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Notice: We securely append the logged-in user's ID
    new_sale = Sale(**sale_in.model_dump(), user_id=current_user.id)
    db.add(new_sale)
    db.commit()
    db.refresh(new_sale)
    query_cache.clear() # ⚡ Wipes Redis cache clean because sales mutated!
    return new_sale

@router.get("/", response_model=List[SaleResponse])
def get_sales(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Sale).all()

@router.put("/{sale_id}", response_model=SaleResponse)
def update_sale(
    sale_id: int,
    sale_in: SaleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    
    # Update fields dynamically
    for key, value in sale_in.model_dump().items():
        setattr(sale, key, value)
        
    db.commit()
    db.refresh(sale)
    query_cache.clear() # ⚡ Wipes Redis cache clean because sales mutated!
    return sale

@router.delete("/{sale_id}")
def delete_sale(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
        
    db.delete(sale)
    db.commit()
    query_cache.clear() # ⚡ Wipes Redis cache clean because sales mutated!
    return {"message": "Sale deleted successfully"}
