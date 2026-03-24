import React from 'react';
import { TABS } from '../shared/constants';

export default function TabBar({ activeTab, onTabChange, paydayDetected }) {
  return (
    <nav className="flex bg-surface-1 border-b border-surface-3">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        const isPulsing = tab.id === 'payday' && paydayDetected && !isActive;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all
              border-b-2 hover:bg-surface-2
              ${isActive
                ? 'border-honey-400 text-honey-400 bg-surface-2'
                : 'border-transparent text-gray-400 hover:text-gray-200'
              }
              ${isPulsing ? 'animate-pulse text-honey-300' : ''}
            `}
          >
            <span className="text-base">{tab.icon}</span>
            <span>{tab.label}</span>
            {isPulsing && (
              <span className="w-2 h-2 rounded-full bg-honey-400 animate-ping" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
