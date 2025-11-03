
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import CalendarPage from './pages/CalendarPage';
import MapPage from './pages/MapPage';
import AuditoriumsPage from './pages/AuditoriumsPage';
import SchedulePage from './pages/SchedulePage';
import KGUPage from './pages/KGUPage';

function App() {
    return (
        <Router>
            <AppLayout>
                <Routes>
                    <Route path="/" element={<CalendarPage />} />
                    <Route path="/calendar" element={<CalendarPage />} />
                    <Route path="/map" element={<MapPage />} />
                    <Route path="/auditoriums" element={<AuditoriumsPage />} />
                    <Route path="/schedule" element={<SchedulePage />} />
                    <Route path="/kgu" element={<KGUPage />} />
                </Routes>
            </AppLayout>
        </Router>
    );
}

export default App;