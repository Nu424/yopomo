import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PomodoroPage from './pages/PomodoroPage';
import RecordPage from './pages/RecordPage';
import SettingsPage from './pages/SettingsPage';
import TabBar from './components/TabBar';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-900 text-white dark:bg-black">
        <Routes>
          <Route path="/" element={<PomodoroPage />} />
          <Route path="/record" element={<RecordPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
        <TabBar />
      </div>
    </BrowserRouter>
  );
}

export default App;
