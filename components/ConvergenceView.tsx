import React, { useRef, useState } from 'react';
import * as htmlToImage from 'html-to-image';
import { IterationNode } from '../types';
import NodeSummaryCard from './NodeSummaryCard';
import DownloadIcon from './icons/DownloadIcon';
import LoadingSpinner from './LoadingSpinner';

interface ConvergenceViewProps {
  nodes: IterationNode[];
  onBack: () => void;
  onExitToDashboard: () => void;
}

const ConvergenceView: React.FC<ConvergenceViewProps> = ({ nodes, onBack, onExitToDashboard }) => {
  const treeContainerRef = useRef<HTMLUListElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadImage = async () => {
    if (!treeContainerRef.current) return;

    setIsDownloading(true);
    try {
      const dataUrl = await htmlToImage.toPng(treeContainerRef.current, {
        backgroundColor: '#f9fafb', // bg-gray-50
        pixelRatio: 2, // for higher resolution
        style: {
          margin: '0', // Ensure no margin is applied on the root element itself during capture
        }
      });

      const link = document.createElement('a');
      link.download = 'design-process-overview.png';
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Failed to download image', error);
      alert('Sorry, there was an error creating the image.');
    } finally {
      setIsDownloading(false);
    }
  };

  const renderNodes = (parentId: string | null): React.ReactElement[] => {
    const children = nodes.filter(node => node.parentId === parentId);
    if (children.length === 0) {
      return [];
    }
    return children.map(node => (
      <li key={node.id}>
        <div className="summary-node-content">
          <NodeSummaryCard node={node} allNodes={nodes} />
        </div>
        {nodes.some(n => n.parentId === node.id) && (
          <ul className="summary-children-group">
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
          .summary-tree-container {
            overflow-x: auto;
            padding: 1rem;
            width: 100%;
          }
          .summary-tree-container ul {
            list-style: none;
            padding: 0;
            margin: 0;
            display: inline-flex;
            flex-direction: column;
            align-items: flex-start;
          }
          .summary-tree-container li {
            display: flex;
            align-items: flex-start;
            position: relative;
            padding-top: 1rem;
            padding-bottom: 1rem;
          }
          .summary-node-content {
            flex-shrink: 0;
            position: relative;
            margin-right: 2rem;
            width: 450px;
          }
          .summary-children-group {
            position: relative;
            padding-left: 2rem;
          }

          /* Connector Lines */
          .summary-children-group::before {
            content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 2px; background-color: #d1d5db;
          }
          .summary-children-group > li::before {
            content: ''; position: absolute; left: 0; top: 38px; width: 2rem; height: 2px; background-color: #d1d5db;
          }
          .summary-node-content::after {
            content: ''; position: absolute; left: 100%; top: 38px; width: 2rem; height: 2px; background-color: #d1d5db;
          }
          .summary-tree-container li:not(:has(ul.summary-children-group)) > .summary-node-content::after {
            display: none;
          }

          /* Root node cleanup */
           .summary-root-group {
             padding: 2rem; /* Add padding to capture in the image */
           }
           .summary-root-group > li {
            padding-left: 1rem;
            padding-top: 0;
            padding-bottom: 0;
          }
           .summary-root-group > li + li {
            padding-top: 2rem;
          }
        `}
      </style>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="text-left">
          <h2 className="text-3xl font-bold text-gray-900">Project Exploration Overview</h2>
          <p className="mt-2 text-md text-gray-600">
            Review your entire creative journey. Curate the best results to finalize your design.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleDownloadImage}
            disabled={isDownloading}
            className="inline-flex items-center justify-center gap-2 py-2 px-4 border border-blue-500 text-sm font-medium rounded-lg text-blue-600 bg-white hover:bg-blue-50 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-wait"
          >
            {isDownloading ? (
              <>
                <LoadingSpinner className="w-4 h-4" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <DownloadIcon className="w-4 h-4" />
                <span>Download as Image</span>
              </>
            )}
          </button>
          <button
            onClick={onExitToDashboard}
            className="inline-flex justify-center py-2 px-5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      <div className="summary-tree-container bg-dots">
        {nodes.length > 0 ? (
          <ul className="summary-root-group" ref={treeContainerRef}>{renderNodes(null)}</ul>
        ) : (
          <p className="text-gray-500 text-center py-10">No exploration data to display. Go back to Step 3 to start iterating.</p>
        )}
      </div>

      <div className="flex justify-between pt-8 mt-8 border-t">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex justify-center py-3 px-6 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
        >
          Back to Exploration
        </button>
      </div>
    </div>
  );
};

export default ConvergenceView;