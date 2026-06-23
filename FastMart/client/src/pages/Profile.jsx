import React, { useEffect, useState, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
const API = import.meta.env.VITE_API_URL;

const Profile = () => {
  const { user, login, logout } = useContext(AuthContext); // ✅ use `login` to update user globally
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    address: '',
    avatar: null
  });
  const [saving, setSaving] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error' | null

  const fallbackAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop';

  // Sync local form state from global user
  const resetFormToUserState = () => {
    if (user) {
      setProfileData({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
        avatar: user.avatar || fallbackAvatar
      });
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    resetFormToUserState();

    const fetchMyOrders = async () => {
      try {
        const res = await fetch(`${API}/api/orders/myorders`, {
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
        console.error('Failed to fetch orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyOrders();
  }, [user?._id]); // only re-run if user ID changes, not on every render

  if (!user) return null;

  const handleChange = (e) => {
    setProfileData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // ── Avatar Handlers ──────────────────────────────────────────────────────────

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Image too large. Please choose a file under 2MB.');
      return;
    }

    setImageLoading(true);
    const reader = new FileReader();

    reader.onloadend = () => {
      setProfileData(prev => ({ ...prev, avatar: reader.result }));
      setImageLoading(false);
    };

    reader.onerror = () => {
      alert('Failed to read image. Please try again.');
      setImageLoading(false);
    };

    reader.readAsDataURL(file);
  };

  const handleAvatarDelete = (e) => {
    e.stopPropagation();
    if (profileData.avatar === fallbackAvatar) return;
    if (window.confirm('Remove your profile photo?')) {
      setProfileData(prev => ({ ...prev, avatar: fallbackAvatar }));
    }
  };

  const handleCancelAction = () => {
    setIsEditing(false);
    setSaveStatus(null);
    resetFormToUserState();
  };

  // ── Save Handler ─────────────────────────────────────────────────────────────

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveStatus(null);

    try {
      const res = await fetch(`${API}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify(profileData)
      });

      const data = await res.json();

      if (res.ok) {
        // ✅ Build the updated user, preserving token + role
        const updatedUser = {
          ...user,
          name: data.name ?? user.name,
          phone: data.phone ?? user.phone,
          address: data.address ?? user.address,
          // ✅ Key fix: if backend doesn't echo avatar back, use the locally staged base64
          avatar: data.avatar ?? profileData.avatar,
          role: data.role ?? user.role,
          token: user.token, // always preserve token
        };

        // ✅ Use `login()` from AuthContext — this calls setUser + updates localStorage('userInfo')
        login(updatedUser);

        // Sync local form with final saved values
        setProfileData({
          name: updatedUser.name || '',
          phone: updatedUser.phone || '',
          address: updatedUser.address || '',
          avatar: updatedUser.avatar || fallbackAvatar,
        });

        setIsEditing(false);
        setSaveStatus('success');

        // Auto-clear success banner after 3s
        setTimeout(() => setSaveStatus(null), 3000);
      } else {
        setSaveStatus('error');
        console.error('Server error:', data.message);
      }
    } catch (err) {
      console.error('Network error during save:', err);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // ── Status badge color for orders ────────────────────────────────────────────
  const getStatusStyle = (status) => {
    switch (status) {
      case 'Delivered': return { bg: 'rgba(16,185,129,0.1)', color: '#10b981' };
      case 'Shipped':   return { bg: 'rgba(59,130,246,0.1)',  color: '#3b82f6' };
      default:          return { bg: 'rgba(245,158,11,0.1)',  color: '#f59e0b' };
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="profile-wrapper">
      <style>{`
        * { box-sizing: border-box; }

        .profile-wrapper {
          max-width: 1100px;
          margin: 40px auto;
          padding: 0 20px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: #fafafa;
        }

        /* ── Grid ── */
        .profile-grid {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 28px;
          align-items: start;
        }

        @media (max-width: 820px) {
          .profile-grid { grid-template-columns: 1fr; }
        }

        /* ── Cards ── */
        .card {
          background: #18181b;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.06);
          box-shadow: 0 15px 35px rgba(0,0,0,0.4);
        }

        .identity-card {
          padding: 40px 28px;
          text-align: center;
        }

        .workspace-card {
          padding: 36px 40px;
        }

        /* ── Avatar ── */
        .avatar-stage {
          position: relative;
          width: 136px;
          height: 136px;
          margin: 0 auto 24px auto;
        }

        .avatar-img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid #f97316;
          box-shadow: 0 0 22px rgba(249,115,22,0.18);
          transition: filter 0.25s ease;
          display: block;
        }

        .avatar-img.dimmed { filter: brightness(0.25) blur(1px); }

        .avatar-overlay-label {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #f97316;
          font-size: 0.82rem;
          font-weight: 600;
          pointer-events: none;
        }

        .avatar-actions {
          position: absolute;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 8px;
          z-index: 5;
        }

        .avatar-btn {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border: 2px solid #18181b;
          font-size: 0.95rem;
          transition: transform 0.18s ease;
          line-height: 1;
        }

        .avatar-btn:hover { transform: scale(1.12); }
        .avatar-btn.upload { background: #f97316; color: #09090b; }
        .avatar-btn.delete { background: #ef4444; color: #fff; }

        /* ── Identity text ── */
        .identity-name  { font-size: 1.45rem; font-weight: 700; margin: 0 0 4px; color: #fff; }
        .identity-email { color: #a1a1aa; font-size: 0.92rem; margin: 0 0 18px; }

        .role-badge {
          display: inline-block;
          background: rgba(249,115,22,0.1);
          color: #f97316;
          padding: 5px 14px;
          border-radius: 30px;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.6px;
          margin-bottom: 28px;
        }

        .logout-btn {
          width: 100%;
          background: transparent;
          border: 1px solid rgba(239,68,68,0.35);
          color: #ef4444;
          padding: 11px;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .logout-btn:hover { background: rgba(239,68,68,0.08); border-color: #ef4444; }

        /* ── Workspace header ── */
        .workspace-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          padding-bottom: 20px;
          margin-bottom: 28px;
        }

        .workspace-header h2 {
          font-size: 1.6rem;
          font-weight: 800;
          margin: 0;
          color: #fff;
        }

        .edit-btn {
          background: #f97316;
          color: #09090b;
          border: none;
          padding: 9px 20px;
          border-radius: 8px;
          font-size: 0.88rem;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .edit-btn:hover { background: #ea580c; }

        /* ── Status banner ── */
        .status-banner {
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: 24px;
        }

        .status-banner.success {
          background: rgba(16,185,129,0.1);
          color: #10b981;
          border: 1px solid rgba(16,185,129,0.2);
        }

        .status-banner.error {
          background: rgba(239,68,68,0.1);
          color: #ef4444;
          border: 1px solid rgba(239,68,68,0.2);
        }

        /* ── Form fields ── */
        .form-fields { display: flex; flex-direction: column; gap: 20px; margin-bottom: 36px; }

        .field-group { display: flex; flex-direction: column; gap: 7px; }

        .field-group label {
          font-size: 0.78rem;
          font-weight: 700;
          color: #71717a;
          text-transform: uppercase;
          letter-spacing: 0.6px;
        }

        .field-group input,
        .field-group textarea {
          background: #09090b;
          border: 1px solid #27272a;
          border-radius: 10px;
          padding: 11px 15px;
          color: #fff;
          font-size: 0.97rem;
          font-family: inherit;
          transition: border-color 0.2s ease;
          resize: vertical;
        }

        .field-group input:focus,
        .field-group textarea:focus {
          outline: none;
          border-color: #f97316;
          box-shadow: 0 0 0 3px rgba(249,115,22,0.08);
        }

        .field-static {
          font-size: 1rem;
          color: #e4e4e7;
          padding: 3px 0;
          line-height: 1.5;
        }

        .field-static em { color: #52525b; font-style: normal; }

        /* ── Form buttons ── */
        .form-actions { display: flex; gap: 10px; justify-content: flex-end; }

        .btn-save {
          background: #f97316;
          color: #09090b;
          border: none;
          padding: 10px 24px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .btn-save:hover:not(:disabled) { background: #ea580c; }
        .btn-save:disabled { opacity: 0.5; cursor: not-allowed; }

        .btn-cancel {
          background: transparent;
          color: #a1a1aa;
          border: 1px solid #27272a;
          padding: 10px 24px;
          border-radius: 8px;
          font-size: 0.9rem;
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s;
        }

        .btn-cancel:hover { border-color: #52525b; color: #d4d4d8; }

        /* ── Orders section ── */
        .section-title {
          font-size: 1.2rem;
          font-weight: 700;
          color: #fff;
          margin: 40px 0 18px;
          padding-top: 32px;
          border-top: 1px solid rgba(255,255,255,0.06);
        }

        .orders-list { display: flex; flex-direction: column; gap: 14px; }

        .order-card {
          background: #09090b;
          border: 1px solid #27272a;
          border-radius: 12px;
          padding: 18px 20px;
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          transition: border-color 0.2s ease;
        }

        .order-card:hover { border-color: #3f3f46; }

        .order-meta p { margin: 0 0 5px; font-size: 0.88rem; color: #71717a; }
        .order-meta p:last-child { margin-bottom: 0; }
        .order-meta span { color: #d4d4d8; }
        .order-meta strong { color: #10b981; }

        .status-pill {
          padding: 5px 14px;
          border-radius: 20px;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.3px;
          white-space: nowrap;
        }

        .empty-orders {
          background: #09090b;
          border: 1px solid #27272a;
          border-radius: 12px;
          padding: 40px;
          text-align: center;
        }

        .empty-orders p { color: #71717a; margin: 0 0 20px; font-size: 0.95rem; }

        .shop-link {
          display: inline-block;
          background: #fff;
          color: #09090b;
          text-decoration: none;
          padding: 9px 22px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.9rem;
          transition: background 0.2s;
        }

        .shop-link:hover { background: #e4e4e7; }

        .loading-text { color: #52525b; font-size: 0.92rem; }
      `}</style>

      <div className="profile-grid">

        {/* ── LEFT: Identity Card ── */}
        <div className="card identity-card">
          <div className="avatar-stage">
            <img
              src={profileData.avatar || fallbackAvatar}
              alt="Profile"
              className={`avatar-img${imageLoading ? ' dimmed' : ''}`}
              onError={(e) => { e.target.src = fallbackAvatar; }}
            />

            {imageLoading && (
              <div className="avatar-overlay-label">Converting…</div>
            )}

            {!imageLoading && isEditing && (
              <div className="avatar-actions">
                <div
                  className="avatar-btn upload"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload photo"
                >
                  📷
                </div>
                {profileData.avatar !== fallbackAvatar && (
                  <div
                    className="avatar-btn delete"
                    onClick={handleAvatarDelete}
                    title="Remove photo"
                  >
                    🗑️
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

          {/* ✅ Always read from global `user` so left card updates immediately after save */}
          <h2 className="identity-name">{user.name}</h2>
          <p className="identity-email">{user.email}</p>
          <span className="role-badge">
            {user.role ? user.role.toUpperCase() : 'CUSTOMER'}
          </span>

          <button className="logout-btn" onClick={handleLogout}>
            Log Out
          </button>
        </div>

        {/* ── RIGHT: Workspace Card ── */}
        <div className="card workspace-card">
          <div className="workspace-header">
            <h2>Account Details</h2>
            {!isEditing && (
              <button className="edit-btn" onClick={() => setIsEditing(true)}>
                Edit Profile
              </button>
            )}
          </div>

          {/* ✅ Status banner replaces alert() — no intrusive popups */}
          {saveStatus === 'success' && (
            <div className="status-banner success">
              ✓ Profile saved successfully!
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="status-banner error">
              ✗ Failed to save. Please try again.
            </div>
          )}

          <form onSubmit={handleProfileSave}>
            <div className="form-fields">

              <div className="field-group">
                <label>Full Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={profileData.name}
                    onChange={handleChange}
                    required
                  />
                ) : (
                  <div className="field-static">{user.name}</div>
                )}
              </div>

              <div className="field-group">
                <label>Phone Number</label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    placeholder="+91 00000 00000"
                    value={profileData.phone}
                    onChange={handleChange}
                  />
                ) : (
                  <div className="field-static">
                    {user.phone || <em>No phone added</em>}
                  </div>
                )}
              </div>

              <div className="field-group">
                <label>Shipping Address</label>
                {isEditing ? (
                  <textarea
                    rows={3}
                    name="address"
                    placeholder="Street, City, State, ZIP"
                    value={profileData.address}
                    onChange={handleChange}
                  />
                ) : (
                  <div className="field-static">
                    {user.address || <em>No address added</em>}
                  </div>
                )}
              </div>

            </div>

            {isEditing && (
              <div className="form-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={handleCancelAction}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-save"
                  disabled={saving || imageLoading}
                >
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            )}
          </form>

          {/* ── Orders ── */}
          <h3 className="section-title">Order History</h3>

          {loading ? (
            <p className="loading-text">Loading orders…</p>
          ) : orders.length === 0 ? (
            <div className="empty-orders">
              <p>No orders placed yet.</p>
              <Link to="/shop" className="shop-link">Browse Products</Link>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map(order => {
                const s = getStatusStyle(order.status);
                return (
                  <div key={order._id} className="order-card">
                    <div className="order-meta">
                      <p>Order ID: <span>{order._id}</span></p>
                      <p>Date: <span>{new Date(order.createdAt).toLocaleDateString('en-IN')}</span></p>
                      <p>Total: <strong>₹{order.totalAmount?.toFixed(2)}</strong></p>
                    </div>
                    <span
                      className="status-pill"
                      style={{ background: s.bg, color: s.color }}
                    >
                      {order.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Profile;