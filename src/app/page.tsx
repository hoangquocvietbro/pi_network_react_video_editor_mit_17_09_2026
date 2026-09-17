"use client";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { ProjectList } from "../components/project-management/project-list";
import { CreateProjectDialog } from "../components/project-management/create-project-dialog";
import { Plus, Video, Folder, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useProjectStore } from "../store/use-project-store";
import { useAuthStore } from "../store/use-auth-store";
import { useEffect } from "react";
import {
	Dialog,
	DialogTrigger,
} from "../components/ui/dialog";
import { AuthProvider } from "../components/auth/auth-provider";
import { LogoIcons } from "../components/shared/logos";


import { Footer } from "../components/shared/footer";
import { Sparkles, Zap, Layers, PlayCircle, ShieldCheck } from "lucide-react";

function HomeContent() {
	const [showProjects, setShowProjects] = useState(false);
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const router = useRouter();
	const { currentProject } = useProjectStore();
	const { user, isAuthenticated, isLoading, _hasCheckedAuth } = useAuthStore() as any;
	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		setIsMounted(true);
	}, []);

	// Auto-show projects if user is authenticated
	useEffect(() => {
		if (isAuthenticated && !isLoading) {
			setShowProjects(true);
		}
	}, [isAuthenticated, isLoading]);

	// If authenticated, redirect to projects page
	useEffect(() => {
		if (_hasCheckedAuth && isAuthenticated && !isLoading) {
			router.push('/projects');
		}
	}, [_hasCheckedAuth, isAuthenticated, isLoading, router]);

	if (!isMounted) return <Loading />;

	const handleNewProject = () => {
		router.push('/edit/new');
	};

	const handleProjectSelect = (projectId: string) => {
		router.push(`/edit/${projectId}`);
	};

	return (
		<div className="min-h-screen bg-background flex flex-col justify-between">
			<div>
				{/* Header */}
				<header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md">
					<div className="container mx-auto px-4 py-3 flex items-center justify-between">
						<div className="flex items-center gap-2.5">
							<LogoIcons.scenify className="h-8 w-8 rounded-lg shadow-sm" />
							<div className="flex flex-col">
								<span className="font-bold text-lg tracking-tight leading-none">VEditor</span>
								<span className="text-[10px] text-muted-foreground font-mono">Pi Video Studio</span>
							</div>
						</div>
						<div className="flex items-center gap-2.5">
							{!isAuthenticated ? (
								<Button
									onClick={() => router.push('/auth/login')}
									size="sm"
									className="gap-1.5 shadow-sm"
								>
									<LogIn className="w-3.5 h-3.5" />
									<span>Pi Login</span>
								</Button>
							) : (
								<Button
									onClick={() => router.push('/projects')}
									variant="outline"
									size="sm"
									className="gap-1.5"
								>
									<Folder className="w-3.5 h-3.5" />
									<span>My Projects</span>
								</Button>
							)}
						</div>
					</div>
				</header>

				{!showProjects ? (
					// Landing Page Content
					<div className="container mx-auto px-4 py-12 md:py-20 max-w-5xl">
						<div className="text-center space-y-10">
							{/* Hero Section */}
							<div className="space-y-4 max-w-3xl mx-auto">
								<div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/25 px-3.5 py-1 text-xs font-medium text-primary">
									<Sparkles className="h-3.5 w-3.5 text-primary" />
									<span>Built for Pi Network Pioneers &bull; Web3 Creation</span>
								</div>
								<h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15]">
									{isAuthenticated && user ? (
										<>
											Welcome back,{" "}
											<span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
												{user.name}
											</span>
										</>
									) : (
										<>
											Create Stunning Videos Directly in{" "}
											<span className="bg-gradient-to-r from-primary via-emerald-400 to-teal-300 bg-clip-text text-transparent">
												Pi Browser
											</span>
										</>
									)}
								</h1>
								<p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
									{isAuthenticated
										? 'Continue working on your saved video projects or start a new viral creation below.'
										: 'Professional multi-track timeline video editor with native Remotion rendering, AI subtitles, and instant Pi payments.'}
								</p>
							</div>

							{/* Action Cards */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto text-left">
								{/* Create Project Card */}
								<Card
									className="group relative cursor-pointer overflow-hidden border-border/70 bg-card/80 backdrop-blur-sm hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
									onClick={handleNewProject}
								>
									<div className="absolute top-0 right-0 h-24 w-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all pointer-events-none" />
									<CardHeader className="pb-3">
										<div className="flex items-center gap-3">
											<div className="p-2.5 bg-primary/15 rounded-xl border border-primary/25 text-primary group-hover:scale-105 transition-transform">
												<Plus className="w-5 h-5" />
											</div>
											<div>
												<CardTitle className="text-lg">Start New Project</CardTitle>
												<CardDescription className="text-xs sm:text-sm">
													Begin editing a new video on the timeline
												</CardDescription>
											</div>
										</div>
									</CardHeader>
									<CardContent className="pt-2">
										<Button className="w-full gap-2 font-medium" onClick={handleNewProject}>
											<PlayCircle className="w-4 h-4" />
											Launch Editor
										</Button>
									</CardContent>
								</Card>

								{/* Second Card: Projects or Login */}
								{isAuthenticated ? (
									<Card
										className="group relative cursor-pointer overflow-hidden border-border/70 bg-card/80 backdrop-blur-sm hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
										onClick={() => router.push('/projects')}
									>
										<div className="absolute top-0 right-0 h-24 w-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all pointer-events-none" />
										<CardHeader className="pb-3">
											<div className="flex items-center gap-3">
												<div className="p-2.5 bg-secondary/80 rounded-xl border border-border text-foreground group-hover:scale-105 transition-transform">
													<Folder className="w-5 h-5 text-primary" />
												</div>
												<div>
													<CardTitle className="text-lg">My Projects</CardTitle>
													<CardDescription className="text-xs sm:text-sm">
														Access and continue your saved drafts
													</CardDescription>
												</div>
											</div>
										</CardHeader>
										<CardContent className="pt-2">
											<Button variant="outline" className="w-full gap-2" onClick={() => router.push('/projects')}>
												<Folder className="w-4 h-4" />
												Open Dashboard
											</Button>
										</CardContent>
									</Card>
								) : (
									<Card
										className="group relative cursor-pointer overflow-hidden border-border/70 bg-card/80 backdrop-blur-sm hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
										onClick={() => router.push('/auth/login')}
									>
										<div className="absolute top-0 right-0 h-24 w-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all pointer-events-none" />
										<CardHeader className="pb-3">
											<div className="flex items-center gap-3">
												<div className="p-2.5 bg-primary/15 rounded-xl border border-primary/25 text-primary group-hover:scale-105 transition-transform">
													<LogIn className="w-5 h-5" />
												</div>
												<div>
													<CardTitle className="text-lg">Pi Pioneer Sign In</CardTitle>
													<CardDescription className="text-xs sm:text-sm">
														1-click login with your Pi Network account
													</CardDescription>
												</div>
											</div>
										</CardHeader>
										<CardContent className="pt-2">
											<Button variant="outline" className="w-full gap-2 border-primary/30 hover:bg-primary/10" onClick={() => router.push('/auth/login')}>
												<LogIn className="w-4 h-4 text-primary" />
												Sign In with Pi
											</Button>
										</CardContent>
									</Card>
								)}
							</div>

							{/* Feature Highlights Grid */}
							<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8">
								<div className="p-4 rounded-xl border border-border/60 bg-card/50 text-left space-y-2">
									<div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center text-primary">
										<Layers className="w-4 h-4" />
									</div>
									<h3 className="font-semibold text-sm text-foreground">Multi-track Timeline</h3>
									<p className="text-xs text-muted-foreground leading-relaxed">
										Stack video, audio, text, images, and transitions on precise visual layers.
									</p>
								</div>

								<div className="p-4 rounded-xl border border-border/60 bg-card/50 text-left space-y-2">
									<div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400">
										<Zap className="w-4 h-4" />
									</div>
									<h3 className="font-semibold text-sm text-foreground">Fast WebCodecs</h3>
									<p className="text-xs text-muted-foreground leading-relaxed">
										Instant in-browser frame rendering with 0MB upload or cloud server acceleration.
									</p>
								</div>

								<div className="p-4 rounded-xl border border-border/60 bg-card/50 text-left space-y-2">
									<div className="w-9 h-9 rounded-lg bg-yellow-500/15 flex items-center justify-center text-yellow-400">
										<Sparkles className="w-4 h-4" />
									</div>
									<h3 className="font-semibold text-sm text-foreground">Pi Monetization</h3>
									<p className="text-xs text-muted-foreground leading-relaxed">
										VIP Passes &amp; Rewarded Ads powered by native Pi Network SDK.
									</p>
								</div>

								<div className="p-4 rounded-xl border border-border/60 bg-card/50 text-left space-y-2">
									<div className="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center text-blue-400">
										<ShieldCheck className="w-4 h-4" />
									</div>
									<h3 className="font-semibold text-sm text-foreground">100% Non-Custodial</h3>
									<p className="text-xs text-muted-foreground leading-relaxed">
										Your wallet passphrase is never requested or stored. Total privacy guaranteed.
									</p>
								</div>
							</div>
						</div>
					</div>
				) : (
					// Projects List View
					<div className="container mx-auto px-4 py-8">
						<div className="flex items-center justify-between mb-8">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setShowProjects(false)}
							>
								&larr; Back to Home
							</Button>
						</div>
						<ProjectList
							onProjectSelect={handleProjectSelect}
							onProjectCreate={() => setIsCreateDialogOpen(true)}
						/>
					</div>
				)}
			</div>

			{/* Footer */}
			<Footer />
		</div>
	);
}

import dynamic from 'next/dynamic';
// Import English Loading component
import Loading from "./loading";

// Lazy load home page content
const DynamicHomeContent = dynamic(() => Promise.resolve(HomeContent), {
	ssr: false,
	loading: () => <Loading />
});


export default function Home() {
	return (
		<AuthProvider>
			<DynamicHomeContent />
		</AuthProvider>
	);
}
