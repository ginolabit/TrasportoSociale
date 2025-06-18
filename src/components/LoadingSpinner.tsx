import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  darkMode: boolean;
  message?: string;
}

export default function LoadingSpinner({ darkMode, message = 'Caricamento...' }: LoadingSpinnerProps) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Loader2 className={`h-8 w-8 animate-spin mx-auto mb-4 ${
          darkMode ? 'text-white' : 'text-gray-900'
        }`} />
        <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {message}
        </p>
      </div>
    </div>
  );
}