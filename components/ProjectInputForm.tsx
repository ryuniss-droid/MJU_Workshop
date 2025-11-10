import React, { useState } from 'react';
import { UserInput, MissionStatement } from '../types';
import { DOMAIN_OPTIONS } from '../constants';

interface ProjectInputFormProps {
  onSubmit: (data: UserInput) => void;
  initialData: UserInput;
}

const ProjectInputForm: React.FC<ProjectInputFormProps> = ({ onSubmit, initialData }) => {
  const [userInput, setUserInput] = useState<UserInput>(initialData);
  const [isMissionOpen, setIsMissionOpen] = useState(!!Object.values(initialData.missionStatement || {}).some(Boolean));

  const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUserInput(prev => ({ ...prev, [name]: value }));
  };
  
  const handleMissionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUserInput(prev => ({
        ...prev,
        missionStatement: {
            ...prev.missionStatement,
            [name]: value,
        },
    }));
  };

  const isFormValid = () => {
     const hasMissionStatement = Object.values(userInput.missionStatement || {}).some(val => typeof val === 'string' && val.trim() !== '');
     return hasMissionStatement;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid()) {
        onSubmit(userInput);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-3xl">
       <div className="bg-white p-6 sm:p-8 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label htmlFor="domain" className="block text-sm font-medium text-neutral-700">Domain</label>
              <select id="domain" name="domain" value={userInput.domain} onChange={handleInputChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                {DOMAIN_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              <p className="mt-1 text-xs text-neutral-500">Source: World Design Organization (WDO)</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200">
            <button type="button" onClick={() => setIsMissionOpen(!isMissionOpen)} className="w-full flex justify-between items-center p-6 text-left">
                <h3 className="text-lg font-medium text-neutral-900">Mission Statement</h3>
                <svg className={`w-5 h-5 text-neutral-500 transform transition-transform ${isMissionOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </button>
            {isMissionOpen && (
                <div className="p-6 pt-0 space-y-4">
                    {Object.keys(initialData.missionStatement || {}).map((key) => {
                        const labels: Record<keyof MissionStatement, string> = {
                            companyOrProject: 'Company / Project',
                            vision: 'Vision (Why)',
                            challenge: 'Challenge (What)',
                            approach: 'Approach (How)',
                            valueProposition: 'Value Proposition (Impact)',
                        };
                        return (
                            <div key={key}>
                                <label htmlFor={key} className="block text-sm font-medium text-neutral-700">{labels[key as keyof MissionStatement]}</label>
                                <textarea name={key} id={key} value={userInput.missionStatement?.[key as keyof MissionStatement] || ''} onChange={handleMissionChange} rows={2} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                        );
                    })}
                </div>
            )}
             <p className="px-6 pb-4 text-sm text-red-600">{!isFormValid() ? 'Please fill out at least one field in the Mission Statement to continue.' : ''}</p>
        </div>

        <div className="flex justify-end pt-2">
            <button type="submit" disabled={!isFormValid()} className="inline-flex justify-center py-3 px-6 border border-transparent text-base font-medium rounded-lg text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200">
                Next: Select Framework
            </button>
        </div>
    </form>
  );
};

export default ProjectInputForm;