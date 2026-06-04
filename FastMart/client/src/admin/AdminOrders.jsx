import { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminOrders = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/orders', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.message || 'Unable to load orders');
          return;
        }
        setOrders(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
        setError('Could not connect to the server. Make sure the API is running.');
      }
    };
    fetchOrders();
  }, [user, navigate]);

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`/api/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (res.ok) {
        setOrders(orders.map(order => order._id === id ? { ...order, status } : order));
      } else {
        setError(data.message || 'Unable to update order status');
      }
    } catch (error) {
      console.error(error);
      setError('Could not connect to the server. Make sure the API is running.');
    }
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div style={containerStyle}>
      <h2 style={{ color: '#f97316', marginBottom: '20px' }}>Manage Orders</h2>
      {error && <p style={{ color: '#f87171', marginBottom: '15px' }}>{error}</p>}
      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr style={rowStyle}>
              <th style={thStyle}>ORDER ID</th>
              <th style={thStyle}>USER</th>
              <th style={thStyle}>TOTAL</th>
              <th style={thStyle}>DATE</th>
              <th style={thStyle}>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order._id} style={rowStyle}>
                <td style={tdStyle}>{order._id.substring(0, 8)}...</td>
                <td style={tdStyle}>{order.userId?.name || 'Deleted User'}</td>
                <td style={tdStyle}>Rs. {Number(order.totalAmount).toFixed(2)}</td>
                <td style={tdStyle}>{new Date(order.createdAt).toLocaleDateString()}</td>
                <td style={tdStyle}>
                  <select 
                    value={order.status} 
                    onChange={(e) => updateStatus(order._id, e.target.value)}
                    style={{ background: '#09090b', color: '#fff', padding: '6px', border: '1px solid #27272a', borderRadius: '4px', outline: 'none' }}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr style={rowStyle}>
                <td style={tdStyle} colSpan="5">No orders found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const containerStyle = { maxWidth: '1200px', margin: '40px auto', padding: '30px', background: '#18181b', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', color: '#fafafa' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const rowStyle = { borderBottom: '1px solid rgba(255,255,255,0.1)' };
const thStyle = { padding: '15px', textAlign: 'left', color: '#a1a1aa', fontSize: '0.9rem' };
const tdStyle = { padding: '15px', textAlign: 'left' };

export default AdminOrders;
