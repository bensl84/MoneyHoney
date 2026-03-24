import React from 'react';

export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div className="w-8 h-8 border-2 border-honey-400 border-t-transparent rounded-full animate-spin" />
      <span className="text-sm text-gray-400">{message}</span>
    </div>
  );
}
