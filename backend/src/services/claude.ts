import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface Message {
  role: 'user' | 'assistant';
  content: string;
  workflow?: any;
  timestamp: string;
}

interface AIResponse {
  message: string;
  workflow?: any;
  needsMoreInfo: boolean;
}

export class ClaudeService {
  private systemPrompt = `You are an AI assistant helping users create workflow automations through natural conversation.

Your role:
1. Understand what the user wants to automate
2. Ask clarifying questions to get all necessary details
3. Generate a structured workflow JSON when you have enough information
4. Help users test and refine their workflows

When generating workflows, use this JSON structure:
{
  "id": "workflow_<random>",
  "name": "Workflow Name",
  "trigger": {
    "type": "schedule|webhook|manual",
    "cron": "cron expression (if schedule)",
    "webhookId": "unique id (if webhook)"
  },
  "steps": [
    {
      "id": "step_1",
      "type": "http_request|send_email|transform_data",
      "config": {
        // Step-specific configuration
      }
    }
  ]
}

Available step types:
- http_request: Make HTTP API calls (GET, POST, PUT, DELETE)
- send_email: Send emails via Gmail
- transform_data: Transform data between steps

Ask questions one at a time to make the conversation natural. When you have enough information, generate the workflow JSON and mark it with <workflow>...</workflow> tags.

Be friendly, concise, and helpful. Guide users through the process step by step.`;

  async processWorkflowRequest(messages: Message[], userId: number): Promise<AIResponse> {
    try {
      // Convert messages to Claude format
      const claudeMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: this.systemPrompt,
        messages: claudeMessages,
      });

      const content = response.content[0];
      const messageText = content.type === 'text' ? content.text : '';

      // Extract workflow JSON if present
      let workflow = null;
      let cleanMessage = messageText;
      const workflowMatch = messageText.match(/<workflow>(.*?)<\/workflow>/s);
      
      if (workflowMatch) {
        try {
          workflow = JSON.parse(workflowMatch[1].trim());
          cleanMessage = messageText.replace(/<workflow>.*?<\/workflow>/s, '').trim();
        } catch (error) {
          console.error('Failed to parse workflow JSON:', error);
        }
      }

      // Determine if we need more information
      const needsMoreInfo = !workflow && (
        messageText.includes('?') ||
        messageText.toLowerCase().includes('need to know') ||
        messageText.toLowerCase().includes('can you tell me')
      );

      return {
        message: cleanMessage || messageText,
        workflow,
        needsMoreInfo
      };
    } catch (error) {
      console.error('Claude API error:', error);
      throw new Error('Failed to process request with AI');
    }
  }

  async generateWorkflowFromDescription(description: string): Promise<any> {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: this.systemPrompt,
      messages: [{
        role: 'user',
        content: `Generate a complete workflow JSON for this automation: ${description}`
      }],
    });

    const content = response.content[0];
    const messageText = content.type === 'text' ? content.text : '';
    const workflowMatch = messageText.match(/<workflow>(.*?)<\/workflow>/s);
    
    if (workflowMatch) {
      return JSON.parse(workflowMatch[1].trim());
    }

    throw new Error('Could not generate workflow from description');
  }
}
