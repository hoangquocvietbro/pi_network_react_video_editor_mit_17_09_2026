"use client";

import { useEffect, useState } from 'react';
import { useProjectStore } from '../../store/use-project-store';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import {
  Search,
  Plus,
  Folder,
  Calendar,
  Clock,
  Eye,
  MoreVertical,
  Edit,
  Trash2,
  Copy
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { CreateProjectDialog } from './create-project-dialog';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface ProjectListProps {
  onProjectSelect?: (projectId: string) => void;
  onProjectCreate?: () => void;
}

export function ProjectList({ onProjectSelect, onProjectCreate }: ProjectListProps) {
  const {
    projects,
    isLoading,
    error,
    listProjects,
    deleteProject,
    setCurrentProject,
    clearCurrentProject
  } = useProjectStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      await listProjects();
    } catch (error) {
      toast.error('Failed to load projects');
    }
  };

  const handleProjectSelect = async (projectId: string) => {
    try {
      await setCurrentProject(projects.find(p => p.id === projectId) as any);
      onProjectSelect?.(projectId);
    } catch (error) {
      toast.error('Failed to load project');
    }
  };

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (!confirm(`Are you sure you want to delete "${projectName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteProject(projectId);
      toast.success('Project deleted successfully');
    } catch (error) {
      toast.error('Failed to delete project');
    }
  };

  const handleCreateProject = () => {
    setIsCreateDialogOpen(true);
    onProjectCreate?.();
  };

  const handleDuplicateProject = async (projectId: string) => {
    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) return;

      // This would require loading the full project data first
      // For now, just show a toast
      toast.info('Duplicate feature coming soon');
    } catch (error) {
      toast.error('Failed to duplicate project');
    }
  };

  // Filter projects based on search query
  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    project.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="text-destructive mb-4">{error}</div>
        <Button onClick={loadProjects} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Projects</h1>
          <p className="text-muted-foreground">
            {projects.length} project{projects.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreateProject}>
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </DialogTrigger>
          <CreateProjectDialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
            onProjectCreate={(project) => {
              console.log("Created project:", project);
              setIsCreateDialogOpen(false);
            }}
          />
        </Dialog>
      </div>

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

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <Folder className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {searchQuery ? 'No projects found' : 'No projects yet'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery
              ? 'Try adjusting your search terms'
              : 'Create your first project to get started'
            }
          </p>
          {!searchQuery && (
            <Button onClick={handleCreateProject}>
              <Plus className="w-4 h-4 mr-2" />
              Create Project
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onSelect={handleProjectSelect}
              onDelete={handleDeleteProject}
              onDuplicate={handleDuplicateProject}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ProjectCardProps {
  project: any;
  onSelect: (projectId: string) => void;
  onDelete: (projectId: string, projectName: string) => void;
  onDuplicate: (projectId: string) => void;
}

function ProjectCard({ project, onSelect, onDelete, onDuplicate }: ProjectCardProps) {
  return (
    <Card className="group hover:border-primary/50 hover:shadow-lg transition-all duration-200 cursor-pointer bg-card/90 border-border/70">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle
              className="text-base sm:text-lg font-semibold truncate cursor-pointer hover:text-primary transition-colors"
              onClick={() => onSelect(project.id)}
            >
              {project.name}
            </CardTitle>
            {project.description && (
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                {project.description}
              </p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground shrink-0"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onSelect(project.id)}>
                <Edit className="w-4 h-4 mr-2" />
                Open
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(project.id)}>
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(project.id, project.name)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Thumbnail placeholder */}
        <div className="aspect-video bg-muted rounded-lg mb-4 flex items-center justify-center">
          {project.thumbnail_url ? (
            <img
              src={project.thumbnail_url}
              alt={project.name}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <div className="text-muted-foreground">
              <Folder className="w-12 h-12 mx-auto mb-2" />
              <p className="text-sm">No preview</p>
            </div>
          )}
        </div>

        {/* Tags */}
        {project.tags && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {project.tags.slice(0, 3).map((tag: string) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {project.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{project.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
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
          {project.is_public && (
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              Public
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
