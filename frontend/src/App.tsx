import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './components/layout/AppShell';
import DashboardPage from './pages/DashboardPage';
import AccountsPage from './pages/AccountsPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import StudentEditPage from './pages/StudentEditPage';
import StudentProfileAdminPage from './pages/StudentProfileAdminPage';
import StudentsPage from './pages/StudentsPage';
import PlacementsPage from './pages/PlacementsPage';
import PlacementOpportunityCreatePage from './pages/PlacementOpportunityCreatePage';
import PlacementDriveCreatePage from './pages/PlacementDriveCreatePage';
import PlacementDriveFastMarkPage from './pages/PlacementDriveFastMarkPage';
import TrainingPage from './pages/TrainingPage';
import TrainingSessionCreatePage from './pages/TrainingSessionCreatePage';
import TrainingFastMarkPage from './pages/TrainingFastMarkPage';
import EventsPage from './pages/EventsPage';
import EventSeminarCreatePage from './pages/EventSeminarCreatePage';

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            <Route
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              {/* Common pages accessible by all logged-in roles */}
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/placements" element={<PlacementsPage />} />
              <Route
                path="/placements/opportunities/create"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'TPO', 'HOD', 'VOLUNTEER']}>
                    <PlacementOpportunityCreatePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/placements/drives/create"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'TPO', 'HOD', 'VOLUNTEER']}>
                    <PlacementDriveCreatePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/placements/drives/mark-single/:driveId"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'TPO', 'HOD', 'VOLUNTEER']}>
                    <PlacementDriveFastMarkPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/training" element={<TrainingPage />} />
              <Route
                path="/training/create"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'TPO', 'HOD', 'VOLUNTEER']}>
                    <TrainingSessionCreatePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/training/mark-single/:lectureId"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'TPO', 'HOD', 'VOLUNTEER']}>
                    <TrainingFastMarkPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/events" element={<EventsPage />} />
              <Route
                path="/events/create"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'TPO', 'HOD']}>
                    <EventSeminarCreatePage />
                  </ProtectedRoute>
                }
              />

              {/* Student Directory and Profile Management - TPO, HOD, Super Admin, and Volunteers */}
              <Route
                path="/students"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'TPO', 'HOD', 'VOLUNTEER']}>
                    <StudentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/students/:studentId"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'TPO', 'HOD', 'VOLUNTEER']}>
                    <StudentProfileAdminPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/students/:studentId/edit"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'TPO', 'HOD', 'VOLUNTEER']}>
                    <StudentEditPage />
                  </ProtectedRoute>
                }
              />

              {/* User Role and Account Management - Admins only */}
              <Route
                path="/accounts"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'TPO', 'HOD']}>
                    <AccountsPage />
                  </ProtectedRoute>
                }
              />

              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Route>

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Navigate to="/dashboard" replace />
                </ProtectedRoute>
              }
            />
            
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
