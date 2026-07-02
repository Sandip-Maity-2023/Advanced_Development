import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { removeFromCart, addToCart } from '../redux/cartSlice';
import '../styles/cart.css';
const API = import.meta.env.VITE_API_URL;

const Cart = () => {
  const cartItems = useSelector((state) => state.cart.cartItems);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleRemove = (id) => {
    dispatch(removeFromCart(id));
  };

  const handleUpdateQty = (item, qty) => {
    if (qty > 0) {
      dispatch(addToCart({ ...item, qty }));
    }
  };

  const totalPrice = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);

  return (
    <div className="cart-container">
      <h2>Shopping Cart</h2>
      {cartItems.length === 0 ? (
        <p>Your cart is empty. <Link to="/shop">Go Shopping</Link></p>
      ) : (
        <div className="cart-layout">
          <div className="cart-items">
            {cartItems.map((item) => {
              console.log('Cart Item:', item); // Debugging line to check the structure of each cart item
              // FIX: Calculate the dynamic discount percentage right here inside the loop
              const discount = item.originalPrice && item.originalPrice > item.price
                ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
                : 0;

              return (
                <div key={item.productId} className="cart-item">
                  <img src={item.imageUrl} alt={item.name} className="cart-item-image" />
                  <div className="cart-item-details">
                    <h4>{item.name}</h4>

                    <div className='cart-item-rating'>
                      <span className="stars">⭐ {(item.ratings || 0).toFixed(1)}</span>
                      <span className='reviews-count'>({item.numReviews || 0} reviews)</span>
                    </div>

                    <div className="price-container">
                      {discount > 0 && (
                        <>
                          <span className="price-discount">↓{discount}%</span>
                          <span className="price-original">₹{item.originalPrice}</span>
                        </>
                      )}
                      <span className="price-actual">₹{item.price}</span>
                    </div>

                    <div className="qty-controls">
                      <button onClick={() => handleUpdateQty(item, item.qty - 1)}>-</button>
                      <span>{item.qty}</span>
                      <button onClick={() => handleUpdateQty(item, item.qty + 1)}>+</button>
                    </div>
                    <button onClick={() => handleRemove(item.productId)} className="btn-remove">Remove</button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="cart-summary">
            <h3>Total: ₹{totalPrice.toFixed(2)}</h3>
            <button onClick={() => navigate('/checkout')} className="btn btn-checkout">Proceed to Checkout</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;