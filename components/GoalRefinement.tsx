import React, { useState, useMemo } from 'react';
import { Project, ReferenceAnalysisItem, KeywordPair, RefinedKeyword } from '../types';
import { RefinementData } from './ProjectWorkspace';
import { generateImageDescriptions, extractAndCategorizeKeywordsFromText, translateKeywords } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import SparklesIcon from './icons/SparklesIcon';
import { DOMAIN_OPTIONS } from '../constants';

interface GoalRefinementProps {
    project: Project;
    onBack: () => void;
    onSubmit: (data: RefinementData) => void;
}

const ReferenceItemCard: React.FC<{
    item: ReferenceAnalysisItem;
    onUpdate: (id: string, field: keyof ReferenceAnalysisItem, value: any) => void;
    onRemove: (id: string) => void;
    onGenerateDescription: (id: string) => void;
    onExtractKeywords: (id: string) => void;
}> = ({ item, onUpdate, onRemove, onGenerateDescription, onExtractKeywords }) => {
    const [isDraggingOver, setIsDraggingOver] = useState(false);

    const processFile = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = (reader.result as string).split(',')[1];
            onUpdate(item.id, 'imageBase64', base64String);
            onUpdate(item.id, 'imageMimeType', file.type);
        };
        reader.readAsDataURL(file);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            processFile(file);
        }
    };
    
    const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            processFile(file);
        }
    };
  
    const handleDragEvents = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDraggingOver(true);
        } else if (e.type === 'dragleave') {
            setIsDraggingOver(false);
        }
    };

    const handleDescriptionChange = (index: number, value: string) => {
        const newDescriptions = [...item.descriptions];
        newDescriptions[index] = value;
        onUpdate(item.id, 'descriptions', newDescriptions);
    };
    
    const hasDescriptions = item.descriptions.some(d => d && d.trim() !== '');

    return (
        <div className="bg-white p-4 rounded-lg border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4 relative">
             <button onClick={() => onRemove(item.id)} className="absolute -top-2 -right-2 bg-white rounded-full p-1 text-gray-400 hover:text-gray-600 border z-10"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg></button>
            <div className="space-y-2">
                 <label 
                    onDrop={handleDrop}
                    onDragEnter={handleDragEvents}
                    onDragOver={handleDragEvents}
                    onDragLeave={handleDragEvents}
                    className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                        isDraggingOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                    }`}
                >
                    {item.imageBase64 ? (
                         <img src={`data:${item.imageMimeType};base64,${item.imageBase64}`} alt="Reference" className="w-full h-full object-contain rounded-lg"/>
                    ) : (
                         <div className="flex flex-col items-center justify-center text-center p-2">
                            <svg className="w-8 h-8 mb-2 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/></svg>
                            <p className="text-xs text-gray-500">Upload Image</p>
                        </div>
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
                <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => onGenerateDescription(item.id)} disabled={!item.imageBase64 || item.isGeneratingDescription} className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 border border-transparent text-sm font-medium rounded-md text-white bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400">
                        {item.isGeneratingDescription ? <LoadingSpinner className="w-5 h-5"/> : <SparklesIcon className="w-5 h-5" />}
                        Generate
                    </button>
                     <button type="button" onClick={() => onExtractKeywords(item.id)} disabled={!hasDescriptions || item.isExtractingKeywords} className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 border border-transparent text-sm font-medium rounded-md text-green-500 hover:bg-green-600 disabled:bg-gray-400">
                        {item.isExtractingKeywords ? <LoadingSpinner className="w-5 h-5"/> : <SparklesIcon className="w-5 h-5" />}
                        Extract
                    </button>
                </div>
            </div>
            <div className="md:col-span-2 space-y-2">
                 <div>
                    <label className="text-sm font-medium text-neutral-700">Source Descriptions</label>
                    <p className="text-xs text-neutral-500 mb-1">Use 'Generate' to create descriptions from the image, or paste your own below.</p>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {Array.from({ length: 4 }).map((_, index) => (
                        <textarea
                          key={index}
                          value={item.descriptions[index] || ''}
                          onChange={e => handleDescriptionChange(index, e.target.value)}
                          rows={5}
                          className="block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          placeholder={`Paste or write description #${index + 1}...`}
                        ></textarea>
                      ))}
                    </div>
                 </div>
            </div>
        </div>
    );
}

const GoalRefinement: React.FC<GoalRefinementProps> = ({ project, onBack, onSubmit }) => {
    const [referenceItems, setReferenceItems] = useState<ReferenceAnalysisItem[]>([]);
    const [refinedKeywords, setRefinedKeywords] = useState<RefinedKeyword[]>(project.refinedKeywords || []);
    const [manualKeywordInput, setManualKeywordInput] = useState('');
    const [isAddingManual, setIsAddingManual] = useState(false);
    
    const [isContextVisible, setIsContextVisible] = useState(false);
    const [isPaletteVisible, setIsPaletteVisible] = useState(true);

    const [keywordSources, setKeywordSources] = useState<{ [key: string]: KeywordPair[] }>({
        ...(project.keywords!),
        imageAbstract: [],
        imageConcrete: [],
    });
    
    const selectedDomainValue = useMemo(() => {
        const option = DOMAIN_OPTIONS.find(opt => opt.value === project.userInput.domain);
        return option ? option.value : '';
    }, [project.userInput.domain]);

    const [subjectKeyword, setSubjectKeyword] = useState(selectedDomainValue);

    const addReferenceItem = () => {
        const newItem: ReferenceAnalysisItem = {
            id: `ref-${Date.now()}`,
            descriptions: Array(4).fill(''),
        };
        setReferenceItems(prev => [...prev, newItem]);
    };
    
    const updateReferenceItem = (id: string, field: keyof ReferenceAnalysisItem, value: any) => {
        setReferenceItems(prev => prev.map(item => item.id === id ? {...item, [field]: value} : item));
    }
    
    const removeReferenceItem = (id: string) => {
        setReferenceItems(prev => prev.filter(item => item.id !== id));
    }

    const handleGenerateDescription = async (itemId: string) => {
        const item = referenceItems.find(i => i.id === itemId);
        if (!item || !item.imageBase64 || !item.imageMimeType) return;

        updateReferenceItem(itemId, 'isGeneratingDescription', true);
        const descriptions = await generateImageDescriptions(item.imageBase64, item.imageMimeType);
        updateReferenceItem(itemId, 'descriptions', descriptions);
        updateReferenceItem(itemId, 'isGeneratingDescription', false);
    }

    const handleExtractKeywordsFromImage = async (itemId: string) => {
        const item = referenceItems.find(i => i.id === itemId);
        if (!item || !item.descriptions.some(d => d.trim())) return;
        
        updateReferenceItem(itemId, 'isExtractingKeywords', true);
        const allDescriptions = item.descriptions.join(' ');
        const { abstract, concrete } = await extractAndCategorizeKeywordsFromText(allDescriptions);
        
        setKeywordSources(prevSources => {
            const existingAbstract = new Set((prevSources.imageAbstract || []).map(kw => kw.en.toLowerCase()));
            const newAbstract = abstract.filter(kw => !existingAbstract.has(kw.en.toLowerCase()));

            const existingConcrete = new Set((prevSources.imageConcrete || []).map(kw => kw.en.toLowerCase()));
            const newConcrete = concrete.filter(kw => !existingConcrete.has(kw.en.toLowerCase()));

            return {
                ...prevSources,
                imageAbstract: [...(prevSources.imageAbstract || []), ...newAbstract],
                imageConcrete: [...(prevSources.imageConcrete || []), ...newConcrete]
            };
        });

        updateReferenceItem(itemId, 'isExtractingKeywords', false);
    };

    const addKeywordsToBoard = (keywords: KeywordPair[]) => {
        const newRefinedKeywords: RefinedKeyword[] = keywords
            .filter(kw => !refinedKeywords.some(rk => rk.en.toLowerCase() === kw.en.toLowerCase()))
            .map(kw => ({
                ...kw,
                id: `refined-${kw.en}-${Date.now()}`,
                label: 'Reference'
            }));
        setRefinedKeywords(prev => [...prev, ...newRefinedKeywords]);
    };
    
    const handleAddManualKeyword = async () => {
        const trimmed = manualKeywordInput.trim();
        if (!trimmed) return;
        setIsAddingManual(true);
        const translated = await translateKeywords([trimmed]);
        addKeywordsToBoard(translated);
        setManualKeywordInput('');
        setIsAddingManual(false);
    };

    const updateRefinedKeyword = (id: string, update: Partial<RefinedKeyword>) => {
        setRefinedKeywords(prev => prev.map(kw => kw.id === id ? { ...kw, ...update } : kw));
    };

    const removeRefinedKeyword = (id: string) => {
        setRefinedKeywords(prev => prev.filter(kw => kw.id !== id));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const submissionData: RefinementData = {
            subject: subjectKeyword,
            refinedKeywords,
        };
        onSubmit(submissionData);
    };
    
    const missionStatementContent = Object.entries(project.userInput.missionStatement)
        .filter(([, value]) => value)
        .map(([key, value]) => {
            const labels: Record<string, string> = {
                companyOrProject: 'Company / Project',
                vision: 'Vision (Why)',
                challenge: 'Challenge (What)',
                approach: 'Approach (How)',
                valueProposition: 'Value Proposition (Impact)',
            };
            return (
                <div key={key}>
                    <p className="text-xs font-semibold text-gray-600">{labels[key]}</p>
                    <p className="text-sm text-gray-800">{value}</p>
                </div>
            );
        });
        
    const coreKeywords = useMemo(() => 
        refinedKeywords
            .filter(kw => kw.label === 'Core')
            .sort((a, b) => (b.score || 0) - (a.score || 0))
            .map(kw => kw.en),
        [refinedKeywords]
    );

    return (
        <div className="flex-grow w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="text-left">
                    <h2 className="text-3xl font-bold text-gray-900">Goal Refinement</h2>
                    <p className="mt-2 text-md text-gray-600">
                       Synthesize keywords from multiple sources to create a powerful initial prompt.
                    </p>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-10">
                    {/* Step 1: Gather */}
                    <div>
                        <h3 className="text-xl font-semibold text-neutral-800 mb-1">1. Gather Keywords from Sources</h3>
                        <p className="text-sm text-gray-500 mb-4">Click keywords from the AI Palette or extract them from reference images. They will be added to the Curation Board below.</p>
                        
                        <div className="space-y-4">
                            {/* Image Source */}
                            <div className="space-y-4 mb-4">
                                {referenceItems.map(item => (
                                    <ReferenceItemCard key={item.id} item={item} onUpdate={updateReferenceItem} onRemove={removeReferenceItem} onGenerateDescription={handleGenerateDescription} onExtractKeywords={handleExtractKeywordsFromImage} />
                                ))}
                            </div>
                            <button type="button" onClick={addReferenceItem} className="w-full text-center py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-700 font-medium hover:bg-gray-100 transition-colors">
                                + Add Reference Image
                            </button>

                            {/* Palette Source */}
                            <div className="border rounded-lg">
                                <button type="button" onClick={() => setIsPaletteVisible(!isPaletteVisible)} className="w-full flex justify-between items-center p-4 text-left font-medium text-gray-700 hover:bg-gray-50">
                                    <span>Initial AI Keyword Palette</span>
                                    <svg className={`w-5 h-5 transform transition-transform ${isPaletteVisible ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                </button>
                                {isPaletteVisible && (
                                    <div className="p-4 border-t bg-gray-50/50 space-y-4">
                                        {/* FIX: Explicitly type the arguments from `Object.entries` to ensure `keywords` is correctly typed as `KeywordPair[]`. */}
                                        {Object.entries(keywordSources).map(([category, keywords]: [string, KeywordPair[]]) => {
                                            if (keywords.length === 0) return null;

                                            const categoryTitles: { [key: string]: string } = {
                                                thematic: 'Design Intention / Theme',
                                                actional: 'Actional',
                                                sensory: 'Sensory',
                                                symbolic: 'Symbolic',
                                                imageAbstract: 'From Image: Abstract (추상)',
                                                imageConcrete: 'From Image: Concrete (구상)',
                                            };
                                            const title = categoryTitles[category] || category;

                                            return (
                                                <div key={category}>
                                                    <h5 className="font-semibold text-neutral-700 mb-2">{title}</h5>
                                                    <div className="flex flex-wrap gap-1">
                                                        {keywords.map((kw, idx) => (
                                                            <button type="button" key={`${kw.en}-${idx}`} onClick={() => addKeywordsToBoard([kw])} className="px-2.5 py-1.5 text-sm bg-white border rounded-md hover:bg-blue-100 hover:border-blue-300 text-center">
                                                                <span>{kw.en}</span>
                                                                <span className="block text-xs text-neutral-500">{kw.ko}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {/* Step 2: Curate */}
                    <div>
                        <h3 className="text-xl font-semibold text-neutral-800">2. Curate & Prioritize Keywords</h3>
                         <p className="text-sm text-gray-500 mb-2">
                            Add keywords manually, then assign a score (1-3) and a label ('Core'/'Reference') to organize your prompt.
                        </p>
                        <div className="flex gap-2 mb-4">
                            <input
                                type="text"
                                value={manualKeywordInput}
                                onChange={e => setManualKeywordInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddManualKeyword())}
                                placeholder="Add manual keyword in English..."
                                className="flex-grow shadow-sm sm:text-sm border-gray-300 rounded-md"
                            />
                            <button type="button" onClick={handleAddManualKeyword} disabled={isAddingManual} className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400">
                                 {isAddingManual ? <LoadingSpinner className="w-5 h-5"/> : 'Add'}
                            </button>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg border min-h-[150px]">
                            {refinedKeywords.length > 0 ? (
                                <div className="flex flex-wrap gap-3">
                                    {refinedKeywords.map(kw => (
                                        <div key={kw.id} className="bg-white p-2 rounded-lg border shadow-sm flex flex-col gap-2 w-48">
                                            <div className="flex justify-between items-start">
                                                <div className="text-left">
                                                    <p className="font-semibold text-gray-800">{kw.en}</p>
                                                    <p className="text-xs text-gray-500">{kw.ko}</p>
                                                </div>
                                                <button type="button" onClick={() => removeRefinedKeyword(kw.id)} className="text-gray-400 hover:text-gray-600">&times;</button>
                                            </div>
                                            <div className="flex items-center justify-between gap-1 text-xs">
                                                <div className="flex gap-1">
                                                    {[1, 2, 3].map(score => (
                                                        <button type="button" key={score} onClick={() => updateRefinedKeyword(kw.id, { score: kw.score === score ? undefined : score as any })} className={`w-5 h-5 rounded-full border flex items-center justify-center font-semibold ${kw.score === score ? 'bg-yellow-400 text-yellow-900 border-yellow-500' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>{score}</button>
                                                    ))}
                                                </div>
                                                 <div className="flex border rounded-md overflow-hidden">
                                                    <button type="button" onClick={() => updateRefinedKeyword(kw.id, { label: 'Core' })} className={`px-2 py-0.5 ${kw.label === 'Core' ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-100 text-gray-600'}`}>Core</button>
                                                    <button type="button" onClick={() => updateRefinedKeyword(kw.id, { label: 'Reference' })} className={`px-2 py-0.5 ${kw.label === 'Reference' ? 'bg-gray-600 text-white' : 'bg-white hover:bg-gray-100 text-gray-600'}`}>Ref</button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-gray-500 py-8">Your curated keywords will appear here.</p>
                            )}
                        </div>
                    </div>

                    {/* Step 3: Define Subject */}
                    <div>
                        <h3 className="text-xl font-semibold text-neutral-800">3. Define Core Subject</h3>
                         <p className="text-sm text-gray-500 mb-4">
                            Confirm or edit the primary subject for your design. This is the central noun of your prompt.
                        </p>
                        <div>
                            <label htmlFor="subjectKeyword" className="block text-sm font-medium text-neutral-700">Core Subject Keyword</label>
                            <input
                                id="subjectKeyword"
                                type="text"
                                value={subjectKeyword}
                                onChange={e => setSubjectKeyword(e.target.value)}
                                className="mt-1 block w-full max-w-md shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                             <p className="mt-1 text-xs text-neutral-500">Pre-filled from the 'Domain' you selected in Step 1.</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200 sticky bottom-4 z-20 shadow-lg">
                    <h3 className="text-xl font-semibold text-neutral-800 mb-2">4. Initial Prompt Composer</h3>
                     <p className="text-sm text-gray-500 mb-4">
                        Your prompt will be automatically created from your 'Core' subject and keywords.
                    </p>
                    
                    <div className="border rounded-lg mb-4">
                        <button type="button" onClick={() => setIsContextVisible(!isContextVisible)} className="w-full flex justify-between items-center p-4 text-left font-medium text-gray-700 hover:bg-gray-50">
                            <span>Review Project Context</span>
                            <svg className={`w-5 h-5 transform transition-transform ${isContextVisible ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                        </button>
                        {isContextVisible && (
                            <div className="p-4 border-t bg-gray-50/50 space-y-3">
                                <div>
                                <p className="text-xs font-semibold text-gray-600">Domain</p>
                                <p className="text-sm text-gray-800">{selectedDomainValue}</p>
                                </div>
                                {missionStatementContent}
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                         <h4 className="font-medium mb-2">Prompt Preview:</h4>
                        <div className="flex flex-wrap gap-x-2 gap-y-1 items-center">
                            <span className="px-3 py-1 text-sm rounded-full bg-indigo-200 text-indigo-800 font-semibold">{subjectKeyword || "[Subject]"}</span>
                            {coreKeywords.length > 0 && <span className="text-gray-400">,</span>}
                            {coreKeywords.map((k, i) => (
                               <React.Fragment key={k}>
                                  <span className="px-3 py-1 text-sm rounded-full bg-blue-200 text-blue-800">
                                      {k}
                                  </span>
                                  {i < coreKeywords.length - 1 && <span className="text-gray-400">,</span>}
                               </React.Fragment>
                            ))}
                            {coreKeywords.length === 0 && (
                                <p className="text-sm text-gray-500 ml-2">Label keywords as 'Core' to add them here.</p>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="flex justify-between pt-4">
                    <button type="button" onClick={onBack} className="inline-flex justify-center py-3 px-6 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50">
                        Back
                    </button>
                    <button type="submit" disabled={coreKeywords.length === 0 || subjectKeyword.trim() === ''} className="inline-flex justify-center py-3 px-6 border border-transparent text-base font-medium rounded-lg text-white bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400">
                        Next: Form Exploration
                    </button>
                </div>
            </form>
        </div>
    )
}

export default GoalRefinement;