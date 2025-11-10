import React from 'react';
import { Project, IterationNode } from '../types';
import KeywordPaletteSidebar from './KeywordPaletteSidebar';
import IterationCanvas from './IterationCanvas';
import StepIndicator from './StepIndicator';

interface WorkshopProps {
  project: Project;
  nodes: IterationNode[];
  setNodes: React.Dispatch<React.SetStateAction<IterationNode[]>>;
  onExitToDashboard: () => void;
  onNext: () => void;
  onBack: () => void;
  onAddNewKeyword: (englishKeyword: string) => Promise<void>;
}

const Workshop: React.FC<WorkshopProps> = ({ project, nodes, setNodes, onExitToDashboard, onNext, onBack, onAddNewKeyword }) => {
  return (
    <div className="flex flex-col w-full items-center">
        <StepIndicator currentStep={3} />
        <div className="flex w-full">
            <KeywordPaletteSidebar 
                keywords={project.keywords!}
                refinedKeywords={project.refinedKeywords}
                emergentKeywords={project.emergentKeywords}
                onAddNewKeyword={onAddNewKeyword}
            />
            <main className="flex-grow">
                <IterationCanvas 
                    nodes={nodes}
                    setNodes={setNodes}
                    onExitToDashboard={onExitToDashboard}
                    onNext={onNext}
                    onBack={onBack}
                />
            </main>
        </div>
    </div>
  );
};

export default Workshop;