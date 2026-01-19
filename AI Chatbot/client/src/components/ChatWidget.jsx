import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

const ChatWidget = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your AI assistant for GEMA competitions. I can help you with:\n\n🎓 Certificate generation\n📅 Exam dates\n💳 Payment links\n🔗 Registration information\n\nHow can I help you today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
    // Restore focus to input field after scrolling
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100) // Small delay to ensure scroll completes first
  }, [messages])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!inputMessage.trim() || isLoading) return

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await axios.post('/api/chat/message', {
        message: inputMessage,
        conversationHistory: messages.slice(-5) // Send last 5 messages for context
      })

      const botMessage = {
        id: Date.now() + 1,
        text: response.data.message,
        sender: 'bot',
        timestamp: new Date(),
        data: response.data.data // Additional data like links, certificates, etc.
      }

      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      console.error('Chat error:', error)
      toast.error('Failed to get response. Please try again.')
      
      const errorMessage = {
        id: Date.now() + 1,
        text: "Sorry, I'm having trouble processing your request right now. Please try again later.",
        sender: 'bot',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      // Ensure input field gets focus after sending message
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
    }
  }

  const formatMessage = (message) => {
    // Handle special formatting for links, certificates, etc.
    let formattedText = message?.text || ''
    
    // Convert URLs to clickable links
    const urlRegex = /(https?:\/\/[^\s]+)/g
    formattedText = formattedText.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')
    
    return { __html: formattedText }
  }

  const handleWebsiteSelection = async (websiteType, data) => {
    setIsLoading(true);
    try {
      // Send the website selection to the server
      const response = await axios.post('/api/chat/message', {
        message: `Use ${websiteType} website for ${data.website}`,
        conversationHistory: messages.slice(-5), // Send last 5 messages for context
        websiteType: websiteType,
        websiteName: data.website,
        email: data.email
      });

      const botMessage = {
        id: Date.now() + 1,
        text: response.data.message,
        sender: 'bot',
        timestamp: new Date(),
        data: response.data.data // Additional data like links, certificates, etc.
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to get response. Please try again.');
      
      const errorMessage = {
        id: Date.now() + 1,
        text: "Sorry, I'm having trouble processing your request right now. Please try again later.",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      // Ensure input field gets focus after sending message
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  };

  const renderMessageData = (data) => {
    if (!data) return null;

    return (
      <div style={{ marginTop: '10px' }}>
        {data.type === 'certificate' && data.downloadUrl && (
          <div style={{ padding: '15px', background: 'linear-gradient(135deg, #e8f5e8 0%, #d4edda 100%)', borderRadius: '12px', marginTop: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '24px', marginRight: '10px' }}>🎓</span>
              <strong style={{ fontSize: '16px' }}>Certificate Ready!</strong>
            </div>
            <p style={{ margin: '8px 0', fontSize: '14px' }}>
              Your certificate for <strong>{data.website || 'the competition'}</strong> has been generated successfully.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
              <a 
                href={data.downloadUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn btn-primary" 
                style={{ 
                  padding: '10px 16px', 
                  fontSize: '14px', 
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <span style={{ fontSize: '18px' }}>⬇️</span> Download Certificate
              </a>
              {data.websiteUrl && (
                <a 
                  href={data.websiteUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ 
                    fontSize: '14px', 
                    color: '#0066cc', 
                    textAlign: 'center',
                    textDecoration: 'none'
                  }}
                >
                  Visit Competition Website
                </a>
              )}
              {data.websiteType && (
                <div style={{ fontSize: '12px', textAlign: 'center', color: '#666', marginTop: '5px' }}>
                  Generated from {data.websiteType === 'india' ? '🇮🇳 India' : '🌎 International'} website
                </div>
              )}
            </div>
          </div>
        )}
        
        {data.type === 'certificate_not_found' && (
          <div style={{ padding: '15px', background: 'linear-gradient(135deg, #fff3cd 0%, #ffeeba 100%)', borderRadius: '12px', marginTop: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '24px', marginRight: '10px' }}>🔍</span>
              <strong style={{ fontSize: '16px' }}>Certificate Not Found</strong>
            </div>
            <p style={{ margin: '8px 0', fontSize: '14px' }}>
              We couldn't find a certificate for <strong>{data.website}</strong> with the email <strong>{data.email}</strong>.
            </p>
            
            {data.reasons && data.reasons.length > 0 && (
              <div style={{ margin: '12px 0' }}>
                <strong style={{ fontSize: '14px' }}>Possible reasons:</strong>
                <ul style={{ marginTop: '5px', paddingLeft: '20px', fontSize: '14px' }}>
                  {data.reasons.map((reason, idx) => (
                    <li key={idx}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {data.contact && (
              <div style={{ margin: '12px 0', fontSize: '14px', padding: '10px', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: '8px' }}>
                <strong>Need help?</strong> Contact support:
                {data.contact.email && (
                  <div style={{ marginTop: '5px' }}>
                    <span style={{ fontSize: '14px' }}>✉️</span> <a href={`mailto:${data.contact.email}`}>{data.contact.email}</a>
                  </div>
                )}
                {data.contact.phone && (
                  <div style={{ marginTop: '5px' }}>
                    <span style={{ fontSize: '14px' }}>📞</span> {data.contact.phone}
                  </div>
                )}
              </div>
            )}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
              <button
                onClick={() => {
                  setInputMessage(`Try certificate with different email`);
                  setTimeout(() => handleSendMessage({ preventDefault: () => {} }), 100);
                }}
                className="btn btn-warning"
                style={{ 
                  padding: '10px 16px', 
                  fontSize: '14px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <span style={{ fontSize: '18px' }}>✉️</span> Try with different email
              </button>
            </div>
          </div>
        )}
        
        {data.type === 'certificate' && !data.downloadUrl && data.resultLink && (
          <div style={{ padding: '15px', background: 'linear-gradient(135deg, #fff3cd 0%, #ffeeba 100%)', borderRadius: '12px', marginTop: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '24px', marginRight: '10px' }}>🔍</span>
              <strong style={{ fontSize: '16px' }}>Certificate Not Found</strong>
            </div>
            <p style={{ margin: '8px 0', fontSize: '14px' }}>
              We couldn't find a certificate with the provided email. Please check the results page to verify your information.
            </p>
            <a 
              href={data.resultLink} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn btn-warning" 
              style={{ 
                marginTop: '12px',
                padding: '10px 16px', 
                fontSize: '14px', 
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <span style={{ fontSize: '18px' }}>🔎</span> View Results Page
            </a>
          </div>
        )}
        
        {data.type === 'website_selection' && (
          <div style={{ padding: '15px', background: 'linear-gradient(135deg, #e6f7ff 0%, #cce5ff 100%)', borderRadius: '12px', marginTop: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '24px', marginRight: '10px' }}>🌐</span>
              <strong style={{ fontSize: '16px' }}>Website Selection</strong>
            </div>
            <p style={{ margin: '8px 0', fontSize: '14px' }}>
              Please select which website to use for certificate generation for <strong>{data.website}</strong>:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
              {data.options.map((option, index) => (
                <button 
                  key={index}
                  onClick={() => handleWebsiteSelection(option.type, data)}
                  className={`btn ${option.type === 'india' ? 'btn-outline-danger' : 'btn-outline-primary'}`}
                  style={{ 
                    padding: '12px 16px', 
                    fontSize: '14px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {option.type === 'india' ? (
                    <>
                      <span style={{ fontSize: '18px' }}>🇮🇳</span> India Website (.in)
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: '18px' }}>🌎</span> International Website (.com)
                    </>
                  )}
                </button>
              ))}
            </div>
            <div style={{ fontSize: '12px', textAlign: 'center', color: '#666', marginTop: '15px' }}>
              Select the website that matches where you registered for the competition
            </div>
          </div>
        )}
        
        {data.type === 'payment_link' && data.link && (
          <div style={{ padding: '15px', background: 'linear-gradient(135deg, #fff3cd 0%, #ffeeba 100%)', borderRadius: '12px', marginTop: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '24px', marginRight: '10px' }}>💳</span>
              <strong style={{ fontSize: '16px' }}>Payment Link</strong>
            </div>
            <p style={{ margin: '8px 0', fontSize: '14px' }}>
              Click the button below to make your payment for the competition registration.
            </p>
            <a 
              href={data.link} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn btn-warning" 
              style={{ 
                marginTop: '12px',
                padding: '10px 16px', 
                fontSize: '14px', 
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <span style={{ fontSize: '18px' }}>💰</span> Make Payment
            </a>
          </div>
        )}
        
        {data.type === 'exam_date' && (
          <div style={{ padding: '15px', background: 'linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%)', borderRadius: '12px', marginTop: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '24px', marginRight: '10px' }}>📅</span>
              <strong style={{ fontSize: '16px' }}>Exam Dates</strong>
            </div>
            <div style={{ margin: '8px 0', fontSize: '14px', lineHeight: '1.5' }}>
              {data.date}
            </div>
          </div>
        )}
        
        {data.type === 'email_request' && (
          <div style={{ padding: '15px', background: 'linear-gradient(135deg, #e8f5e8 0%, #d4edda 100%)', borderRadius: '12px', marginTop: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '24px', marginRight: '10px' }}>✉️</span>
              <strong style={{ fontSize: '16px' }}>Email Required</strong>
            </div>
            <p style={{ margin: '8px 0', fontSize: '14px' }}>
              {data.message || 'Please provide your email address to generate your certificate.'}
            </p>
            
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const emailInput = e.target.elements.email.value;
                if (emailInput && emailInput.includes('@')) {
                  setInputMessage(`My email is ${emailInput}`);
                  setTimeout(() => handleSendMessage({ preventDefault: () => {} }), 100);
                } else {
                  toast.error('Please enter a valid email address');
                }
              }}
              style={{ marginTop: '12px' }}
            >
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="email" 
                  name="email"
                  placeholder="Enter your email address" 
                  className="form-control"
                  style={{ fontSize: '14px' }}
                  required
                />
                <button 
                  type="submit" 
                  className="btn btn-success"
                  style={{ 
                    padding: '8px 16px', 
                    fontSize: '14px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <span style={{ fontSize: '16px' }}>✓</span> Submit
                </button>
              </div>
            </form>
          </div>
        )}
        
        {data.type === 'certificate_options' && data.websites && (
          <div style={{ padding: '15px', background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', borderRadius: '12px', marginTop: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '24px', marginRight: '10px' }}>🏆</span>
              <strong style={{ fontSize: '16px' }}>Available Competitions</strong>
            </div>
            <div style={{ margin: '8px 0', fontSize: '14px' }}>
              <p>Select a competition to generate your certificate:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                {data.websites.map((site, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setInputMessage(`Generate certificate for ${site.name}`);
                      setTimeout(() => handleSendMessage({ preventDefault: () => {} }), 100);
                    }}
                    className="btn btn-outline-secondary"
                    style={{ 
                      padding: '10px 16px', 
                      fontSize: '14px',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span style={{ fontSize: '18px' }}>🎓</span> {site.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {data.type === 'website_info' && (
          <div style={{ padding: '15px', background: 'linear-gradient(135deg, #e6f7ff 0%, #cce5ff 100%)', borderRadius: '12px', marginTop: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '24px', marginRight: '10px' }}>ℹ️</span>
              <strong style={{ fontSize: '16px' }}>Website Information</strong>
            </div>
            <div style={{ margin: '8px 0', fontSize: '14px', lineHeight: '1.5' }}>
              <h4 style={{ fontSize: '16px', marginBottom: '8px' }}>{data.name}</h4>
              {data.description && <p style={{ marginBottom: '10px' }}>{data.description}</p>}
              
              {data.examDate && (
                <div style={{ marginBottom: '8px' }}>
                  <strong>📅 Exam Date:</strong> {data.examDate}
                </div>
              )}
              
              {data.lastDateofRegister && (
                <div style={{ marginBottom: '8px' }}>
                  <strong>⏰ Last Date for Registration:</strong> {data.lastDateofRegister}
                </div>
              )}
              
              {data.categories && data.categories.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <strong>👥 Categories:</strong>
                  <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
                    {data.categories.map((cat, idx) => (
                      <li key={idx}>{cat}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {data.links && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                  {data.links.map((link, idx) => (
                    <a 
                      key={idx}
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className={`btn ${link.type === 'registration' ? 'btn-success' : link.type === 'payment' ? 'btn-warning' : 'btn-info'}`}
                      style={{ 
                        padding: '8px 16px', 
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      <span style={{ fontSize: '18px' }}>
                        {link.type === 'registration' ? '📝' : 
                         link.type === 'payment' ? '💳' : 
                         link.type === 'result' ? '🔍' : '🔗'}
                      </span>
                      {link.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.sender}`}>
            <div dangerouslySetInnerHTML={formatMessage(message)} />
            {renderMessageData(message.data)}
            <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="message bot">
            <div className="loading">
              <div className="spinner"></div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSendMessage} className="chat-input">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Ask me about certificates, exam dates, or payment links..."
          className="input"
          disabled={isLoading}
          ref={inputRef}
        />
        <button type="submit" className="btn btn-primary" disabled={isLoading || !inputMessage.trim()}>
          Send
        </button>
      </form>
    </div>
  )
}

export default ChatWidget