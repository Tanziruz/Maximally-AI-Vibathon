import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { chatRouter } from './routes/chat';
import { workflowRouter } from './routes/workflows';
import { webhookRouter } from './routes/webhooks';
import { authRouter } from './routes/auth';
import { errorHandler } from './middleware/errorHandler';
import { initDatabase } from './db/init';
import { WorkflowScheduler } from './services/scheduler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/chat', chatRouter);
app.use('/api/workflows', workflowRouter);
app.use('/api/webhooks', webhookRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

// Initialize database and start server
async function start() {
  try {
    await initDatabase();
    console.log('✓ Database initialized');

    // Start workflow scheduler
    const scheduler = WorkflowScheduler.getInstance();
    await scheduler.start();
    console.log('✓ Workflow scheduler started');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
