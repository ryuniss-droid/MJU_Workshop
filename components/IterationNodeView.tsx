import React, { useState, useRef, useEffect, useCallback } from 'react';
import { IterationNode, ImageReference, StyleReference, ResultImage, PromptDiff } from '../types';
import CopyIcon from './icons/CopyIcon';
import StarIcon from './icons/StarIcon';

interface IterationNodeViewProps {
  node: IterationNode;
  allNodes: IterationNode[];
  updateNode: (updatedNode: IterationNode) => void;
  addChildNode: (parentNode: IterationNode, action: string, sourceImageId?: string) => void;
}

const PER_IMAGE_ACTION_TYPES = ['Vary (Subtle)', 'Vary (Strong)', 'Remix'];
const GLOBAL_ACTION_TYPES = ['Vary All (Subtle)', 'Vary All (Strong)', 'Remix All', 'Prompt Edit'];

const ImageActionMenu: React.FC<{ onAction: (action: string) => void }> = ({ onAction }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={menuRef} className="absolute top-1 right-1 z-10">
      <button onClick={() => setIsOpen(!isOpen)} className="p-1.5 bg-black bg-opacity-40 rounded-full text-white hover:bg-opacity-60">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>
      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-36 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
          <div className="py-1">
            {PER_IMAGE_ACTION_TYPES.map(action => (
              <button key={action} onClick={() => { onAction(action); setIsOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">{action}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const PromptComposer: React.FC<{
    keywords: string[];
    onKeywordsChange: (keywords: string[]) => void;
}> = ({ keywords, onKeywordsChange }) => {
    const [newKeyword, setNewKeyword] = useState('');
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        dragItem.current = index;
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        dragOverItem.current = index;
    };

    const handleDragEnd = () => {
        if (dragItem.current !== null && dragOverItem.current !== null) {
            const newKeywords = [...keywords];
            const draggedItemContent = newKeywords.splice(dragItem.current, 1)[0];
            newKeywords.splice(dragOverItem.current, 0, draggedItemContent);
            onKeywordsChange(newKeywords);
        }
        dragItem.current = null;
        dragOverItem.current = null;
    };

    const handleAddKeyword = () => {
        const trimmedInput = newKeyword.trim();
        if (trimmedInput) {
            const newKeywordsToAdd = trimmedInput
                .split(',')
                .map(k => k.trim())
                .filter(k => k !== '');

            if (newKeywordsToAdd.length > 0) {
                onKeywordsChange([...keywords, ...newKeywordsToAdd]);
            }
            setNewKeyword('');
        }
    };

    const handleRemoveKeyword = (index: number) => {
        const newKeywords = keywords.filter((_, i) => i !== index);
        onKeywordsChange(newKeywords);
    };

    return (
        <div>
            <div className="p-2 border border-gray-300 rounded-md bg-white flex flex-wrap gap-2 min-h-[100px]">
                {keywords.map((keyword, index) => (
                    <div
                        key={index}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragEnter={(e) => handleDragEnter(e, index)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => e.preventDefault()}
                        className="flex items-center gap-2 bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1.5 rounded-md cursor-grab active:cursor-grabbing"
                    >
                        <span>{keyword}</span>
                        <button
                            type="button"
                            onClick={() => handleRemoveKeyword(index)}
                            className="text-blue-600 hover:text-blue-800"
                        >
                            &times;
                        </button>
                    </div>
                ))}
            </div>
            <div className="mt-2 flex gap-2">
                <input
                    type="text"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
                    placeholder="Add a keyword..."
                    className="flex-grow shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
                <button
                    type="button"
                    onClick={handleAddKeyword}
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700"
                >
                    Add
                </button>
            </div>
        </div>
    );
};

const IterationNodeView: React.FC<IterationNodeViewProps> = ({ node, allNodes, updateNode, addChildNode }) => {
  const [showMainActions, setShowMainActions] = useState(false);
  const [showPromptDiff, setShowPromptDiff] = useState(!!node.promptDiff && (!!node.promptDiff.added || !!node.promptDiff.removed));
  const mainActionsRef = useRef<HTMLDivElement>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  
  const [promptKeywords, setPromptKeywords] = useState<string[]>(Array.isArray(node.prompt) ? node.prompt : []);
  const [promptDiff, setPromptDiff] = useState<PromptDiff>(node.promptDiff || { added: '', removed: '', changed: '' });
  const [parameters, setParameters] = useState(node.parameters);
  const [analysis, setAnalysis] = useState(node.analysis || '');
  const [nextPlan, setNextPlan] = useState(node.nextPlan || '');
  const [processCommentary, setProcessCommentary] = useState(node.processCommentary || '');
  const [imagePrompts, setImagePrompts] = useState<ImageReference[]>(node.imagePrompts || []);
  const [styleReferences, setStyleReferences] = useState<StyleReference[]>(node.styleReferences || []);
  const [resultImages, setResultImages] = useState<ResultImage[]>(node.resultImages || []);
  const [srefCodeInput, setSrefCodeInput] = useState('');
  
  // Drag and drop states
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isDraggingOverImgPrompt, setIsDraggingOverImgPrompt] = useState(false);
  const [isDraggingOverSrefImg, setIsDraggingOverSrefImg] = useState(false);

  const handleUpdate = useCallback((field: keyof IterationNode, value: any) => {
    updateNode({ ...node, [field]: value });
  }, [node, updateNode]);
  
  useEffect(() => {
    // Auto-diff logic and prompt update
    handleUpdate('prompt', promptKeywords);

    if (node.parentId) {
      const parentNode = allNodes.find(n => n.id === node.parentId);
      if (parentNode && Array.isArray(parentNode.prompt)) {
        const parentKeywords = new Set(parentNode.prompt);
        const currentKeywords = new Set(promptKeywords);

        const added = [...currentKeywords].filter(k => !parentKeywords.has(k));
        const removed = [...parentKeywords].filter(k => !currentKeywords.has(k));

        const newDiff = { ...promptDiff, added: added.join(', '), removed: removed.join(', ') };
        setPromptDiff(newDiff);
        handleUpdate('promptDiff', newDiff);
        if(added.length > 0 || removed.length > 0) {
            setShowPromptDiff(true);
        }
      }
    }
  }, [promptKeywords]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mainActionsRef.current && !mainActionsRef.current.contains(event.target as Node)) {
        setShowMainActions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleAction = (action: string, sourceImageId?: string) => {
    const currentNodeState: IterationNode = {
        ...node,
        prompt: promptKeywords,
        parameters: parameters,
        analysis: analysis,
        nextPlan: nextPlan,
        processCommentary: processCommentary,
        imagePrompts: imagePrompts,
        styleReferences: styleReferences,
        resultImages: resultImages,
        promptDiff: promptDiff,
    };
    addChildNode(currentNodeState, action, sourceImageId);
    if (showMainActions) {
        setShowMainActions(false);
    }
  }
  
  const processFile = (file: File, callback: (base64: string, mimeType: string) => void) => {
      if (file && file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onloadend = () => {
              const base64String = (reader.result as string).split(',')[1];
              callback(base64String, file.type);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string, mimeType: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file, callback);
    }
  };
  
  const handleDrop = (e: React.DragEvent<HTMLLabelElement>, callback: (base64: string, mimeType: string) => void) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file, callback);
    }
  };

  const addImagePrompt = (imageBase64: string, imageMimeType: string) => {
    const newPrompts = [...imagePrompts, { id: `img-${Date.now()}`, imageBase64, imageMimeType }];
    setImagePrompts(newPrompts);
    handleUpdate('imagePrompts', newPrompts);
  };

  const removeImagePrompt = (id: string) => {
    const newPrompts = imagePrompts.filter(p => p.id !== id);
    setImagePrompts(newPrompts);
    handleUpdate('imagePrompts', newPrompts);
  };
  
  const addStyleRefImage = (imageBase64: string, imageMimeType: string) => {
    const newRefs = [...styleReferences, { id: `sref-img-${Date.now()}`, imageBase64, imageMimeType }];
    setStyleReferences(newRefs);
    handleUpdate('styleReferences', newRefs);
  };
  
  const addStyleRefCode = () => {
    if (srefCodeInput.trim() === '') return;
    const newRefs = [...styleReferences, { id: `sref-code-${Date.now()}`, srefCode: srefCodeInput.trim() }];
    setStyleReferences(newRefs);
    handleUpdate('styleReferences', newRefs);
    setSrefCodeInput('');
  };

  const removeStyleRef = (id: string) => {
    const newRefs = styleReferences.filter(r => r.id !== id);
    setStyleReferences(newRefs);
    handleUpdate('styleReferences', newRefs);
  };
  
  const handleResultImageUpload = (imageBase64: string, imageMimeType: string, index: number) => {
    const newImage: ResultImage = { id: `res-${Date.now()}`, imageBase64, imageMimeType, isHighlighted: false };
    const newImages = [...resultImages];
    newImages[index] = newImage;
    setResultImages(newImages.filter(Boolean)); // filter out empty slots if any
    handleUpdate('resultImages', newImages.filter(Boolean));
  };

  const removeResultImage = (index: number) => {
    const newImages = [...resultImages];
    newImages.splice(index, 1);
    setResultImages(newImages);
    handleUpdate('resultImages', newImages);
  };

  const handleToggleHighlight = (imageId: string) => {
    const newImages = resultImages.map(img => 
        img.id === imageId ? { ...img, isHighlighted: !img.isHighlighted } : img
    );
    setResultImages(newImages);
    handleUpdate('resultImages', newImages);
  };
  
  const handleCopyPrompt = () => {
    const promptString = promptKeywords.join(', ');
    navigator.clipboard.writeText(promptString);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const ActionBadge = () => {
    let actionText = node.creationAction;
    if (node.parentId && node.sourceResultImageId) {
        const parent = allNodes.find(n => n.id === node.parentId);
        if (parent && parent.resultImages) {
            const imageIndex = parent.resultImages.findIndex(img => img.id === node.sourceResultImageId);
            if (imageIndex !== -1) {
                actionText = `${node.creationAction} from Image #${imageIndex + 1}`;
            }
        }
    }
    return (
        <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">
          {actionText}
        </span>
    );
  };

  return (
    <div className="bg-white p-4 sm:p-6 my-4 rounded-lg border border-gray-200 shadow-sm w-full">
      <div className="flex justify-between items-center mb-4">
        <ActionBadge />
        <div className="relative" ref={mainActionsRef}>
          <button
            onClick={() => setShowMainActions(!showMainActions)}
            className="inline-flex items-center justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-500 hover:bg-blue-600"
          >
            Iterate...
            <svg className={`-mr-1 ml-2 h-5 w-5 transform transition-transform ${showMainActions ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
          </button>
          {showMainActions && (
            <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
              <div className="py-1">
                {GLOBAL_ACTION_TYPES.map(action => (
                    <button 
                        key={action}
                        onClick={() => handleAction(action)} 
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                        {action}
                    </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Inputs & References */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-neutral-700">Prompt</label>
                <button type="button" onClick={handleCopyPrompt} className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline">
                  <CopyIcon className="w-4 h-4" />
                  {copySuccess ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <PromptComposer keywords={promptKeywords} onKeywordsChange={setPromptKeywords} />
            </div>
            <div className="flex items-center">
               <input type="checkbox" id={`diff-check-${node.id}`} checked={showPromptDiff} onChange={() => setShowPromptDiff(!showPromptDiff)} className="h-4 w-4 text-blue-600 border-gray-300 rounded"/>
               <label htmlFor={`diff-check-${node.id}`} className="ml-2 block text-sm text-gray-900">Track Detailed Prompt Changes</label>
            </div>
            {showPromptDiff && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 bg-gray-50 rounded-md border">
                    <div>
                        <label className="text-xs font-medium text-green-700">Added</label>
                        <textarea value={promptDiff.added} onChange={e => setPromptDiff(p => ({...p, added: e.target.value}))} onBlur={() => handleUpdate('promptDiff', promptDiff)} rows={2} className="mt-1 text-sm w-full border-gray-200 rounded-md" placeholder="keywords..."/>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-red-700">Removed</label>
                        <textarea value={promptDiff.removed} onChange={e => setPromptDiff(p => ({...p, removed: e.target.value}))} onBlur={() => handleUpdate('promptDiff', promptDiff)} rows={2} className="mt-1 text-sm w-full border-gray-200 rounded-md" placeholder="keywords..."/>
                    </div>
                     <div>
                        <label className="text-xs font-medium text-yellow-700">Changed</label>
                        <textarea value={promptDiff.changed} onChange={e => setPromptDiff(p => ({...p, changed: e.target.value}))} onBlur={() => handleUpdate('promptDiff', promptDiff)} rows={2} className="mt-1 text-sm w-full border-gray-200 rounded-md" placeholder="old -> new..."/>
                    </div>
                </div>
            )}
            <div>
              <label className="block text-sm font-medium text-neutral-700">Parameters</label>
              <input type="text" value={parameters} onChange={e => setParameters(e.target.value)} onBlur={() => handleUpdate('parameters', parameters)} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"/>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
                 <div>
                  <label className="block text-sm font-medium text-neutral-700">Image Prompts</label>
                  <div className="mt-1 space-y-2">
                      {imagePrompts.map(p => (
                          <div key={p.id} className="flex items-center gap-2">
                              <img src={`data:${p.imageMimeType};base64,${p.imageBase64}`} className="w-8 h-8 rounded object-cover" />
                              <button onClick={() => removeImagePrompt(p.id)} className="ml-auto text-gray-400 hover:text-gray-600 p-1 rounded-full text-xs">X</button>
                          </div>
                      ))}
                      <label 
                        onDrop={(e) => { handleDrop(e, addImagePrompt); setIsDraggingOverImgPrompt(false); }}
                        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOverImgPrompt(true); }}
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOverImgPrompt(true); }}
                        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOverImgPrompt(false); }}
                        className={`w-full text-center py-1.5 border-2 border-dashed rounded-md text-sm text-gray-600 cursor-pointer block transition-colors ${
                            isDraggingOverImgPrompt ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        + Add
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, addImagePrompt)} />
                      </label>
                  </div>
              </div>
               <div>
                  <label className="block text-sm font-medium text-neutral-700">Style References (sref)</label>
                   <div className="mt-1 space-y-2">
                      {styleReferences.map(r => (
                          <div key={r.id} className="flex items-center gap-2 text-sm">
                              {r.imageBase64 && <img src={`data:${r.imageMimeType};base64,${r.imageBase64}`} className="w-8 h-8 rounded object-cover" />}
                              {r.srefCode && <span className="bg-gray-100 px-2 py-1 rounded font-mono text-xs">{r.srefCode}</span>}
                              <button onClick={() => removeStyleRef(r.id)} className="ml-auto text-gray-400 hover:text-gray-600 p-1 rounded-full text-xs">X</button>
                          </div>
                      ))}
                      <div className="flex gap-2">
                          <label 
                            onDrop={(e) => { handleDrop(e, addStyleRefImage); setIsDraggingOverSrefImg(false); }}
                            onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOverSrefImg(true); }}
                            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOverSrefImg(true); }}
                            onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOverSrefImg(false); }}
                            className={`flex-1 text-center py-1.5 border-2 border-dashed rounded-md text-sm text-gray-600 cursor-pointer transition-colors ${
                                isDraggingOverSrefImg ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            + Img
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, addStyleRefImage)} />
                          </label>
                          <div className="flex-1 flex gap-1">
                            <input type="text" value={srefCodeInput} onChange={e => setSrefCodeInput(e.target.value)} placeholder="Code..." className="w-full text-sm border-gray-300 rounded-md" />
                            <button onClick={addStyleRefCode} className="px-2 bg-gray-200 rounded-md hover:bg-gray-300 text-lg">+</button>
                          </div>
                      </div>
                  </div>
              </div>
             </div>
          </div>

          {/* Right Column: Result Images */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Result Images</label>
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: 4 }).map((_, index) => {
                const image = resultImages[index];
                return (
                  <div key={image?.id || index} className={`w-full aspect-square rounded-lg transition-all ${image?.isHighlighted ? 'ring-4 ring-yellow-400 ring-offset-2' : ''}`}>
                     <label 
                        onDrop={(e) => { handleDrop(e, (b64, mime) => handleResultImageUpload(b64, mime, index)); setDragOverIndex(null); }}
                        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverIndex(index); }}
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverIndex(index); }}
                        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverIndex(null); }}
                        className={`relative flex flex-col items-center justify-center w-full h-full border-2 border-dashed rounded-lg cursor-pointer transition-colors group ${
                            dragOverIndex === index ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                        }`}
                     >
                        {image ? (
                          <>
                            <img src={`data:${image.imageMimeType};base64,${image.imageBase64}`} alt={`Result ${index + 1}`} className="w-full h-full object-cover rounded-lg"/>
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg"></div>
                            <button onClick={(e) => { e.preventDefault(); handleToggleHighlight(image.id); }} className="absolute top-1 left-1 bg-black bg-opacity-40 rounded-full p-1.5 text-white hover:bg-opacity-60 z-10">
                                <StarIcon filled={!!image.isHighlighted} className="w-4 h-4" />
                            </button>
                            <ImageActionMenu onAction={(action) => handleAction(action, image.id)} />
                            <button onClick={(e) => {e.preventDefault(); removeResultImage(index);}} type="button" className="absolute bottom-1 right-1 bg-black bg-opacity-40 rounded-full p-1 text-white hover:bg-opacity-60">
                               <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd"></path></svg>
                            </button>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-2">
                            <svg className="w-6 h-6 mb-2 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/></svg>
                            <p className="text-xs text-gray-500">Upload Image</p>
                          </div>
                        )}
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, (b64, mime) => handleResultImageUpload(b64, mime, index))} />
                      </label>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Full-width Analysis Section */}
        <div>
           <label className="block text-sm font-medium text-neutral-800">Designer's Intent / Analysis (디자이너 의도 / 분석)</label>
           <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
                 <label className="block text-sm font-medium text-neutral-700">Process Reflection (과정 성찰)</label>
                 <p className="text-xs text-neutral-500 mb-1">Comment on any significant changes, challenges, or new directions in your process here... (과정에서 발생한 중요한 변화, 어려움, 새로운 방향성에 대해 코멘트를 남겨주세요...)</p>
                 <textarea value={processCommentary} onChange={e => setProcessCommentary(e.target.value)} onBlur={() => handleUpdate('processCommentary', processCommentary)} rows={2} className="block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"/>
                 <hr className="my-4"/>
                 <label className="block text-sm font-medium text-neutral-700">Result Analysis & Evaluation (결과 분석 및 평가)</label>
                 <p className="text-xs text-neutral-500 mb-1">What worked? What didn't? Why? (어떤 점이 효과적이었고, 어떤 점이 그렇지 않았나요? 그 이유는 무엇인가요?)</p>
                 <textarea value={analysis} onChange={e => setAnalysis(e.target.value)} onBlur={() => handleUpdate('analysis', analysis)} rows={4} className="block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"/>
              </div>
              <div>
                 <label className="block text-sm font-medium text-neutral-700">Next Iteration Plan (다음 단계 계획)</label>
                 <p className="text-xs text-neutral-500 mb-1">What's the hypothesis for the next step? (다음 단계를 위한 가설은 무엇인가요?)</p>
                 <textarea value={nextPlan} onChange={e => setNextPlan(e.target.value)} onBlur={() => handleUpdate('nextPlan', nextPlan)} rows={4} className="block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"/>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default IterationNodeView;