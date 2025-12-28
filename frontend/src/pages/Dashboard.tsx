import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../lib/api'
import { PlusCircle, LogOut, Workflow, Clock, CheckCircle, Pause } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Workflow {
  id: string
  name: string
  description: string
  status: 'draft' | 'active' | 'paused'
  created_at: string
  updated_at: string
}

export default function Dashboard() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  useEffect(() => {
    loadWorkflows()
  }, [])

  const loadWorkflows = async () => {
    try {
      const response = await api.get('/workflows')
      setWorkflows(response.data)
    } catch (error) {
      console.error('Failed to load workflows:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'paused':
        return <Pause className="w-5 h-5 text-yellow-500" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'paused':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Workflow className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">AI Workflow Automation</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Your Workflows</h2>
            <p className="text-gray-600 mt-1">Build and manage your automations</p>
          </div>
          <button
            onClick={() => navigate('/chat')}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <PlusCircle className="w-5 h-5" />
            Create Workflow
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : workflows.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Workflow className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No workflows yet</h3>
            <p className="text-gray-600 mb-6">
              Get started by creating your first automated workflow
            </p>
            <button
              onClick={() => navigate('/chat')}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <PlusCircle className="w-5 h-5" />
              Create Your First Workflow
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workflows.map((workflow) => (
              <div
                key={workflow.id}
                onClick={() => navigate(`/workflows/${workflow.id}`)}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {workflow.name}
                    </h3>
                    {workflow.description && (
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {workflow.description}
                      </p>
                    )}
                  </div>
                  {getStatusIcon(workflow.status)}
                </div>

                <div className="flex items-center justify-between">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      workflow.status
                    )}`}
                  >
                    {workflow.status}
                  </span>
                  <span className="text-xs text-gray-500">
                    Updated {formatDistanceToNow(new Date(workflow.updated_at))} ago
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
