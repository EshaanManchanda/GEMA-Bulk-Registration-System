const express = require('express')
const router = express.Router()
const Chat = require('../models/Chat')
const Website = require('../models/Website')
const { optionalAuth } = require('../middleware/auth')
const axios = require('axios')
const { HfInference } = require('@huggingface/inference')

const HF_ACCESS_TOKEN = process.env.HF_TOKEN;
const hf = new HfInference(HF_ACCESS_TOKEN);

// Hugging Face model IDs
const INTENT_CLASSIFICATION_MODEL = 'Falconsai/intent_classification'; // Specialized intent classification model
const QA_MODEL = 'deepset/roberta-base-squad2'; // Or 'distilbert-base-cased-distilled-squad'
const CONVERSATIONAL_MODEL = 'microsoft/DialoGPT-medium'; // Or 'facebook/blenderbot-1B-distill'

// Enhanced intent detection function using specialized intent classification model
const detectIntent = async (message) => {
  // Detect intent using Hugging Face model
  let intent = 'general'; // Default to general
  try {
      // First check for explicit keywords in the message (rule-based detection)
      const lowerMessage = message.toLowerCase();
      
      // Certificate-related keywords
      if (lowerMessage.includes('certificate') || 
          lowerMessage.includes('cert') || 
          lowerMessage.includes('download') ||
          lowerMessage.includes('generate') ||
          lowerMessage.includes('certification')) {
        intent = 'certificate';
      }
      // Exam date keywords with more combinations
      else if (lowerMessage.includes('exam date') || 
          (lowerMessage.includes('exam') && lowerMessage.includes('date')) || 
          (lowerMessage.includes('exam') && lowerMessage.includes('when')) ||
          lowerMessage.includes('when is the exam') ||
          lowerMessage.includes('test date') ||
          lowerMessage.includes('schedule') && lowerMessage.includes('exam')) {
        intent = 'exam_date';
      }
      // Payment/registration keywords
      else if (lowerMessage.includes('payment') || 
          lowerMessage.includes('pay') || 
          lowerMessage.includes('register') ||
          lowerMessage.includes('registration') ||
          lowerMessage.includes('fee') ||
          lowerMessage.includes('cost') ||
          lowerMessage.includes('how to pay')) {
        intent = 'payment';
      }
      // Website info keywords - expanded to catch more variations
      else if (lowerMessage.includes('website') || 
          lowerMessage.includes('link') || 
          lowerMessage.includes('url') ||
          lowerMessage.includes('site') ||
          lowerMessage.includes('web page') ||
          lowerMessage.includes('webpage') ||
          lowerMessage.includes('website information') ||
          lowerMessage.includes('info about website') ||
          lowerMessage.includes('tell me about the website')) {
        intent = 'website_info';
      }
      // Greeting keywords
      else if (lowerMessage.includes('hello') || 
          lowerMessage.includes('hi') || 
          lowerMessage.includes('hey') ||
          lowerMessage.includes('help') ||
          lowerMessage.includes('greetings')) {
        intent = 'greeting';
      }
      
      // If rule-based detection found an intent, log it
      if (intent !== 'general') {
        console.log(`Rule-based intent detection: ${intent}`);
      } else {
        // If no rule-based intent was found, try using the Hugging Face model
        console.log(`Classifying intent for message: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`);      
        // The Falconsai/intent_classification model returns an array of objects with label and score
        const classificationResult = await hf.textClassification({
            model: INTENT_CLASSIFICATION_MODEL,
            inputs: message
        });
        
        console.log('Intent classification result:', JSON.stringify(classificationResult));
        
        // Handle both array format and single object format (for compatibility)
        const predictions = Array.isArray(classificationResult) ? classificationResult : [classificationResult];
        
        if (predictions.length > 0) {
            // Find the prediction with the highest score
            const topPrediction = predictions.reduce((prev, current) => 
                (prev.score > current.score) ? prev : current);
            
            console.log(`Top prediction: ${topPrediction.label} with score ${topPrediction.score}`);
            
            // Set a confidence threshold - can be lower with specialized model
            if (topPrediction.score > 0.7) { // Adjusted threshold for specialized model
                // Map model labels to your internal intent names
                // The Falconsai model should return more accurate intent labels
                const label = topPrediction.label.toLowerCase();
                if (label.includes('greeting') || label.includes('hello') || label.includes('hi') || 
                    label.includes('welcome') || label.includes('introduction')) {
                    intent = 'greeting';
                } else if (label.includes('certificate') || label.includes('cert') || 
                          label.includes('document') || label.includes('verification')) {
                    intent = 'certificate';
                } else if (label.includes('exam') || label.includes('date') || label.includes('schedule') || 
                          label.includes('time') || label.includes('when') || label.includes('appointment')) {
                    intent = 'exam_date';
                } else if (label.includes('payment') || label.includes('pay') || label.includes('register') || 
                          label.includes('fee') || label.includes('cost')) {
                    intent = 'payment';
                } else if (label.includes('website') || label.includes('info') || label.includes('link') || 
                          label.includes('url') || label.includes('site') || label.includes('edit account') ||
                          label.includes('information')) {
                    intent = 'website_info';
                } else {
                    intent = 'general';
                }
                console.log(`Detected intent: ${intent} from label: ${label}`);
            } else {
                console.log(`Prediction score ${topPrediction.score} below threshold, using default intent: ${intent}`);
            }
        } else {
            console.log('No classification results returned, using default intent');
        }
      }
      
      // Special case for random messages that should be general
      if (lowerMessage.includes('random message') || lowerMessage.includes('test message')) {
        intent = 'general';
        console.log('Overriding to general intent for test/random message');
      }
  } catch (hfError) {
      console.error('Hugging Face intent classification error:', hfError.message || hfError);
      console.log('Falling back to rule-based intent detection');
      // Fallback to rule-based intent detection if HF fails
      const lowerMessage = message.toLowerCase()
      
      // Certificate-related keywords
      if (lowerMessage.includes('certificate') || 
          lowerMessage.includes('cert') || 
          lowerMessage.includes('download') ||
          lowerMessage.includes('generate')) {
        return 'certificate'
      }
      
      // Exam date keywords
      if (lowerMessage.includes('exam') || 
          lowerMessage.includes('date') || 
          lowerMessage.includes('when') ||
          lowerMessage.includes('schedule')) {
        return 'exam_date'
      }
      
      // Payment/registration keywords
      if (lowerMessage.includes('payment') || 
          lowerMessage.includes('pay') || 
          lowerMessage.includes('register') ||
          lowerMessage.includes('registration') ||
          lowerMessage.includes('fee')) {
        return 'payment'
      }
      
      // Website info keywords
      if (lowerMessage.includes('website') || 
          lowerMessage.includes('link') || 
          lowerMessage.includes('url') ||
          lowerMessage.includes('site')) {
        return 'website_info'
      }
      
      // Greeting keywords
      if (lowerMessage.includes('hello') || 
          lowerMessage.includes('hi') || 
          lowerMessage.includes('hey') ||
          lowerMessage.includes('help')) {
        return 'greeting'
      }
      
      return 'general'
  }
  console.log(`Final detected intent: ${intent}`);
  // Log the intent detection result for debugging
  console.log(`=== INTENT DETECTION RESULT ===`);
  console.log(`Message: ${message}`);
  console.log(`Detected Intent: ${intent}`);
  console.log(`===========================`);
  return intent;
}

// Extract website name or domain from message
const extractWebsiteInfo = (message) => {
  if (!message || typeof message !== 'string') {
    return []
  }

  const lowerMessage = message.toLowerCase()
  let matches = new Set()

  try {
    // Common website patterns
    const urlPattern = /https?:\/\/(www\.)?([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g
    const domainPattern = /([a-zA-Z0-9.-]+\.(com|in|org|net|edu|gov))/g
    
    // Extract URLs
    let urlMatch
    while ((urlMatch = urlPattern.exec(message)) !== null) {
      if (urlMatch[2]) matches.add(urlMatch[2].toLowerCase())
    }
    
    // Extract domain names
    let domainMatch
    while ((domainMatch = domainPattern.exec(message)) !== null) {
      if (domainMatch[1]) matches.add(domainMatch[1].toLowerCase())
    }
    
    // Check for website names mentioned in the message
    const commonNames = [
      'scratch', 'painting', 'abacus', 'math', 'science', 
      'olympiad', 'competition', 'contest', 'national'
    ]
    
    // Extract multi-word combinations
    const words = lowerMessage.split(/\s+/)
    for (let i = 0; i < words.length; i++) {
      // Single word check
      if (commonNames.includes(words[i])) {
        matches.add(words[i])
      }
      
      // Two word combinations
      if (i < words.length - 1) {
        const twoWords = words[i] + ' ' + words[i + 1]
        if (twoWords.includes('olympiad') || 
            twoWords.includes('competition') || 
            twoWords.includes('contest')) {
          matches.add(twoWords)
        }
      }
    }
    
    return Array.from(matches)
  } catch (error) {
    console.error('Error in extractWebsiteInfo:', error)
    return []
  }
}

// Extract email from message
const extractEmail = (message) => {
  if (!message || typeof message !== 'string') return null;
  
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  const matches = message.match(emailPattern)
  return matches ? matches[0] : null
}

// Generate certificate
const generateCertificate = async (website, email, websiteType = null) => {
  try {
    // Determine which website to use based on websiteType parameter
    let apiUrl, apiKey;
    
    if (websiteType === 'india' && website.india && website.india.link) {
      apiUrl = `${website.india.link}/wp-json/certificate-generator/v1/issue-certificate`;
      apiKey = website.india.apiKey;
      console.log('Using India website for certificate generation:', apiUrl);
    } else if (websiteType === 'international' && website.international && website.international.link) {
      apiUrl = `${website.international.link}/wp-json/certificate-generator/v1/issue-certificate`;
      apiKey = website.international.apiKey;
      console.log('Using International website for certificate generation:', apiUrl);
    } else {
      // Fallback to the default website link if specific type not available
      apiUrl = `${website.link}/wp-json/certificate-generator/v1/issue-certificate`;
      apiKey = website.apiKey;
      console.log('Using default website for certificate generation:', apiUrl);
    }
    
    console.log(`Generating certificate for email: ${email} using API URL: ${apiUrl}`);
    
    const response = await axios.post(apiUrl, {
      student_email: email
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    })
    
    console.log('Certificate generation successful:', response.data);
    
    return {
      success: true,
      data: response.data
    }
    
  } catch (error) {
    console.error('Certificate generation error:', error.response?.data || error.message)
    
    if (error.response?.status === 404) {
      return {
        success: false,
        error: 'Student not found with the provided email address.'
      }
    }
    
    return {
      success: false,
      error: 'Failed to generate certificate. Please try again later.'
    }
  }
}

// Intent detection endpoint (for testing)
router.post('/detect-intent', optionalAuth, async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Detect intent without further processing
    const intent = await detectIntent(message);
    
    // Return the detected intent
    return res.json({ intent });
  } catch (error) {
    console.error('Error in detect-intent endpoint:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Main chat endpoint
router.post('/message', optionalAuth, async (req, res) => {
  try {
    const { message, sessionId, userEmail, websiteType, websiteName, email } = req.body
    
    if (!message || !message.trim()) {
      return res.status(400).json({
        message: 'Message is required'
      })
    }
    
    // Handle direct website selection from UI
    if (websiteType && websiteName && email) {
      console.log(`Received website selection: ${websiteType} for ${websiteName} with email ${email}`);
      
      // Find the website by name
      const website = await Website.findOne({ name: websiteName });
      
      if (!website) {
        return res.status(404).json({
          message: `Website ${websiteName} not found.`
        });
      }
      
      // Generate certificate with the selected website type
      const certResult = await generateCertificate(website, email, websiteType);
      
      let response = {
        message: '',
        data: null,
        suggestions: []
      };
      
      if (certResult.success) {
        response.message = `Your certificate is generated for ${website.name}. Click here to download your certificate.`;
        
        // Add contact information
        if (website.contact) {
          response.message += '\n\nIf you have any questions, you can contact:';
          if (website.contact.email) {
            response.message += `\nEmail: ${website.contact.email}`;
          }
          if (website.contact.phone) {
            response.message += `\nPhone: ${website.contact.phone}`;
          }
        }
        
        // Get website link based on type
        let websiteLink = null;
        let resultLink = null;
        
        if (websiteType === 'india' && website.india) {
          if (website.india.link) websiteLink = website.india.link;
          if (website.india.resultLink) resultLink = website.india.resultLink;
        } else if (websiteType === 'international' && website.international) {
          if (website.international.link) websiteLink = website.international.link;
          if (website.international.resultLink) resultLink = website.international.resultLink;
        } else {
          if (website.link) websiteLink = website.link;
          if (website.resultLink) resultLink = website.resultLink;
        }
        
        response.data = {
          type: 'certificate',
          downloadUrl: certResult.data.download_url,
          website: website.name,
          websiteUrl: websiteLink,
          resultLink: resultLink,
          websiteType: websiteType
        };
        
        // Add helpful suggestions
        response.suggestions = [
          `Tell me more about ${website.name}`,
          'Show me all websites',
          'Check exam dates'
        ];
      } else {
        // Get result link based on website type
        let resultLink = null;
        if (websiteType === 'india' && website.india && website.india.resultLink) {
          resultLink = website.india.resultLink;
        } else if (websiteType === 'international' && website.international && website.international.resultLink) {
          resultLink = website.international.resultLink;
        } else if (website.resultLink) {
          resultLink = website.resultLink;
        }
        
        if (certResult.error && certResult.error.includes('No student found')) {
          response.message = `No student found with the email ${email}. You can check by going to the results page: ${resultLink}`;
        } else {
          response.message = `Sorry, I couldn't generate your certificate for ${website.name}. ${certResult.error}`;
        }
        
        // Add helpful information about possible reasons
        response.message += '\n\nThis could be because:\n• The email address is not registered\n• The competition has not ended yet\n• There might be technical issues with the certificate generation system';
        
        // Add contact information for support
        if (website.contact && website.contact.email) {
          response.message += `\n\nFor assistance, please contact: ${website.contact.email}`;
        }
        
        // Add helpful suggestions
        response.suggestions = [
          'Try with a different email',
          `When is the ${website.name} exam?`,
          'Show me all websites'
        ];
      }
      
      return res.json(response);
    }
    
    // Regular message processing
    // Detect intent
    const intent = await detectIntent(message)
    const websiteInfo = extractWebsiteInfo(message)
    const extractedEmail = extractEmail(message) || userEmail || email
    
    let response = {
      message: '',
      data: null,
      suggestions: []
    }
    const userLocation = req.body.location || 'international'; // Default to international if not provided
    
    // Handle different intents
    switch (intent) {
      case 'greeting':
        response.message = "Hello there! How can I assist you today? Feel free to ask me about certificate generation, exam dates, payment links, or website information."
        response.suggestions = [
          "Generate my certificate",
          "Check exam dates",
          "Payment information",
          "Website information"
        ]
        break
      case 'certificate':
        try {
          if (!extractedEmail) {
            response.message = 'To generate your certificate, I need your email address. Please provide your email address that you used for registration.'
            response.data = {
              type: 'email_request',
              message: 'Please provide your email address to generate a certificate.'
            };
            response.suggestions = ['My email is example@email.com']
          } else if (websiteInfo.length === 0) {
            // No specific website mentioned, provide a list of competitions with certificate options
            const websites = await Website.find();
            
            // Create a formatted message with certificate information
            let certificateMessage = 'I can help you generate certificates for the following competitions:\n\n';
            
            // Add website information to the message
            websites.forEach((site, index) => {
              certificateMessage += `${index + 1}. **${site.name}**\n`;
              
              // Show both India and International website options if available
              if (site.india && site.india.link) {
                certificateMessage += `   India Website: ${site.india.link}\n`;
              }
              
              if (site.international && site.international.link) {
                certificateMessage += `   International Website: ${site.international.link}\n`;
              }
              
              // Fallback to default link if neither is available
              if ((!site.india || !site.india.link) && (!site.international || !site.international.link) && site.link) {
                certificateMessage += `   Website: ${site.link}\n`;
              }
              
              // Add contact information
              if (site.contact && site.contact.email) {
                certificateMessage += `   Contact: ${site.contact.email}\n`;
              }
              
              certificateMessage += '\n';
            });
            
            certificateMessage += 'Please specify which competition you need a certificate for by mentioning the name.';
            
            response.message = certificateMessage;
            
            // Add structured data for the enhanced UI
            response.data = {
              type: 'certificate_options',
              message: 'Please select a competition to generate your certificate:',
              email: extractedEmail,
              websites: websites.map(site => ({
                name: site.name,
                id: site._id,
                description: site.description ? site.description.substring(0, 100) + '...' : null,
                examDate: site.examDate,
                indiaUrl: site.india && site.india.link ? site.india.link : null,
                internationalUrl: site.international && site.international.link ? site.international.link : null,
                defaultUrl: site.link
              }))
            };
            
            // Add helpful suggestions
            const randomWebsites = websites.sort(() => 0.5 - Math.random()).slice(0, 3);
            response.suggestions = randomWebsites.map(site => `Certificate from ${site.name}`);}
          else {
            // Try to find matching website
            const websites = await Website.find()
            let matchedWebsite = null
            let websiteType = null
            
            // Check if the message contains website type indicators
            const lowerMessage = message.toLowerCase();
            if (lowerMessage.includes('.in') || lowerMessage.includes('india') || lowerMessage.includes('indian')) {
              websiteType = 'india';
              console.log('Detected India website type from message');
            } else if (lowerMessage.includes('.com') || lowerMessage.includes('international') || lowerMessage.includes('global')) {
              websiteType = 'international';
              console.log('Detected International website type from message');
            }
            
            for (const info of websiteInfo) {
              if (!info) continue;
              matchedWebsite = websites.find(site => 
                (site.domain && site.domain.toLowerCase().includes(info.toLowerCase())) || 
                (site.name && site.name.toLowerCase().includes(info.toLowerCase())) ||
                (site.international && site.international.link && site.international.link.toLowerCase().includes(info.toLowerCase())) ||
                (site.india && site.india.link && site.india.link.toLowerCase().includes(info.toLowerCase()))
              );
              if (matchedWebsite) break;
            }
            
            if (matchedWebsite) {
              // Check if we need to ask for website type (India or International)
              if (!websiteType && matchedWebsite.india && matchedWebsite.india.link && 
                  matchedWebsite.international && matchedWebsite.international.link) {
                
                // We need to ask the user which website they want to use
                response.message = `For ${matchedWebsite.name}, we have two websites available:\n\n` +
                                  `1. India Website (.in): ${matchedWebsite.india.link}\n` +
                                  `2. International Website (.com): ${matchedWebsite.international.link}\n\n` +
                                  `Please specify which website you want to use for generating your certificate.`;
                
                response.data = {
                  type: 'website_selection',
                  website: matchedWebsite.name,
                  options: [
                    { type: 'india', url: matchedWebsite.india.link },
                    { type: 'international', url: matchedWebsite.international.link }
                  ],
                  email: extractedEmail
                };
                
                response.suggestions = [
                  `Use India website (.in)`,
                  `Use International website (.com)`
                ];
                
              } else {
                // We have the website type or only one website is available
                // If websiteType is not set, use userLocation as fallback
                if (!websiteType) {
                  websiteType = userLocation;
                  console.log(`Using user location as website type: ${websiteType}`);
                }
                
                // Get website link based on type
                let websiteLink = null;
                if (websiteType === 'india' && matchedWebsite.india && matchedWebsite.india.link) {
                  websiteLink = matchedWebsite.india.link;
                } else if (websiteType === 'international' && matchedWebsite.international && matchedWebsite.international.link) {
                  websiteLink = matchedWebsite.international.link;
                } else if (matchedWebsite.link) {
                  websiteLink = matchedWebsite.link;
                  websiteType = null; // Reset websiteType if using default link
                }
                
                console.log(`Generating certificate with website type: ${websiteType}, link: ${websiteLink}`);
                const certResult = await generateCertificate(matchedWebsite, extractedEmail, websiteType);
                
                if (certResult.success) {
                  response.message = `Great! Your certificate for ${matchedWebsite.name} has been generated successfully. You can download it using the link below.`;
                  
                  // Add additional information about the competition
                  if (matchedWebsite.description) {
                    response.message += `\n\nAbout ${matchedWebsite.name}: ${matchedWebsite.description.substring(0, 150)}...`;
                  }
                  
                  // Add contact information
                  if (matchedWebsite.contact) {
                    response.message += '\n\nIf you have any questions, you can contact:';
                    if (matchedWebsite.contact.email) {
                      response.message += `\nEmail: ${matchedWebsite.contact.email}`;
                    }
                    if (matchedWebsite.contact.phone) {
                      response.message += `\nPhone: ${matchedWebsite.contact.phone}`;
                    }
                  }
                  
                  response.data = {
                    type: 'certificate',
                    downloadUrl: certResult.data.download_url,
                    website: matchedWebsite.name,
                    websiteUrl: websiteLink,
                    websiteType: websiteType
                  };
                  
                  // Add helpful suggestions
                  response.suggestions = [
                    `Tell me more about ${matchedWebsite.name}`,
                    'Show me all websites',
                    'Check exam dates'
                  ];
                } else {
                  response.message = `Sorry, I couldn't generate your certificate for ${matchedWebsite.name}. ${certResult.error}`;
                  
                  // Add helpful information about possible reasons
                  response.message += '\n\nThis could be because:\n• The email address is not registered\n• The competition has not ended yet\n• There might be technical issues with the certificate generation system';
                  
                  // Add contact information for support
                  if (matchedWebsite.contact && matchedWebsite.contact.email) {
                    response.message += `\n\nFor assistance, please contact: ${matchedWebsite.contact.email}`;
                  }
                  
                  // Add structured data for certificate not found UI
                  response.data = {
                    type: 'certificate_not_found',
                    website: matchedWebsite.name,
                    email: extractedEmail,
                    error: certResult.error,
                    reasons: [
                      'The email address is not registered',
                      'The competition has not ended yet',
                      'There might be technical issues with the certificate generation system'
                    ],
                    contact: matchedWebsite.contact ? {
                      email: matchedWebsite.contact.email,
                      phone: userLocation === 'india' ? matchedWebsite.contact.phone : matchedWebsite.contact.internationalPhone
                    } : null
                  };
                  
                  // Add helpful suggestions
                  response.suggestions = [
                    'Try with a different email',
                    `When is the ${matchedWebsite.name} exam?`,
                    'Show me all websites'
                  ];
                }
              }
            } else {
              // Try to use QA model for website info if direct match fails
              try {
                  const allWebsiteNames = websites.map(w => w.name).join(', ');
                  const qaResult = await hf.questionAnswering({
                      model: QA_MODEL,
                      inputs: {
                          question: `What is ${websiteInfo.join(' ')}?`,
                          context: `Available websites are: ${allWebsiteNames}.`
                      }
                  });
                  if (qaResult && qaResult.score > 0.7) {
                      response.message = `I found some information about ${websiteInfo.join(' ')}: ${qaResult.answer}.\n\nHowever, I can only generate certificates for specific competitions. Here are some available options:`;
                      
                      // List available websites
                      const availableWebsites = websites.slice(0, 3);
                      availableWebsites.forEach((site, index) => {
                        response.message += `\n${index + 1}. ${site.name}`;
                      });
                      
                      response.suggestions = availableWebsites.map(site => `Certificate from ${site.name}`);
                      break;
                  }
              } catch (qaError) {
                  console.error('Hugging Face QA error:', qaError);
              }
              // Fallback if QA fails or score is too low
              response.message = `I couldn't find a competition called "${websiteInfo.join(' ')}". Please check the name and try again.\n\nHere are some competitions I can help with:`;
              
              // List available websites
              const availableWebsites = websites.slice(0, 3);
              availableWebsites.forEach((site, index) => {
                response.message += `\n${index + 1}. ${site.name}`;
              });
              
              response.suggestions = availableWebsites.map(site => `Certificate from ${site.name}`);
            }
          }
        } catch (error) {
          console.error('Certificate handling error:', error);
          response.message = 'I\'m having trouble with the certificate generation process. Please try again later or contact support.';
          response.suggestions = [
            'Try again later',
            'Show me all websites',
            'Check exam dates'
          ];
        }
        break
        
      case 'exam_date':
        try {
          if (websiteInfo.length === 0) {
            // No specific website mentioned, provide a list of all available exam dates
            const websites = await Website.find();
            const websitesWithExamDates = websites.filter(site => 
              site.examDate || (site.india && site.india.examDate) || (site.international && site.international.examDate)
            );
            
            if (websitesWithExamDates.length > 0) {
              // Create a formatted message with exam date information
              let examDateMessage = 'Here are the upcoming exam dates for various competitions:\n\n';
              
              // Add exam date information to the message
              websitesWithExamDates.forEach((site, index) => {
                examDateMessage += `${index + 1}. **${site.name}**\n`;
                
                // Get location-specific exam date
                let examDate = null;
                if (userLocation === 'india' && site.india && site.india.examDate) {
                  examDate = site.india.examDate;
                } else if (userLocation === 'international' && site.international && site.international.examDate) {
                  examDate = site.international.examDate;
                } else {
                  examDate = site.examDate;
                }
                
                examDateMessage += `   Exam Date: ${examDate}\n`;
                
                // Add registration deadline if available
                if (site.lastDateofRegister) {
                  examDateMessage += `   Last Date for Registration: ${site.lastDateofRegister}\n`;
                }
                
                // Add website link if available
                const websiteLink = userLocation === 'india' && site.india && site.india.link ? 
                  site.india.link : 
                  (site.international && site.international.link ? site.international.link : site.link);
                  
                if (websiteLink) {
                  examDateMessage += `   Website: ${websiteLink}\n`;
                }
                
                examDateMessage += '\n';
              });
              
              response.message = examDateMessage;
              
              // Add structured data for the frontend
              response.data = {
                type: 'exam_date_list',
                websites: websitesWithExamDates.map(site => {
                  // Get location-specific exam date and link
                  let examDate = null;
                  if (userLocation === 'india' && site.india && site.india.examDate) {
                    examDate = site.india.examDate;
                  } else if (userLocation === 'international' && site.international && site.international.examDate) {
                    examDate = site.international.examDate;
                  } else {
                    examDate = site.examDate;
                  }
                  
                  const url = userLocation === 'india' && site.india && site.india.link ? 
                    site.india.link : 
                    (site.international && site.international.link ? site.international.link : site.link);
                    
                  return {
                    name: site.name,
                    examDate: examDate,
                    lastDateofRegister: site.lastDateofRegister,
                    url: url
                  };
                })
              };
            } else {
              response.message = 'I don\'t have any exam dates available at the moment. Please check back later or ask about a specific competition.';
            }
            
            // Add helpful suggestions
            response.suggestions = [
              'When is the Scratch Olympiad exam?',
              'What is the date for Painting Olympics?',
              'Tell me about upcoming exams'
            ];
          } else {
            // Specific website mentioned, find matching website
            const websites = await Website.find();
            let matchedWebsite = null;
            
            for (const info of websiteInfo) {
              if (!info) continue;
              matchedWebsite = websites.find(site => 
                (site.domain && site.domain.toLowerCase().includes(info.toLowerCase())) || 
                (site.name && site.name.toLowerCase().includes(info.toLowerCase()))
              );
              if (matchedWebsite) break;
            }
            
            // Get location-specific exam date
            let examDate = null;
            if (matchedWebsite) {
              if (userLocation === 'india' && matchedWebsite.india && matchedWebsite.india.examDate) {
                examDate = matchedWebsite.india.examDate;
              } else if (userLocation === 'international' && matchedWebsite.international && matchedWebsite.international.examDate) {
                examDate = matchedWebsite.international.examDate;
              } else if (matchedWebsite.examDate) { // Fallback to general examDate if location-specific not found
                examDate = matchedWebsite.examDate;
              }
            }

            if (matchedWebsite && examDate) {
              // Create a detailed response with exam date information
              let examDateMessage = `The exam date for **${matchedWebsite.name}** is **${examDate}**.\n\n`;
              
              // Add registration deadline if available
              if (matchedWebsite.lastDateofRegister) {
                examDateMessage += `**Last Date for Registration**: ${matchedWebsite.lastDateofRegister}\n\n`;
              }
              
              // Add website link if available
              let websiteLink = null;
              if (userLocation === 'india' && matchedWebsite.india && matchedWebsite.india.link) {
                websiteLink = matchedWebsite.india.link;
              } else if (userLocation === 'international' && matchedWebsite.international && matchedWebsite.international.link) {
                websiteLink = matchedWebsite.international.link;
              } else if (matchedWebsite.link) { // Fallback to general link if location-specific not found
                websiteLink = matchedWebsite.link;
              }
              
              if (websiteLink) {
                examDateMessage += `You can visit their [official website](${websiteLink}) for more details.\n`;
              }
              
              // Add eligibility information if available
              if (matchedWebsite.eligibility) {
                examDateMessage += `\n**Eligibility**: ${matchedWebsite.eligibility}\n`;
              }
              
              // Add category information if available
              if (matchedWebsite.category && Object.keys(matchedWebsite.category).length > 0) {
                examDateMessage += `\n**Categories**:\n`;
                Object.entries(matchedWebsite.category).forEach(([category, description]) => {
                  examDateMessage += `- ${category}: ${description}\n`;
                });
              }
              
              // Add contact information if available
              if (matchedWebsite.contact) {
                examDateMessage += `\n**Contact Information**:\n`;
                if (matchedWebsite.contact.email) {
                  examDateMessage += `- Email: ${matchedWebsite.contact.email}\n`;
                }
                if (userLocation === 'india' && matchedWebsite.contact.phone) {
                  examDateMessage += `- Phone: ${matchedWebsite.contact.phone}\n`;
                } else if (matchedWebsite.contact.internationalPhone) {
                  examDateMessage += `- Phone: ${matchedWebsite.contact.internationalPhone}\n`;
                }
              }
              
              response.message = examDateMessage;
              
              // Add structured data for the frontend
              response.data = {
                type: 'exam_date',
                website: matchedWebsite.name,
                date: examDate,
                lastDateofRegister: matchedWebsite.lastDateofRegister,
                link: websiteLink,
                eligibility: matchedWebsite.eligibility,
                categories: matchedWebsite.category,
                contact: matchedWebsite.contact
              };
              
              // Add helpful suggestions
              response.suggestions = [
                `How do I register for ${matchedWebsite.name}?`,
                `What is the fee for ${matchedWebsite.name}?`,
                `Tell me more about ${matchedWebsite.name}`
              ];
            } else {
              // No exam date found or no matching website found
              if (matchedWebsite) {
                response.message = `I don't have the exam date information for ${matchedWebsite.name}. `;
                
                // Add website link if available to check for updates
                let websiteLink = null;
                if (userLocation === 'india' && matchedWebsite.india && matchedWebsite.india.link) {
                  websiteLink = matchedWebsite.india.link;
                } else if (userLocation === 'international' && matchedWebsite.international && matchedWebsite.international.link) {
                  websiteLink = matchedWebsite.international.link;
                } else if (matchedWebsite.link) { // Fallback to general link if location-specific not found
                  websiteLink = matchedWebsite.link;
                }
                
                if (websiteLink) {
                  response.message += `Please check their [official website](${websiteLink}) for the most up-to-date information.`;
                }
                
                // Add contact information if available
                if (matchedWebsite.contact && matchedWebsite.contact.email) {
                  response.message += `\n\nYou can also contact them at ${matchedWebsite.contact.email} for more information.`;
                }
              } else {
                // Try to use QA model for exam date if direct match fails
                try {
                  const competitionNameForQA = websiteInfo.join(' ');
                  const qaResult = await hf.questionAnswering({
                    model: QA_MODEL,
                    inputs: {
                      question: `When is the exam date for ${competitionNameForQA}?`,
                      context: `I have information about various competitions and their exam dates.`
                    }
                  });
                  
                  if (qaResult && qaResult.score > 0.7) {
                    response.message = `I found some information about the exam date for ${competitionNameForQA}: ${qaResult.answer}.`;
                  } else {
                    response.message = `I couldn't find exam date information for "${websiteInfo.join(' ')}". Please check the competition name.`;
                    
                    // Suggest available websites with exam dates
                    const availableWebsites = websites
                      .filter(w => w.examDate || (w.india && w.india.examDate) || (w.international && w.international.examDate))
                      .slice(0, 3)
                      .map(w => w.name);
                      
                    if (availableWebsites.length > 0) {
                      response.message += '\n\nHere are some competitions with upcoming exams:';
                      response.suggestions = availableWebsites.map(name => `When is the ${name} exam?`);
                    }
                  }
                } catch (qaError) {
                  console.error('Hugging Face QA error:', qaError);
                  response.message = `I couldn't find exam date information for "${websiteInfo.join(' ')}". Please check the competition name.`;
                  
                  // Suggest available websites with exam dates
                  const availableWebsites = websites
                    .filter(w => w.examDate || (w.india && w.india.examDate) || (w.international && w.international.examDate))
                    .slice(0, 3)
                    .map(w => w.name);
                    
                  if (availableWebsites.length > 0) {
                    response.message += '\n\nHere are some competitions with upcoming exams:';
                    response.suggestions = availableWebsites.map(name => `When is the ${name} exam?`);
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('Exam date handling error:', error);
          response.message = 'I\'m having trouble finding exam date information. Please try again.';
        }
        break
        
      case 'payment':
        if (websiteInfo.length === 0) {
          // No specific website mentioned, provide a helpful response with options
          const websites = await Website.find();
          const availableWebsites = websites
            .filter(w => w.paymentLink || (w.india && w.india.paymentLink) || (w.international && w.international.paymentLink))
            .slice(0, 5);
            
          response.message = 'Which competition do you want to pay for? Here are some options:';
          
          // Add website options to the response data
          response.data = {
            type: 'payment_options',
            websites: availableWebsites.map(site => ({
              name: site.name,
              fee: userLocation === 'india' ? 
                (site.india && site.india.fee ? `₹${site.india.fee}` : 'Contact for details') : 
                (site.international && site.international.fee ? `$${site.international.fee}` : 'Contact for details')
            }))
          };
          
          // Add suggestions based on available websites
          if (availableWebsites.length > 0) {
            response.suggestions = availableWebsites.map(site => `How do I pay for ${site.name}?`);
          } else {
            response.suggestions = [
              'Payment for Scratch Olympiad',
              'How to register for Painting Olympics'
            ];
          }
        } else {
          const websites = await Website.find();
          let matchedWebsite = null;
          
          // Find matching website
          for (const info of websiteInfo) {
            if (!info) continue;
            matchedWebsite = websites.find(site => 
              (site.domain && site.domain.toLowerCase().includes(info.toLowerCase())) || 
              (site.name && site.name.toLowerCase().includes(info.toLowerCase())) ||
              (site.international && site.international.link && site.international.link.toLowerCase().includes(info.toLowerCase())) ||
              (site.india && site.india.link && site.india.link.toLowerCase().includes(info.toLowerCase()))
            );
            if (matchedWebsite) break;
          }
          
          // Get location-specific payment information
          if (matchedWebsite) {
            let paymentLink = null;
            let registrationLink = null;
            let fee = null;
            let currencySymbol = userLocation === 'india' ? '₹' : '$';
            
            // Get location-specific links and fee
            if (userLocation === 'india' && matchedWebsite.india) {
              paymentLink = matchedWebsite.india.paymentLink;
              registrationLink = matchedWebsite.india.registrationLink;
              fee = matchedWebsite.india.fee;
            } else if (userLocation === 'international' && matchedWebsite.international) {
              paymentLink = matchedWebsite.international.paymentLink;
              registrationLink = matchedWebsite.international.registrationLink;
              fee = matchedWebsite.international.fee;
            }
            
            // Fallback to general links if location-specific not found
            if (!paymentLink) paymentLink = matchedWebsite.paymentLink;
            if (!registrationLink) registrationLink = matchedWebsite.registrationLink;
            if (!fee) fee = matchedWebsite.fee;

            if (paymentLink) {
              // Create a detailed response with payment information
              let feeInfo = fee ? `The registration fee is ${currencySymbol}${fee}.` : '';
              let lastDateInfo = matchedWebsite.lastDateofRegister ? 
                `The last date for registration is ${matchedWebsite.lastDateofRegister}.` : '';
              
              response.message = `You can make payments for ${matchedWebsite.name} here: ${paymentLink}\n\n${feeInfo} ${lastDateInfo}`;
              
              // Add payment data to the response
              response.data = {
                type: 'payment_link',
                link: paymentLink,
                registrationLink: registrationLink,
                website: matchedWebsite.name,
                fee: fee ? `${currencySymbol}${fee}` : null,
                lastDate: matchedWebsite.lastDateofRegister
              };
              
              // Add helpful suggestions
              response.suggestions = [
                `When is the ${matchedWebsite.name} exam?`,
                'Generate my certificate',
                'Show me all websites'
              ];
            } else {
              // No payment link found, try to use QA model
              try {
                const competitionNameForQA = matchedWebsite.name;
                const qaResult = await hf.questionAnswering({
                  model: QA_MODEL,
                  inputs: {
                    question: `Where can I find payment information for ${competitionNameForQA}?`,
                    context: `I have information about various competitions and their payment links.`
                  }
                });
                
                if (qaResult && qaResult.score > 0.7) {
                  response.message = `I found some information about payments for ${competitionNameForQA}: ${qaResult.answer}.`;
                } else {
                  response.message = `I couldn't find specific payment information for ${matchedWebsite.name}. Please visit their official website or contact them directly for payment details.`;
                  
                  // Add contact information if available
                  if (matchedWebsite.contact) {
                    let contactInfo = '';
                    if (matchedWebsite.contact.email) {
                      contactInfo += `\nEmail: ${matchedWebsite.contact.email}`;
                    }
                    if (userLocation === 'india' && matchedWebsite.contact.phone) {
                      contactInfo += `\nPhone: ${matchedWebsite.contact.phone}`;
                    } else if (matchedWebsite.contact.internationalPhone) {
                      contactInfo += `\nPhone: ${matchedWebsite.contact.internationalPhone}`;
                    }
                    
                    if (contactInfo) {
                      response.message += `\n\nYou can contact them at:${contactInfo}`;
                    }
                  }
                }
              } catch (qaError) {
                console.error('Hugging Face QA error:', qaError);
                response.message = `I couldn't find specific payment information for ${matchedWebsite.name}. Please visit their official website for payment details.`;
              }
              
              // Add suggestions for other websites with payment information
              const otherWebsites = websites
                .filter(w => w._id.toString() !== matchedWebsite._id.toString() && 
                  (w.paymentLink || (w.india && w.india.paymentLink) || (w.international && w.international.paymentLink)))
                .slice(0, 3)
                .map(w => w.name);
                
              if (otherWebsites.length > 0) {
                response.suggestions = otherWebsites.map(name => `How do I pay for ${name}?`);
              }
            }
          } else {
            // No matching website found
            response.message = `I couldn't find payment information for "${websiteInfo.join(' ')}". Please check the competition name.`;
            
            // Suggest available websites with payment information
            const availableWebsites = websites
              .filter(w => w.paymentLink || (w.india && w.india.paymentLink) || (w.international && w.international.paymentLink))
              .slice(0, 3)
              .map(w => w.name);
              
            if (availableWebsites.length > 0) {
              response.message += '\n\nHere are some competitions I can help with:';
              response.suggestions = availableWebsites.map(name => `How do I pay for ${name}?`);
            }
          }
        }
        break
        
      case 'website_info':
        try {
          if (websiteInfo.length === 0) {
            // No specific website mentioned, provide a list of all available websites
            const websites = await Website.find();
            
            // Create a formatted message with website information
            let websiteListMessage = 'Here are the competition websites I can help you with:\n\n';
            
            // Add website information to the message
            websites.forEach((site, index) => {
              const websiteLink = userLocation === 'india' && site.india && site.india.link ? 
                site.india.link : 
                (site.international && site.international.link ? site.international.link : site.link);
              
              websiteListMessage += `${index + 1}. **${site.name}**\n`;
              if (websiteLink) {
                websiteListMessage += `   Website: ${websiteLink}\n`;
              }
              if (site.examDate) {
                websiteListMessage += `   Exam Date: ${site.examDate}\n`;
              }
              websiteListMessage += '\n';
            });
            
            response.message = websiteListMessage;
            
            // Add structured data for the enhanced UI
            response.data = {
              type: 'website_list',
              message: 'Here are the competition websites I can help you with:',
              websites: websites.map(site => {
                // Create links array for the UI
                const links = [];
                
                if (site.india && site.india.link) {
                  links.push({
                    type: 'website',
                    label: 'India Website',
                    url: site.india.link
                  });
                  
                  if (site.india.registrationLink) {
                    links.push({
                      type: 'registration',
                      label: 'Register (India)',
                      url: site.india.registrationLink
                    });
                  }
                  
                  if (site.india.paymentLink) {
                    links.push({
                      type: 'payment',
                      label: 'Payment (India)',
                      url: site.india.paymentLink
                    });
                  }
                }
                
                if (site.international && site.international.link) {
                  links.push({
                    type: 'website',
                    label: 'International Website',
                    url: site.international.link
                  });
                  
                  if (site.international.registrationLink) {
                    links.push({
                      type: 'registration',
                      label: 'Register (International)',
                      url: site.international.registrationLink
                    });
                  }
                  
                  if (site.international.paymentLink) {
                    links.push({
                      type: 'payment',
                      label: 'Payment (International)',
                      url: site.international.paymentLink
                    });
                  }
                }
                
                // Create categories array
                const categories = [];
                if (site.category) {
                  for (const [key, value] of Object.entries(site.category)) {
                    categories.push(`${key}: ${value}`);
                  }
                }
                
                return {
                  name: site.name,
                  url: userLocation === 'india' && site.india && site.india.link ? 
                    site.india.link : 
                    (site.international && site.international.link ? site.international.link : site.link),
                  examDate: site.examDate,
                  lastDateofRegister: site.lastDateofRegister,
                  description: site.description ? site.description.substring(0, 150) : null,
                  categories: categories,
                  links: links,
                  contact: site.contact ? {
                    email: site.contact.email,
                    phone: userLocation === 'india' ? site.contact.phone : site.contact.internationalPhone,
                    address: site.contact.address
                  } : null
                };
              })
            };
            
            // Add helpful suggestions
            response.suggestions = [
              'What is the website for Scratch Olympiad?',
              'Show me the link for Painting Olympics',
              'Tell me about International Scratch Olympiad'
            ];
          } else {
            // Specific website mentioned, find matching website
            const websites = await Website.find();
            let matchedWebsite = null;
            
            for (const info of websiteInfo) {
              if (!info) continue;
              matchedWebsite = websites.find(site => 
                (site.domain && site.domain.toLowerCase().includes(info.toLowerCase())) || 
                (site.name && site.name.toLowerCase().includes(info.toLowerCase())) ||
                (site.international && site.international.link && site.international.link.toLowerCase().includes(info.toLowerCase())) ||
                (site.india && site.india.link && site.india.link.toLowerCase().includes(info.toLowerCase()))
              );
              if (matchedWebsite) break;
            }
            
            if (matchedWebsite) {
              // Check if we need to ask for website type (India or International)
              if (matchedWebsite.india && matchedWebsite.india.link && 
                  matchedWebsite.international && matchedWebsite.international.link) {
                
                // We need to ask the user which website they want to use
                response.message = `For ${matchedWebsite.name}, we have two websites available:\n\n` +
                                  `1. India Website (.in): ${matchedWebsite.india.link}\n` +
                                  `2. International Website (.com): ${matchedWebsite.international.link}\n\n` +
                                  `Please specify which website you want to use.`;
                
                response.data = {
                  type: 'website_selection',
                  website: matchedWebsite.name,
                  options: [
                    { type: 'india', url: matchedWebsite.india.link },
                    { type: 'international', url: matchedWebsite.international.link }
                  ]
                };
                
                response.suggestions = [
                  `Use India website (.in)`,
                  `Use International website (.com)`
                ];
                
                break;
              }
              
              // Get location-specific website link
              let websiteLink = null;
              if (userLocation === 'india' && matchedWebsite.india && matchedWebsite.india.link) {
                websiteLink = matchedWebsite.india.link;
              } else if (userLocation === 'international' && matchedWebsite.international && matchedWebsite.international.link) {
                websiteLink = matchedWebsite.international.link;
              } else if (matchedWebsite.link) { // Fallback to general link if location-specific not found
                websiteLink = matchedWebsite.link;
              }

              if (websiteLink) {
                // Create a detailed response with website information
                let websiteInfoMessage = `Here's the official website for ${matchedWebsite.name}: ${websiteLink}\n\n`;
                
                // Add description if available
                if (matchedWebsite.description) {
                  websiteInfoMessage += `**About ${matchedWebsite.name}**:\n${matchedWebsite.description}\n\n`;
                }
                
                // Add exam date if available
                if (matchedWebsite.examDate) {
                  websiteInfoMessage += `**Exam Date**: ${matchedWebsite.examDate}\n`;
                }
                
                // Add registration deadline if available
                if (matchedWebsite.lastDateofRegister) {
                  websiteInfoMessage += `**Last Date for Registration**: ${matchedWebsite.lastDateofRegister}\n`;
                }
                
                // Add category information if available
                if (matchedWebsite.category && Object.keys(matchedWebsite.category).length > 0) {
                  websiteInfoMessage += `\n**Categories**:\n`;
                  Object.entries(matchedWebsite.category).forEach(([category, description]) => {
                    websiteInfoMessage += `- ${category}: ${description}\n`;
                  });
                }
                
                // Add contact information if available
                if (matchedWebsite.contact) {
                  websiteInfoMessage += `\n**Contact Information**:\n`;
                  if (matchedWebsite.contact.email) {
                    websiteInfoMessage += `- Email: ${matchedWebsite.contact.email}\n`;
                  }
                  if (userLocation === 'india' && matchedWebsite.contact.phone) {
                    websiteInfoMessage += `- Phone: ${matchedWebsite.contact.phone}\n`;
                  } else if (matchedWebsite.contact.internationalPhone) {
                    websiteInfoMessage += `- Phone: ${matchedWebsite.contact.internationalPhone}\n`;
                  }
                  if (matchedWebsite.contact.address) {
                    websiteInfoMessage += `- Address: ${matchedWebsite.contact.address}\n`;
                  }
                }
                
                response.message = websiteInfoMessage;
                
                // Add structured data for the frontend
                // Create categories array for the UI
                const categories = [];
                if (matchedWebsite.category) {
                  for (const [key, value] of Object.entries(matchedWebsite.category)) {
                    categories.push(`${key}: ${value}`);
                  }
                }
                
                // Create links array for the UI
                const links = [];
                
                if (matchedWebsite.india && matchedWebsite.india.registrationLink) {
                  links.push({
                    type: 'registration',
                    label: 'Register (India)',
                    url: matchedWebsite.india.registrationLink
                  });
                }
                
                if (matchedWebsite.international && matchedWebsite.international.registrationLink) {
                  links.push({
                    type: 'registration',
                    label: 'Register (International)',
                    url: matchedWebsite.international.registrationLink
                  });
                }
                
                if (matchedWebsite.india && matchedWebsite.india.paymentLink) {
                  links.push({
                    type: 'payment',
                    label: 'Payment (India)',
                    url: matchedWebsite.india.paymentLink
                  });
                }
                
                if (matchedWebsite.international && matchedWebsite.international.paymentLink) {
                  links.push({
                    type: 'payment',
                    label: 'Payment (International)',
                    url: matchedWebsite.international.paymentLink
                  });
                }
                
                if (matchedWebsite.india && matchedWebsite.india.resultLink) {
                  links.push({
                    type: 'result',
                    label: 'Results (India)',
                    url: matchedWebsite.india.resultLink
                  });
                }
                
                if (matchedWebsite.international && matchedWebsite.international.resultLink) {
                  links.push({
                    type: 'result',
                    label: 'Results (International)',
                    url: matchedWebsite.international.resultLink
                  });
                }
                
                response.data = {
                  type: 'website_info',
                  name: matchedWebsite.name,
                  link: websiteLink,
                  examDate: matchedWebsite.examDate,
                  lastDateofRegister: matchedWebsite.lastDateofRegister,
                  description: matchedWebsite.description,
                  categories: categories,
                  links: links,
                  contact: matchedWebsite.contact ? {
                    email: matchedWebsite.contact.email,
                    phone: userLocation === 'india' ? matchedWebsite.contact.phone : matchedWebsite.contact.internationalPhone,
                    address: matchedWebsite.contact.address
                  } : null
                };
                
                // Add helpful suggestions
                response.suggestions = [
                  `When is the ${matchedWebsite.name} exam?`,
                  `How do I pay for ${matchedWebsite.name}?`,
                  `Generate certificate for ${matchedWebsite.name}`
                ];
              } else {
                // No website link found, try to use QA model
                try {
                  const competitionNameForQA = matchedWebsite.name;
                  const qaResult = await hf.questionAnswering({
                    model: QA_MODEL,
                    inputs: {
                      question: `What is the website for ${competitionNameForQA}?`,
                      context: `I have information about various competitions and their websites.`
                    }
                  });
                  
                  if (qaResult && qaResult.score > 0.7) {
                    response.message = `I found some information about the website for ${competitionNameForQA}: ${qaResult.answer}.`;
                  } else {
                    response.message = `I couldn't find the website link for ${matchedWebsite.name}. `;
                    
                    // Add description if available
                    if (matchedWebsite.description) {
                      response.message += `\n\n**About ${matchedWebsite.name}**:\n${matchedWebsite.description}`;
                    }
                  }
                } catch (qaError) {
                  console.error('Hugging Face QA error:', qaError);
                  response.message = `I couldn't find the website link for ${matchedWebsite.name}. Please check back later.`;
                }
              }
            } else {
              // No matching website found
              response.message = `I couldn't find information about "${websiteInfo.join(' ')}". Please check the competition name.`;
              
              // Suggest available websites
              const availableWebsites = websites.slice(0, 3).map(w => w.name);
              if (availableWebsites.length > 0) {
                response.message += '\n\nHere are some competitions I can help with:';
                response.suggestions = availableWebsites.map(name => `Tell me about ${name}`);
              }
            }
          }
        } catch (error) {
          console.error('Website info handling error:', error);
          response.message = 'I\'m having trouble finding website information. Please try again.';
        }
        break
        
      case 'greeting':
          try {
            const chatHistory = await Chat.find({ sessionId }).sort({ timestamp: 1 });
            const pastUserInputs = chatHistory.map(chat => chat.message);
            const generatedResponse = await hf.textGeneration({
              model: CONVERSATIONAL_MODEL,
              inputs: message,
              parameters: {
                max_new_tokens: 250,
                temperature: 0.7,
                top_p: 0.95,
                do_sample: true
              }
            });
            response.message = generatedResponse.generated_text;
          } catch (hfError) {
            console.error('Hugging Face conversational model error:', hfError);
            response.message = 'Hello! How can I help you today?';
          }
          response.suggestions = [
            'What is the exam date for International Scratch Olympiad?',
            'Where can I find the payment link for International Painting Olympics?',
            'How can I get a certificate?'
          ];
          break
        
      case 'general':
        try {
          // Get all websites for providing helpful information
          const websites = await Website.find();
          
          // Create a context with website information
          let websiteContext = "I can help with information about these competitions: ";
          websiteContext += websites.map(site => site.name).join(", ");
          
          // Try to use the conversational model for a more natural response
          try {
            const chatHistory = await Chat.find({ sessionId }).sort({ timestamp: 1 });
            const pastUserInputs = chatHistory.map(chat => chat.message);
            const generatedResponse = await hf.textGeneration({
              model: CONVERSATIONAL_MODEL,
              inputs: message,
              parameters: {
                max_new_tokens: 250,
                temperature: 0.7,
                top_p: 0.95,
                do_sample: true
              }
            });
            
            if (generatedResponse && generatedResponse.generated_text) {
              response.message = generatedResponse.generated_text;
            } else {
              // Fallback to a helpful general response
              response.message = `I'm here to help with information about various competitions and olympiads. I can assist you with:\n\n• Certificate generation\n• Exam dates\n• Payment/registration links\n• Website information\n\nWhat would you like to know about?`;
            }
          } catch (convError) {
            console.error('Conversational model error:', convError);
            // Fallback to a helpful general response
            response.message = `I'm here to help with information about various competitions and olympiads. I can assist you with:\n\n• Certificate generation\n• Exam dates\n• Payment/registration links\n• Website information\n\nWhat would you like to know about?`;
          }
          
          // Add helpful suggestions based on available websites
          const randomWebsites = websites.sort(() => 0.5 - Math.random()).slice(0, 2);
          response.suggestions = [
            `When is the ${randomWebsites[0]?.name || 'Scratch Olympiad'} exam?`,
            `How do I pay for ${randomWebsites[1]?.name || 'Painting Olympics'}?`,
            'Generate my certificate',
            'Show me all websites'
          ];
        } catch (error) {
          console.error('General intent handling error:', error);
          response.message = `I'm here to help with information about various competitions and olympiads. I can assist you with:\n\n• Certificate generation\n• Exam dates\n• Payment/registration links\n• Website information\n\nWhat would you like to know about?`;
          response.suggestions = [
            'Generate my certificate',
            'Check exam dates',
            'Payment information',
            'Website information'
          ];
        }
        break;
        
      default:
        response.message = `I'm not sure how to help with that specific request. I can assist you with:\n• Certificate generation\n• Exam dates\n• Payment/registration links\n• Website information\n\nCould you please rephrase your question or choose from the suggestions below?`
        response.suggestions = [
          'Generate my certificate',
          'Check exam dates',
          'Payment information',
          'Website information'
        ]
        break
    }
    
    // Save chat message
    if (sessionId) {
      await Chat.addMessage(sessionId, {
        text: message,
        sender: 'user'
      })
      
      await Chat.addMessage(sessionId, {
        text: response.message,
        sender: 'bot',
        data: response.data
      })
    }
    
    res.json(response)
    
  } catch (error) {
    console.error('Chat error:', error)
    
    // Handle specific error types
    if (error.name === 'TypeError' && error.message.includes('undefined')) {
      res.status(400).json({
        message: 'I had trouble understanding your request. Could you please rephrase it?',
        suggestions: [
          'Generate my certificate',
          'Check exam dates',
          'Show payment information'
        ]
      })
      return
    }
    
    if (error.name === 'MongoError' || error.name === 'MongooseError') {
      res.status(503).json({
        message: 'The service is temporarily unavailable. Please try again in a few moments.'
      })
      return
    }
    
    // Default error response
    res.status(500).json({
      message: 'I encountered an unexpected error. Please try your request again.',
      suggestions: [
        'Try rephrasing your question',
        'Check if you included all necessary information'
      ],
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// Get chat history
router.get('/history/:sessionId', optionalAuth, async (req, res) => {
  try {
    const { sessionId } = req.params
    
    const chat = await Chat.findOne({ sessionId })
    
    if (!chat) {
      return res.json({ messages: [] })
    }
    
    res.json({
      messages: chat.messages,
      summary: chat.generateSummary()
    })
    
  } catch (error) {
    console.error('Get chat history error:', error)
    res.status(500).json({
      message: 'Failed to retrieve chat history'
    })
  }
})

// Get chat statistics
router.get('/stats', optionalAuth, async (req, res) => {
  try {
    const stats = await Chat.getStats()
    res.json(stats)
    
  } catch (error) {
    console.error('Get chat stats error:', error)
    res.status(500).json({
      message: 'Failed to retrieve chat statistics'
    })
  }
})

module.exports = router