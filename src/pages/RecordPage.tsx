import React from 'react';
import RecordList from '../components/RecordList';

const RecordPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 pb-24">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">作業記録</h1>
        <RecordList />
      </div>
    </div>
  );
};

export default RecordPage; 