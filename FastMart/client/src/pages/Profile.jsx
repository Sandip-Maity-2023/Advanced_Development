import React, { useEffect, useState, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Profile = () => {
  const { user, logout, setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Core Data States
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Profile Configuration UI States
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    address: '',
    avatar: ''
  });
  const [saving, setSaving] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  const fallbackAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop';

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    setProfileData({
      name: user.name || '',
      phone: user.phone || '',
      address: user.address || '',
      avatar: user.avatar || fallbackAvatar
    });

    const fetchMyOrders = async () => {
      try {
        const res = await fetch('/api/orders/myorders', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setOrders(Array.isArray(data) ? data : []);
        } else if (res.status === 401) {
          logout();
          navigate('/login');
        }
      } catch (error) {
        console.error("Failed fetching order repository: ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMyOrders();
  }, [user, navigate, logout]);

  if (!user) return null;

  const handleChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  /* ==========================================================================
     Pure MongoDB Base64 Conversion Handlers
     ========================================================================== */
  
  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // MongoDB document limit is 16MB. Let's safe-check against massive files (>2MB) to keep things speedy
    if (file.size > 2 * 1024 * 1024) {
      alert("Image is too large! Please choose an avatar under 2MB.");
      return;
    }

    setImageLoading(true);
    const reader = new FileReader();
    
    reader.onloadend = () => {
      // reader.result turns the entire file into a safe text string that fits right into MongoDB
      setProfileData(prev => ({ ...prev, avatar: reader.result }));
      setImageLoading(false);
    };

    reader.onerror = () => {
      console.error("Error reading file stream.");
      alert("Failed to read image locally.");
      setImageLoading(false);
    };

    reader.readAsDataURL(file);
  };

  const handleAvatarDelete = (e) => {
    e.stopPropagation();
    if (profileData.avatar === fallbackAvatar) return;
    
    if (window.confirm("Are you sure you want to remove your profile image?")) {
      setProfileData(prev => ({ ...prev, avatar: fallbackAvatar }));
    }
  };

  /* ==========================================================================
     MongoDB Save Handler
     ========================================================================== */
  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}` 
        },
        body: JSON.stringify(profileData) // Sends all fields, including the local Base64 string
      });
      
      const data = await res.json();

      if (res.ok) {
        setIsEditing(false);
        
        // Update your global authentication state context
        if (setUser) {
          setUser({ ...user, ...profileData });
          
          // Sync changes to persistent local storage session
          const localStorageUser = JSON.parse(localStorage.getItem('user') || '{}');
          localStorage.setItem('user', JSON.stringify({ ...localStorageUser, ...profileData }));
        }
        
        alert("Profile settings safely saved directly to MongoDB!");
      } else {
        alert(data.message || "Profile parameters failed to update successfully.");
      }
    } catch (err) {
      console.error("Profile settings synchronization error: ", err);
      alert("Network failure syncing changes to backend database.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="profile-dashboard-wrapper">
      {/* INTERNAL CSS SYSTEM BLOCK */}
      <style>{`
        .profile-dashboard-wrapper {
          max-width: 1100px;
          margin: 40px auto;
          padding: 0 20px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: #fafafa;
        }

        .profile-grid-layout {
          display: grid;
          grid-template-columns: 350px 1fr;
          gap: 30px;
          align-items: start;
        }

        .identity-control-card {
          background: #18181b;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 40px 30px;
          text-align: center;
          box-shadow: 0 15px 35px rgba(0,0,0,0.4);
        }

        .avatar-uploader-stage {
          position: relative;
          width: 140px;
          height: 140px;
          margin: 0 auto 24px auto;
        }

        .dashboard-avatar-img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid #f97316;
          box-shadow: 0 0 20px rgba(249, 115, 22, 0.15);
          transition: filter 0.3s ease;
        }

        .avatar-dimmed { filter: brightness(0.3) blur(1px); }

        .avatar-spinner-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #f97316;
          font-weight: 600;
          font-size: 0.85rem;
          z-index: 4;
        }

        .avatar-action-hub-bar {
          position: absolute;
          bottom: -5px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 8px;
          z-index: 5;
        }

        .avatar-action-circle-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border: 2px solid #18181b;
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          font-size: 1rem;
        }

        .avatar-action-circle-btn:hover { transform: scale(1.1); }
        .avatar-action-circle-btn.upload { background: #f97316; color: #09090b; }
        .avatar-action-circle-btn.delete { background: #ef4444; color: #ffffff; }

        .identity-name { font-size: 1.5rem; font-weight: 700; margin: 0 0 4px 0; color: #fff; }
        .identity-email { color: #a1a1aa; font-size: 0.95rem; margin: 0 0 20px 0; }
        
        .role-pill-badge {
          background: rgba(249, 115, 22, 0.1);
          color: #f97316;
          padding: 6px 14px;
          border-radius: 30px;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.5px;
          display: inline-block;
          margin-bottom: 30px;
        }

        .logout-btn-action {
          width: 100%;
          background: transparent;
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
          padding: 12px;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .logout-btn-action:hover { background: rgba(239, 68, 68, 0.08); border-color: #ef4444; }

        .workspace-details-card {
          background: #18181b;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 40px;
          box-shadow: 0 15px 35px rgba(0,0,0,0.4);
        }

        .workspace-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          padding-bottom: 20px;
          margin-bottom: 30px;
        }

        .workspace-header-row h2 { font-size: 1.75rem; font-weight: 800; margin: 0; }

        .utility-edit-btn {
          background: #27272a;
          color: #fff;
          border: 1px solid rgba(255,255,255,0.08);
          padding: 8px 18px;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .utility-edit-btn:hover { background: #3f3f46; border-color: rgba(255,255,255,0.2); }

        .interactive-form-grid { display: flex; flex-direction: column; gap: 20px; margin-bottom: 40px; }
        .form-input-field-group { display: flex; flex-direction: column; gap: 8px; }
        
        .form-input-field-group label {
          font-size: 0.85rem;
          font-weight: 600;
          color: #a1a1aa;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .form-input-field-group input,
        .form-input-field-group textarea {
          background: #09090b;
          border: 1px solid #27272a;
          border-radius: 10px;
          padding: 12px 16px;
          color: #fff;
          font-size: 1rem;
          transition: border-color 0.2s ease;
        }

        .form-input-field-group input:focus,
        .form-input-field-group textarea:focus { outline: none; border-color: #f97316; }
        .form-read-plaintext { font-size: 1.05rem; color: #e4e4e7; padding: 4px 0; }
        .form-button-dock { display: flex; gap: 12px; justify-content: flex-end; }
        .btn-save-primary { background: #f97316; color: #09090b; border: none; padding: 10px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; }
        .btn-cancel-secondary { background: transparent; color: #a1a1aa; border: 1px solid #27272a; padding: 10px 24px; border-radius: 8px; cursor: pointer; }

        .order-history-section-header { font-size: 1.35rem; font-weight: 700; color: #fff; margin: 0 0 20px 0; }
        .empty-orders-state { background: #09090b; padding: 40px; border-radius: 12px; text-align: center; border: 1px solid #27272a; }
        .empty-orders-state p { color: #a1a1aa; margin: 0 0 20px 0; }
        .shop-redirect-cta { display: inline-block; background: #ffffff; color: #09090b; text-decoration: none; padding: 10px 24px; border-radius: 8px; font-weight: 600; }
        .orders-stack-container { display: flex; flex-direction: column; gap: 16px; }
        
        .order-row-item {
          background: #09090b;
          padding: 20px;
          border-radius: 12px;
          border: 1px solid #27272a;
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }

        .order-metadata p { margin: 0 0 6px 0; color: #a1a1aa; font-size: 0.9rem; }
        .order-metadata p span, .order-metadata p strong { color: #fff; }
        .status-badge-capsule { padding: 6px 14px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; }

        @media (max-width: 850px) {
          .profile-grid-layout { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="profile-grid-layout">
        
        {/* LEFT COLUMN: IDENTITY CONTROL BASE */}
        <div className="identity-control-card">
          <div className="avatar-uploader-stage">
            <img 
              src={profileData.avatar} 
              alt="Dashboard Avatar" 
              className={`dashboard-avatar-img ${imageLoading ? 'avatar-dimmed' : ''}`} 
            />
            
            {imageLoading && (
              <div className="avatar-spinner-overlay">Converting...</div>
            )}

            {!imageLoading && (
              <div className="avatar-action-hub-bar">
                <div className="avatar-action-circle-btn upload" onClick={() => fileInputRef.current.click()} title="Upload custom photo">
                  <span>📷</span>
                </div>
                
                {profileData.avatar !== fallbackAvatar && (
                  <div className="avatar-action-circle-btn delete" onClick={handleAvatarDelete} title="Remove asset">
                    <span>🗑️</span>
                  </div>
                )}
              </div>
            )}

            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="image/*" 
              onChange={handleAvatarUpload} 
            />
          </div>
          
          <h2 className="identity-name">{profileData.name || user.name}</h2>
          <p className="identity-email">{user.email}</p>
          <span className="role-pill-badge">ACCOUNT TYPE: {user.role.toUpperCase()}</span>
          
          <button onClick={handleLogout} className="logout-btn-action">Log Out Dashboard</button>
        </div>

        {/* RIGHT COLUMN: WORKSPACE SETTINGS FORM */}
        <div className="workspace-details-card">
          <div className="workspace-header-row">
            <h2>Account Credentials</h2>
            {!isEditing && (
              <button className="utility-edit-btn" onClick={() => setIsEditing(true)}>Edit Details</button>
            )}
          </div>

          <form onSubmit={handleProfileSave}>
            <div className="interactive-form-grid">
              <div className="form-input-field-group">
                <label>Full Name</label>
                {isEditing ? (
                  <input type="text" name="name" value={profileData.name} onChange={handleChange} required />
                ) : (
                  <div className="form-read-plaintext">{profileData.name}</div>
                )}
              </div>

              <div className="form-input-field-group">
                <label>Phone Number</label>
                {isEditing ? (
                  <input type="tel" name="phone" placeholder="+1 (555) 000-0000" value={profileData.phone} onChange={handleChange} />
                ) : (
                  <div className="form-read-plaintext">{profileData.phone || <em style={{ color: '#71717a' }}>No phone connected</em>}</div>
                )}
              </div>

              <div className="form-input-field-group">
                <label>Primary Shipping Address</label>
                {isEditing ? (
                  <textarea rows="3" name="address" placeholder="Street Address, City, State, ZIP" value={profileData.address} onChange={handleChange}></textarea>
                ) : (
                  <div className="form-read-plaintext">{profileData.address || <em style={{ color: '#71717a' }}>No shipping address logged</em>}</div>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="form-button-dock">
                <button type="button" className="btn-cancel-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
                <button type="submit" className="btn-save-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            )}
          </form>

          {/* BLOCK: TRANSACTION DETAILS */}
          <h3 className="order-history-section-header">Recent Transactions</h3>
          {loading ? (
            <p style={{ color: '#a1a1aa' }}>Sourcing complete checkout logs...</p>
          ) : orders.length === 0 ? (
            <div className="empty-orders-state">
              <p>You haven't initialized or confirmed any transactions yet.</p>
              <Link to="/shop" className="shop-redirect-cta">Explore Marketplace</Link>
            </div>
          ) : (
            <div className="orders-stack-container">
              {orders.map(order => (
                <div key={order._id} className="order-row-item">
                  <div className="order-metadata">
                    <p>Order Tracking Ref: <span>{order._id}</span></p>
                    <p>Processing Timestamp: <span>{new Date(order.createdAt).toLocaleDateString()}</span></p>
                    <p>Total Invoice Value: <strong style={{ color: '#10b981' }}>₹{order.totalAmount.toFixed(2)}</strong></p>
                  </div>
                  <div>
                    <span className="status-badge-capsule" style={{ 
                      background: order.status === 'Delivered' ? 'rgba(16,185,129,0.1)' : order.status === 'Shipped' ? 'rgba(59,130,246,0.1)' : 'rgba(245,158,11,0.1)', 
                      color: order.status === 'Delivered' ? '#10b981' : order.status === 'Shipped' ? '#3b82f6' : '#f59e0b'
                    }}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Profile;