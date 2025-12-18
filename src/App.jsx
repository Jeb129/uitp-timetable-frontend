// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppLayout from './components/AppLayout';
import CalendarPage from './pages/CalendarPage';
import MapPage from './pages/MapPage';
import SchedulePage from './pages/SchedulePage';
import KGUPage from './pages/KGUPage';
import ProfilePage from './pages/ProfilePage.jsx';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import RulesPage from './pages/RulesPage';
import AdminPage from "./pages/AdminPage.jsx";
import KGUConfirmPage from "./pages/KGUConfirmPage.jsx";
import { FilterProvider } from './contexts/FilterContext';


// Компонент, который проверяет авторизацию - ОТКЛЮЧЕН
const ProtectedRoute = ({ children }) => {
    // const { user, loading } = useAuth();
    // if (loading) return <div>Загрузка...</div>;
    // return user ? children : <Navigate to="/login" replace />;
    return children; // Пропускаем всех без проверки
};

const ProtectedAdminRoute = ({ children }) => {
    const { user, loading, isAdmin } = useAuth();

    if (loading) return <div>Загрузка...</div>;

    if (!user) return <Navigate to="/login" replace />;

    if (!isAdmin()) return <Navigate to="/" replace />;

    return children;
};

// Компонент для гостя - ОТКЛЮЧЕН
const GuestRoute = ({ children }) => {
    // const { user, loading } = useAuth();
    // if (loading) return <div>Загрузка...</div>;
    // return !user ? children : <Navigate to="/profile" replace />;
    return children; // Пропускаем всех без проверки
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
            <Route path="/admin" element={
                // <ProtectedRoute>
                <AppLayout>
                    <AdminPage />
                </AppLayout>
                // </ProtectedRoute>
            } />

            {/* Защищённые маршруты - теперь доступны всем */}
            <Route path="/profile" element={
                <AppLayout>
                    <ProfilePage />
                </AppLayout>

            } />

            {/* Гостевые маршруты — с AppLayout - теперь доступны всем */}
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
            <Route path="/rules" element={
                <AppLayout>
                    <RulesPage />
                </AppLayout>
            } />
            <Route path="/kgu-confirm" element={
                <AppLayout>
                    <KGUConfirmPage />
                </AppLayout>
            } />
        </Routes>
    );
};

function App() {
    return (
        <AuthProvider>
            <FilterProvider>
                <Router>
                    <AppContent />
                </Router>
            </FilterProvider>
        </AuthProvider>
    );
}

export default App;