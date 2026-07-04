from sqlalchemy import Column, Integer, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    customer_id = Column(Integer, ForeignKey("customers.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    
    quantity = Column(Integer, nullable=False)
    total_amount = Column(Numeric(15, 2), nullable=False)
    sale_date = Column(DateTime, default=func.now())

    # Relationships mapping back to the other tables
    user = relationship("User", back_populates="sales")
    customer = relationship("Customer", back_populates="sales")
    product = relationship("Product", back_populates="sales")
