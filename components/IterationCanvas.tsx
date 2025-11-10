import React from 'react';
import { IterationNode } from '../types';
import IterationNodeView from './IterationNodeView';
import SparklesIcon from './icons/SparklesIcon';

interface IterationCanvasProps {
  nodes: IterationNode[];
  setNodes: React.Dispatch<React.SetStateAction<IterationNode[]>>;
  onExitToDashboard: () => void;
  onNext: () => void;
  onBack: () => void;
}

const IterationCanvas: React.FC<IterationCanvasProps> = ({ nodes, setNodes, onExitToDashboard, onNext, onBack }) => {
  const updateNode = (updatedNode: IterationNode) => {
    setNodes(prevNodes => prevNodes.map(n => n.id === updatedNode.id ? updatedNode : n));
  };
  
  const addChildNode = (parentNode: IterationNode, action: string, sourceImageId?: string) => {
    const newNode: IterationNode = {
      id: `node-${Date.now()}`,
      parentId: parentNode.id,
      creationAction: action,
      prompt: Array.isArray(parentNode.prompt) ? [...parentNode.prompt] : [],
      parameters: parentNode.parameters,
      analysis: '',
      nextPlan: '',
      processCommentary: '',
      imagePrompts: parentNode.imagePrompts || [],
      styleReferences: parentNode.styleReferences || [],
      resultImages: [],
      sourceResultImageId: sourceImageId,
      promptDiff: { added: '', removed: '', changed: '' },
    };
    setNodes(prevNodes => [...prevNodes, newNode]);
  };

  const addRootNode = () => {
    const newNode: IterationNode = {
      id: `node-${Date.now()}`,
      parentId: null, // This makes it a new root
      creationAction: 'New Idea',
      prompt: [], // Blank prompt array
      parameters: '--ar 16:9', // Default params
      analysis: '',
      nextPlan: '',
      processCommentary: '',
      imagePrompts: [],
      styleReferences: [],
      resultImages: [],
      promptDiff: { added: '', removed: '', changed: '' },
    };
    setNodes(prevNodes => [...prevNodes, newNode]);
  };

  const renderNodes = (parentId: string | null): React.ReactElement[] => {
    const children = nodes.filter(node => node.parentId === parentId);
    if (children.length === 0) {
        return [];
    }
    return children.map(node => (
      <li key={node.id} className={node.sourceResultImageId ? 'is-single-image-branch' : ''}>
        <div className="node-content">
          <IterationNodeView
            node={node}
            allNodes={nodes}
            updateNode={updateNode}
            addChildNode={addChildNode}
          />
        </div>
        {nodes.some(n => n.parentId === node.id) && (
          <ul className="children-group">
            {renderNodes(node.id)}
          </ul>
        )}
      </li>
    ));
  };

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8">
      <style>
        {`
          .tree-container {
            overflow-x: auto;
            padding: 1rem;
            width: 100%;
          }
          .tree-container ul {
            list-style: none;
            padding: 0;
            margin: 0;
            display: inline-flex;
            flex-direction: column;
            align-items: flex-start;
          }
          .tree-container li {
            display: flex;
            align-items: flex-start; /* Aligns node with the top of its children block */
            position: relative;
            padding-top: 1.5rem;
            padding-bottom: 1.5rem;
          }
          .node-content {
            flex-shrink: 0;
            position: relative; /* for outgoing line */
            margin-right: 3rem; /* space before children */
            width: 700px; /* Give nodes a fixed width to help layout */
          }
          .children-group {
            position: relative; /* for incoming line */
            padding-left: 3rem;
          }

          /* --- Connector Lines --- */
          /* Vertical line connecting sibling nodes */
          .children-group::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 2px;
            background-color: #d1d5db; /* gray-300 */
          }

          /* Horizontal line from vertical connector to the child node */
          .children-group > li::before {
            content: '';
            position: absolute;
            left: 0;
            top: 52px; /* Vertically align with node header area */
            width: 3rem;
            height: 2px;
            background-color: #d1d5db;
          }

          /* Dashed line for single-image branches */
          .children-group > li.is-single-image-branch::before {
            background-image: repeating-linear-gradient(to right, #d1d5db 0, #d1d5db 6px, transparent 6px, transparent 12px);
            background-color: transparent;
          }
          
          /* Horizontal line from parent node to its children's vertical connector */
          .node-content::after {
            content: '';
            position: absolute;
            left: 100%;
            top: 52px; /* Vertically align with node header area */
            width: 3rem;
            height: 2px;
            background-color: #d1d5db;
          }

          /* --- Edge cases and cleanup --- */
          /* Only draw outgoing line if there are children */
          .tree-container li:not(:has(ul.children-group)) > .node-content::after {
            display: none;
          }
          /* Adjustments for first/last children */
          .children-group > li:first-child { padding-top: 1.5rem; }
          .children-group > li:last-child { padding-bottom: 1.5rem; }
          .children-group > li:only-child { padding-top: 1.5rem; padding-bottom: 1.5rem; }
          
          /* Clean up root node styling */
          .root-group > li {
            padding-left: 1rem; /* Give some initial space */
            padding-top: 0;
            padding-bottom: 0;
          }
          .root-group > li + li {
            padding-top: 3rem; /* Space between root-level threads */
          }
        `}
      </style>
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="text-left">
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <SparklesIcon className="w-8 h-8 text-blue-500" />
            Form Exploration
          </h2>
          <p className="mt-2 text-md text-gray-600">
            Track your creative process. Edit prompts, upload results, and branch your ideas.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
            <button
                onClick={addRootNode}
                className="inline-flex items-center justify-center py-2 px-4 border border-blue-500 text-sm font-medium rounded-lg text-blue-600 bg-white hover:bg-blue-50"
            >
                + Add New Idea Thread
            </button>
            <button
            onClick={onExitToDashboard}
            className="inline-flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
            >
            Back to Dashboard
            </button>
        </div>
      </div>
      <div className="tree-container bg-dots">
        <ul className="root-group">
            {renderNodes(null)}
        </ul>
      </div>
       <div className="flex justify-between pt-8 mt-8 border-t">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex justify-center py-3 px-6 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="inline-flex justify-center py-3 px-6 border border-transparent text-base font-medium rounded-lg text-white bg-blue-500 hover:bg-blue-600"
        >
          Next: Convergence
        </button>
      </div>
    </div>
  );
};

export default IterationCanvas;