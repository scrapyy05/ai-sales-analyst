from sqlalchemy import Column, Integer, String, Numeric
from sqlalchemy.orm import relationship
from app.db.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    category = Column(String(100))
    price = Column(Numeric(10, 2), nullable=False)

    # A Product can be part of many Sales
    sales = relationship("Sale", back_populates="product")
