import React from 'react';
import { format } from 'date-fns';
import { Download, ExternalLink } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { FeedbackButton } from './FeedbackButton';

export const ChatMessage = ({ message, onSuggestionClick, onFeedback, messageIndex }) => {
  const isBot = message.sender === 'bot';

  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-4`}>
      <div className={`max-w-[75%] ${isBot ? 'order-1' : 'order-2'}`}>
        {/* Message Bubble */}
        <div
          className={`rounded-lg px-4 py-2 ${isBot
            ? 'bg-gray-100 text-gray-800'
            : 'bg-blue-600 text-white'
            }`}
        >
          {isBot ? (
            <div className="text-sm">
              <MarkdownRenderer content={message.text} />
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
          )}
        </div>

        {/* Data section (certificates, links, etc.) */}
        {message.data && (
          <div className="mt-2 space-y-2">
            {/* Certificate */}
            {message.data.type === 'certificate' && message.data.download_url && (
              <a
                href={message.data.download_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                Download Certificate
              </a>
            )}

            {/* Event Link */}
            {message.data.website_url && (
              <a
                href={message.data.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm ml-2"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Visit Website
              </a>
            )}

            {/* Registration Info */}
            {message.data.type === 'registration_info' && (
              <div className="bg-white border border-gray-200 rounded-lg p-3 text-sm">
                <p className="font-semibold text-gray-900">{message.data.event?.title}</p>
                <p className="text-gray-600 mt-1">Fee: {message.data.event?.fee}</p>
                {message.data.event?.deadline && (
                  <p className="text-gray-600 text-xs mt-1">
                    Deadline: {format(new Date(message.data.event.deadline), 'PP')}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Suggestions */}
        {message.suggestions && message.suggestions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => onSuggestionClick(suggestion)}
                className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-colors text-xs"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {/* Feedback for bot messages */}
        {isBot && onFeedback && (
          <FeedbackButton
            messageIndex={messageIndex}
            onFeedback={onFeedback}
            initialRating={message.feedback?.rating}
          />
        )}

        {/* Timestamp */}
        <p className={`text-xs mt-1 ${isBot ? 'text-gray-500' : 'text-gray-600 text-right'}`}>
          {format(new Date(message.timestamp), 'p')}
        </p>
      </div>
    </div>
  );
};
