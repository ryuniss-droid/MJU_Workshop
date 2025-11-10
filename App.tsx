import React, { useState, useEffect, useCallback } from 'react';
import { Project, UserInput, RefinedKeyword } from './types';
import ProjectDashboard from './components/ProjectDashboard';
import ProjectWorkspace from './components/ProjectWorkspace';
import { DOMAIN_OPTIONS } from './constants';

const LOCAL_STORAGE_KEY = 'ai-design-workshop-projects';

const createNewProject = (name: string): Project => {
    const initialUserInput: UserInput = {
        domain: DOMAIN_OPTIONS[0].value,
        missionStatement: {
            companyOrProject: '',
            vision: '',
            challenge: '',
            approach: '',
            valueProposition: '',
        },
    };
    return {
        id: `proj-${Date.now()}`,
        name: name,
        lastModified: Date.now(),
        appState: 'projectInput',
        userInput: initialUserInput,
        frameworkInput: null,
        keywords: null,
        refinedKeywords: [],
        emergentKeywords: [],
        iterationNodes: [],
        error: null,
    };
};

const App: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

    useEffect(() => {
        try {
            const savedProjectsJSON = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (savedProjectsJSON) {
                setProjects(JSON.parse(savedProjectsJSON));
            }
        } catch (error) {
            console.error("Failed to load projects from localStorage:", error);
            setProjects([]);
        }
    }, []);

    const saveProjects = useCallback((updatedProjects: Project[]) => {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedProjects));
        } catch (error) {
            console.error("Failed to save projects to localStorage:", error);
        }
    }, []);

    const handleCreateProject = () => {
        const newProject = createNewProject(`New Project ${projects.length + 1}`);
        const updatedProjects = [...projects, newProject];
        setProjects(updatedProjects);
        saveProjects(updatedProjects);
        setActiveProjectId(newProject.id);
    };

    const handleUpdateProject = (updatedProject: Project) => {
        const updatedProjects = projects.map(p =>
            p.id === updatedProject.id ? { ...updatedProject, lastModified: Date.now() } : p
        );
        setProjects(updatedProjects);
        saveProjects(updatedProjects);
    };
    
    const handleDeleteProject = (projectId: string) => {
        // The confirmation is now handled in the ProjectDashboard component.
        // This function now directly deletes the project.
        const updatedProjects = projects.filter(p => p.id !== projectId);
        setProjects(updatedProjects);
        saveProjects(updatedProjects);
        
        if (activeProjectId === projectId) {
            setActiveProjectId(null);
        }
    };
    
    const handleRenameProject = (projectId: string, newName: string) => {
        const updatedProjects = projects.map(p =>
            p.id === projectId ? { ...p, name: newName, lastModified: Date.now() } : p
        );
        setProjects(updatedProjects);
        saveProjects(updatedProjects);
    }
    
    const activeProject = projects.find(p => p.id === activeProjectId);

    if (activeProject) {
        return (
            <ProjectWorkspace
                project={activeProject}
                updateProject={handleUpdateProject}
                onExit={() => setActiveProjectId(null)}
            />
        );
    }

    return (
        <ProjectDashboard
            projects={projects}
            onSelectProject={setActiveProjectId}
            onCreateProject={handleCreateProject}
            onDeleteProject={handleDeleteProject}
            onRenameProject={handleRenameProject}
        />
    );
};

export default App;