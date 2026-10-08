from datetime import datetime
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    Customer,
    Product,
    SalesOrder,
    SalesOrderItem,
    Approval,
    InventoryTransaction,
)
from app.schemas import SalesOrderCreate, ApprovalAction


router = APIRouter(
    prefix="/orders",
    tags=["Sales Orders"]
)

APPROVAL_THRESHOLD = Decimal("50000")


@router.post("/")
def create_order(
    order_data: SalesOrderCreate,
    db: Session = Depends(get_db)
):
    # Check customer
    customer = db.query(Customer).filter(
        Customer.id == order_data.customer_id,
        Customer.is_active == True
    ).first()

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    if not order_data.items:
        raise HTTPException(
            status_code=400,
            detail="Order must contain at least one product"
        )

    total_amount = Decimal("0")
    products_data = []

    # Check products and stock
    for item in order_data.items:

        if item.quantity <= 0:
            raise HTTPException(
                status_code=400,
                detail="Quantity must be greater than 0"
            )

        product = db.query(Product).filter(
            Product.id == item.product_id,
            Product.is_active == True
        ).first()

        if not product:
            raise HTTPException(
                status_code=404,
                detail=f"Product {item.product_id} not found"
            )

        if product.stock_quantity < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for {product.name}. Available stock: {product.stock_quantity}"
            )

        item_total = Decimal(str(product.price)) * item.quantity
        total_amount += item_total

        products_data.append({
            "product": product,
            "quantity": item.quantity,
            "unit_price": product.price,
            "total_price": item_total
        })

    # Check approval requirement
    needs_approval = total_amount > APPROVAL_THRESHOLD

    order = SalesOrder(
        customer_id=order_data.customer_id,
        total_amount=total_amount,
        status="pending" if needs_approval else "confirmed",
        approval_status="pending" if needs_approval else "not_required"
    )

    db.add(order)
    db.flush()

    # Create order items
    for item in products_data:
        order_item = SalesOrderItem(
            order_id=order.id,
            product_id=item["product"].id,
            quantity=item["quantity"],
            unit_price=item["unit_price"],
            total_price=item["total_price"]
        )

        db.add(order_item)

    # If approval is NOT required, update inventory immediately
    if not needs_approval:

        for item in products_data:
            product = item["product"]
            quantity = item["quantity"]

            product.stock_quantity -= quantity

            transaction = InventoryTransaction(
                product_id=product.id,
                order_id=order.id,
                transaction_type="SALE",
                quantity=quantity
            )

            db.add(transaction)

    # If approval required, create approval record
    else:
        approval = Approval(
            order_id=order.id,
            status="pending"
        )

        db.add(approval)

    db.commit()
    db.refresh(order)

    return {
        "message": (
            "Order created and confirmed"
            if not needs_approval
            else "Order created and waiting for manager approval"
        ),
        "order_id": order.id,
        "total_amount": float(total_amount),
        "status": order.status,
        "approval_status": order.approval_status
    }


@router.get("/")
def get_orders(db: Session = Depends(get_db)):
    orders = db.query(SalesOrder).order_by(
        SalesOrder.id.desc()
    ).all()

    return orders


@router.post("/{order_id}/approve")
def approve_order(
    order_id: int,
    approval_data: ApprovalAction,
    db: Session = Depends(get_db)
):
    order = db.query(SalesOrder).filter(
        SalesOrder.id == order_id
    ).first()

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found"
        )

    if order.approval_status != "pending":
        raise HTTPException(
            status_code=400,
            detail="This order is not waiting for approval"
        )

    approval = db.query(Approval).filter(
        Approval.order_id == order_id,
        Approval.status == "pending"
    ).first()

    if not approval:
        raise HTTPException(
            status_code=404,
            detail="Approval request not found"
        )

    order_items = db.query(SalesOrderItem).filter(
        SalesOrderItem.order_id == order_id
    ).all()

    # Check stock again before approval
    for item in order_items:
        product = db.query(Product).filter(
            Product.id == item.product_id
        ).first()

        if product.stock_quantity < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for {product.name}"
            )

    # Update inventory
    for item in order_items:

        product = db.query(Product).filter(
            Product.id == item.product_id
        ).first()

        product.stock_quantity -= item.quantity

        transaction = InventoryTransaction(
            product_id=product.id,
            order_id=order.id,
            transaction_type="SALE",
            quantity=item.quantity
        )

        db.add(transaction)

    # Update approval
    approval.status = "approved"
    approval.manager_id = approval_data.manager_id
    approval.comments = approval_data.comments
    approval.decided_at = datetime.utcnow()

    # Update order
    order.status = "confirmed"
    order.approval_status = "approved"

    db.commit()

    return {
        "message": "Order approved successfully",
        "order_id": order.id,
        "status": order.status,
        "approval_status": order.approval_status
    }


@router.post("/{order_id}/reject")
def reject_order(
    order_id: int,
    approval_data: ApprovalAction,
    db: Session = Depends(get_db)
):
    order = db.query(SalesOrder).filter(
        SalesOrder.id == order_id
    ).first()

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found"
        )

    if order.approval_status != "pending":
        raise HTTPException(
            status_code=400,
            detail="This order is not waiting for approval"
        )

    approval = db.query(Approval).filter(
        Approval.order_id == order_id,
        Approval.status == "pending"
    ).first()

    if not approval:
        raise HTTPException(
            status_code=404,
            detail="Approval request not found"
        )

    approval.status = "rejected"
    approval.manager_id = approval_data.manager_id
    approval.comments = approval_data.comments
    approval.decided_at = datetime.utcnow()

    order.status = "rejected"
    order.approval_status = "rejected"

    db.commit()

    return {
        "message": "Order rejected successfully",
        "order_id": order.id,
        "status": order.status,
        "approval_status": order.approval_status
    }