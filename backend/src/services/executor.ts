import axios from 'axios';
import nodemailer from 'nodemailer';
import { pool } from '../db/init';
import { WorkflowDefinition, WorkflowStep, ExecutionContext } from '../types/workflow';

export class WorkflowExecutor {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async execute(workflow: WorkflowDefinition, userId: number, triggerData?: any) {
    // Create execution record
    const executionResult = await pool.query(
      `INSERT INTO workflow_executions (workflow_id, status, trigger_data, execution_log)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [workflow.id, 'running', JSON.stringify(triggerData || {}), JSON.stringify([])]
    );

    const executionId = executionResult.rows[0].id;
    const executionLog: any[] = [];

    const context: ExecutionContext = {
      workflowId: workflow.id,
      executionId,
      triggerData,
      stepResults: new Map(),
      userId,
    };

    try {
      // Execute each step in sequence
      for (const step of workflow.steps) {
        const stepLog: any = {
          stepId: step.id,
          stepType: step.type,
          startedAt: new Date().toISOString(),
          status: 'running',
        };

        try {
          const result = await this.executeStep(step, context);
          context.stepResults.set(step.id, result);

          stepLog.status = 'completed';
          stepLog.completedAt = new Date().toISOString();
          stepLog.result = result;
        } catch (error: any) {
          stepLog.status = 'failed';
          stepLog.error = error.message;
          executionLog.push(stepLog);
          throw error;
        }

        executionLog.push(stepLog);
      }

      // Update execution as successful
      await pool.query(
        `UPDATE workflow_executions 
         SET status = $1, completed_at = CURRENT_TIMESTAMP, execution_log = $2
         WHERE id = $3`,
        ['completed', JSON.stringify(executionLog), executionId]
      );

      return {
        executionId,
        status: 'completed',
        executionLog,
      };
    } catch (error: any) {
      // Update execution as failed
      await pool.query(
        `UPDATE workflow_executions 
         SET status = $1, completed_at = CURRENT_TIMESTAMP, error_message = $2, execution_log = $3
         WHERE id = $4`,
        ['failed', error.message, JSON.stringify(executionLog), executionId]
      );

      throw error;
    }
  }

  private async executeStep(step: WorkflowStep, context: ExecutionContext): Promise<any> {
    // Replace template variables in config
    const config = this.replaceTemplateVariables(step.config, context);

    switch (step.type) {
      case 'http_request':
        return await this.executeHttpRequest(config);
      
      case 'send_email':
        return await this.executeSendEmail(config);
      
      case 'transform_data':
        return await this.executeTransformData(config, context);
      
      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  private replaceTemplateVariables(config: any, context: ExecutionContext): any {
    const configStr = JSON.stringify(config);
    let replaced = configStr;

    // Replace {{step_X.path}} with actual values
    const templateRegex = /\{\{([^}]+)\}\}/g;
    let match;

    while ((match = templateRegex.exec(configStr)) !== null) {
      const variable = match[1].trim();
      let value;

      if (variable === 'trigger.data') {
        value = context.triggerData;
      } else if (variable.startsWith('step_')) {
        const [stepId, ...pathParts] = variable.split('.');
        const stepResult = context.stepResults.get(stepId);
        
        if (stepResult) {
          value = this.getNestedValue(stepResult, pathParts.join('.'));
        }
      }

      if (value !== undefined) {
        replaced = replaced.replace(match[0], JSON.stringify(value));
      }
    }

    return JSON.parse(replaced);
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private async executeHttpRequest(config: any): Promise<any> {
    const { method, url, headers, body } = config;

    const response = await axios({
      method,
      url,
      headers,
      data: body,
      timeout: 30000,
    });

    return {
      status: response.status,
      headers: response.headers,
      data: response.data,
    };
  }

  private async executeSendEmail(config: any): Promise<any> {
    const { to, subject, body, cc, bcc } = config;

    const info = await this.transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      cc,
      bcc,
      subject,
      text: body,
    });

    return {
      messageId: info.messageId,
      accepted: info.accepted,
    };
  }

  private async executeTransformData(config: any, context: ExecutionContext): Promise<any> {
    const { operation, expression } = config;

    // Simple transform operations
    // In production, you'd want a safer eval mechanism or use a library like JSONata
    switch (operation) {
      case 'filter':
        // Example: filter array based on condition
        return { transformed: true, operation };
      
      case 'map':
        // Example: map array to new structure
        return { transformed: true, operation };
      
      case 'reduce':
        // Example: reduce array to single value
        return { transformed: true, operation };
      
      default:
        throw new Error(`Unknown transform operation: ${operation}`);
    }
  }
}
