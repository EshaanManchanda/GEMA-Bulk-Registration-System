import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Markdown renderer component for chat messages
 * Safely renders markdown with support for tables, lists, and code blocks
 */
export const MarkdownRenderer = ({ content }) => {
    return (
        <div className="markdown-content">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    // Customize link rendering for security
                    a: ({ node, ...props }) => (
                        <a
                            {...props}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline"
                        />
                    ),
                    // Code blocks
                    code: ({ node, inline, className, children, ...props }) => {
                        if (inline) {
                            return (
                                <code
                                    className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800"
                                    {...props}
                                >
                                    {children}
                                </code>
                            );
                        }
                        return (
                            <code
                                className="block bg-gray-900 text-gray-100 p-3 rounded-md overflow-x-auto text-sm font-mono my-2"
                                {...props}
                            >
                                {children}
                            </code>
                        );
                    },
                    // Lists
                    ul: ({ node, ...props }) => (
                        <ul className="list-disc list-inside my-2 space-y-1" {...props} />
                    ),
                    ol: ({ node, ...props }) => (
                        <ol className="list-decimal list-inside my-2 space-y-1" {...props} />
                    ),
                    // Tables
                    table: ({ node, ...props }) => (
                        <div className="overflow-x-auto my-2">
                            <table className="min-w-full border-collapse border border-gray-300" {...props} />
                        </div>
                    ),
                    th: ({ node, ...props }) => (
                        <th className="border border-gray-300 px-3 py-2 bg-gray-100 font-semibold text-left" {...props} />
                    ),
                    td: ({ node, ...props }) => (
                        <td className="border border-gray-300 px-3 py-2" {...props} />
                    ),
                    // Headings
                    h1: ({ node, ...props }) => (
                        <h1 className="text-xl font-bold mt-4 mb-2" {...props} />
                    ),
                    h2: ({ node, ...props }) => (
                        <h2 className="text-lg font-bold mt-3 mb-2" {...props} />
                    ),
                    h3: ({ node, ...props }) => (
                        <h3 className="text-base font-bold mt-2 mb-1" {...props} />
                    ),
                    // Paragraphs
                    p: ({ node, ...props }) => (
                        <p className="my-1" {...props} />
                    ),
                    // Blockquotes
                    blockquote: ({ node, ...props }) => (
                        <blockquote className="border-l-4 border-gray-300 pl-4 italic my-2" {...props} />
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};
