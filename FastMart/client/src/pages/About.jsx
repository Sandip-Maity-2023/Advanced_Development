import React from 'react';
import cap from '../assets/captain.jpg';

const About = () => (
  <div className="about-page-wrapper">
    <style>{`
      .about-page-wrapper {
        width: 100%; min-height: 80vh; display: flex;
        align-items: center; justify-content: center;
        padding: 40px 20px; background: #09090b;
        font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
      }
      .premium-profile-card {
        max-width: 800px; width: 100%; padding: 60px 40px;
        background: rgba(24,24,27,.65); backdrop-filter: blur(20px);
        border-radius: 24px; border: 1px solid rgba(255,255,255,.05);
        box-shadow: 0 30px 60px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.1);
        text-align: center; position: relative; overflow: hidden;
      }
      .card-mesh-glow {
        position: absolute; top: -150px; left: 50%; transform: translateX(-50%);
        width: 350px; height: 350px;
        background: radial-gradient(circle, rgba(249,115,22,.12) 0%, transparent 70%);
      }
      .profile-avatar-container {
        width: 160px; height: 160px; margin: 0 auto 30px; position: relative;
      }
      .premium-avatar-img {
        width: 100%; height: 100%; border-radius: 50%; object-fit: cover;
        border: 2px solid rgba(255,255,255,.1); transition: transform .4s;
      }
      .premium-profile-card:hover .premium-avatar-img { transform: scale(1.04) rotate(2deg); }
      .avatar-glow-ring {
        position: absolute; inset: -4px; border-radius: 50%;
        background: linear-gradient(135deg,#f97316,#ea580c,#f43f5e);
        opacity: .85; box-shadow: 0 0 25px rgba(249,115,22,.4);
        animation: breathingGlow 4s ease-in-out infinite alternate;
      }
      @keyframes breathingGlow {
        0% { transform: scale(.98); opacity:.7; filter: blur(2px); }
        100% { transform: scale(1.02); opacity:1; filter: blur(0); }
      }
      .profile-main-title { font-size: 2.75rem; font-weight: 800; color: #fff; margin: 0 0 8px; }
      .profile-username-tag { font-size: 1.25rem; font-weight: 500; color: #f97316; margin: 0 0 25px; }
      .handle { color: #a1a1aa; font-size: 1.1rem; font-weight: 400; }
      .profile-divider { width: 60px; height: 4px; margin: 0 auto 25px; border-radius: 2px;
        background: linear-gradient(90deg,#f97316,transparent); }
      .profile-bio-text { font-size: 1.1rem; color: #a1a1aa; line-height: 1.7; max-width: 580px; margin: 0 auto 40px; }
      .highlight-text { color: #fff; font-weight: 600; }
      .social-links-grid { display: flex; flex-wrap: wrap; justify-content: center; gap: 14px; }
      .social-pill-btn {
        display: inline-flex; align-items: center; gap: 10px;
        padding: 12px 22px; font-size: .9rem; font-weight: 600;
        border-radius: 12px; text-decoration: none;
        background: rgba(39,39,42,.4); color: #e4e4e7;
        border: 1px solid rgba(255,255,255,.04); transition: all .25s;
      }
      .social-pill-btn:hover { transform: translateY(-3px); color: #fff; box-shadow: 0 10px 20px rgba(0,0,0,.3); }
      .social-pill-btn .icon { font-size: 1.1rem; transition: transform .2s; }
      .social-pill-btn:hover .icon { transform: scale(1.2); }
      .website:hover { background: rgba(255,255,255,.08); border-color: rgba(255,255,255,.3); }
      .youtube:hover { background: rgba(239,68,68,.12); border-color: rgba(239,68,68,.4); color:#ef4444; }
      .instagram:hover { background: rgba(236,72,153,.12); border-color: rgba(236,72,153,.4); color:#ec4899; }
      .linkedin:hover { background: rgba(59,130,246,.12); border-color: rgba(59,130,246,.4); color:#3b82f6; }
      .twitter:hover { background: rgba(255,255,255,.08); border-color: rgba(255,255,255,.2); }
      .whatsapp:hover { background: rgba(16,185,129,.12); border-color: rgba(16,185,129,.4); color:#10b981; }
      .linktree:hover { background: rgba(52,211,153,.12); border-color: rgba(52,211,153,.3); color:#34d399; }
      @media (max-width:640px){
        .premium-profile-card{padding:40px 20px;border-radius:16px;}
        .profile-main-title{font-size:2.2rem;}
        .social-links-grid{flex-direction:column;width:100%;}
        .social-pill-btn{width:100%;justify-content:center;}
      }
    `}</style>

    <div className="premium-profile-card">
      <div className="card-mesh-glow"></div>
      <div className="profile-avatar-container">
        <div className="avatar-glow-ring"></div>
        <img src={cap} alt="@sandipmaity" className="premium-avatar-img" />
      </div>
      <h2 className="profile-main-title">About Me</h2>
      <h3 className="profile-username-tag">Sandip Maity <span className="handle">(@sandipmaity)</span></h3>
      <div className="profile-divider"></div>
      <p className="profile-bio-text">
        <span className="highlight-text">Join the community and grow together!</span><br/>
        Welcome to my platform where we build, deploy, and scale highly engineered systems.
      </p>
      <div className="social-links-grid">
        <a href="https://live-site-olive.vercel.app/" target="_blank" rel="noreferrer" className="social-pill-btn website"><span className="icon">🌐</span> Website</a>
        <a href="https://www.youtube.com/@SANDIPMAITY-xe2tu" target="_blank" rel="noreferrer" className="social-pill-btn youtube"><span className="icon">📺</span> YouTube</a>
        <a href="https://www.instagram.com/sandipmaity725/" target="_blank" rel="noreferrer" className="social-pill-btn instagram"><span className="icon">📸</span> Instagram</a>
        <a href="https://www.linkedin.com/in/sandip-maity-243537292/" target="_blank" rel="noreferrer" className="social-pill-btn linkedin"><span className="icon">💼</span> LinkedIn</a>
      </div>
    </div>
  </div>
);

export default About;
