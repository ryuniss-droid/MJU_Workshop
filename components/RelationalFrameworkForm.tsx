import React, { useState, useMemo } from 'react';
import { RELATIONSHIP_AXES, TEMPORALITY_OPTIONS, SPATIAL_SCOPE_OPTIONS } from '../constants';
import { RelationalFrameworkInput } from '../types';

interface RelationalFrameworkFormProps {
  onSubmit: (framework: RelationalFrameworkInput) => void;
  onBack: () => void;
}

const RelationalFrameworkForm: React.FC<RelationalFrameworkFormProps> = ({ onSubmit, onBack }) => {
  const [formState, setFormState] = useState<RelationalFrameworkInput>({
    relationshipAxes: [RELATIONSHIP_AXES[0].name],
    selectedSubCategories: [],
    temporality: [TEMPORALITY_OPTIONS[0]],
    spatialScope: [SPATIAL_SCOPE_OPTIONS[0]],
  });

  const handleAxisChange = (axisName: string) => {
    setFormState(prev => {
      const isCurrentlySelected = prev.relationshipAxes.includes(axisName);
      const newAxes = isCurrentlySelected
        ? prev.relationshipAxes.filter(a => a !== axisName)
        : [...prev.relationshipAxes, axisName];
      
      let newSubCategories = prev.selectedSubCategories;
      if (isCurrentlySelected) {
        const subCategoriesOfDeselectedAxis = RELATIONSHIP_AXES.find(axis => axis.name === axisName)?.subCategories.map(sub => sub.name) || [];
        newSubCategories = newSubCategories.filter(sc => !subCategoriesOfDeselectedAxis.includes(sc));
      }

      return {
        ...prev,
        relationshipAxes: newAxes,
        selectedSubCategories: newSubCategories,
      };
    });
  };

  const handleSubCategoryChange = (subCategoryName: string) => {
    setFormState(prev => {
      const newSubCategories = prev.selectedSubCategories.includes(subCategoryName)
        ? prev.selectedSubCategories.filter(sc => sc !== subCategoryName)
        : [...prev.selectedSubCategories, subCategoryName];
      return { ...prev, selectedSubCategories: newSubCategories };
    });
  };
  
  const handleMultiSelectChange = (field: 'temporality' | 'spatialScope', value: string) => {
    setFormState(prev => {
      const currentValues = prev[field];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      return { ...prev, [field]: newValues };
    });
  };

  const isFormValid = useMemo(() => {
    return formState.relationshipAxes.length > 0 && 
           formState.selectedSubCategories.length > 0 &&
           formState.temporality.length > 0 &&
           formState.spatialScope.length > 0;
  }, [formState]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid) {
      onSubmit(formState);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 w-full max-w-4xl">
      <div className="text-left">
        <h2 className="text-2xl font-bold text-gray-900">Select a Relational Framework</h2>
        <p className="mt-2 text-md text-gray-600">
          Guide the AI by selecting the core principles of your design's intended experience.
        </p>
      </div>

      <div className="space-y-6 bg-white p-6 sm:p-8 rounded-lg border border-gray-200">
        <div>
          <label className="block text-lg font-medium text-neutral-800">1. Core Relationship Axis</label>
          <p className="text-sm text-neutral-500 mb-3">What are the primary ways your design relates to people? (Select one or more)</p>
          <div className="flex flex-wrap gap-3">
            {RELATIONSHIP_AXES.map((axis) => (
              <button
                type="button"
                key={axis.name}
                onClick={() => handleAxisChange(axis.name)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  formState.relationshipAxes.includes(axis.name)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {axis.name}
              </button>
            ))}
          </div>
        </div>

        <div>
           <label className="block text-base font-medium text-neutral-800">Select Sub-Categories of Focus</label>
           <p className="text-sm text-neutral-500 mb-4">Choose one or more specific areas to explore from your selected axes.</p>
           <div className="space-y-6">
                {RELATIONSHIP_AXES
                    .filter(axis => formState.relationshipAxes.includes(axis.name))
                    .map((axis) => (
                    <div key={axis.name}>
                        <h4 className="font-semibold text-neutral-700 mb-3 border-b pb-2">{axis.name}</h4>
                        <div className="space-y-3">
                            {axis.subCategories.map((sub) => (
                                <label key={sub.name} className="flex items-start p-4 rounded-lg border border-gray-200 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formState.selectedSubCategories.includes(sub.name)}
                                        onChange={() => handleSubCategoryChange(sub.name)}
                                        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1"
                                    />
                                    <div className="ml-4">
                                        <p className="font-semibold text-neutral-800">{sub.name}</p>
                                        <p className="text-sm text-neutral-600">{sub.description}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
                {formState.relationshipAxes.length === 0 && (
                     <p className="text-sm text-neutral-500">Please select a Core Relationship Axis above to see its sub-categories.</p>
                )}
           </div>
           {formState.relationshipAxes.length > 0 && formState.selectedSubCategories.length === 0 && <p className="mt-2 text-sm text-red-600">Please select at least one sub-category.</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 pt-4">
            <div>
                 <label className="block text-lg font-medium text-neutral-800">2. Temporality</label>
                 <p className="text-sm text-neutral-500 mb-3">When does this relationship occur? (Select one or more)</p>
                 <div className="flex flex-wrap gap-2">
                    {TEMPORALITY_OPTIONS.map(opt => (
                        <label key={opt} className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formState.temporality.includes(opt)}
                                onChange={() => handleMultiSelectChange('temporality', opt)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-neutral-700">{opt}</span>
                        </label>
                    ))}
                 </div>
                 {formState.temporality.length === 0 && <p className="mt-2 text-sm text-red-600">Please select at least one temporal focus.</p>}
            </div>
            <div>
                <label className="block text-lg font-medium text-neutral-800">3. Spatial Scope</label>
                <p className="text-sm text-neutral-500 mb-3">What is the physical scale of this relationship? (Select one or more)</p>
                 <div className="flex flex-wrap gap-2">
                    {SPATIAL_SCOPE_OPTIONS.map(opt => (
                         <label key={opt} className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formState.spatialScope.includes(opt)}
                                onChange={() => handleMultiSelectChange('spatialScope', opt)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-neutral-700">{opt}</span>
                        </label>
                    ))}
                </div>
                 {formState.spatialScope.length === 0 && <p className="mt-2 text-sm text-red-600">Please select at least one spatial scope.</p>}
            </div>
        </div>

      </div>

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex justify-center py-3 px-6 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={!isFormValid}
          className="inline-flex justify-center py-3 px-6 border border-transparent text-base font-medium rounded-lg text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
        >
          Generate Keyword Palette
        </button>
      </div>
    </form>
  );
};

export default RelationalFrameworkForm;