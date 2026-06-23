import React, { useEffect, useState, useRef, useMemo } from 'react';
import ProductCard from '../components/ProductCard';
import '../styles/product.css';
import { FcSearch } from "react-icons/fc";
import { 
  BiDevices, BiLaptop, BiCloset, BiSmile, 
  BiHomeAlt, BiGridAlt 
} from 'react-icons/bi';

import { GiFruitBowl } from "react-icons/gi";
import { FaShoppingCart } from "react-icons/fa";
import { GiClothes } from "react-icons/gi";
import { MdBakeryDining } from "react-icons/md";
import { GiMilkCarton } from "react-icons/gi";
import { GiTomato } from "react-icons/gi";

const API = import.meta.env.VITE_API_URL;

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const categoryRefs = useRef({});

  // 1. Fetch data on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${API}/api/products`);
        const data = await res.json();
        setProducts(data);
      } catch (error) {
        console.error("Error fetching products: ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // 2. STABLE CATEGORIES: Get all unique categories from the static master array so they NEVER disappear when searching
  const allCategories = useMemo(() => {
    if (products.length === 0) return [];
    const cats = products.map(p => p.category || 'Other / Featured');
    return [...new Set(cats)];
  }, [products]);

  // 3. Process searched items matching your grid logic
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const groupedProducts = filteredProducts.reduce((acc, product) => {
    const category = product.category || 'Other / Featured';
    if (!acc[category]) acc[category] = [];
    acc[category].push(product);
    return acc;
  }, {});

  // 4. FIX LAYOUT SHAKING: Use absolute scroll offset windows to prevent feedback loops
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 120) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getCategoryIcon = (category) => {
    const name = category.toLowerCase();
    if (name.includes('elect') || name.includes('gadget')) return <BiDevices />;
    if (name.includes('fashion') || name.includes('cloth') || name.includes('apparel')) return <GiClothes />;
    if (name.includes('laptop') || name.includes('tech')) return <BiLaptop />;
    if (name.includes('beauty') || name.includes('toy')) return <BiSmile />;
    if (name.includes('home') || name.includes('furniture')) return <BiHomeAlt />;
    if (name.includes('fruit') || name.includes('food')) return <GiFruitBowl />;
    if (name.includes('cart') || name.includes('grocery')) return <FaShoppingCart />;
    if (name.includes('bakery') || name.includes('bread')) return <MdBakeryDining />;
    if (name.includes('milk') || name.includes('dairy')) return <GiMilkCarton />;
    if (name.includes('vegetable') || name.includes('tomato')) return <GiTomato />;


    return <BiGridAlt />;
  };

  const scrollToCategory = (categoryName) => {
    // If searching filtered this category entirely out of the UI, clear the filter so it mounts back cleanly!
    if (!groupedProducts[categoryName]) {
      setSearch('');
    }
    
    // Allow React a micro-tick to render the cleared sections before scrolling down safely
    setTimeout(() => {
      const targetElement = categoryRefs.current[categoryName];
      if (targetElement) {
        targetElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 50);
  };

  return (
    <div className="shop-container">
      
      {/* FIXED CONTAINER CLASSIFICATION FRAME */}
      <div className={`sticky-controls-wrapper ${isCollapsed ? 'collapsed-state' : ''}`}>
        
        {/* Search Field */}
        <div className="search-bar-container">
          <FcSearch className="search-icon-react" />
          <input 
            type="text" 
            placeholder="Search products..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input-field"
          />
        </div>

        {/* ALWAYS VISIBLE CATEGORY BAR */}
        {!loading && allCategories.length > 0 && (
          <div className="category-nav-bar">
            {allCategories.map((categoryName) => (
              <button 
                key={categoryName} 
                className="category-nav-item"
                onClick={() => scrollToCategory(categoryName)}
              >
                <div className="category-nav-icon">
                  {getCategoryIcon(categoryName)}
                </div>
                <span className="category-nav-label">{categoryName}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Layout Content Feed offset */}
      <div className="shop-content-offset">
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Sourcing items...</p>
          </div>
        ) : Object.keys(groupedProducts).length > 0 ? (
          Object.entries(groupedProducts).map(([categoryName, items]) => (
            <div 
              key={categoryName} 
              className="category-section"
              ref={el => categoryRefs.current[categoryName] = el}
            >
              <div className="category-header">
                <div className="category-title-wrapper">
                  <h2 className="category-title">{categoryName}</h2>
                  <span className="category-count">{items.length} items</span>
                </div>
                <button className="view-all-btn">View All →</button>
              </div>
              
              <div className="product-grid">
                {items.map((product) => (
                  <ProductCard key={product._id || product.id} product={product} />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <h3>No products found</h3>
            <p>We couldn't find anything matching "{search}".</p>
            <button onClick={() => setSearch('')} className="clear-search-btn">Clear Search</button>
          </div>
        )}
      </div>

    </div>
  );
};

export default Shop;