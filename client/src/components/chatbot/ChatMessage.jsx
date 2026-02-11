import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  Download, ExternalLink, Calendar, Clock, CreditCard, Send
} from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { FeedbackButton } from './FeedbackButton';

export const ChatMessage = ({
  message, onSuggestionClick, onFeedback, messageIndex
}) => {
  const isBot = message.sender === 'bot';
  const [emailInput, setEmailInput] = useState('');

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (emailInput.trim()) {
      onSuggestionClick(`My email is ${emailInput.trim()}`);
      setEmailInput('');
    }
  };

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
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.text}
            </p>
          )}
        </div>

        {/* Data section */}
        {message.data && (
          <div className="mt-2 space-y-2">

            {/* Email Request */}
            {message.data.type === 'email_request' && (
              <form
                onSubmit={handleEmailSubmit}
                className="flex gap-2 bg-white border border-gray-200
                  rounded-lg p-3"
              >
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 text-sm border border-gray-300
                    rounded-md px-3 py-1.5
                    focus:outline-none focus:ring-2
                    focus:ring-blue-500"
                  required
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-blue-600 text-white
                    rounded-md hover:bg-blue-700
                    transition-colors text-sm
                    flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send
                </button>
              </form>
            )}

            {/* Certificate Options */}
            {message.data.type === 'certificate_options'
              && message.data.events && (
              <div className="space-y-1.5">
                {message.data.events.map((evt) => (
                  <button
                    key={evt.id}
                    onClick={() => onSuggestionClick(
                      `Certificate for ${evt.title}`
                    )}
                    className="w-full text-left px-3 py-2 bg-white
                      border border-gray-200 rounded-lg
                      hover:bg-blue-50 hover:border-blue-300
                      transition-colors text-sm font-medium
                      text-gray-800"
                  >
                    {evt.title}
                  </button>
                ))}
              </div>
            )}

            {/* Event List */}
            {message.data.type === 'event_list'
              && message.data.events && (
              <div className="space-y-2">
                {message.data.events.map((evt) => (
                  <div
                    key={evt.id}
                    className="bg-white border border-gray-200
                      rounded-lg p-3 text-sm"
                  >
                    <p className="font-semibold text-gray-900">
                      {evt.title}
                    </p>
                    <div className="flex items-center gap-1.5 text-gray-600
                      mt-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        {format(
                          new Date(evt.event_date), 'PP'
                        )}
                      </span>
                    </div>
                    {evt.registration_deadline && (
                      <div className="flex items-center gap-1.5
                        text-orange-600 mt-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-xs">
                          Deadline:{' '}
                          {format(
                            new Date(evt.registration_deadline),
                            'PP'
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Event Date */}
            {message.data.type === 'event_date'
              && message.data.event && (
              <div className="bg-white border border-gray-200
                rounded-lg p-3 text-sm">
                <p className="font-semibold text-gray-900">
                  {message.data.event.title}
                </p>
                <div className="flex items-center gap-1.5
                  text-gray-600 mt-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {format(
                      new Date(message.data.event.start_date),
                      'PP'
                    )}
                    {message.data.event.end_date
                      && new Date(message.data.event.end_date)
                        > new Date(message.data.event.start_date)
                      && (
                        <> — {format(
                          new Date(message.data.event.end_date),
                          'PP'
                        )}</>
                      )}
                  </span>
                </div>
                {message.data.event.registration_deadline && (
                  <div className="flex items-center gap-1.5
                    text-orange-600 mt-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-xs">
                      Deadline:{' '}
                      {format(
                        new Date(
                          message.data.event.registration_deadline
                        ),
                        'PP'
                      )}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Event Info */}
            {message.data.type === 'event_info'
              && message.data.event && (
              <div className="bg-white border border-gray-200
                rounded-lg p-3 text-sm">
                <p className="font-semibold text-gray-900">
                  {message.data.event.title}
                </p>
                {message.data.event.description && (
                  <p className="text-gray-600 mt-1 text-xs
                    line-clamp-3">
                    {message.data.event.description}
                  </p>
                )}
                {message.data.event.grade_levels
                  && message.data.event.grade_levels.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {message.data.event.grade_levels.map((g) => (
                      <span
                        key={g}
                        className="px-2 py-0.5 bg-purple-100
                          text-purple-700 rounded-full text-xs"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Certificate (enhanced) */}
            {message.data.type === 'certificate' && (
              <div className="bg-white border border-gray-200
                rounded-lg p-3">
                {message.data.event_title && (
                  <p className="font-semibold text-gray-900 text-sm
                    mb-2">
                    {message.data.event_title}
                  </p>
                )}
                {message.data.download_url && (
                  <a
                    href={message.data.download_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4
                      py-2 bg-green-600 text-white rounded-lg
                      hover:bg-green-700 transition-colors text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Download Certificate
                  </a>
                )}
              </div>
            )}

            {/* Event Link (standalone website_url) */}
            {message.data.website_url && (
              <a
                href={message.data.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3
                  py-1.5 bg-blue-100 text-blue-700 rounded-md
                  hover:bg-blue-200 transition-colors text-sm ml-2"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Visit Website
              </a>
            )}

            {/* Registration Info (enhanced) */}
            {message.data.type === 'registration_info' && (
              <div className="bg-white border border-gray-200
                rounded-lg p-3 text-sm">
                <p className="font-semibold text-gray-900">
                  {message.data.event?.title}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <CreditCard className="w-3.5 h-3.5
                    text-gray-500" />
                  <span className="px-2 py-0.5 bg-green-100
                    text-green-700 rounded-full text-xs
                    font-medium">
                    {message.data.event?.fee}
                  </span>
                </div>
                {message.data.event?.deadline && (
                  <div className="flex items-center gap-1.5
                    text-gray-600 mt-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-xs">
                      Deadline:{' '}
                      {format(
                        new Date(message.data.event.deadline),
                        'PP'
                      )}
                    </span>
                  </div>
                )}
                {message.data.event?.slug && (
                  <a
                    href={`/events/${message.data.event.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5
                      mt-2 px-3 py-1.5 bg-blue-600 text-white
                      rounded-md hover:bg-blue-700
                      transition-colors text-xs"
                  >
                    <ExternalLink className="w-3 h-3" />
                    View Event
                  </a>
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
                className="px-3 py-1.5 bg-white border
                  border-gray-300 text-gray-700 rounded-full
                  hover:bg-gray-50 transition-colors text-xs"
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
        <p className={`text-xs mt-1 ${
          isBot ? 'text-gray-500' : 'text-gray-600 text-right'
        }`}>
          {format(new Date(message.timestamp), 'p')}
        </p>
      </div>
    </div>
  );
};
