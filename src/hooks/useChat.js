import { useState, useCallback, useRef } from 'react';
import { sendMessage } from '../utils/gemini';

const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'model',
  content: `👋 Hello! I'm **CarrezzaBot**, the official AI assistant for **Carrezza Global Solutions (CGS)**!

I can help you with:
- 🏢 Information about our services (IT & BPO)
- 💼 Career & internship opportunities
- 🛠️ Our tech stack & internal tools
- 📞 How to contact us

What would you like to know?`,
  timestamp: new Date(),
};

export function useChat() {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const historyRef = useRef([]);

  const sendUserMessage = useCallback(async (userText) => {
    if (!userText.trim() || isLoading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const responseText = await sendMessage(historyRef.current, userText);

      const botMessage = {
        id: `bot-${Date.now()}`,
        role: 'model',
        content: responseText,
        timestamp: new Date(),
      };

      // Update history for context continuity
      historyRef.current = [
        ...historyRef.current,
        { role: 'user', content: userText },
        { role: 'model', content: responseText },
      ];

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error('Gemini API error:', err);
      const errorMessage = err.message?.includes('VITE_GEMINI_API_KEY')
        ? '⚠️ API key not configured. Please add your VITE_GEMINI_API_KEY to the .env file.'
        : '⚠️ Sorry, I encountered an error. Please try again in a moment.';

      setError(errorMessage);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'error',
          content: errorMessage,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const clearChat = useCallback(() => {
    setMessages([WELCOME_MESSAGE]);
    setError(null);
    historyRef.current = [];
  }, []);

  return { messages, isLoading, error, sendUserMessage, clearChat };
}
