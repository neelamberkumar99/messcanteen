import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';

// Student Pages
import StudentDashboard from './pages/student/Dashboard';
import StudentShop from './pages/student/Shop';
import StudentOrders from './pages/student/Orders';
import StudentBill from './pages/student/Bill';
import StudentHistory from './pages/student/History';
import StudentFeedback from './pages/student/Feedback';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminOrders from './pages/admin/Orders';
import AdminPayments from './pages/admin/Payments';
import AdminUsers from './pages/admin/Users';
import AdminMealPlans from './pages/admin/MealPlans';
import AdminFeedback from './pages/admin/Feedback';
import AdminSettings from './pages/admin/Settings';

// Vendor Pages
import VendorDashboard from './pages/vendor/Dashboard';
import VendorItems from './pages/vendor/Items';
import VendorOrders from './pages/vendor/Orders';
import VendorDiets from './pages/vendor/Diets';
import VendorStudents from './pages/vendor/Students';
import VendorFeedback from './pages/vendor/Feedback';
import VendorPOS from './pages/vendor/POS';

// Super Admin Pages
import SuperAdminDashboard from './pages/superadmin/Dashboard';
import SuperAdminAccounts from './pages/superadmin/Accounts';
import SuperAdminAudit from './pages/superadmin/Audit';

// Settings & Support
import Settings from './pages/Settings';
import Support from './pages/Support';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />

          {/* Student Routes */}
          <Route path="/student/*" element={
            <ProtectedRoute requiredRoles={['student']}>
              <Routes>
                <Route path="dashboard" element={<StudentDashboard />} />
                <Route path="shop" element={<StudentShop />} />
                <Route path="orders" element={<StudentOrders />} />
                <Route path="bill" element={<StudentBill />} />
                <Route path="history" element={<StudentHistory />} />
                <Route path="feedback" element={<StudentFeedback />} />
              </Routes>
            </ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin/*" element={
            <ProtectedRoute requiredRoles={['admin']}>
              <Routes>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="payments" element={<AdminPayments />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="meal-plans" element={<AdminMealPlans />} />
                <Route path="feedback" element={<AdminFeedback />} />
                <Route path="settings" element={<AdminSettings />} />
              </Routes>
            </ProtectedRoute>
          } />

          {/* Vendor Routes */}
          <Route path="/vendor/*" element={
            <ProtectedRoute requiredRoles={['vendor', 'contractor']}>
              <Routes>
                <Route path="dashboard" element={<VendorDashboard />} />
                <Route path="items" element={<VendorItems />} />
                <Route path="orders" element={<VendorOrders />} />
                <Route path="diets" element={<VendorDiets />} />
                <Route path="students" element={<VendorStudents />} />
                <Route path="feedback" element={<VendorFeedback />} />
                <Route path="pos" element={<VendorPOS />} />
              </Routes>
            </ProtectedRoute>
          } />

          {/* Super Admin Routes */}
          <Route path="/superadmin/*" element={
            <ProtectedRoute requiredRoles={['superadmin']}>
              <Routes>
                <Route path="dashboard" element={<SuperAdminDashboard />} />
                <Route path="accounts" element={<SuperAdminAccounts />} />
                <Route path="audit" element={<SuperAdminAudit />} />
              </Routes>
            </ProtectedRoute>
          } />

          {/* Global Pages */}
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
          <Route path="/support" element={
            <ProtectedRoute>
              <Support />
            </ProtectedRoute>
          } />
          
          {/* Fallback */}
          <Route path="*" element={<div className="flex items-center justify-center h-screen font-bold text-2xl">404 - Page Not Found</div>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
