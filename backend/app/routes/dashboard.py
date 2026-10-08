from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import Product, Customer, SalesOrder


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("/")
def get_dashboard(db: Session = Depends(get_db)):

    total_products = db.query(Product).filter(
        Product.is_active == True
    ).count()

    total_customers = db.query(Customer).filter(
        Customer.is_active == True
    ).count()

    total_orders = db.query(SalesOrder).count()

    pending_orders = db.query(SalesOrder).filter(
        SalesOrder.approval_status == "pending"
    ).count()

    confirmed_orders = db.query(SalesOrder).filter(
        SalesOrder.status == "confirmed"
    ).count()

    total_sales = db.query(
        func.sum(SalesOrder.total_amount)
    ).filter(
        SalesOrder.status == "confirmed"
    ).scalar() or 0

    low_stock_products = db.query(Product).filter(
        Product.is_active == True,
        Product.stock_quantity <= Product.low_stock_threshold
    ).count()

    return {
        "total_products": total_products,
        "total_customers": total_customers,
        "total_orders": total_orders,
        "pending_orders": pending_orders,
        "confirmed_orders": confirmed_orders,
        "total_sales": float(total_sales),
        "low_stock_products": low_stock_products
    }