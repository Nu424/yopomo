import React from 'react';

type TabType = 'timer' | 'record' | 'settings';

interface TabBarProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  action?: React.ReactNode;
}

const TabBar: React.FC<TabBarProps> = ({ currentTab, onTabChange, action }) => {
  return (
    <div className="fixed bottom-0 left-0 w-full z-50 glass border-t border-white/10 md:top-0 md:bottom-auto md:border-t-0 md:border-b">
      <div className="relative flex justify-around items-center h-16 max-w-screen-md mx-auto">
        <button
          onClick={() => onTabChange('timer')}
          className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${
            currentTab === 'timer' ? 'text-white' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <span className="text-xl mb-1">⏱️</span>
          <span className="text-xs font-medium">Timer</span>
        </button>

        <button
          onClick={() => onTabChange('record')}
          className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${
            currentTab === 'record' ? 'text-white' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <span className="text-xl mb-1">📊</span>
          <span className="text-xs font-medium">Record</span>
        </button>

        <button
          onClick={() => onTabChange('settings')}
          className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${
            currentTab === 'settings' ? 'text-white' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <span className="text-xl mb-1">⚙️</span>
          <span className="text-xs font-medium">Settings</span>
        </button>
      </div>

      {/* Action Button for Desktop (placed on the right side of the bar) */}
      {action && (
        <div className="hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 z-50">
          {action}
        </div>
      )}
    </div>
  );
};

export default TabBar;
