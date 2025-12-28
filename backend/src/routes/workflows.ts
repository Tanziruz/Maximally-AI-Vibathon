import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, AuthRequest } from '../middleware/auth';
import { pool } from '../db/init';
import { WorkflowExecutor } from '../services/executor';

export const workflowRouter = express.Router();

// Create workflow
workflowRouter.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { name, description, workflowJson } = req.body;
    const userId = req.userId!;
    const workflowId = uuidv4();

    const result = await pool.query(
      `INSERT INTO workflows (id, user_id, name, description, workflow_json, status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [workflowId, userId, name, description, JSON.stringify(workflowJson), 'draft']
    );

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Get all workflows for user
workflowRouter.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;

    const result = await pool.query(
      'SELECT * FROM workflows WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Get single workflow
workflowRouter.get('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const result = await pool.query(
      'SELECT * FROM workflows WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Update workflow
workflowRouter.put('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, workflowJson } = req.body;
    const userId = req.userId!;

    const result = await pool.query(
      `UPDATE workflows 
       SET name = $1, description = $2, workflow_json = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [name, description, JSON.stringify(workflowJson), id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Deploy workflow (activate it)
workflowRouter.post('/:id/deploy', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const result = await pool.query(
      `UPDATE workflows 
       SET status = 'active', deployed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    res.json({ message: 'Workflow deployed successfully', workflow: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Pause workflow
workflowRouter.post('/:id/pause', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const result = await pool.query(
      `UPDATE workflows 
       SET status = 'paused', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    res.json({ message: 'Workflow paused', workflow: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Execute workflow manually
workflowRouter.post('/:id/execute', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { testData } = req.body;
    const userId = req.userId!;

    const result = await pool.query(
      'SELECT * FROM workflows WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    const workflow = result.rows[0];
    const executor = new WorkflowExecutor();
    const execution = await executor.execute(workflow.workflow_json, userId, testData);

    res.json(execution);
  } catch (error) {
    next(error);
  }
});

// Get workflow executions
workflowRouter.get('/:id/executions', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    // First verify the workflow belongs to the user
    const workflowResult = await pool.query(
      'SELECT id FROM workflows WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (workflowResult.rows.length === 0) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    const result = await pool.query(
      'SELECT * FROM workflow_executions WHERE workflow_id = $1 ORDER BY started_at DESC LIMIT 50',
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Delete workflow
workflowRouter.delete('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const result = await pool.query(
      'DELETE FROM workflows WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    res.json({ message: 'Workflow deleted successfully' });
  } catch (error) {
    next(error);
  }
});
