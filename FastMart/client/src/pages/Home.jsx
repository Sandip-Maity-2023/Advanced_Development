import React, { useEffect, useState } from 'react';
import ProductCard from '../components/ProductCard';

// 1. Array of slides for the dynamic changing banner
const BANNER_SLIDES = [
  {
    badge: "⚡ LIMITED TIME OFFER",
    title: "Ultimate Gadgets Up To 80% Off",
    subtitle: "Discover lightning-fast delivery on premium, handpicked electronics.",
    accentColor: "rgba(249, 115, 22, 0.25)" // Orange accent
  },
  {
    badge: "🔥 FASHION WEEK REVEAL",
    title: "Elevate Your Daily Style",
    subtitle: "Upgrade your wardrobe with curated fashion collections designed to last.",
    accentColor: "rgba(59, 130, 246, 0.2)" // Soft blue accent
  },
  {
    badge: "🏠 EXCLUSIVE HOME ACCENTS",
    title: "Smart Living, Modern Comfort",
    subtitle: "Explore high-efficiency tech appliances engineered for contemporary homes.",
    accentColor: "rgba(168, 85, 247, 0.2)" // Purple accent
  }
];

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  // 2. Fetch Featured Products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        setProducts(data.slice(0, 13)); 
      } catch (error) {
        console.error("Error sourcing featured items: ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // 3. Auto-play banner changing loop sequence
  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide((prevIndex) => (prevIndex + 1) % BANNER_SLIDES.length);
    }, 3000); // Transitions slide content every 5000ms (5 seconds)

    return () => clearInterval(slideInterval); // Clean up interval on unmount
  }, []);

  return (
    <div className="home-container">
      
      {/* 4. DYNAMIC HERO BANNER ACCENT WRAPPER */}
      <div 
        className="hero-banner" 
        style={{
          backgroundImage: `radial-gradient(circle at top right, ${BANNER_SLIDES[currentSlide].accentColor}, transparent 65%), linear-gradient(135deg, #18181b 0%, #09090b 100%)`
        }}
      >
        {/* Render key-locked animation slides */}
        <div key={currentSlide} className="banner-slide-content">
          <span className="banner-badge">{BANNER_SLIDES[currentSlide].badge}</span>
          <h1>{BANNER_SLIDES[currentSlide].title}</h1>
          <p>{BANNER_SLIDES[currentSlide].subtitle}</p>
          <button className="banner-cta-btn">Shop New Arrivals</button>
        </div>

        {/* 5. SELECTION SLIDE INDICATOR DOTS */}
        <div className="banner-dots-container">
          {BANNER_SLIDES.map((_, index) => (
            <span 
              key={index} 
              className={`banner-dot ${index === currentSlide ? 'active-dot' : ''}`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
      </div>

      <h2 className="section-headline">Featured Products</h2>
      
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;