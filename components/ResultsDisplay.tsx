import React, { useState } from 'react';
import { GeneratedKeywordsResponse, KeywordPair } from '../types';

interface ResultsDisplayProps {
  result: GeneratedKeywordsResponse;
  onExitToDashboard: () => void;
  onNext: () => void;
  onBack: () => void;
}

const KeywordCategory: React.FC<{ title: string; keywords: KeywordPair[] }> = ({ title, keywords }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(keywords.map(k => k.en).join(', '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-neutral-800">{title}</h3>
        <button
          onClick={handleCopy}
          className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {copied ? 'Copied!' : 'Copy English'}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {keywords.map((keyword, index) => (
          <div key={index} className="px-3 py-1.5 text-sm bg-gray-100 text-neutral-800 rounded-md text-center">
            <span>{keyword.en}</span>
            <span className="block text-xs text-neutral-500">{keyword.ko}</span>
          </div>
        ))}
      </div>
    </div>
  );
};


const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result, onExitToDashboard, onNext, onBack }) => {
  return (
    <div className="w-full max-w-5xl space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900">Your Keyword Palette</h2>
        <p className="mt-2 text-md text-gray-600">
            This is the result of your initial Goal Setting. Use these keywords in the next step.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <KeywordCategory title="Design Intention / Theme" keywords={result.thematic} />
          <KeywordCategory title="Actional" keywords={result.actional} />
          <KeywordCategory title="Sensory" keywords={result.sensory} />
          <KeywordCategory title="Symbolic" keywords={result.symbolic} />
      </div>
       <div className="flex flex-wrap justify-between items-center gap-4 pt-8 mt-8 border-t">
          <button
            onClick={onBack}
            className="inline-flex justify-center py-3 px-6 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            Back
          </button>
        <div className="flex items-center gap-4">
            <button
                onClick={onExitToDashboard}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
                Back to Dashboard
            </button>
            <button
            onClick={onNext}
            className="inline-flex items-center justify-center py-3 px-6 border border-transparent text-base font-medium rounded-lg text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
            Next: Goal Refinement
            </button>
        </div>
       </div>
    </div>
  );
};

export default ResultsDisplay;