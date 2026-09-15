import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Project, ProjectListItem, CreateProjectRequest, UpdateProjectRequest } from '../lib/types';
import { useAuthStore } from './use-auth-store';

interface ProjectStore {
  // Current project state
  currentProject: Project | null;
  projectName: string;
  isDirty: boolean; // Track if project has unsaved changes

  // Project list state
  projects: ProjectListItem[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setCurrentProject: (project: Project | null) => void;
  setProjectName: (name: string) => void;
  setDirty: (isDirty: boolean) => void;

  // Project list actions
  setProjects: (projects: ProjectListItem[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // CRUD operations
  createProject: (data: CreateProjectRequest) => Promise<Project>;
  updateProject: (id: string, data: UpdateProjectRequest) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  loadProject: (id: string) => Promise<Project>;
  listProjects: (userId?: string) => Promise<ProjectListItem[]>;

  // Utility actions
  clearCurrentProject: () => void;
  markAsAccessed: (id: string) => Promise<void>;
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currentProject: null,
      projectName: 'Untitled Project',
      isDirty: false,
      projects: [],
      isLoading: false,
      error: null,

      // Basic setters
      setCurrentProject: (project) => {
        set({
          currentProject: project,
          projectName: project?.name || 'Untitled Project',
          isDirty: false
        });
      },

      setProjectName: (name) => {
        set({
          projectName: name,
          isDirty: true
        });
      },

      setDirty: (isDirty) => set({ isDirty }),

      // Project list setters
      setProjects: (projects) => set({ projects }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      // CRUD operations
      createProject: async (data) => {
        try {
          set({ isLoading: true, error: null });

          // Get current user
          const { user } = useAuthStore.getState();

          const response = await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...data,
              user_id: user?.id
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to create project');
          }

          const project = await response.json();

          // Add to projects list
          const { projects } = get();
          set({
            projects: [project, ...projects],
            isLoading: false
          });

          return project;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      updateProject: async (id, data) => {
        try {
          set({ isLoading: true, error: null });

          const response = await fetch(`/api/projects/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            throw new Error('Failed to update project');
          }

          const updatedProject = await response.json();

          // Update current project if it's the same
          const { currentProject } = get();
          if (currentProject?.id === id) {
            set({
              currentProject: updatedProject,
              projectName: updatedProject.name,
              isDirty: false
            });
          }

          // Update projects list
          const { projects } = get();
          set({
            projects: projects.map(p => p.id === id ? updatedProject : p),
            isLoading: false
          });

          return updatedProject;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      deleteProject: async (id) => {
        try {
          set({ isLoading: true, error: null });

          const response = await fetch(`/api/projects/${id}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            throw new Error('Failed to delete project');
          }

          // Remove from projects list
          const { projects, currentProject } = get();
          set({
            projects: projects.filter(p => p.id !== id),
            isLoading: false
          });

          // Clear current project if it was deleted
          if (currentProject?.id === id) {
            set({ currentProject: null, projectName: 'Untitled Project' });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      loadProject: async (id) => {
        try {
          set({ isLoading: true, error: null });

          const response = await fetch(`/api/projects/${id}`);

          if (!response.ok) {
            throw new Error('Failed to load project');
          }

          const project = await response.json();

          set({
            currentProject: project,
            projectName: project.name,
            isDirty: false,
            isLoading: false
          });

          // Mark as accessed
          get().markAsAccessed(id);

          return project;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      listProjects: async (userId) => {
        try {
          set({ isLoading: true, error: null });

          // Get current user if no userId provided
          const { user } = useAuthStore.getState();
          const targetUserId = userId || user?.id;

          const url = targetUserId ? `/api/projects?userId=${targetUserId}` : '/api/projects';
          const response = await fetch(url);

          if (!response.ok) {
            throw new Error('Failed to load projects');
          }

          const projects = await response.json();

          set({ projects, isLoading: false });
          return projects;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      markAsAccessed: async (id) => {
        try {
          await fetch(`/api/projects/${id}/access`, {
            method: 'POST',
          });
        } catch (error) {
          console.warn('Failed to mark project as accessed:', error);
        }
      },

      clearCurrentProject: () => {
        set({
          currentProject: null,
          projectName: 'Untitled Project',
          isDirty: false
        });
      },
    }),
    {
      name: 'project-store',
      partialize: (state) => ({
        currentProject: state.currentProject,
        projectName: state.projectName,
        isDirty: state.isDirty,
      }),
    }
  )
);
