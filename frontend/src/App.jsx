import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ParticipantRoom from './pages/participant/ParticipantRoom';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminLiveControl from './pages/admin/AdminLiveControl';
import ThemeToggle from './components/ThemeToggle';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen relative overflow-hidden flex flex-col">
        {/* Background Gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-brand-600/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-fuchsia-600/20 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="absolute top-4 right-4 z-50">
          <ThemeToggle />
        </div>

        <div className="flex-1 z-10">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/room/:roomCode" element={<ParticipantRoom />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/room/:roomId" element={<AdminLiveControl />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
