import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Trash2, Minimize2, Bot } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import ChatMessage from './ChatMessage';
import ChatTypingIndicator from './ChatTypingIndicator';
import { QUICK_REPLIES } from '../data/knowledgeBase';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const { messages, isLoading, sendUserMessage, clearChat } = useChat();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || isLoading) return;
    setInputValue('');
    setShowQuickReplies(false);
    await sendUserMessage(text);
  };

  const handleQuickReply = async (reply) => {
    setShowQuickReplies(false);
    await sendUserMessage(reply);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    clearChat();
    setShowQuickReplies(true);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <div className="fixed bottom-6 right-6 z-[9999]">
        <AnimatePresence mode="wait">
          {!isOpen && (
            <motion.button
              key="open-btn"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsOpen(true)}
              className="relative w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 shadow-2xl shadow-blue-900/60 flex items-center justify-center cursor-pointer border border-blue-500/30"
              aria-label="Open CGS AI Chat"
            >
              {/* Pulse ring */}
              <span className="absolute inset-0 rounded-full bg-blue-500/30 animate-ping" />
              <MessageCircle className="w-7 h-7 text-white relative z-10" />
              {/* Badge */}
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[9px] font-bold shadow-lg">
                AI
              </span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Chat Window */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              key="chat-window"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-[380px] h-[600px] flex flex-col rounded-3xl overflow-hidden
                shadow-2xl shadow-black/60
                bg-gradient-to-b from-[#0d1117] to-[#0a0f1a]
                border border-white/10"
              style={{ transformOrigin: 'bottom right' }}
            >
              {/* Header */}
              <div className="relative px-5 py-4 bg-gradient-to-r from-blue-900/80 to-indigo-900/80 border-b border-white/10 backdrop-blur-md flex-shrink-0">
                {/* Background glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10" />
                <div className="relative flex items-center gap-3">
                  {/* Bot Icon */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/40 flex-shrink-0">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-sm truncate">CarrezzaBot</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-emerald-400 text-[11px] font-medium">Online • CGS AI Assistant</span>
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleClear}
                      className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                      title="Clear chat"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                      title="Minimize"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {messages.map((msg) => (
                  <ChatMessage key={msg.id} message={msg} />
                ))}
                {isLoading && <ChatTypingIndicator />}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Replies */}
              <AnimatePresence>
                {showQuickReplies && messages.length <= 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="px-4 pb-2 flex flex-wrap gap-2"
                  >
                    {QUICK_REPLIES.map((reply) => (
                      <button
                        key={reply}
                        onClick={() => handleQuickReply(reply)}
                        className="text-[11px] px-3 py-1.5 rounded-full border border-blue-500/40 text-blue-300 hover:bg-blue-600/20 hover:border-blue-400/60 transition-all whitespace-nowrap"
                      >
                        {reply}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input Area */}
              <div className="px-4 py-3 border-t border-white/10 bg-white/3 flex-shrink-0">
                <div className="flex items-end gap-2 bg-white/5 rounded-2xl border border-white/10 px-4 py-2.5 focus-within:border-blue-500/50 focus-within:bg-white/8 transition-all">
                  <textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask me anything about CGS..."
                    rows={1}
                    className="flex-1 bg-transparent text-white text-sm placeholder-gray-500 outline-none resize-none leading-relaxed max-h-28 overflow-y-auto"
                    style={{ scrollbarWidth: 'none' }}
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isLoading}
                    className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all
                      ${inputValue.trim() && !isLoading
                        ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-500/30 hover:scale-105'
                        : 'bg-white/10 text-gray-500 cursor-not-allowed'
                      }`}
                    aria-label="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[10px] text-gray-600 text-center mt-2">
                  Powered by Google Gemini • Carrezza Global Solutions
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
