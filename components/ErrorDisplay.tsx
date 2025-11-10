import React from 'react';

interface ErrorDisplayProps {
  error: string;
  onReset: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onReset }) => {
  if (!error) return null;

  return (
    <div className="bg-red-50 p-6 rounded-lg border border-red-300 w-full max-w-3xl text-center">
      <h3 className="text-lg font-semibold text-red-800">An Error Occurred</h3>
      <p className="mt-2 text-sm text-red-700">{error}</p>
      <button
        onClick={onReset}
        className="mt-4 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
      >
        Start Over
      </button>
    </div>
  );
};

export default ErrorDisplay;
