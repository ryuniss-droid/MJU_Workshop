import React from 'react';
import {
  Project,
  UserInput,
  RelationalFrameworkInput,
  GeneratedKeywordsResponse,
  IterationNode,
  AppState,
  KeywordPair,
  RefinedKeyword
} from '../types';
import { generateKeywords, translateKeywords } from '../services/geminiService';

import StepIndicator from './StepIndicator';
import ProjectInputForm from './ProjectInputForm';
import RelationalFrameworkForm from './RelationalFrameworkForm';
import LoadingSpinner from './LoadingSpinner';
import ErrorDisplay from './ErrorDisplay';
import ResultsDisplay from './ResultsDisplay';
import GoalRefinement from './GoalRefinement';
import Workshop from './Workshop';
import ConvergenceView from './ConvergenceView';

interface ProjectWorkspaceProps {
    project: Project;
    updateProject: (updatedProject: Project) => void;
    onExit: () => void;
}

export interface RefinementData {
    subject: string;
    refinedKeywords: RefinedKeyword[];
}


const ProjectWorkspace: React.FC<ProjectWorkspaceProps> = ({ project, updateProject, onExit }) => {

    const setAppState = (newState: AppState) => {
        updateProject({ ...project, appState: newState });
    };

    const handleReset = () => {
       const freshProjectState: Partial<Project> = {
            appState: 'projectInput',
            userInput: { ...project.userInput, missionStatement: { companyOrProject: '', vision: '', challenge: '', approach: '', valueProposition: ''} },
            frameworkInput: null,
            keywords: null,
            error: null,
            iterationNodes: [],
            refinedKeywords: [],
            emergentKeywords: [],
       };
       updateProject({ ...project, ...freshProjectState });
    };

    const handleProjectSubmit = (data: UserInput) => {
        updateProject({ ...project, userInput: data, appState: 'frameworkInput' });
    };

    const handleFrameworkSubmit = async (data: RelationalFrameworkInput) => {
        updateProject({ ...project, frameworkInput: data, appState: 'generating', error: null });
        try {
            const result = await generateKeywords(project.userInput, data);
            updateProject({ ...project, frameworkInput: data, keywords: result, appState: 'results' });
        } catch (e) {
            const errorMsg = e instanceof Error ? e.message : 'An unknown error occurred.';
            updateProject({ ...project, frameworkInput: data, error: errorMsg, appState: 'error' });
        }
    };

    const handleStartRefinement = () => {
        setAppState('refinement');
    }

    const handleRefinementSubmit = (data: RefinementData) => {
        
        const coreKeywords = data.refinedKeywords
            .filter(kw => kw.label === 'Core')
            .sort((a, b) => (b.score || 0) - (a.score || 0))
            .map(kw => kw.en);

        const fullPrompt = [data.subject, ...coreKeywords];
        
        const rootNode: IterationNode = {
            id: `node-${Date.now()}`,
            parentId: null,
            creationAction: 'Initial Prompt',
            prompt: fullPrompt.filter(Boolean),
            parameters: '--ar 16:9',
            analysis: 'This is the first prompt generated from the goal refinement step.',
            nextPlan: '',
            processCommentary: '',
            imagePrompts: [],
            styleReferences: [],
            resultImages: [],
        };

        updateProject({ 
            ...project, 
            refinedKeywords: data.refinedKeywords,
            iterationNodes: [rootNode], 
            appState: 'exploration' 
        });
    };

    const handleAddNewKeyword = async (englishKeyword: string) => {
        const allKeywords = [
            ...project.keywords?.actional || [],
            ...project.keywords?.sensory || [],
            ...project.keywords?.symbolic || [],
            ...project.keywords?.thematic || [],
            ...project.refinedKeywords,
            ...project.emergentKeywords,
        ];
        if (allKeywords.some(k => k.en.toLowerCase() === englishKeyword.toLowerCase())) {
            console.warn("Keyword already exists.");
            return;
        }

        try {
            const translatedPairs = await translateKeywords([englishKeyword]);
            if (translatedPairs.length > 0) {
                const newEmergentKeywords = [...project.emergentKeywords, translatedPairs[0]];
                updateProject({ ...project, emergentKeywords: newEmergentKeywords });
            }
        } catch (error) {
            console.error("Failed to add new keyword:", error);
            // Optionally handle the error in the UI
        }
    };


    const setIterationNodes = (nodes: IterationNode[] | ((prevNodes: IterationNode[]) => IterationNode[])) => {
        const newNodes = typeof nodes === 'function' ? nodes(project.iterationNodes) : nodes;
        updateProject({ ...project, iterationNodes: newNodes });
    };

    const getCurrentStep = () => {
        switch (project.appState) {
            case 'projectInput':
            case 'frameworkInput':
            case 'generating':
            case 'results':
                return 1;
            case 'refinement':
                return 2;
            case 'exploration':
                return 3;
            case 'convergence':
                return 4;
            case 'error':
                return 1;
            default:
                return 1;
        }
    };

    const renderContent = () => {
        switch (project.appState) {
            case 'projectInput':
                return <ProjectInputForm onSubmit={handleProjectSubmit} initialData={project.userInput} />;
            case 'frameworkInput':
                return <RelationalFrameworkForm onSubmit={handleFrameworkSubmit} onBack={() => setAppState('projectInput')} />;
            case 'generating':
                return <div className="text-center"><LoadingSpinner className="w-12 h-12 mx-auto" /><p className="mt-4 text-lg">Generating your keyword palette...</p></div>;
            case 'results':
                return project.keywords && <ResultsDisplay result={project.keywords} onExitToDashboard={onExit} onNext={handleStartRefinement} onBack={() => setAppState('frameworkInput')} />;
            case 'refinement':
                return project.keywords && <GoalRefinement project={project} onBack={() => setAppState('results')} onSubmit={handleRefinementSubmit} />
            case 'exploration':
                return project.keywords && <Workshop
                    project={project}
                    nodes={project.iterationNodes}
                    setNodes={setIterationNodes}
                    onExitToDashboard={onExit}
                    onNext={() => setAppState('convergence')}
                    onBack={() => setAppState('refinement')}
                    onAddNewKeyword={handleAddNewKeyword}
                />
            case 'convergence':
                return <ConvergenceView nodes={project.iterationNodes} onBack={() => setAppState('exploration')} onExitToDashboard={onExit} />
            case 'error':
                return <ErrorDisplay error={project.error || 'An unexpected error occurred.'} onReset={handleReset} />;
            default:
                return null;
        }
    };

    return (
        <div className={`min-h-screen bg-gray-50 flex flex-col items-center py-10 sm:py-16 ${project.appState === 'exploration' ? 'justify-start' : 'justify-center'}`}>
            {project.appState !== 'exploration' && <StepIndicator currentStep={getCurrentStep()} />}
             <div className="w-full px-4 text-center">
                 <h1 className="text-2xl font-bold text-gray-800">{project.name}</h1>
            </div>
            <main className={`${project.appState === 'exploration' ? 'w-full' : 'flex-grow flex items-center justify-center w-full px-4'}`}>
                {renderContent()}
            </main>
        </div>
    );
};

export default ProjectWorkspace;