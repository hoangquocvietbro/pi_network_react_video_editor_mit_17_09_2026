"use client";

import { useState, useEffect } from 'react';
import { useProjectStore } from '../../store/use-project-store';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import {
  Search,
  Folder,
  Calendar,
  Clock,
  Eye,
  Loader2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface ProjectLoadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectLoad: (projectId: string) => void;
}

export function ProjectLoadDialog({
  open,
  onOpenChange,
  onProjectLoad
}: ProjectLoadDialogProps) {
  const {
    projects,
    isLoading,
    error,
    listProjects,
    loadProject
  } = useProjectStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isLoadingProject, setIsLoadingProject] = useState(false);

  // Load projects when dialog opens
  useEffect(() => {
    if (open) {
      loadProjects();
    }
  }, [open]);

  const loadProjects = async () => {
    try {
      await listProjects();
    } catch (error) {
      toast.error('Failed to load projects');
    }
  };

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId);
  };

  const handleLoadProject = async () => {
    if (!selectedProjectId) return;

    setIsLoadingProject(true);

    try {
      await loadProject(selectedProjectId);
      onProjectLoad(selectedProjectId);
      onOpenChange(false);
      toast.success('Project loaded successfully');
    } catch (error) {
      toast.error('Failed to load project');
    } finally {
      setIsLoadingProject(false);
    }
  };

  // Filter projects based on search query
  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    project.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Load Project</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Projects List */}
          <div className="max-h-96 overflow-y-auto space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="text-destructive mb-4">{error}</div>
                <Button onClick={loadProjects} variant="outline">
                  Try Again
                </Button>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Folder className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery ? 'No projects found' : 'No projects available'}
                </p>
              </div>
            ) : (
              filteredProjects.map((project) => (
                <ProjectItem
                  key={project.id}
                  project={project}
                  isSelected={selectedProjectId === project.id}
                  onSelect={handleProjectSelect}
                />
              ))
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleLoadProject}
              disabled={!selectedProjectId || isLoadingProject}
            >
              {isLoadingProject ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Load Project
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ProjectItemProps {
  project: any;
  isSelected: boolean;
  onSelect: (projectId: string) => void;
}

function ProjectItem({ project, isSelected, onSelect }: ProjectItemProps) {
  return (
    <div
      className={`p-4 border rounded-lg cursor-pointer transition-colors ${isSelected
          ? 'border-primary bg-primary/5'
          : 'border-border hover:bg-muted/50'
        }`}
      onClick={() => onSelect(project.id)}
    >
      <div className="flex items-start gap-4">
        {/* Thumbnail */}
        <div className="w-16 h-12 bg-muted rounded flex items-center justify-center flex-shrink-0">
          {project.thumbnail_url ? (
            <img
              src={project.thumbnail_url}
              alt={project.name}
              className="w-full h-full object-cover rounded"
            />
          ) : (
            <Folder className="w-6 h-6 text-muted-foreground" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{project.name}</h3>
              {project.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {project.description}
                </p>
              )}
            </div>
            {project.is_public && (
              <Badge variant="secondary" className="ml-2">
                <Eye className="w-3 h-3 mr-1" />
                Public
              </Badge>
            )}
          </div>

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {project.tags.slice(0, 3).map((tag: string) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {project.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{project.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Metadata */}
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
            </div>
            {project.last_accessed_at && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(project.last_accessed_at), { addSuffix: true })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
