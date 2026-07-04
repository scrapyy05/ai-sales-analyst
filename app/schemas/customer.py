from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional

class CustomerBase(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    company: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
