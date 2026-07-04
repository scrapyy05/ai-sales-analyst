from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class SaleBase(BaseModel):
    customer_id: int
    product_id: int
    quantity: int
    total_amount: float

class SaleCreate(SaleBase):
    pass

class SaleResponse(SaleBase):
    id: int
    user_id: int
    sale_date: datetime

    model_config = ConfigDict(from_attributes=True)
