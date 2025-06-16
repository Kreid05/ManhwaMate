require('dotenv').config();

const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // Your API Key from environment variable

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function getChatbotResponse(userMessage) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const response = await model.generateContent(userMessage);

    const botMessage = response.response.text(); // Get response text

    return botMessage;
  } catch (error) {
    console.error('Error with Gemini API:', error);
    return 'Sorry, there was an error communicating with the Gemini API.';
  }
}

module.exports = { getChatbotResponse };
