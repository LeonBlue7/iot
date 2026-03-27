import { Navigate, Route, Routes } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Devices from './pages/Devices'
import Alarms from './pages/Alarms'
import Stats from './pages/Stats'
import Groups from './pages/Groups'
import { AuthGuard } from './components/AuthGuard'
import { Layout } from './components/Layout'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <AuthGuard>
            <Layout />
          </AuthGuard>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="devices" element={<Devices />} />
        <Route path="groups" element={<Groups />} />
        <Route path="alarms" element={<Alarms />} />
        <Route path="stats" element={<Stats />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
