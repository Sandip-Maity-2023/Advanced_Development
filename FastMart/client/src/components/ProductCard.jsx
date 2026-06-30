import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/product.css';

const ProductCard = ({ product }) => {
  // Calculate discount percentage dynamically if originalPrice exists
  const discount = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="product-card">
      <img src={product.imageUrl} alt={product.name} className="product-image" />
      <div className="product-info">
        <h3>{product.name}</h3>

        {/* 1. Added Ratings & Reviews Snapshot */}
        <div className="product-card-rating" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', marginBottom: '8px' }}>
          <span style={{ color: '#ffa41c', fontWeight: 'bold' }}>⭐ {(product.ratings || 0).toFixed(1)}</span>
          <span style={{ color: '#a1a1aa' }}>({product.numReviews || 0})</span>
        </div>

        {/* 2. Added Discount & Strikethrough Price Layout */}
        <div className="product-card-price-container" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
          {discount > 0 && (
            <>
              <span className="card-discount" style={{ color: '#10b981', fontWeight: '600', fontSize: '1rem' }}>
                ↓{discount}%
              </span>
              <span className="card-original-price" style={{ color: '#71717a', textDecoration: 'line-through', fontSize: '0.95rem' }}>
                ₹{product.originalPrice}
              </span>
            </>
          )}
          <span className="price" style={{ fontWeight: '700', fontSize: '1.15rem' }}>₹{product.price}</span>
        </div>

        <Link to={`/product/${product._id}`} className="btn" style={{ display: 'block', textAlign: 'center' }}>
          View Details
        </Link>
      </div>
    </div>
  );
};

export default ProductCard;