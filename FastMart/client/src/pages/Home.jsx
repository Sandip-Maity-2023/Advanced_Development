import React, { useEffect, useState } from 'react';
import ProductCard from '../components/ProductCard';
import tv from "../assets/Btv.png";
import phone from "../assets/Bphone.png";
import Bveg from "../assets/Bveg.png";
import Breuse from "../assets/Breuse.png";
import pro from "../assets/Bpro.png";
import Bimg from "../assets/Bimg.png";

const BANNER_SLIDES = [
  {
    badge: "⚡ LIMITED TIME OFFER",
    title: "Ultimate Gadgets Up To 80% Off",
    subtitle: "Discover lightning-fast delivery on premium, handpicked electronics.",
    accentColor: "#f97316", // Solid brand theme colors for text accents
    image: tv
  },
  {
    badge: "🔥 FASHION WEEK REVEAL",
    title: "Elevate Your Daily Style",
    subtitle: "Upgrade your wardrobe with curated fashion collections designed to last.",
    accentColor: "#3b82f6",
    image: phone
  },
  {
    badge: "🏠 EXCLUSIVE HOME ACCENTS",
    title: "Smart Living, Modern Comfort",
    subtitle: "Explore high-efficiency tech appliances engineered for contemporary homes.",
    accentColor: "#a855f7",
    image: Bimg
  },
  {
    badge: "🍎 FRESHNESS GUARANTEED",
    title: "Farm-to-Doorstep Freshness",
    subtitle: "Experience the convenience of farm-fresh produce delivered to your door.",
    accentColor: "#22c55e",
    image: Bveg
  },
  {
    badge: "♻️ SUSTAINABLE CHOICES",
    title: "Eco-Friendly Essentials",
    subtitle: "Shop sustainable products that blend style, function, and planet care.",
    accentColor: "#10b981",
    image: Breuse
  },
  {
    badge: "💼 PROFESSIONAL GRADE",
    title: "Professional-Grade Tools",
    subtitle: "Access high-performance equipment designed for professionals and enthusiasts.",
    accentColor: "#8b5cf6",
    image: pro
  }
];

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

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

  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide((prevIndex) => (prevIndex + 1) % BANNER_SLIDES.length);
    }, 3000);

    return () => clearInterval(slideInterval);
  }, []);

  return (
    <div className="home-container">
      
      {/* MASTER CAROUSEL WRAPPER */}
      <div className="premium-hero-card">
        
        {/* UPPER IMAGE STAGE: Image scales perfectly here */}
        <div 
          className="banner-image-canvas"
          style={{ backgroundImage: `url(${BANNER_SLIDES[currentSlide].image})` }}
        />

        {/* LOWER CONTEXT CARD: Text information bar split away from graphic canvas */}
        <div className="banner-footer-info-bar">
          <div key={currentSlide} className="banner-slide-content">
            <span 
              className="banner-badge" 
              style={{ 
                color: BANNER_SLIDES[currentSlide].accentColor,
                borderColor: `${BANNER_SLIDES[currentSlide].accentColor}33`,
                background: `${BANNER_SLIDES[currentSlide].accentColor}12`
              }}
            >
              {BANNER_SLIDES[currentSlide].badge}
            </span>
            <h1 className="banner-title">{BANNER_SLIDES[currentSlide].title}</h1>
            <p className="banner-subtitle">{BANNER_SLIDES[currentSlide].subtitle}</p>
          </div>

          {/* RIGHT CTA POSITIONING PLATFORM */}
          <div className="banner-action-column">
            <button className="banner-cta-btn">Shop Now →</button>
          </div>
        </div>

        {/* CONTROLLER SELECTION INDICATOR DOTS */}
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