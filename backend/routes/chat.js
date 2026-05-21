import express from 'express';
import { chatWithBot } from '../services/chatbotService.js';

const router = express.Router();

// POST /api/chat - Public endpoint for the chatbot
router.post('/', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    const reply = await chatWithBot(message);
    
    res.json({ reply });
  } catch (error) {
    console.error('❌ Chat route error:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

export default router;
