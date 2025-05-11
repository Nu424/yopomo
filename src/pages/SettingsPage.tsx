import React from 'react';
import SettingsForm from '../components/SettingsForm';

const SettingsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 pb-24">
      <div className="max-w-2xl mx-auto">
        <SettingsForm />
      </div>
    </div>
  );
};

export default SettingsPage; 