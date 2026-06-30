import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL;

const ProductReviewForm = ({ productId, onReviewSubmitted }) => {
  const { user } = useContext(AuthContext);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // If user is not logged in, don't show the review input form
  if (!user) {
    return <p style={{ color: '#71717a' }}>Please login to write a product review.</p>;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const res = await fetch(`${API}/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`, // Passes auth middleware check
        },
        body: JSON.stringify({ rating, comment }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('Thank you! Your review has been submitted.');
        setComment('');
        setRating(5);
        if (onReviewSubmitted) onReviewSubmitted(); // Triggers a reload of product details
      } else {
        setError(data.message || 'Failed to submit review');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="review-form-container" style={{ marginTop: '30px', padding: '20px', borderTop: '1px solid #e4e4e7' }}>
      <h3>Write a Customer Review</h3>
      
      {message && <p style={{ color: '#10b981', fontWeight: '600' }}>{message}</p>}
      {error && <p style={{ color: '#ef4444', fontWeight: '600' }}>{error}</p>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '500px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Rating:</label>
          <select 
            value={rating} 
            onChange={(e) => setRating(Number(e.target.value))}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #d4d4d8', width: '100%' }}
          >
            <option value="5">⭐⭐⭐⭐⭐ (5 - Excellent)</option>
            <option value="4">⭐⭐⭐⭐ (4 - Good)</option>
            <option value="3">⭐⭐⭐ (3 - Average)</option>
            <option value="2">⭐⭐ (2 - Poor)</option>
            <option value="1">⭐ (1 - Terrible)</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Comment:</label>
          <textarea
            rows="4"
            required
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your thoughts about this product..."
            style={{ padding: '10px', borderRadius: '4px', border: '1px solid #d4d4d8', width: '100%', resize: 'none' }}
          />
        </div>

        <button type="submit" className="btn" style={{ alignSelf: 'flex-start', padding: '10px 20px' }}>
          Submit Review
        </button>
      </form>
    </div>
  );
};

export default ProductReviewForm;