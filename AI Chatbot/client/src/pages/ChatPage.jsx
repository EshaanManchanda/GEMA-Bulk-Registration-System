import React from 'react'
import ChatWidget from '../components/ChatWidget'

const ChatPage = () => {
  return (
    <div className="container">
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h1 style={{ color: '#667eea', marginBottom: '8px' }}>🤖 GEMA AI Assistant</h1>
          <p style={{ color: '#666', fontSize: '18px' }}>
            Your intelligent companion for competition certificates, exam dates, and registration information
          </p>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎓</div>
            <h3>Certificate Generation</h3>
            <p style={{ fontSize: '14px', color: '#666' }}>Get your competition certificates instantly</p>
          </div>
          
          <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>📅</div>
            <h3>Exam Dates</h3>
            <p style={{ fontSize: '14px', color: '#666' }}>Check upcoming competition schedules</p>
          </div>
          
          <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>💳</div>
            <h3>Payment Links</h3>
            <p style={{ fontSize: '14px', color: '#666' }}>Quick access to registration payments</p>
          </div>
          
          <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔗</div>
            <h3>Competition Info</h3>
            <p style={{ fontSize: '14px', color: '#666' }}>Get details about various olympiads</p>
          </div>
        </div>
        
        <ChatWidget />
        
        <div style={{ marginTop: '20px', padding: '16px', background: '#e8f5e8', borderRadius: '8px' }}>
          <h4 style={{ marginBottom: '8px', color: '#2d5a2d' }}>💡 Quick Tips:</h4>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#2d5a2d' }}>
            <li>Ask: "I want my certificate from scratcholympiads.com"</li>
            <li>Ask: "When is the National Math Olympiad exam?"</li>
            <li>Ask: "Give me the payment link for Painting Olympics"</li>
            <li>Ask: "What competitions are available?"</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default ChatPage