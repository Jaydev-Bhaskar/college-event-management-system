import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Events from './pages/Events';
import EventDetails from './pages/EventDetails';
import StudentDashboard from './pages/StudentDashboard';
import OrganizerDashboard from './pages/OrganizerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import POBankManager from './pages/POBankManager';
import FeedbackFormBuilder from './pages/FeedbackFormBuilder';
import SystemSettings from './pages/SystemSettings';
import ExpertDashboard from './pages/ExpertDashboard';
import AdminSetup from './pages/AdminSetup';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Navbar />
          <Routes>
            {/* Public */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:id" element={<EventDetails />} />

            {/* [DEV ONLY] Admin Setup */}
            <Route path="/setup" element={<AdminSetup />} />

            {/* Expert Dashboard (expert JWT auth, no ProtectedRoute) */}
            <Route path="/expert/dashboard" element={<ExpertDashboard />} />

            {/* Student / Teacher Dashboard — all sub-paths render same dashboard */}
            <Route path="/dashboard" element={
              <ProtectedRoute roles={['student', 'teacher', 'organizer']}>
                <StudentDashboard />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/*" element={
              <ProtectedRoute roles={['student', 'teacher', 'organizer']}>
                <StudentDashboard />
              </ProtectedRoute>
            } />

            {/* Organizer — all sub-paths render same dashboard */}
            <Route path="/organizer" element={
              <ProtectedRoute roles={['organizer']}>
                <OrganizerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/organizer/events" element={
              <ProtectedRoute roles={['organizer']}>
                <OrganizerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/organizer/participants" element={
              <ProtectedRoute roles={['organizer']}>
                <OrganizerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/organizer/analytics" element={
              <ProtectedRoute roles={['organizer']}>
                <OrganizerDashboard />
              </ProtectedRoute>
            } />

            {/* Feedback Form Builder */}
            <Route path="/organizer/feedback-builder/:eventId" element={
              <ProtectedRoute roles={['organizer', 'admin']}>
                <FeedbackFormBuilder />
              </ProtectedRoute>
            } />

            {/* Admin — all sub-paths render same dashboard */}
            <Route path="/admin" element={
              <ProtectedRoute roles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/requests" element={
              <ProtectedRoute roles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/events" element={
              <ProtectedRoute roles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/students" element={
              <ProtectedRoute roles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/reports" element={
              <ProtectedRoute roles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />

            {/* Admin dedicated pages */}
            <Route path="/admin/po-bank" element={
              <ProtectedRoute roles={['admin']}>
                <POBankManager />
              </ProtectedRoute>
            } />
            <Route path="/admin/settings" element={
              <ProtectedRoute roles={['admin']}>
                <SystemSettings />
              </ProtectedRoute>
            } />

            {/* Profile */}
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />

            {/* Fallback */}
            <Route path="*" element={
              <div className="page-container" style={{ textAlign: 'center', paddingTop: '40vh' }}>
                <h1 style={{ fontSize: '4rem', fontWeight: 700 }} className="text-gradient">404</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Page not found</p>
              </div>
            } />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
