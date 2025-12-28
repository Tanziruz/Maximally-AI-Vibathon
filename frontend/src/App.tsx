import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import ChatBuilder from './pages/ChatBuilder'
import WorkflowDetail from './pages/WorkflowDetail'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((state) => state.token)
  return token ? <>{children}</> : <Navigate to="/login" />
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatBuilder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/workflows/:id"
          element={
            <ProtectedRoute>
              <WorkflowDetail />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  )
}

export default App
