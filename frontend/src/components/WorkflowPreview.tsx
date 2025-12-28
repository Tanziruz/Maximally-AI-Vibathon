import { Calendar, Globe, MousePointer, Mail, Globe2, Database } from 'lucide-react'

interface WorkflowPreviewProps {
  workflow: any
}

export default function WorkflowPreview({ workflow }: WorkflowPreviewProps) {
  const getTriggerIcon = (type: string) => {
    switch (type) {
      case 'schedule':
        return <Calendar className="w-5 h-5" />
      case 'webhook':
        return <Globe className="w-5 h-5" />
      case 'manual':
        return <MousePointer className="w-5 h-5" />
      default:
        return null
    }
  }

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'send_email':
        return <Mail className="w-5 h-5" />
      case 'http_request':
        return <Globe2 className="w-5 h-5" />
      case 'transform_data':
        return <Database className="w-5 h-5" />
      default:
        return null
    }
  }

  const getStepTitle = (type: string) => {
    switch (type) {
      case 'send_email':
        return 'Send Email'
      case 'http_request':
        return 'HTTP Request'
      case 'transform_data':
        return 'Transform Data'
      default:
        return type
    }
  }

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {workflow.name || 'Workflow Preview'}
      </h3>

      {/* Trigger */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            {getTriggerIcon(workflow.trigger.type)}
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">Trigger</div>
            <div className="text-xs text-gray-600 capitalize">{workflow.trigger.type}</div>
          </div>
        </div>
        {workflow.trigger.cron && (
          <div className="ml-10 text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded">
            Schedule: {workflow.trigger.cron}
          </div>
        )}
        {workflow.trigger.webhookId && (
          <div className="ml-10 text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded break-all">
            Webhook ID: {workflow.trigger.webhookId}
          </div>
        )}
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {workflow.steps?.map((step: any, index: number) => (
          <div key={step.id}>
            {/* Connector Line */}
            <div className="ml-4 w-0.5 h-6 bg-gray-300"></div>

            {/* Step */}
            <div className="flex items-start gap-2">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0">
                {getStepIcon(step.type)}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{getStepTitle(step.type)}</div>
                <div className="text-xs text-gray-600 mt-1">
                  {step.type === 'send_email' && (
                    <div className="space-y-1">
                      <div>To: {step.config.to}</div>
                      <div>Subject: {step.config.subject}</div>
                    </div>
                  )}
                  {step.type === 'http_request' && (
                    <div className="space-y-1">
                      <div>
                        {step.config.method} {step.config.url}
                      </div>
                    </div>
                  )}
                  {step.type === 'transform_data' && (
                    <div>Operation: {step.config.operation}</div>
                  )}
                </div>
                <div className="mt-2 bg-gray-50 rounded p-2 text-xs font-mono text-gray-700 overflow-x-auto">
                  {JSON.stringify(step.config, null, 2)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
