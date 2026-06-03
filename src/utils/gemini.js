import { GoogleGenerativeAI } from '@google/generative-ai';
import { CGS_SYSTEM_PROMPT } from '../data/knowledgeBase';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let genAI = null;
let model = null;

function getModel() {
  if (!API_KEY) {
    throw new Error('VITE_GEMINI_API_KEY is not set in your .env file');
  }
  if (!genAI) {
    genAI = new GoogleGenerativeAI(API_KEY);
  }
  if (!model) {
    model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: CGS_SYSTEM_PROMPT,
    });
  }
  return model;
}

/**
 * Send a message to Gemini and get a response.
 * @param {Array<{role: string, parts: Array<{text: string}>}>} history - Chat history
 * @param {string} userMessage - The latest user message
 * @returns {Promise<string>} - The assistant's response text
 */
export async function sendMessage(history, userMessage) {
  const geminiModel = getModel();

  const chat = geminiModel.startChat({
    history: history.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    })),
  });

  const result = await chat.sendMessage(userMessage);
  const response = await result.response;
  return response.text();
}
