# AI Workflow Automation Platform

An AI-powered workflow automation platform where users create complex workflows through natural conversation instead of technical configuration.

## 🚀 Features

- **Conversational Workflow Builder**: Describe your automation needs in plain English, and AI builds it for you
- **Visual Workflow Preview**: See your workflow structure in real-time as it's being built
- **Flexible Triggers**: Schedule (cron), webhook, or manual execution
- **Multiple Actions**: HTTP requests, email sending, data transformation
- **Reliable Execution**: Background job queue with retries and error handling
- **Execution History**: Monitor all workflow runs with detailed logs

## 🏗️ Architecture

### Backend (Node.js + Express)
- **API Server**: RESTful API with Express
- **Database**: PostgreSQL for persistent storage
- **Job Queue**: BullMQ with Redis for reliable workflow execution
- **AI Integration**: Claude API for conversational workflow building
- **Email**: Nodemailer for sending emails

### Frontend (React + TypeScript)
- **Chat Interface**: Conversational UI for building workflows
- **Dashboard**: Manage and monitor all workflows
- **Workflow Visualization**: Visual representation of workflow structure
- **Authentication**: JWT-based user authentication

## 📦 Getting Started

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16+
- Redis 7+
- Anthropic API key

### Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Maximally-AI-Vibathon
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env and add your API keys
   ```

3. **Start all services**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost
   - Backend API: http://localhost:3001

### Local Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up PostgreSQL and Redis**
   ```bash
   # Using Docker
   docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:16-alpine
   docker run -d -p 6379:6379 redis:7-alpine
   ```

3. **Configure environment**
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your settings
   ```

4. **Run development servers**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

## 🔧 Configuration

### Environment Variables

**Backend (`backend/.env`)**:
```env
PORT=3001
DATABASE_URL=postgresql://postgres:password@localhost:5432/workflow_db
REDIS_URL=redis://localhost:6379
ANTHROPIC_API_KEY=your_api_key_here
JWT_SECRET=your_jwt_secret_here
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
FRONTEND_URL=http://localhost:5173
```

**Docker Compose (`.env`)**:
```env
ANTHROPIC_API_KEY=your_api_key_here
JWT_SECRET=your_jwt_secret_here
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### Gmail Setup

To send emails via Gmail:

1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the app password in `SMTP_PASS` environment variable

## 📚 API Documentation

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login to existing account

### Chat (Workflow Builder)
- `POST /api/chat/message` - Send message to AI and get response
- `GET /api/chat/conversations` - List all conversations
- `GET /api/chat/conversations/:id` - Get conversation details

### Workflows
- `GET /api/workflows` - List all workflows
- `POST /api/workflows` - Create new workflow
- `GET /api/workflows/:id` - Get workflow details
- `PUT /api/workflows/:id` - Update workflow
- `DELETE /api/workflows/:id` - Delete workflow
- `POST /api/workflows/:id/deploy` - Deploy/activate workflow
- `POST /api/workflows/:id/pause` - Pause workflow
- `POST /api/workflows/:id/execute` - Execute workflow manually
- `GET /api/workflows/:id/executions` - Get execution history

### Webhooks
- `POST /api/webhooks/:webhookId` - Trigger workflow via webhook
- `GET /api/webhooks/url/:workflowId` - Get webhook URL for workflow

## 🎯 Workflow JSON Structure

```json
{
  "id": "workflow_123",
  "name": "Weekly Sales Report",
  "trigger": {
    "type": "schedule",
    "cron": "0 9 * * MON"
  },
  "steps": [
    {
      "id": "step_1",
      "type": "http_request",
      "config": {
        "method": "GET",
        "url": "https://api.example.com/sales"
      }
    },
    {
      "id": "step_2",
      "type": "send_email",
      "config": {
        "to": "user@example.com",
        "subject": "Weekly Sales Report",
        "body": "{{step_1.data}}"
      }
    }
  ]
}
```

### Trigger Types
- **schedule**: Run on a cron schedule
- **webhook**: Triggered by incoming HTTP request
- **manual**: Execute on demand

### Step Types
- **http_request**: Make HTTP API calls
- **send_email**: Send emails via SMTP
- **transform_data**: Transform data between steps

### Template Variables
Use `{{variable}}` syntax to reference data from previous steps:
- `{{trigger.data}}` - Data from trigger
- `{{step_1.data}}` - Response from step_1
- `{{step_1.data.field}}` - Nested field access

## 🛠️ Development

### Project Structure
```
.
├── backend/
│   ├── src/
│   │   ├── index.ts           # Main server file
│   │   ├── db/                # Database initialization
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic
│   │   ├── middleware/        # Express middleware
│   │   └── types/             # TypeScript types
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── pages/             # React pages
│   │   ├── components/        # React components
│   │   ├── lib/               # Utilities
│   │   └── store/             # State management
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml
└── package.json
```

### Testing Workflows

**Example 1: Scheduled Email**
```
User: "Send me an email every Monday at 9am with a summary"
AI: [Asks clarifying questions about email content and recipients]
User: [Provides details]
AI: [Generates workflow with schedule trigger and email action]
```

**Example 2: Webhook Integration**
```
User: "Notify me when someone fills my contact form"
AI: "I can help! How do you want to be notified?"
User: "Send me an email"
AI: [Generates workflow with webhook trigger and email action]
```

## 🚢 Deployment

### Docker Production Deployment

1. **Build and run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

2. **View logs**
   ```bash
   docker-compose logs -f
   ```

3. **Stop services**
   ```bash
   docker-compose down
   ```

### Environment-Specific Configuration

For production, make sure to:
- Use strong `JWT_SECRET`
- Set secure database credentials
- Use environment-specific URLs
- Enable HTTPS/SSL
- Set up proper backup for PostgreSQL

## 🔮 Future Enhancements

- [ ] Visual drag-and-drop workflow editor
- [ ] More integrations (Slack, Google Sheets, Airtable)
- [ ] Conditional logic and branching
- [ ] Error notifications via email/SMS
- [ ] Monitoring dashboard with metrics
- [ ] Workflow templates library
- [ ] Team collaboration features
- [ ] API rate limiting and usage tracking

## 📄 License

MIT License - feel free to use this for your projects!

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For questions or issues, please open an issue on GitHub.
