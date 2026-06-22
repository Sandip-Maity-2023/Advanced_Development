import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="ultimate-premium-footer">
      {/* INTERNAL CSS BLOCK - Premium self-contained interactions */}
      <style>{`
        .ultimate-premium-footer {
          background: #09090b;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding: 60px 20px 30px 20px;
          margin-top: auto;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        .footer-grid-container {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 40px;
        }

        /* Brand Column Details */
        .footer-brand-column h3 {
          color: #f97316;
          font-size: 1.5rem;
          font-weight: 800;
          margin: 0 0 12px 0;
          letter-spacing: -0.5px;
        }

        .footer-brand-column p {
          color: #a1a1aa;
          font-size: 0.95rem;
          line-height: 1.6;
          max-width: 320px;
          margin: 0;
        }

        /* Nav Link Column Groupings */
        .footer-nav-column h4 {
          color: #ffffff;
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 16px 0;
          letter-spacing: 0.2px;
        }

        .footer-links-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .footer-link {
          color: #a1a1aa;
          font-size: 0.9rem;
          text-decoration: none;
          transition: color 0.2s ease, transform 0.2s ease;
          display: inline-flex;
          align-items: center;
          width: fit-content;
        }

        .footer-link:hover {
          color: #f97316;
          transform: translateX(3px);
        }

        /* Bottom Row Separation Copyright Grid */
        .footer-bottom-divider {
          max-width: 1200px;
          height: 1px;
          background: rgba(255, 255, 255, 0.05);
          margin: 40px auto 20px auto;
        }

        .footer-copyright-row {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #71717a;
          font-size: 0.85rem;
        }

        .footer-legal-links {
          display: flex;
          gap: 20px;
        }

        .footer-legal-link {
          color: #71717a;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .footer-legal-link:hover {
          color: #a1a1aa;
        }

        /* Fully Adaptive Viewport Adjustments */
        @media (max-width: 768px) {
          .ultimate-premium-footer {
            padding: 40px 20px 20px 20px;
          }
          .footer-grid-container {
            grid-template-columns: 1fr;
            gap: 30px;
          }
          .footer-copyright-row {
            flex-direction: column;
            gap: 15px;
            text-align: center;
          }
        }
      `}</style>

      {/* FOOTER CORE GRID ARCHITECTURE */}
      <div className="footer-grid-container">
        
        {/* BRAND PROJECTION LAYER */}
        <div className="footer-brand-column">
          <h3>FastMart</h3>
          <p>
            Experience next-generation retail. Building, deploying, and engineering the ultimate storefront interfaces.
          </p>
        </div>
        
        {/* PLATFORM RESOURCE NAVIGATION */}
        <div className="footer-nav-column">
          <h4>Company</h4>
          <div className="footer-links-list">
            <Link to="/about" className="footer-link">About Us</Link>
            <Link to="/products" className="footer-link">Explore Products</Link>
          </div>
        </div>

        {/* CUSTOMER SATISFACTION ASSURANCE LINKS */}
        <div className="footer-nav-column">
          <h4>Support</h4>
          <div className="footer-links-list">
            <Link to="/return" className="footer-link">Return Policy</Link>
            <Link to="/disclaimer" className="footer-link">Disclaimer</Link>
          </div>
        </div>

      </div>

      <div className="footer-bottom-divider"></div>

      {/* LOWER COPYRIGHT & COMPLIANCE BAR */}
      <div className="footer-copyright-row">
        <div>
          &copy; {new Date().getFullYear()} FastMart. All rights reserved.
        </div>
        <div className="footer-legal-links">
          <a href="#privacy" className="footer-legal-link">Privacy Policy</a>
          <a href="#terms" className="footer-legal-link">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;