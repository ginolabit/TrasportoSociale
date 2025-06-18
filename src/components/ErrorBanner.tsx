import React from 'react';
import { AlertCircle, X, AlertTriangle } from 'lucide-react';

interface ErrorBannerProps {
  message: string;
  onClose?: () => void;
  type?: 'error' | 'warning';
  darkMode: boolean;
}

export default function ErrorBanner({ 
  message, 
  onClose, 
  type = 'error', 
  darkMode 
}: ErrorBannerProps) {
  const isError = type === 'error';
  const Icon = isError ? AlertCircle : AlertTriangle;
  
  const bgColor = isError 
    ? (darkMode ? 'bg-red-900/50' : 'bg-red-50')
    : (darkMode ? 'bg-yellow-900/50' : 'bg-yellow-50');
    
  const borderColor = isError 
    ? (darkMode ? 'border-red-700' : 'border-red-200')
    : (darkMode ? 'border-yellow-700' : 'border-yellow-200');
    
  const textColor = isError 
    ? (darkMode ? 'text-red-200' : 'text-red-800')
    : (darkMode ? 'text-yellow-200' : 'text-yellow-800');
    
  const iconColor = isError 
    ? (darkMode ? 'text-red-400' : 'text-red-500')
    : (darkMode ? 'text-yellow-400' : 'text-yellow-500');

  return (
    <div className={`${bgColor} border ${borderColor} p-4 mb-4 mx-6 mt-6 rounded-lg`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Icon className={`h-5 w-5 ${iconColor} mr-3 flex-shrink-0`} />
          <p className={`text-sm font-medium ${textColor}`}>
            {message}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`${textColor} hover:opacity-75 transition-opacity`}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}