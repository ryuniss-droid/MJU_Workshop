import React from 'react';

interface StepIndicatorProps {
  currentStep: number;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  const steps = [
    'Goal Setting', 
    'Refinement', 
    'Exploration', 
    'Convergence'
  ];
  
  return (
    <div className="w-full max-w-4xl mb-12 px-4">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;

          return (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center text-center w-24">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300
                    ${isCompleted ? 'bg-blue-500 border-blue-500 text-white' : ''}
                    ${isActive ? 'bg-white border-blue-500' : ''}
                    ${!isCompleted && !isActive ? 'bg-white border-gray-300' : ''}
                  `}
                >
                  {isCompleted ? (
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                  ) : (
                    <span className={`h-3 w-3 rounded-full transition-all duration-300 ${isActive ? 'bg-blue-500' : 'bg-gray-300'}`}></span>
                  )}
                </div>
                <p className={`mt-2 text-sm font-medium transition-colors duration-300 ${isActive || isCompleted ? 'text-blue-600' : 'text-gray-500'}`}>
                  {`Step ${stepNumber}`}<br/>{step}
                </p>
              </div>
              
              {index < steps.length - 1 && (
                <div className={`flex-auto h-0.5 transition-colors duration-500 ease-in-out -mt-12
                  ${isCompleted ? 'bg-blue-500' : 'bg-gray-200'}
                `}></div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default StepIndicator;