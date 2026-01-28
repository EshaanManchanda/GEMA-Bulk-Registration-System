const { HfInference } = require('@huggingface/inference');

const HF_ACCESS_TOKEN = process.env.HF_TOKEN;
const HF_TIMEOUT_MS = 10000;
const hf = new HfInference(HF_ACCESS_TOKEN);

// Model IDs from env with fallbacks
const INTENT_CLASSIFICATION_MODEL = process.env.INTENT_CLASSIFICATION_MODEL || 'Falconsai/intent_classification';
const QA_MODEL = process.env.QA_MODEL || 'deepset/roberta-base-squad2';
const CONVERSATIONAL_MODEL = process.env.CONVERSATIONAL_MODEL || 'microsoft/DialoGPT-medium';

/**
 * Detect user intent from message
 * Intents: greeting, certificate, event_info, payment, registration, general
 */
const detectIntent = async (message) => {
  let intent = 'general';

  try {
    const lowerMessage = message.toLowerCase();

    // Rule-based detection first (faster)
    if (lowerMessage.includes('certificate') || lowerMessage.includes('cert') ||
      lowerMessage.includes('download') || lowerMessage.includes('generate')) {
      intent = 'certificate';
    }
    else if (lowerMessage.includes('exam date') ||
      (lowerMessage.includes('exam') && lowerMessage.includes('date')) ||
      (lowerMessage.includes('exam') && lowerMessage.includes('when')) ||
      lowerMessage.includes('when is the exam') ||
      lowerMessage.includes('test date') ||
      lowerMessage.includes('schedule') && lowerMessage.includes('exam') ||
      lowerMessage.includes('check exam dates')) {
      intent = 'exam_date';
    }
    else if (lowerMessage.includes('payment') || lowerMessage.includes('pay') ||
      lowerMessage.includes('register') || lowerMessage.includes('registration') ||
      lowerMessage.includes('fee') || lowerMessage.includes('cost') ||
      lowerMessage.includes('discount') || lowerMessage.includes('bulk')) {
      intent = 'payment';
    }
    else if (lowerMessage.includes('event') || lowerMessage.includes('competition') ||
      lowerMessage.includes('link') || lowerMessage.includes('url') ||
      lowerMessage.includes('info about') ||
      lowerMessage.includes('tell me about') ||
      lowerMessage.includes('show me') ||
      lowerMessage.includes('upcoming')) {
      intent = 'event_info';
    }
    else if (lowerMessage.includes('hello') || lowerMessage.includes('hi') ||
      lowerMessage.includes('hey') || lowerMessage.includes('help') ||
      lowerMessage.includes('greetings')) {
      intent = 'greeting';
    }

    if (intent !== 'general') {
      console.log(`Rule-based intent: ${intent}`);
      return intent;
    }

    // HuggingFace AI classification
    console.log(`Classifying intent with HF for: "${message.substring(0, 50)}..."`);

    const classificationResult = await Promise.race([
      hf.textClassification({
        model: INTENT_CLASSIFICATION_MODEL,
        inputs: message
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('HF API timeout')), HF_TIMEOUT_MS)
      )
    ]);

    const predictions = Array.isArray(classificationResult) ? classificationResult : [classificationResult];

    if (predictions.length > 0) {
      const topPrediction = predictions.reduce((prev, current) =>
        (prev.score > current.score) ? prev : current);

      console.log(`Top prediction: ${topPrediction.label} (${topPrediction.score})`);

      if (topPrediction.score > 0.7) {
        const label = topPrediction.label.toLowerCase();

        if (label.includes('greeting') || label.includes('hello') || label.includes('hi')) {
          intent = 'greeting';
        } else if (label.includes('certificate') || label.includes('cert') || label.includes('document')) {
          intent = 'certificate';
        } else if (label.includes('exam') || label.includes('date') || label.includes('schedule')) {
          intent = 'exam_date';
        } else if (label.includes('payment') || label.includes('pay') || label.includes('register') || label.includes('fee')) {
          intent = 'payment';
        } else if (label.includes('event') || label.includes('info') || label.includes('competition')) {
          intent = 'event_info';
        }

        console.log(`Mapped to intent: ${intent}`);
      }
    }

  } catch (error) {
    console.error('HuggingFace intent classification error:', error.message);

    // Fallback to basic rule-based
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('certificate')) return 'certificate';
    if (lowerMessage.includes('exam') || lowerMessage.includes('date')) return 'exam_date';
    if (lowerMessage.includes('payment') || lowerMessage.includes('register')) return 'payment';
    if (lowerMessage.includes('event') || lowerMessage.includes('tell me about')) return 'event_info';
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) return 'greeting';
    return 'general';
  }

  console.log(`Final intent: ${intent}`);
  return intent;
};

/**
 * Extract event names/keywords from message - improved version
 */
const extractEventInfo = (message) => {
  if (!message || typeof message !== 'string') return [];

  try {
    // Common words that indicate a general query, not a specific event
    const genericPhrases = [
      'events', 'event', 'all events', 'upcoming events', 'available events',
      'exam dates', 'dates', 'check exam dates', 'show events', 'list events',
      'competitions', 'information', 'details', 'help', 'support',
      'registration', 'help with registration', 'bulk discount options',
      'discount', 'options', 'bulk', 'how'
    ];

    // Remove common phrases to isolate the event name
    let cleanedMessage = message.toLowerCase()
      .replace(/tell me about(?:\s+the)?/gi, '')
      .replace(/register for(?:\s+the)?/gi, '')
      .replace(/how to register for(?:\s+the)?/gi, '')
      .replace(/how to(?:\s+the)?/gi, '')
      .replace(/how do i register for(?:\s+the)?/gi, '')
      .replace(/when is(?:\s+the)?/gi, '')
      .replace(/what is(?:\s+the)?/gi, '')
      .replace(/certificate for(?:\s+the)?/gi, '')
      .replace(/show(?:\s+me)?(?:\s+the)?/gi, '')
      .replace(/upcoming/gi, '')
      .replace(/available/gi, '')
      .replace(/check/gi, '')
      .replace(/list/gi, '')
      .replace(/all/gi, '')
      .replace(/\?/g, '')
      .trim();

    // If the cleaned message is a generic phrase, return empty
    if (genericPhrases.includes(cleanedMessage)) {
      return [];
    }

    // Only return if it looks like an actual event name (more than 5 chars)
    if (cleanedMessage.length > 5 && !genericPhrases.some(phrase => cleanedMessage === phrase)) {
      return [cleanedMessage];
    }

    return [];
  } catch (error) {
    console.error('Error in extractEventInfo:', error);
    return [];
  }
};

/**
 * Extract email from message
 */
const extractEmail = (message) => {
  if (!message || typeof message !== 'string') return null;

  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const matches = message.match(emailPattern);
  return matches ? matches[0] : null;
};

/**
 * Generate conversational response using HF
 */
const generateConversationalResponse = async (message) => {
  try {
    const response = await Promise.race([
      hf.textGeneration({
        model: CONVERSATIONAL_MODEL,
        inputs: message,
        parameters: {
          max_new_tokens: 250,
          temperature: 0.7,
          top_p: 0.95,
          do_sample: true
        }
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('HF API timeout')), HF_TIMEOUT_MS)
      )
    ]);

    return response.generated_text || 'Hello! How can I help you today?';
  } catch (error) {
    console.error('Conversational model error:', error);
    return 'Hello! How can I help you today?';
  }
};

module.exports = {
  detectIntent,
  extractEventInfo,
  extractEmail,
  generateConversationalResponse
};
