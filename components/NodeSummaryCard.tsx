import React from 'react';
import { IterationNode } from '../types';
import StarIcon from './icons/StarIcon';

interface NodeSummaryCardProps {
  node: IterationNode;
  allNodes: IterationNode[];
}

const ActionBadge: React.FC<{ node: IterationNode; allNodes: IterationNode[] }> = ({ node, allNodes }) => {
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

const NodeSummaryCard: React.FC<NodeSummaryCardProps> = ({ node, allNodes }) => {
  const hasDiff = node.promptDiff && (node.promptDiff.added || node.promptDiff.removed || node.promptDiff.changed);
  
  const promptText = Array.isArray(node.prompt) ? node.prompt.join(', ') : (node.prompt || '(No prompt)');

  return (
    <div className="bg-white p-4 my-2 rounded-lg border border-gray-200 shadow-sm w-full space-y-4">
      <div className="flex justify-between items-center">
        <ActionBadge node={node} allNodes={allNodes} />
      </div>
      
      {node.resultImages && node.resultImages.length > 0 && (
        <div className="grid grid-cols-4 gap-1">
          {node.resultImages.map((image, index) => (
            <div key={image.id || index} className="relative w-full aspect-square bg-gray-100 rounded">
               <img src={`data:${image.imageMimeType};base64,${image.imageBase64}`} alt={`Result ${index + 1}`} className="w-full h-full object-cover rounded"/>
               {image.isHighlighted && (
                   <div className="absolute top-0 right-0 p-0.5 bg-white bg-opacity-80 rounded-bl-md">
                       <StarIcon filled className="w-4 h-4 text-yellow-400" />
                   </div>
               )}
            </div>
          ))}
        </div>
      )}
      
      <div>
        <label className="block text-xs font-medium text-neutral-600">Prompt</label>
        <p className="mt-1 text-sm p-2 bg-gray-50 rounded border border-gray-200 whitespace-pre-wrap font-mono text-gray-700 max-h-24 overflow-y-auto">
            {promptText}
        </p>
      </div>

       {node.parameters && (
         <div>
            <label className="block text-xs font-medium text-neutral-600">Parameters</label>
            <p className="text-sm font-mono text-gray-600">{node.parameters}</p>
        </div>
       )}

       {hasDiff && (
         <div className="space-y-1">
            <label className="block text-xs font-medium text-neutral-600">Prompt Changes</label>
            {node.promptDiff?.added && (
              <p className="text-sm text-green-700 bg-green-50 p-1 rounded">
                <span className="font-bold">+</span> {node.promptDiff.added}
              </p>
            )}
            {node.promptDiff?.removed && (
              <p className="text-sm text-red-700 bg-red-50 p-1 rounded">
                <span className="font-bold">-</span> {node.promptDiff.removed}
              </p>
            )}
             {node.promptDiff?.changed && (
              <p className="text-sm text-yellow-700 bg-yellow-50 p-1 rounded">
                <span className="font-bold">~</span> {node.promptDiff.changed}
              </p>
            )}
         </div>
       )}
       
      {(node.analysis || node.nextPlan || node.processCommentary) && (
        <div className="space-y-2 pt-2 border-t mt-4">
          {node.processCommentary && (
             <div>
              <label className="block text-xs font-medium text-neutral-600">Process Reflection</label>
              <blockquote className="mt-1 text-sm text-gray-700 italic border-l-4 pl-3 py-1 bg-gray-50">
                {node.processCommentary}
              </blockquote>
            </div>
          )}
          {node.analysis && (
            <div>
              <label className="block text-xs font-medium text-neutral-600">Analysis & Evaluation</label>
              <blockquote className="mt-1 text-sm text-gray-700 italic border-l-4 pl-3 py-1 bg-gray-50">
                {node.analysis}
              </blockquote>
            </div>
          )}
           {node.nextPlan && (
            <div>
              <label className="block text-xs font-medium text-neutral-600">Next Iteration Plan</label>
              <blockquote className="mt-1 text-sm text-gray-700 italic border-l-4 pl-3 py-1 bg-gray-50">
                {node.nextPlan}
              </blockquote>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NodeSummaryCard;