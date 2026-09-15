"use client";

import React, { useState } from 'react';
import { useProjectStore } from '../../store/use-project-store';
import { useAuthStore } from '../../store/use-auth-store';
import { Button } from '../ui/button';
import { Save, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { toast } from 'sonner';
import type StateManager from '@designcombo/state';
import type { IDesign } from '@designcombo/types';
import { ExportLoginPrompt } from '../auth/export-login-prompt';

interface ProjectSaveButtonProps {
  stateManager: StateManager;
  projectName: string;
  onProjectSaved?: (projectId: string) => void;
  iconOnly?: boolean;
}

export function ProjectSaveButton({
  stateManager,
  projectName,
  onProjectSaved,
  iconOnly = false
}: ProjectSaveButtonProps) {
  const {
    currentProject,
    isDirty,
    createProject,
    updateProject,
    setProjectName
  } = useProjectStore();
  const { isAuthenticated } = useAuthStore();

  const [isSaving, setIsSaving] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const handleSave = async () => {
    // Require authentication for saving
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }

    if (!projectName.trim()) {
      toast.error('Please enter a project name');
      return;
    }

    setIsSaving(true);

    try {
      const designData: IDesign = {
        id: currentProject?.id || '', // Use existing ID if available
        ...stateManager.toJSON()
      };

      let savedProject;

      if (currentProject) {
        // Update existing project
        savedProject = await updateProject(currentProject.id, {
          name: projectName,
          design_data: designData,
        });
      } else {
        // Create new project
        savedProject = await createProject({
          name: projectName,
          design_data: designData,
        });
      }

      toast.success(
        currentProject ? 'Project updated successfully' : 'Project saved successfully'
      );

      onProjectSaved?.(savedProject.id);
    } catch (error) {
      toast.error('Failed to save project');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAs = async () => {
    // Require authentication for saving
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }

    const newName = prompt('Enter new project name:', projectName);
    if (!newName?.trim()) return;

    setIsSaving(true);

    try {
      const designData: IDesign = {
        id: '', // New project
        ...stateManager.toJSON()
      };

      const savedProject = await createProject({
        name: newName.trim(),
        design_data: designData,
      });

      toast.success('Project saved as new');
      onProjectSaved?.(savedProject.id);
    } catch (error) {
      toast.error('Failed to save project');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAutoSave = async () => {
    if (!currentProject || !isDirty || !isAuthenticated) return;

    try {
      const designData: IDesign = {
        id: currentProject.id,
        ...stateManager.toJSON()
      };

      await updateProject(currentProject.id, {
        design_data: designData,
      });

      // Update project name if changed
      if (projectName !== currentProject.name) {
        setProjectName(projectName);
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  };

  // Auto-save effect (every 30 seconds) - only for authenticated users
  React.useEffect(() => {
    if (!currentProject || !isDirty || !isAuthenticated) return;

    const interval = setInterval(handleAutoSave, 30000);
    return () => clearInterval(interval);
  }, [currentProject, isDirty, projectName, isAuthenticated]);

  const handleButtonClick = () => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            disabled={isSaving}
            size={iconOnly ? "icon" : "sm"}
            className={`relative shrink-0 border border-border shadow-sm ${iconOnly ? "h-8 w-8 p-0" : "h-8"}`}
            onClick={handleButtonClick}
            title={currentProject ? "Save Changes" : "Save Project"}
            aria-label="Save Project"
          >
            {isSaving ? (
              <Loader2 className={`w-4 h-4 animate-spin ${iconOnly ? "" : "mr-2"}`} />
            ) : (
              <Save className={`w-4 h-4 ${iconOnly ? "" : "mr-2"}`} />
            )}
            {!iconOnly && "Save"}
            {isDirty && isAuthenticated && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full"></span>
            )}
            {!isAuthenticated && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full"></span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {currentProject ? 'Save Changes' : 'Save Project'}
            {!isAuthenticated && <span className="ml-2 text-xs text-yellow-500">(Login)</span>}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSaveAs} disabled={isSaving}>
            Save As...
            {!isAuthenticated && <span className="ml-2 text-xs text-yellow-500">(Login)</span>}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled>
            {isAuthenticated
              ? `Auto-save: ${isDirty ? 'Pending' : 'Up to date'}`
              : 'Login to enable auto-save'
            }
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ExportLoginPrompt
        open={showLoginPrompt}
        onOpenChange={setShowLoginPrompt}
        remainingExports={0}
      />
    </>
  );
}
