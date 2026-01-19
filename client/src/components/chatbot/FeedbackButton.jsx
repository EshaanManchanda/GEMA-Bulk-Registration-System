import React from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

/**
 * Feedback button component for chat messages
 * Allows users to rate bot responses as helpful or not helpful
 */
export const FeedbackButton = ({ messageIndex, onFeedback, initialRating = null }) => {
    const [rating, setRating] = React.useState(initialRating);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const handleFeedback = async (newRating) => {
        if (rating === newRating || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await onFeedback(messageIndex, newRating);
            setRating(newRating);
        } catch (error) {
            console.error('Failed to submit feedback:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-gray-500">Was this helpful?</span>
            <button
                onClick={() => handleFeedback('helpful')}
                disabled={isSubmitting}
                className={`p-1 rounded transition-colors ${rating === 'helpful'
                        ? 'bg-green-100 text-green-600'
                        : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                    } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-label="Mark as helpful"
                title="Helpful"
            >
                <ThumbsUp className="w-4 h-4" />
            </button>
            <button
                onClick={() => handleFeedback('not_helpful')}
                disabled={isSubmitting}
                className={`p-1 rounded transition-colors ${rating === 'not_helpful'
                        ? 'bg-red-100 text-red-600'
                        : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                    } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-label="Mark as not helpful"
                title="Not helpful"
            >
                <ThumbsDown className="w-4 h-4" />
            </button>
        </div>
    );
};
