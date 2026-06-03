import React from 'react';
import ReactMarkdown from 'react-markdown';

function formatTime(date) {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user';
  const isError = message.role === 'error';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end mb-4`}>
      {/* Avatar */}
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 text-white text-xs font-bold">
          C
        </div>
      )}

      {/* Bubble */}
      <div className={`max-w-[80%] group`}>
        <div
          className={`
            relative px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-lg
            ${isUser
              ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-br-sm'
              : isError
              ? 'bg-red-900/40 border border-red-500/30 text-red-300 rounded-bl-sm'
              : 'bg-white/5 border border-white/10 text-gray-100 backdrop-blur-sm rounded-bl-sm'
            }
          `}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none
              prose-p:my-1 prose-ul:my-1 prose-li:my-0.5
              prose-strong:text-blue-300 prose-headings:text-blue-200
              prose-a:text-blue-400 prose-code:text-blue-300">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>
        <p className={`text-[10px] text-gray-500 mt-1 ${isUser ? 'text-right pr-1' : 'text-left pl-1'}`}>
          {formatTime(message.timestamp)}
        </p>
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white text-xs font-bold shadow">
          Y
        </div>
      )}
    </div>
  );
}
