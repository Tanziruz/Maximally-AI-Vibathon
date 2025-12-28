export interface Workflow {
  id: string;
  userId: number;
  name: string;
  description?: string;
  workflowJson: WorkflowDefinition;
  status: 'draft' | 'active' | 'paused';
  createdAt: Date;
  updatedAt: Date;
  deployedAt?: Date;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  trigger: Trigger;
  steps: WorkflowStep[];
}

export interface Trigger {
  type: 'schedule' | 'webhook' | 'manual';
  cron?: string;
  webhookId?: string;
}

export interface WorkflowStep {
  id: string;
  type: 'http_request' | 'send_email' | 'transform_data';
  config: StepConfig;
}

export interface StepConfig {
  [key: string]: any;
}

export interface HttpRequestConfig extends StepConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers?: Record<string, string>;
  body?: any;
}

export interface SendEmailConfig extends StepConfig {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
}

export interface TransformDataConfig extends StepConfig {
  operation: 'filter' | 'map' | 'reduce';
  expression: string;
}

export interface ExecutionContext {
  workflowId: string;
  executionId: number;
  triggerData?: any;
  stepResults: Map<string, any>;
  userId: number;
}
