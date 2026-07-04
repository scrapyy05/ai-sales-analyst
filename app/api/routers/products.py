from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductResponse
from app.api.dependencies import get_current_user
from app.models.user import User

from typing import List

router = APIRouter(prefix="/products", tags=["Products"])

@router.get("/", response_model=List[ProductResponse])
def get_products(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Product).all()

@router.post("/", response_model=ProductResponse)
def create_product(
    product_in: ProductCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_product = Product(**product_in.model_dump())
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product
