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
import InvoiceGenerator from './pages/InvoiceGenerator';
import InvoiceHistory from './pages/InvoiceHistory';
import FormBuilderDashboard from './pages/FormBuilderDashboard';
import FormBuilderEditor from './pages/FormBuilderEditor';
import FormPublicView from './pages/FormPublicView';
import FormResponses from './pages/FormResponses';
import FormAnalytics from './pages/FormAnalytics';
import OfferLetterGenerator from './pages/OfferLetterGenerator';
import { useEffect } from 'react';
import ChatWidget from './components/ChatWidget';
import AttendanceTracker from './pages/AttendanceTracker';
import LiveSheetDashboard from './pages/LiveSheetDashboard';
import LiveSheetEditor from './pages/LiveSheetEditor';
import LiveSheetPublicView from './pages/LiveSheetPublicView';
import LiveSheetResponses from './pages/LiveSheetResponses';

import { setupGlobalAlert } from './utils/notify';

setupGlobalAlert();

function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, []);

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
          <Route path="/f/:id" element={<FormPublicView />} />
          <Route path="/public/sheet/:id" element={<LiveSheetPublicView />} />
          
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
            <Route path="invoice-generator" element={<InvoiceGenerator />} />
            <Route path="invoice-history" element={<InvoiceHistory />} />
            <Route path="attendance-tracker" element={<AttendanceTracker />} />
            <Route path="offer-letter" element={<OfferLetterGenerator />} />
            
            {/* Custom Form Builder Module */}
            <Route path="form-builder" element={<FormBuilderDashboard />} />
            <Route path="form-builder/create" element={<FormBuilderEditor />} />
            <Route path="form-builder/edit/:id" element={<FormBuilderEditor />} />
            <Route path="form-builder/responses/:id" element={<FormResponses />} />
            <Route path="form-builder/analytics/:id" element={<FormAnalytics />} />
            
            {/* Live Sheets Module */}
            <Route path="live-sheets" element={<LiveSheetDashboard />} />
            <Route path="live-sheets/edit/:id" element={<LiveSheetEditor />} />
            <Route path="live-sheets/:id/responses" element={<LiveSheetResponses />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <ChatWidget />
    </AuthProvider>
  );
}

export default App;
