from pydantic import BaseModel, ConfigDict
from typing import Optional


class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    stock_quantity: int
    low_stock_threshold: int = 10


class ProductResponse(ProductCreate):
    id: int
    is_active: bool

    model_config = ConfigDict(from_attributes=True)

class CustomerCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: str
    address: Optional[str] = None


class CustomerResponse(CustomerCreate):
    id: int
    is_active: bool

    model_config = ConfigDict(from_attributes=True)
class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int


class SalesOrderCreate(BaseModel):
    customer_id: int
    items: list[OrderItemCreate]


class ApprovalAction(BaseModel):
    manager_id: int
    comments: Optional[str] = None