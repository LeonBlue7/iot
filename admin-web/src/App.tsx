import { Navigate, Route, Routes } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Devices from './pages/Devices'
import DeviceDetail from './pages/Devices/Detail'
import Alarms from './pages/Alarms'
import Stats from './pages/Stats'
import Groups from './pages/Groups'
import GroupDetail from './pages/Groups/Detail'
import Zones from './pages/Zones'
import ZoneDetail from './pages/Zones/Detail'
import Customers from './pages/Customers'
import CustomerDetail from './pages/Customers/Detail'
import Users from './pages/Users'
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
        <Route path="customers" element={<Customers />} />
        <Route path="customers/:id" element={<CustomerDetail />} />
        <Route path="zones" element={<Zones />} />
        <Route path="zones/:id" element={<ZoneDetail />} />
        <Route path="groups" element={<Groups />} />
        <Route path="groups/:id" element={<GroupDetail />} />
        <Route path="devices" element={<Devices />} />
        <Route path="devices/:id" element={<DeviceDetail />} />
        <Route path="alarms" element={<Alarms />} />
        <Route path="stats" element={<Stats />} />
        <Route path="users" element={<Users />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
