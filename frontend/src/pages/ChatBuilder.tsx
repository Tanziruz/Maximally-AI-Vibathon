import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { Send, Loader2, ArrowLeft, Sparkles } from 'lucide-react'
import WorkflowPreview from '../components/WorkflowPreview'

interface Message {
  role: 'user' | 'assistant'
  content: string
  workflow?: any
  timestamp: string
}

export default function ChatBuilder() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<number | null>(null)
  const [currentWorkflow, setCurrentWorkflow] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await api.post('/chat/message', {
        message: input,
        conversationId,
      })

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.data.message,
        workflow: response.data.workflow,
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, assistantMessage])
      setConversationId(response.data.conversationId)

      if (response.data.workflow) {
        setCurrentWorkflow(response.data.workflow)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleDeploy = async () => {
    if (!currentWorkflow) return

    try {
      // Create the workflow
      const response = await api.post('/workflows', {
        name: currentWorkflow.name,
        description: '',
        workflowJson: currentWorkflow,
      })

      // Deploy it
      await api.post(`/workflows/${response.data.id}/deploy`)

      navigate(`/workflows/${response.data.id}`)
    } catch (error) {
      console.error('Failed to deploy workflow:', error)
      alert('Failed to deploy workflow. Please try again.')
    }
  }

  const handleTest = async () => {
    if (!currentWorkflow) return

    try {
      const testData = prompt('Enter test data (JSON format, or leave empty):')
      const parsedData = testData ? JSON.parse(testData) : undefined

      const response = await api.post('/workflows/test', {
        workflowJson: currentWorkflow,
        testData: parsedData,
      })

      alert('Test completed successfully! Check console for details.')
      console.log('Test result:', response.data)
    } catch (error) {
      console.error('Test failed:', error)
      alert('Test failed. Check console for details.')
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">AI Workflow Builder</h1>
          </div>
        </div>
        {currentWorkflow && (
          <div className="flex gap-3">
            <button
              onClick={handleTest}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Test Workflow
            </button>
            <button
              onClick={handleDeploy}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Deploy Workflow
            </button>
          </div>
        )}
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-8">
            {messages.length === 0 && (
              <div className="max-w-2xl mx-auto text-center py-12">
                <Sparkles className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Let's build your workflow
                </h2>
                <p className="text-gray-600 mb-8">
                  Describe what you want to automate, and I'll help you build it step by step.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <button
                    onClick={() =>
                      setInput('Send me an email every Monday with last week\'s sales data')
                    }
                    className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-sm"
                  >
                    <div className="font-medium text-gray-900 mb-1">Weekly Sales Report</div>
                    <div className="text-gray-600 text-xs">
                      Automated email with sales data
                    </div>
                  </button>
                  <button
                    onClick={() =>
                      setInput('Notify me when someone fills out my contact form')
                    }
                    className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-sm"
                  >
                    <div className="font-medium text-gray-900 mb-1">Form Notifications</div>
                    <div className="text-gray-600 text-xs">Get notified about form submissions</div>
                  </button>
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`mb-6 flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-2xl px-6 py-4 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-900 shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start mb-6">
                <div className="bg-white px-6 py-4 rounded-lg shadow-sm flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  <span className="text-gray-600">Thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 bg-white px-6 py-4">
            <div className="max-w-4xl mx-auto flex gap-4">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Describe what you want to automate..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="w-5 h-5" />
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Workflow Preview */}
        {currentWorkflow && (
          <div className="w-96 border-l border-gray-200 bg-white overflow-y-auto">
            <WorkflowPreview workflow={currentWorkflow} />
          </div>
        )}
      </div>
    </div>
  )
}
