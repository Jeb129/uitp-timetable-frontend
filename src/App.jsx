// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppLayout from './components/AppLayout';
import CalendarPage from './pages/CalendarPage';
import MapPage from './pages/MapPage';
import AuditoriumsPage from './pages/AuditoriumsPage';
import SchedulePage from './pages/SchedulePage';
import KGUPage from './pages/KGUPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Компонент, который проверяет авторизацию
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) return <div>Загрузка...</div>;

    return user ? children : <Navigate to="/login" replace />;
};

// Компонент для гостя (если авторизован — редирект на /profile)
const GuestRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) return <div>Загрузка...</div>;

    return !user ? children : <Navigate to="/profile" replace />;
};

const AppContent = () => {
    return (
        <Routes>
            {/* Страницы с AppLayout */}
            <Route path="/" element={
                <AppLayout>
                    <CalendarPage />
                </AppLayout>
            } />
            <Route path="/calendar" element={
                <AppLayout>
                    <CalendarPage />
                </AppLayout>
            } />
            <Route path="/map" element={
                <AppLayout>
                    <MapPage />
                </AppLayout>
            } />
            <Route path="/auditoriums" element={
                <AppLayout>
                    <AuditoriumsPage />
                </AppLayout>
            } />
            <Route path="/schedule" element={
                <AppLayout>
                    <SchedulePage />
                </AppLayout>
            } />
            <Route path="/kgu" element={
                <AppLayout>
                    <KGUPage />
                </AppLayout>
            } />

            {/* Защищённые маршруты */}
            <Route path="/profile" element={
                <ProtectedRoute>
                    <AppLayout>
                        <ProfilePage />
                    </AppLayout>
                </ProtectedRoute>
            } />

            {/* Гостевые маршруты — с AppLayout */}
            <Route path="/login" element={
                <GuestRoute>
                    <AppLayout>
                        <LoginPage />
                    </AppLayout>
                </GuestRoute>
            } />
            <Route path="/register" element={
                <GuestRoute>
                    <AppLayout>
                        <RegisterPage />
                    </AppLayout>
                </GuestRoute>
            } />
        </Routes>
    );
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <AppContent />
            </Router>
        </AuthProvider>
    );
}

export default App;