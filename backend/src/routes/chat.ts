import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { ClaudeService } from '../services/claude';
import { pool } from '../db/init';

export const chatRouter = express.Router();
const claudeService = new ClaudeService();

// Send message and get AI response
chatRouter.post('/message', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { message, conversationId } = req.body;
    const userId = req.userId!;

    // Get conversation history
    let conversation;
    if (conversationId) {
      const result = await pool.query(
        'SELECT * FROM conversations WHERE id = $1 AND user_id = $2',
        [conversationId, userId]
      );
      conversation = result.rows[0];
    }

    const messages = conversation?.messages || [];

    // Add user message
    messages.push({
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    });

    // Get AI response
    const aiResponse = await claudeService.processWorkflowRequest(messages, userId);

    // Add AI response
    messages.push({
      role: 'assistant',
      content: aiResponse.message,
      workflow: aiResponse.workflow,
      timestamp: new Date().toISOString()
    });

    // Save or update conversation
    let savedConversation;
    if (conversation) {
      const result = await pool.query(
        'UPDATE conversations SET messages = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [JSON.stringify(messages), conversationId]
      );
      savedConversation = result.rows[0];
    } else {
      const result = await pool.query(
        'INSERT INTO conversations (user_id, messages) VALUES ($1, $2) RETURNING *',
        [userId, JSON.stringify(messages)]
      );
      savedConversation = result.rows[0];
    }

    res.json({
      conversationId: savedConversation.id,
      message: aiResponse.message,
      workflow: aiResponse.workflow,
      needsMoreInfo: aiResponse.needsMoreInfo
    });
  } catch (error) {
    next(error);
  }
});

// Get conversation history
chatRouter.get('/conversations/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const result = await pool.query(
      'SELECT * FROM conversations WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// List all conversations
chatRouter.get('/conversations', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;

    const result = await pool.query(
      'SELECT id, workflow_id, created_at, updated_at FROM conversations WHERE user_id = $1 ORDER BY updated_at DESC',
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});
