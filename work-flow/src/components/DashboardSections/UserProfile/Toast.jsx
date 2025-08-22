import React from 'react';
import { CheckCircle } from 'lucide-react';

const Toast = ({ show, message }) => {
  return (
    <div className={`fixed top-4 right-4 z-50 transform transition-all duration-300 ${
      show ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0 pointer-events-none'
    }`}>
      <div className="px-6 py-4 bg-green-500 text-white rounded-lg shadow-lg flex items-center space-x-3">
        <CheckCircle className="w-5 h-5" />
        <span className="font-medium">{message}</span>
      </div>
    </div>
  );
};

export default React.memo(Toast);