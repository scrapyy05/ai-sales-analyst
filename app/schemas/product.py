from pydantic import BaseModel, ConfigDict
from typing import Optional

class ProductBase(BaseModel):
    name: str
    category: Optional[str] = None
    price: float

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
