import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { AuthProvider } from './context/AuthContext';

// Pages
// import LoginPage from './pages/auth/LoginPage';
// import DashboardPage from './pages/dashboard/DashboardPage';
// import StudentListPage from './pages/students/StudentListPage';
// import PlacementListPage from './pages/placements/PlacementListPage';

// Components
// import Layout from './components/layout/Layout';
// import ProtectedRoute from './components/common/ProtectedRoute';

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Auth Routes */}
            {/* <Route path="/login" element={<LoginPage />} /> */}
            {/* <Route path="/register" element={<RegisterPage />} /> */}

            {/* Protected Routes */}
            {/* <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}> */}
            {/*   <Route path="/" element={<DashboardPage />} /> */}
            {/*   <Route path="/students" element={<StudentListPage />} /> */}
            {/*   <Route path="/placements" element={<PlacementListPage />} /> */}
            {/* </Route> */}

            {/* Redirect to home */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
