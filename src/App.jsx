import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Register from './pages/Register';
import Scanner from './pages/Scanner';
import EmployeeDetails from './pages/EmployeeDetails';
import AdminEmployeeView from './pages/AdminEmployeeView';
import Login from './pages/Login';
import RegisterCertificate from './pages/RegisterCertificate';
import CertificatePortfolio from './pages/CertificatePortfolio';
import CertificatesDashboard from './pages/CertificatesDashboard';
import AdminCertificateView from './pages/AdminCertificateView';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/register-certificate" element={<RegisterCertificate />} />
          <Route path="/employee/:id" element={<EmployeeDetails />} />
          <Route path="/certificate/:id" element={<CertificatePortfolio />} />
          
          {/* Protected Admin Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="scanner" element={<Scanner />} />
            <Route path="admin/employee/:id" element={<AdminEmployeeView />} />
            <Route path="certificates" element={<CertificatesDashboard />} />
            <Route path="admin/certificate/:id" element={<AdminCertificateView />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
