import express from 'express';
import { pool } from '../db/init';
import { WorkflowExecutor } from '../services/executor';

export const webhookRouter = express.Router();

// Receive webhook and trigger workflow
webhookRouter.post('/:webhookId', async (req, res, next) => {
  try {
    const { webhookId } = req.params;
    const webhookData = req.body;

    // Find workflow with this webhook trigger
    const result = await pool.query(
      `SELECT * FROM workflows 
       WHERE status = 'active' 
       AND workflow_json->>'trigger'->>'type' = 'webhook'
       AND workflow_json->>'trigger'->>'webhookId' = $1`,
      [webhookId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Webhook not found or workflow not active' });
    }

    const workflow = result.rows[0];
    
    // Execute workflow asynchronously
    const executor = new WorkflowExecutor();
    executor.execute(workflow.workflow_json, workflow.user_id, webhookData)
      .catch(error => console.error('Webhook execution error:', error));

    // Respond immediately to webhook sender
    res.json({ message: 'Webhook received, workflow triggered' });
  } catch (error) {
    next(error);
  }
});

// Get webhook URL for workflow
webhookRouter.get('/url/:workflowId', async (req, res, next) => {
  try {
    const { workflowId } = req.params;

    const result = await pool.query(
      'SELECT workflow_json FROM workflows WHERE id = $1',
      [workflowId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    const workflow = result.rows[0].workflow_json;
    
    if (workflow.trigger?.type === 'webhook') {
      const webhookUrl = `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/webhooks/${workflow.trigger.webhookId}`;
      res.json({ webhookUrl });
    } else {
      res.status(400).json({ error: 'Workflow does not have webhook trigger' });
    }
  } catch (error) {
    next(error);
  }
});
