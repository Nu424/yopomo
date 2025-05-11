import React from 'react';
import { NavLink } from 'react-router-dom';

const TabBar: React.FC = () => {
  return (
    <nav className="fixed bottom-0 w-full flex justify-around bg-gray-800 text-white border-t border-gray-700">
      <NavLink 
        to="/" 
        className={({ isActive }: { isActive: boolean }) => 
          `flex-1 py-3 text-center ${isActive ? 'bg-gray-700 text-white' : 'text-gray-400'}`
        }
        end
      >
        タイマー
      </NavLink>
      <NavLink 
        to="/record" 
        className={({ isActive }: { isActive: boolean }) => 
          `flex-1 py-3 text-center ${isActive ? 'bg-gray-700 text-white' : 'text-gray-400'}`
        }
      >
        記録
      </NavLink>
      <NavLink 
        to="/settings" 
        className={({ isActive }: { isActive: boolean }) => 
          `flex-1 py-3 text-center ${isActive ? 'bg-gray-700 text-white' : 'text-gray-400'}`
        }
      >
        設定
      </NavLink>
    </nav>
  );
};

export default TabBar; 