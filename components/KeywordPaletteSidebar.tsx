import React, { useState } from 'react';
import { GeneratedKeywordsResponse, KeywordPair, RefinedKeyword } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface KeywordPaletteSidebarProps {
  keywords: GeneratedKeywordsResponse;
  refinedKeywords: RefinedKeyword[];
  emergentKeywords: KeywordPair[];
  onAddNewKeyword: (englishKeyword: string) => Promise<void>;
}

const KeywordPaletteSidebar: React.FC<KeywordPaletteSidebarProps> = ({ 
    keywords, 
    refinedKeywords,
    emergentKeywords,
    onAddNewKeyword
}) => {
  const [copiedKeyword, setCopiedKeyword] = useState<string | null>(null);
  const [newKeywordInput, setNewKeywordInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleCopy = (keyword: string) => {
    navigator.clipboard.writeText(keyword);
    setCopiedKeyword(keyword);
    setTimeout(() => {
      setCopiedKeyword(null);
    }, 1500);
  };

  const handleAddKeyword = async () => {
    const trimmedKeyword = newKeywordInput.trim();
    if (trimmedKeyword && !isAdding) {
      setIsAdding(true);
      await onAddNewKeyword(trimmedKeyword);
      setNewKeywordInput('');
      setIsAdding(false);
    }
  };

  const initialCategories = [
    { title: 'Design Intention / Theme', keywords: keywords.thematic },
    { title: 'Actional', keywords: keywords.actional },
    { title: 'Sensory', keywords: keywords.sensory },
    { title: 'Symbolic', keywords: keywords.symbolic },
  ];

  const coreRefinedKeywords = refinedKeywords.filter(k => k.label === 'Core');
  const referenceRefinedKeywords = refinedKeywords.filter(k => k.label === 'Reference');

  const refinedCategories = [
      { title: 'Refined: Core', keywords: coreRefinedKeywords },
      { title: 'Refined: Reference', keywords: referenceRefinedKeywords }
  ].filter(cat => cat.keywords && cat.keywords.length > 0);
  
  const evolvingCategory = { title: 'Evolving Keywords', keywords: emergentKeywords };

  const KeywordList: React.FC<{keywords: (KeywordPair | RefinedKeyword)[]}> = ({ keywords }) => (
     <div className="flex flex-wrap gap-2">
        {keywords.map((keyword, index) => (
            <button
            key={`${keyword.en}-${index}`}
            onClick={() => handleCopy(keyword.en)}
            className="relative px-3 py-1.5 text-sm bg-gray-100 text-neutral-700 rounded-md hover:bg-blue-100 hover:text-blue-700 transition-colors cursor-pointer text-center"
            title={`Click to copy "${keyword.en}"`}
            >
            <span>{keyword.en}</span>
            {'score' in keyword && keyword.score && (
                <span className="absolute -top-1.5 -right-1.5 text-xs bg-yellow-400 text-yellow-900 rounded-full h-4 w-4 flex items-center justify-center font-bold">{keyword.score}</span>
            )}
            <span className="block text-xs text-neutral-500">{keyword.ko}</span>
            {copiedKeyword === keyword.en && (
                <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-xs bg-gray-800 text-white px-2 py-0.5 rounded-md">
                Copied!
                </span>
            )}
            </button>
        ))}
    </div>
  );

  return (
    <aside className="w-80 h-screen sticky top-0 bg-white border-r border-gray-200 p-6 flex-shrink-0 overflow-y-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Keyword Palette</h2>
      <p className="text-sm text-gray-600 mb-6">Click a keyword to copy it.</p>
      
      <div className="space-y-6">
        {/* Add New Keyword Section */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
           <h3 className="text-lg font-semibold text-neutral-800 mb-2">Add Evolving Keyword</h3>
           <div className="flex gap-2">
             <input
                type="text"
                value={newKeywordInput}
                onChange={(e) => setNewKeywordInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                placeholder="New English keyword..."
                className="block w-full text-sm border-gray-300 rounded-md shadow-sm"
                disabled={isAdding}
             />
             <button
                onClick={handleAddKeyword}
                disabled={isAdding || !newKeywordInput.trim()}
                className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 disabled:bg-gray-400 flex items-center justify-center"
              >
                {isAdding ? <LoadingSpinner className="w-4 h-4" /> : 'Add'}
              </button>
           </div>
        </div>

        {/* Evolving Keywords Display */}
        {evolvingCategory.keywords.length > 0 && (
             <div>
                <h3 className="text-lg font-semibold text-neutral-800 mb-3">{evolvingCategory.title}</h3>
                <KeywordList keywords={evolvingCategory.keywords} />
            </div>
        )}
        
        <hr />
        
        {/* Refined Keywords */}
        {refinedCategories.length > 0 && (
            refinedCategories.map(category => (
                <div key={category.title}>
                    <h3 className="text-lg font-semibold text-neutral-800 mb-3">{category.title}</h3>
                    <KeywordList keywords={category.keywords} />
                </div>
            ))
        )}
         {refinedCategories.length > 0 && <hr />}


        {/* Initial Categories */}
        {initialCategories.map(category => (
          <div key={category.title}>
            <h3 className="text-lg font-semibold text-neutral-800 mb-3">{category.title}</h3>
            <KeywordList keywords={category.keywords} />
          </div>
        ))}
      </div>
    </aside>
  );
};

export default KeywordPaletteSidebar;