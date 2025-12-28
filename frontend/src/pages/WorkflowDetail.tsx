import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { ArrowLeft, Play, Pause, Trash2, Calendar, Globe, MousePointer } from 'lucide-react'
import WorkflowPreview from '../components/WorkflowPreview'
import { formatDistanceToNow } from 'date-fns'

interface Execution {
  id: number
  status: string
  started_at: string
  completed_at: string | null
  error_message: string | null
}

export default function WorkflowDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [workflow, setWorkflow] = useState<any>(null)
  const [executions, setExecutions] = useState<Execution[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWorkflow()
    loadExecutions()
  }, [id])

  const loadWorkflow = async () => {
    try {
      const response = await api.get(`/workflows/${id}`)
      setWorkflow(response.data)
    } catch (error) {
      console.error('Failed to load workflow:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadExecutions = async () => {
    try {
      const response = await api.get(`/workflows/${id}/executions`)
      setExecutions(response.data)
    } catch (error) {
      console.error('Failed to load executions:', error)
    }
  }

  const handleDeploy = async () => {
    try {
      await api.post(`/workflows/${id}/deploy`)
      loadWorkflow()
    } catch (error) {
      console.error('Failed to deploy:', error)
    }
  }

  const handlePause = async () => {
    try {
      await api.post(`/workflows/${id}/pause`)
      loadWorkflow()
    } catch (error) {
      console.error('Failed to pause:', error)
    }
  }

  const handleExecute = async () => {
    try {
      await api.post(`/workflows/${id}/execute`, {})
      loadExecutions()
    } catch (error) {
      console.error('Failed to execute:', error)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this workflow?')) return

    try {
      await api.delete(`/workflows/${id}`)
      navigate('/')
    } catch (error) {
      console.error('Failed to delete:', error)
    }
  }

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!workflow) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Workflow not found</h2>
          <button onClick={() => navigate('/')} className="text-blue-600 hover:text-blue-700">
            Go back to dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/')} className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{workflow.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  {getTriggerIcon(workflow.workflow_json.trigger.type)}
                  <span className="text-sm text-gray-600">
                    {workflow.workflow_json.trigger.type === 'schedule'
                      ? `Runs ${workflow.workflow_json.trigger.cron}`
                      : workflow.workflow_json.trigger.type}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleExecute}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Run Now
              </button>
              {workflow.status === 'active' ? (
                <button
                  onClick={handlePause}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center gap-2"
                >
                  <Pause className="w-4 h-4" />
                  Pause
                </button>
              ) : (
                <button
                  onClick={handleDeploy}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Deploy
                </button>
              )}
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Workflow Definition */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Workflow Structure</h2>
            <WorkflowPreview workflow={workflow.workflow_json} />
          </div>

          {/* Execution History */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Execution History</h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {executions.length === 0 ? (
                <div className="p-8 text-center text-gray-600">No executions yet</div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {executions.map((execution) => (
                    <div key={execution.id} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            execution.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : execution.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {execution.status}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDistanceToNow(new Date(execution.started_at))} ago
                        </span>
                      </div>
                      {execution.error_message && (
                        <p className="text-sm text-red-600 mt-2">{execution.error_message}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
