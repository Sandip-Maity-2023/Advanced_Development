import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API= import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AddProduct = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '', description: '', price: '', category: '', stock: '', imageUrl: ''
  });
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user || user.role !== 'admin') return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image && !formData.imageUrl.trim()) {
      return setError('Please upload an image or paste an image URL');
    }
    
    setLoading(true);
    setError('');
    const data = new FormData();
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('price', formData.price);
    data.append('category', formData.category);
    data.append('stock', formData.stock);
    data.append('imageUrl', formData.imageUrl.trim());
    if (image) data.append('image', image);

    try {
      const res = await fetch(`${API}/api/products`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${user.token}` },
        body: data
      });
      const responseData = await res.json();
      
      if (res.ok) {
        alert('Product created successfully with Cloudinary Image URL!');
        navigate('/admin/products');
      } else {
        setError(responseData.message || 'Error creating product');
      }
    } catch (error) {
      console.error(error);
      setError('Could not connect to the server. Make sure the API is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', background: '#18181b', padding: '40px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
      <h2 style={{ color: '#f97316', marginBottom: '20px' }}>Add New Product</h2>
      {error && <p style={{ color: '#f87171', marginBottom: '15px' }}>{error}</p>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input 
          type="text" placeholder="Product Name" required 
          onChange={(e) => setFormData({...formData, name: e.target.value})} 
          style={inputStyle} 
        />
        <textarea 
          placeholder="Description" required rows="4"
          onChange={(e) => setFormData({...formData, description: e.target.value})} 
          style={inputStyle} 
        />
        <input 
          type="number" placeholder="Price" required 
          onChange={(e) => setFormData({...formData, price: e.target.value})} 
          style={inputStyle} 
        />
        <input 
          type="text" placeholder="Category" required 
          onChange={(e) => setFormData({...formData, category: e.target.value})} 
          style={inputStyle} 
        />
        <input 
          type="number" placeholder="Stock Quantity" required 
          onChange={(e) => setFormData({...formData, stock: e.target.value})} 
          style={inputStyle} 
        />
        <input
          type="url" placeholder="Image URL"
          value={formData.imageUrl}
          onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
          style={inputStyle}
        />
        
        <div style={{ padding: '15px', border: '1px dashed #f97316', borderRadius: '8px' }}>
          <label style={{ display: 'block', marginBottom: '10px', color: '#a1a1aa' }}>Upload Product Image (Optional)</label>
          <input 
            type="file" accept="image/*"
            onChange={(e) => setImage(e.target.files[0])} 
            style={{ color: '#fff' }}
          />
        </div>

        <button type="submit" disabled={loading} className="btn" style={{ marginTop: '10px' }}>
          {loading ? 'Uploading & Creating...' : 'Publish Product'}
        </button>
      </form>
    </div>
  );
};

const inputStyle = {
  padding: '12px',
  background: '#09090b',
  border: '1px solid #27272a',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '15px',
  outline: 'none'
};

export default AddProduct;
