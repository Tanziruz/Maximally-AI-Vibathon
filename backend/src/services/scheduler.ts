import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import cron from 'cron-parser';
import { pool } from '../db/init';
import { WorkflowExecutor } from './executor';

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export class WorkflowScheduler {
  private static instance: WorkflowScheduler;
  private queue: Queue;
  private worker: Worker;

  private constructor() {
    this.queue = new Queue('workflows', { connection });
    
    this.worker = new Worker(
      'workflows',
      async (job) => {
        const { workflowId, userId, workflowJson } = job.data;
        const executor = new WorkflowExecutor();
        
        try {
          await executor.execute(workflowJson, userId);
          console.log(`✓ Workflow ${workflowId} executed successfully`);
        } catch (error) {
          console.error(`✗ Workflow ${workflowId} failed:`, error);
          throw error;
        }
      },
      { connection }
    );

    this.worker.on('completed', (job) => {
      console.log(`Job ${job.id} completed`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`Job ${job?.id} failed:`, err);
    });
  }

  static getInstance(): WorkflowScheduler {
    if (!WorkflowScheduler.instance) {
      WorkflowScheduler.instance = new WorkflowScheduler();
    }
    return WorkflowScheduler.instance;
  }

  async start() {
    // Load all active scheduled workflows
    await this.loadScheduledWorkflows();
    
    // Reload every 5 minutes to catch new workflows
    setInterval(() => this.loadScheduledWorkflows(), 5 * 60 * 1000);
  }

  private async loadScheduledWorkflows() {
    try {
      const result = await pool.query(
        `SELECT id, user_id, workflow_json 
         FROM workflows 
         WHERE status = 'active' 
         AND workflow_json->'trigger'->>'type' = 'schedule'`
      );

      for (const workflow of result.rows) {
        const cronExpression = workflow.workflow_json.trigger.cron;
        
        if (cronExpression) {
          await this.scheduleWorkflow(
            workflow.id,
            workflow.user_id,
            workflow.workflow_json,
            cronExpression
          );
        }
      }

      console.log(`Loaded ${result.rows.length} scheduled workflows`);
    } catch (error) {
      console.error('Error loading scheduled workflows:', error);
    }
  }

  async scheduleWorkflow(
    workflowId: string,
    userId: number,
    workflowJson: any,
    cronExpression: string
  ) {
    try {
      // Remove existing jobs for this workflow
      const jobs = await this.queue.getJobs(['delayed', 'waiting']);
      for (const job of jobs) {
        if (job.data.workflowId === workflowId) {
          await job.remove();
        }
      }

      // Parse cron and get next execution time
      const interval = cron.parseExpression(cronExpression);
      const nextRun = interval.next().toDate();

      // Add job to queue
      await this.queue.add(
        `workflow-${workflowId}`,
        {
          workflowId,
          userId,
          workflowJson,
        },
        {
          delay: nextRun.getTime() - Date.now(),
          jobId: `${workflowId}-${nextRun.getTime()}`,
        }
      );

      console.log(`Scheduled workflow ${workflowId} for ${nextRun.toISOString()}`);
    } catch (error) {
      console.error(`Error scheduling workflow ${workflowId}:`, error);
    }
  }

  async unscheduleWorkflow(workflowId: string) {
    const jobs = await this.queue.getJobs(['delayed', 'waiting', 'active']);
    for (const job of jobs) {
      if (job.data.workflowId === workflowId) {
        await job.remove();
      }
    }
  }
}
