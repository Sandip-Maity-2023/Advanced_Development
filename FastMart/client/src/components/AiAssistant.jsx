// src/components/AIAssistant.jsx
import React, { useState } from 'react';
import axios from 'axios';

const AIAssistant = () => {
  const [query, setQuery] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setChatLog(prev => [...prev, { sender: 'user', text: query }]);
    
    try {
      const { data } = await axios.post('/api/ai/chat', { userQuery: query });
      setChatLog(prev => [...prev, { 
        sender: 'ai', 
        text: data.reply, 
        cards: data.matches 
      }]);
    } catch (err) {
      setChatLog(prev => [...prev, { sender: 'ai', text: "Error connecting to advisor." }]);
    }
    setQuery('');
    setLoading(false);
  };

  return (
    <div className="ai-chat-window">
      <div className="chat-messages">
        {chatLog.map((msg, i) => (
          <div key={i} className={`message-${msg.sender}`}>
            <p>{msg.text}</p>
            {msg.cards && (
              <div className="ai-suggested-cards">
                {msg.cards.map(item => (
                  <div key={item.id} className="mini-card">
                    <h5>{item.name}</h5>
                    <p>₹{item.price}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <form onSubmit={handleSendMessage}>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ask me anything..." />
        <button type="submit" disabled={loading}>Send</button>
      </form>
    </div>
  );
};

export default AIAssistant;
