import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API = "http://127.0.0.1:8000";

function App() {
  const [dashboard, setDashboard] = useState(null);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);

  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    stock_quantity: "",
    low_stock_threshold: 10
  });

  const [customerForm, setCustomerForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: ""
  });
  const [orderForm, setOrderForm] = useState({
  customer_id: "",
  product_id: "",
  quantity: ""
});

  const loadData = async () => {
    try {
      const [dashboardRes, productsRes, customersRes, ordersRes] =
        await Promise.all([
          axios.get(`${API}/dashboard/`),
          axios.get(`${API}/products/`),
          axios.get(`${API}/customers/`),
          axios.get(`${API}/orders/`)
        ]);

      setDashboard(dashboardRes.data);
      setProducts(productsRes.data);
      setCustomers(customersRes.data);
      setOrders(ordersRes.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const createProduct = async (e) => {
    e.preventDefault();

    try {
      await axios.post(`${API}/products/`, {
        ...productForm,
        price: Number(productForm.price),
        stock_quantity: Number(productForm.stock_quantity),
        low_stock_threshold: Number(productForm.low_stock_threshold)
      });

      alert("Product created successfully");

      setProductForm({
        name: "",
        description: "",
        price: "",
        stock_quantity: "",
        low_stock_threshold: 10
      });

      loadData();
    } catch (error) {
      alert(error.response?.data?.detail || "Failed to create product");
    }
  };

  const createCustomer = async (e) => {
    e.preventDefault();

    try {
      await axios.post(`${API}/customers/`, customerForm);

      alert("Customer created successfully");

      setCustomerForm({
        name: "",
        email: "",
        phone: "",
        address: ""
      });

      loadData();
    } catch (error) {
      alert(error.response?.data?.detail || "Failed to create customer");
    }
  };
  const createOrder = async (e) => {
  e.preventDefault();

  try {
    const response = await axios.post(`${API}/orders/`, {
      customer_id: Number(orderForm.customer_id),
      items: [
        {
          product_id: Number(orderForm.product_id),
          quantity: Number(orderForm.quantity)
        }
      ]
    });

    alert(response.data.message);

    setOrderForm({
      customer_id: "",
      product_id: "",
      quantity: ""
    });

    loadData();
  } catch (error) {
    alert(
      error.response?.data?.detail ||
      "Failed to create order"
    );
  }
};

  return (
    <div className="app">

      <header className="header">
        <div>
          <h1>Sales & Inventory</h1>
          <p>Management Dashboard</p>
        </div>

        <button onClick={loadData}>Refresh</button>
      </header>

      <main className="container">

        <section className="cards">

          <div className="card">
            <span>Products</span>
            <strong>{dashboard?.total_products ?? 0}</strong>
          </div>

          <div className="card">
            <span>Customers</span>
            <strong>{dashboard?.total_customers ?? 0}</strong>
          </div>

          <div className="card">
            <span>Total Orders</span>
            <strong>{dashboard?.total_orders ?? 0}</strong>
          </div>

          <div className="card">
            <span>Pending Approval</span>
            <strong>{dashboard?.pending_orders ?? 0}</strong>
          </div>

          <div className="card">
            <span>Total Sales</span>
            <strong>
              ₹{dashboard?.total_sales?.toLocaleString() ?? 0}
            </strong>
          </div>

        </section>

        <section className="forms">

          <div className="form-card">
            <h2>Add Product</h2>

            <form onSubmit={createProduct}>

              <input
                placeholder="Product name"
                value={productForm.name}
                onChange={(e) =>
                  setProductForm({
                    ...productForm,
                    name: e.target.value
                  })
                }
                required
              />

              <input
                placeholder="Description"
                value={productForm.description}
                onChange={(e) =>
                  setProductForm({
                    ...productForm,
                    description: e.target.value
                  })
                }
              />

              <input
                type="number"
                placeholder="Price"
                value={productForm.price}
                onChange={(e) =>
                  setProductForm({
                    ...productForm,
                    price: e.target.value
                  })
                }
                required
              />

              <input
                type="number"
                placeholder="Stock quantity"
                value={productForm.stock_quantity}
                onChange={(e) =>
                  setProductForm({
                    ...productForm,
                    stock_quantity: e.target.value
                  })
                }
                required
              />

              <input
                type="number"
                placeholder="Low stock threshold"
                value={productForm.low_stock_threshold}
                onChange={(e) =>
                  setProductForm({
                    ...productForm,
                    low_stock_threshold: e.target.value
                  })
                }
              />

              <button type="submit">Add Product</button>

            </form>
          </div>

          <div className="form-card">
            <h2>Add Customer</h2>

            <form onSubmit={createCustomer}>

              <input
                placeholder="Customer name"
                value={customerForm.name}
                onChange={(e) =>
                  setCustomerForm({
                    ...customerForm,
                    name: e.target.value
                  })
                }
                required
              />

              <input
                type="email"
                placeholder="Email"
                value={customerForm.email}
                onChange={(e) =>
                  setCustomerForm({
                    ...customerForm,
                    email: e.target.value
                  })
                }
              />

              <input
                placeholder="Phone"
                value={customerForm.phone}
                onChange={(e) =>
                  setCustomerForm({
                    ...customerForm,
                    phone: e.target.value
                  })
                }
                required
              />

              <input
                placeholder="Address"
                value={customerForm.address}
                onChange={(e) =>
                  setCustomerForm({
                    ...customerForm,
                    address: e.target.value
                  })
                }
              />

              <button type="submit">Add Customer</button>

            </form>
          </div>
          <div className="form-card">
  <h2>Create Sales Order</h2>

  <form onSubmit={createOrder}>

    <select
      value={orderForm.customer_id}
      onChange={(e) =>
        setOrderForm({
          ...orderForm,
          customer_id: e.target.value
        })
      }
      required
    >
      <option value="">Select Customer</option>

      {customers.map((customer) => (
        <option key={customer.id} value={customer.id}>
          {customer.name}
        </option>
      ))}
    </select>

    <select
      value={orderForm.product_id}
      onChange={(e) =>
        setOrderForm({
          ...orderForm,
          product_id: e.target.value
        })
      }
      required
    >
      <option value="">Select Product</option>

      {products.map((product) => (
        <option key={product.id} value={product.id}>
          {product.name} - ₹{product.price}
        </option>
      ))}
    </select>

    <input
      type="number"
      min="1"
      placeholder="Quantity"
      value={orderForm.quantity}
      onChange={(e) =>
        setOrderForm({
          ...orderForm,
          quantity: e.target.value
        })
      }
      required
    />

    <button type="submit">
      Create Order
    </button>

  </form>
</div>

        </section>

        <section className="section">
          <h2>Products</h2>

          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Threshold</th>
              </tr>
            </thead>

            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>{product.id}</td>
                  <td>{product.name}</td>
                  <td>₹{product.price}</td>
                  <td>{product.stock_quantity}</td>
                  <td>{product.low_stock_threshold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="section">
          <h2>Customers</h2>

          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
              </tr>
            </thead>

            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td>{customer.id}</td>
                  <td>{customer.name}</td>
                  <td>{customer.email}</td>
                  <td>{customer.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="section">
          <h2>Sales Orders</h2>

          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
                <th>Approval</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.customer_id}</td>
                  <td>₹{order.total_amount}</td>
                  <td>{order.status}</td>
                  <td>
  {order.approval_status}

  {order.approval_status === "pending" && (
    <button
      onClick={async () => {
        try {
          await axios.post(
            `${API}/orders/${order.id}/approve`,
            {
              manager_id: 1,
              comments: "Approved by manager"
            }
          );

          alert("Order approved successfully");

          loadData();
        } catch (error) {
          alert(
            error.response?.data?.detail ||
            "Approval failed"
          );
        }
      }}
    >
      Approve
    </button>
  )}
</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

      </main>
    </div>
  );
}

export default App;