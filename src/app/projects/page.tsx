"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useProjectStore } from "../../store/use-project-store";
import { useAuthStore } from "../../store/use-auth-store";
import { AuthProvider } from "../../components/auth/auth-provider";
import { ProjectList } from "../../components/project-management/project-list";
import { CreateProjectDialog } from "../../components/project-management/create-project-dialog";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { LogoIcons } from "../../components/shared/logos";
import { UserProfile } from "../../components/auth/user-profile";

import { Footer } from "../../components/shared/footer";

function ProjectsContent() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const router = useRouter();
  const { projects, listProjects, isLoading } = useProjectStore();
  const { isAuthenticated } = useAuthStore();

  // Load projects when component mounts
  useEffect(() => {
    if (isAuthenticated) {
      listProjects();
    }
  }, [isAuthenticated, listProjects]);

  const handleProjectSelect = (projectId: string) => {
    console.log('🔍 Project selected:', projectId);
    router.push(`/edit/${projectId}`);
  };

  const handleNewProject = () => {
    router.push('/edit/new');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border/80 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please sign in with Pi Network to view your projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button onClick={() => router.push('/auth/login')} className="w-full">
                Sign In with Pi
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <div>
        {/* Header - matching home page style */}
        <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className="flex items-center gap-2.5 cursor-pointer"
                onClick={() => router.push('/')}
              >
                <LogoIcons.scenify className="h-8 w-8 rounded-lg" />
                <span className="font-bold text-lg tracking-tight">VEditor</span>
              </div>
            </div>
            <UserProfile />
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Projects List */}
          <ProjectList
            onProjectSelect={handleProjectSelect}
            onProjectCreate={() => setIsCreateDialogOpen(true)}
          />

          {/* Create Project Dialog */}
          <CreateProjectDialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
            onProjectCreate={(project) => {
              setIsCreateDialogOpen(false);
              handleProjectSelect(project.id);
            }}
          />
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <AuthProvider requireAuth={true} redirectTo="/auth/login">
      <ProjectsContent />
    </AuthProvider>
  );
}
