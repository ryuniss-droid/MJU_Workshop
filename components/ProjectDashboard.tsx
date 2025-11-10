import React, { useState } from 'react';
import { Project } from '../types';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';

interface ProjectDashboardProps {
  projects: Project[];
  onSelectProject: (projectId: string) => void;
  onCreateProject: () => void;
  onDeleteProject: (projectId: string) => void;
  onRenameProject: (projectId: string, newName: string) => void;
}

const ConfirmationModal: React.FC<{
    project: Project;
    onConfirm: () => void;
    onCancel: () => void;
}> = ({ project, onConfirm, onCancel }) => {
    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8 w-full max-w-md m-4">
                <h3 className="text-xl font-semibold text-gray-900">Confirm Deletion</h3>
                <div className="mt-4">
                    <p className="text-sm text-gray-600">
                        Are you sure you want to delete the project named{' '}
                        <strong className="font-medium text-gray-800">"{project.name}"</strong>?
                    </p>
                    <p className="mt-2 text-sm text-red-600">
                        This action cannot be undone.
                    </p>
                </div>
                <div className="mt-6 flex justify-end space-x-4">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};


const ProjectDashboard: React.FC<ProjectDashboardProps> = ({
  projects,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  onRenameProject,
}) => {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const handleRenameStart = (project: Project) => {
    setRenamingId(project.id);
    setNewName(project.name);
  };

  const handleRenameSave = (projectId: string) => {
    if (newName.trim()) {
      onRenameProject(projectId, newName.trim());
    }
    setRenamingId(null);
    setNewName('');
  };

  const handleDeleteRequest = (project: Project) => {
    setProjectToDelete(project);
  };
  
  const handleConfirmDelete = () => {
    if (projectToDelete) {
        onDeleteProject(projectToDelete.id);
        setProjectToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setProjectToDelete(null);
  };

  const sortedProjects = [...projects].sort((a, b) => b.lastModified - a.lastModified);

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900">AI-based Design Process Workshop</h1>
            <p className="mt-3 text-lg text-gray-600">
              Manage your design projects or start a new one.
            </p>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-neutral-800">Your Projects</h2>
              <button
                onClick={onCreateProject}
                className="inline-flex items-center justify-center py-2 px-5 border border-transparent text-base font-medium rounded-lg text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                + New Project
              </button>
            </div>

            <div className="space-y-4">
              {sortedProjects.length > 0 ? (
                sortedProjects.map(project => (
                  <div key={project.id} className="p-4 rounded-lg border bg-gray-50 flex items-center justify-between hover:bg-white hover:border-blue-500 transition-colors">
                    <div className="flex-grow">
                      {renamingId === project.id ? (
                        <input
                          type="text"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          onBlur={() => handleRenameSave(project.id)}
                          onKeyDown={(e) => e.key === 'Enter' && handleRenameSave(project.id)}
                          className="text-lg font-semibold text-neutral-900 border-b-2 border-blue-500 focus:outline-none bg-transparent"
                          autoFocus
                        />
                      ) : (
                        <button onClick={() => onSelectProject(project.id)} className="w-full text-left">
                          <h3 className="text-lg font-semibold text-neutral-900">{project.name}</h3>
                          <p className="text-sm text-neutral-500">
                            Last modified: {new Date(project.lastModified).toLocaleString()}
                          </p>
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                      <button onClick={() => onSelectProject(project.id)} className="text-sm font-medium text-blue-600 hover:underline">Open</button>
                      <button onClick={() => handleRenameStart(project)} title="Rename project" className="p-2 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-200">
                        <EditIcon className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDeleteRequest(project)} title="Delete project" className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-50">
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10">
                  <p className="text-neutral-500">You don't have any projects yet.</p>
                  <p className="mt-2 text-neutral-500">Click "New Project" to get started!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {projectToDelete && (
        <ConfirmationModal
            project={projectToDelete}
            onConfirm={handleConfirmDelete}
            onCancel={handleCancelDelete}
        />
      )}
    </>
  );
};

export default ProjectDashboard;