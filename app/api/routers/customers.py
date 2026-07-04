from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerResponse
from app.api.dependencies import get_current_user
from app.models.user import User

from typing import List

router = APIRouter(prefix="/customers", tags=["Customers"])

@router.get("/", response_model=List[CustomerResponse])
def get_customers(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Customer).all()

@router.post("/", response_model=CustomerResponse)
def create_customer(
    customer_in: CustomerCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) # Protected Route!
):
    new_customer = Customer(**customer_in.model_dump())
    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)
    return new_customer
