import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { dispatch } from "@designcombo/events";
import { HISTORY_UNDO, HISTORY_REDO, DESIGN_RESIZE, EDIT_OBJECT } from "@designcombo/state";
import useStore from "./store/use-store";
import { Icons } from "@/components/shared/icons";

import { getSSRMode } from './store/use-download-state';
import { VipPaymentButton } from '@/components/vip-payment-button';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
	ChevronDown,
	Download,
	ProportionsIcon,
	ShareIcon,
	CloudIcon,
	MonitorIcon,
	MoreHorizontal,
	SaveIcon,
	SwitchCamera,
	DownloadIcon,
	Lock,
	LogIn,
	UserPlus,
	Crown
} from "lucide-react";
import { Label } from "@/components/ui/label";

import type StateManager from "@designcombo/state";
import { generateId } from "@designcombo/timeline";
import type { IDesign } from "@designcombo/types";
import { useDownloadState } from "./store/use-download-state";
import { useAuthStore } from "../../store/use-auth-store";
import { useExportLimitStore } from "../../store/use-export-limit-store";
import { ExportLoginPrompt } from "../../components/auth/export-login-prompt";
import DownloadProgressModal from "./download-progress-modal";
import AutosizeInput from "@/components/ui/autosize-input";
import { debounce } from "lodash";
import {
	useIsLargeScreen,
	useIsMediumScreen,
	useIsSmallScreen,
} from "@/hooks/use-media-query";

import { LogoIcons } from "@/components/shared/logos";
import Link from "next/link";
import { ProjectSaveButton } from "../../components/project-management/project-save-button";
import { UserProfile } from "../../components/auth/user-profile";
import { usePiAds, usePiPayment } from "../../lib/pi-payment";
import { usePiAuth } from "../../contexts/pi-auth-context";
import { toast } from "sonner";
export default function Navbar({
	user,
	stateManager,
	setProjectName,
	projectName,
}: {
	user: any | null;
	stateManager: StateManager;
	setProjectName: (name: string) => void;
	projectName: string;
}) {
	const [title, setTitle] = useState(projectName);
	const isLargeScreen = useIsLargeScreen();
	const isMediumScreen = useIsMediumScreen();
	const isSmallScreen = useIsSmallScreen();
	const { isAuthenticated, isLoading, _hasCheckedAuth } = useAuthStore() as any;
	const handleUndo = () => {
		dispatch(HISTORY_UNDO);
	};

	const handleRedo = () => {
		dispatch(HISTORY_REDO);
	};

	const handleCreateProject = async () => { };

	// Create a debounced function for setting the project name
	const debouncedSetProjectName = useCallback(
		debounce((name: string) => {
			console.log("Debounced setProjectName:", name);
			setProjectName(name);
		}, 2000), // 2 seconds delay
		[],
	);

	// Update the debounced function whenever the title changes
	useEffect(() => {
		debouncedSetProjectName(title);
	}, [title, debouncedSetProjectName]);

	const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setTitle(e.target.value);
	};

	return (
		<div
			style={{
				display: "grid",
				gridTemplateColumns: isLargeScreen ? "320px 1fr 320px" : "auto 1fr auto"
			}}
			className="bg-muted/95 backdrop-blur-sm pointer-events-none flex h-11 items-center border-b border-border/80 px-2 gap-1"
		>
			<DownloadProgressModal />

			<div className="flex items-center gap-1 sm:gap-2">
				<Link
					href="/projects"
					className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-md hover:bg-zinc-800 text-zinc-200 transition-colors"
					title="Back to Projects"
				>
					<LogoIcons.scenify className="h-6 w-6 rounded" />
				</Link>

				<div className="pointer-events-auto flex h-8 items-center">
					<Button
						onClick={handleUndo}
						className="text-muted-foreground h-8 w-8"
						variant="ghost"
						size="icon"
						title="Undo"
					>
						<Icons.undo width={17} />
					</Button>
					<Button
						onClick={handleRedo}
						className="text-muted-foreground h-8 w-8"
						variant="ghost"
						size="icon"
						title="Redo"
					>
						<Icons.redo width={17} />
					</Button>
				</div>
			</div>

			<div className="flex h-11 items-center justify-center gap-1 overflow-hidden px-1">
				<div className="pointer-events-auto flex h-8 items-center gap-1.5 rounded-md px-1 text-muted-foreground max-w-full">
					<AutosizeInput
						name="title"
						value={title}
						onChange={handleTitleChange}
						width={isSmallScreen ? 110 : 200}
						inputClassName="border-none outline-none px-1.5 bg-background/70 rounded text-xs sm:text-sm font-medium text-zinc-200 truncate"
					/>
				</div>
			</div>

			<div className="flex h-11 items-center justify-end gap-1.5">
				<div className="pointer-events-auto flex h-10 items-center gap-1.5 rounded-md">
					{/* Desktop View: Show all buttons */}
					{!isSmallScreen && (
						<>
							<ResizeVideo />
							<ProjectSaveButton
								stateManager={stateManager}
								projectName={projectName}
							/>

							<ShareButton isAuthenticated={isAuthenticated} isMediumScreen={isMediumScreen} />

							<DownloadPopover stateManager={stateManager} />
						</>
					)}

					{/* Mobile View: Show Save icon + Export icon + menu button */}
					{isSmallScreen && (
						<div className="flex items-center gap-1.5">
							<ProjectSaveButton
								stateManager={stateManager}
								projectName={projectName}
								iconOnly={true}
							/>
							<DownloadPopover stateManager={stateManager} iconOnly={true} />
							<MobileMenu stateManager={stateManager} projectName={projectName} />
						</div>
					)}

					{/* User Profile - hidden on mobile since login is in MobileMenu */}
					{!isSmallScreen && (
						<>
							{!_hasCheckedAuth || isLoading ? (
								// Show skeleton while checking auth
								<div className="flex gap-2">
									<div className="h-8 w-16 bg-muted animate-pulse rounded-md" />
								</div>
							) : isAuthenticated ? (
								<UserProfile />
							) : (
								<div className="flex gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => window.location.href = '/auth/login'}
									>
										Sign In
									</Button>
								</div>
							)}
						</>
					)}				</div>
			</div>
		</div>
	);
}

const DownloadPopover = ({ stateManager, iconOnly = false }: { stateManager: StateManager; iconOnly?: boolean }) => {
	const isMediumScreen = useIsMediumScreen();
	const { actions, exportType, renderMode } = useDownloadState();
	const { isAuthenticated } = useAuthStore();
	const { canExportAnonymously, incrementExportCount, getRemainingExports } = useExportLimitStore();
	const [isExportTypeOpen, setIsExportTypeOpen] = useState(false);
	const [open, setOpen] = useState(false);
	const [showLoginPrompt, setShowLoginPrompt] = useState(false);
	const [isProcessingPi, setIsProcessingPi] = useState(false);

	const { user } = useAuthStore();
	const { buyRemoveAds, buyRemoteRenderMonthly, hasRemovedAds, hasRemoteRender } = usePiPayment();
	const { isAdNetworkSupported, showInterstitial } = usePiAds();

	const isCSR = renderMode === 'csr';
	const remainingExports = getRemainingExports();
	const canExport = isAuthenticated || (isCSR && canExportAnonymously());

	const handleExport = async () => {
		// Check if user can export
		if (!isAuthenticated) {
			if (!isCSR) {
				// SSR requires login
				setShowLoginPrompt(true);
				return;
			}
			if (!canExportAnonymously()) {
				// Free exports exhausted
				setShowLoginPrompt(true);
				return;
			}
			// Increment anonymous export count
			incrementExportCount();
		}

		// Pi Network Monetization Check: Only show ad if user has NOT removed ads
		if (!hasRemovedAds && isAuthenticated) {
			try {
				setIsProcessingPi(true);
				console.log("[Export] Showing Pi Interstitial Ad before video render...");
				await showInterstitial();
			} catch (adErr) {
				console.warn("[Export] Pi Ad display error:", adErr);
			} finally {
				setIsProcessingPi(false);
			}
		}
		const data: IDesign = {
			id: generateId(),
			...stateManager.getState(),
		};

		actions.setState({ payload: data });
		setOpen(false); // Close popover when export starts
		actions.startExport();
	};

	const handleBuyRemoveAds = async () => {
		try {
			setIsProcessingPi(true);
			const res = await buyRemoveAds();
			if (res.success) {
				toast.success("Successfully unlocked Remove Ads Pass (5 Pi)!");
			} else if (res.error) {
				toast.error(res.error);
			}
		} catch (e: any) {
			toast.error(e?.message || "Payment failed. Please try again.");
		} finally {
			setIsProcessingPi(false);
		}
	};

	const handleBuyRemoteRender = async () => {
		try {
			setIsProcessingPi(true);
			const res = await buyRemoteRenderMonthly();
			if (res.success) {
				toast.success("Successfully activated 1 Month Remote Render Pass (10 Pi)!");
			} else if (res.error) {
				toast.error(res.error);
			}
		} catch (e: any) {
			toast.error(e?.message || "Payment failed. Please try again.");
		} finally {
			setIsProcessingPi(false);
		}
	};

	const handleRenderModeToggle = () => {
		if (!isAuthenticated && isCSR) {
			// Anonymous trying to switch to SSR - show login
			setShowLoginPrompt(true);
			return;
		}
		// Toggle between CSR and configured SSR mode

		const ssrMode = getSSRMode();
		actions.setRenderMode(isCSR ? ssrMode : 'csr');
	};
	return (
		<>
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						className={
							iconOnly
								? "flex h-8 w-8 items-center justify-center p-0 border border-border shadow-sm shrink-0"
								: "flex h-8 gap-1.5 border border-border text-xs sm:text-sm font-medium px-2.5 shadow-sm"
						}
						size={iconOnly ? "icon" : "sm"}
						title="Export Video"
						aria-label="Export Video"
					>
						<Download width={16} />
						{!iconOnly && <span>Export</span>}
					</Button>
				</PopoverTrigger>
				<PopoverContent
					align="end"
					className="bg-sidebar z-[250] flex w-72 flex-col gap-4"
				>
					<Label>Export settings</Label>

					{/* Free exports remaining (only show for anonymous) */}
					{!isAuthenticated && (
						<div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm">
							<span className="text-muted-foreground">Free exports left:</span>
							<span className={`font-medium ${remainingExports === 0 ? 'text-destructive' : 'text-primary'}`}>
								{remainingExports}
							</span>
						</div>
					)}

					{/* Pi Network Packages Upgrade Banner */}
					{isAuthenticated && (!hasRemovedAds || !hasRemoteRender) && (
						<div className="flex flex-col items-start gap-2 rounded-md bg-primary/10 border border-primary/20 px-3 py-2 text-sm">
							<span className="text-primary font-semibold text-xs flex items-center gap-1.5">
								<Crown className="w-3.5 h-3.5 text-yellow-500" /> Upgrade Pi Account
							</span>
							<span className="text-muted-foreground text-[11px] leading-tight">
								Enjoy an ad-free experience or enable lightning-fast cloud rendering.
							</span>
							<div className="flex flex-col gap-1.5 w-full pt-1">
								{!hasRemovedAds && (
									<Button
										size="sm"
										variant="outline"
										onClick={handleBuyRemoveAds}
										disabled={isProcessingPi}
										className="w-full text-xs h-7 justify-between border-primary/30 hover:bg-primary/20"
									>
										<span>Remove Ads</span>
										<span className="font-semibold text-primary">5 Pi</span>
									</Button>
								)}
								{!hasRemoteRender && (
									<Button
										size="sm"
										onClick={handleBuyRemoteRender}
										disabled={isProcessingPi}
										className="w-full text-xs h-7 justify-between bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-500 border border-yellow-500/40"
									>
										<span>Remote Render (1 Month)</span>
										<span className="font-semibold text-yellow-400">10 Pi</span>
									</Button>
								)}
							</div>
						</div>
					)}

					{/* Format Selection */}
					<div className="space-y-2">
						<Label className="text-xs text-muted-foreground">Format</Label>
						<Popover open={isExportTypeOpen} onOpenChange={setIsExportTypeOpen}>
							<PopoverTrigger asChild>
								<Button className="w-full justify-between" variant="outline">
									<div>{exportType.toUpperCase()}</div>
									<ChevronDown width={16} />
								</Button>
							</PopoverTrigger>
							<PopoverContent className="bg-background z-[251] w-[--radix-popover-trigger-width] px-2 py-2">
								<div
									className="flex h-7 items-center rounded-sm px-3 text-sm hover:cursor-pointer hover:bg-zinc-800"
									onClick={() => {
										actions.setExportType("mp4");
										setIsExportTypeOpen(false);
									}}
								>
									MP4
								</div>
								<div
									className="flex h-7 items-center rounded-sm px-3 text-sm hover:cursor-pointer hover:bg-zinc-800"
									onClick={() => {
										actions.setExportType("json");
										setIsExportTypeOpen(false);
									}}
								>
									JSON
								</div>
							</PopoverContent>
						</Popover>
					</div>

					{/* Quality Selection */}
					{exportType === "mp4" && (
						<div className="space-y-2">
							<Label className="text-xs text-muted-foreground">Quality</Label>
							<Popover>
								<PopoverTrigger asChild>
									<Button className="w-full justify-between" variant="outline">
										<div>
											{useDownloadState.getState().exportQuality === 'high' && "High (Original)"}
											{useDownloadState.getState().exportQuality === 'standard' && "Standard (HD 720p)"}
											{useDownloadState.getState().exportQuality === 'low' && "Low (SD 480p)"}
										</div>
										<ChevronDown width={16} />
									</Button>
								</PopoverTrigger>
								<PopoverContent className="bg-background z-[251] w-[--radix-popover-trigger-width] px-2 py-2">
									<div
										className="flex h-9 items-center rounded-sm px-3 text-sm hover:cursor-pointer hover:bg-zinc-800"
										onClick={() => actions.setExportQuality('high')}
									>
										High (Original) - Best Quality
									</div>
									<div
										className="flex h-9 items-center rounded-sm px-3 text-sm hover:cursor-pointer hover:bg-zinc-800"
										onClick={() => actions.setExportQuality('standard')}
									>
										Standard (HD 720p) - Faster
									</div>
									<div
										className="flex h-9 items-center rounded-sm px-3 text-sm hover:cursor-pointer hover:bg-zinc-800"
										onClick={() => actions.setExportQuality('low')}
									>
										Low (SD 480p) - Smallest File
									</div>
								</PopoverContent>
							</Popover>
						</div>
					)}

					{/* Render Mode Selection */}
					{exportType === "mp4" && (
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label className="text-xs text-muted-foreground">
									Render Mode
									{!isAuthenticated && !isCSR && (
										<span className="ml-1.5 text-yellow-500 font-normal">(Login required)</span>
									)}
								</Label>
								<span className="text-[11px] font-medium text-emerald-500">
									{isCSR ? "✓ CSR (Default)" : "⚡ Remote Server"}
								</span>
							</div>
							<div className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/20 p-2.5">
								<div className="flex flex-col gap-0.5 max-w-[135px]">
									<span className="text-xs font-semibold text-foreground">
										{isCSR ? "Browser (CSR)" : "Remote Server"}
									</span>
									<span className="text-[11px] text-muted-foreground leading-tight">
										{isCSR
											? "Directly on device (Free & Fast)"
											: "Cloud render server"
										}
									</span>
								</div>
								{/* 2-Option Pill Selector */}
								<div className="flex items-center rounded-lg bg-muted p-1 border border-border/50 shrink-0">
									<button
										type="button"
										onClick={() => actions.setRenderMode('csr')}
										className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${isCSR
											? 'bg-background text-foreground shadow-sm font-semibold'
											: 'text-muted-foreground hover:text-foreground'
											}`}
										title="Client-Side Rendering (Browser via WebCodecs)"
									>
										<MonitorIcon width={13} height={13} />
										<span>CSR</span>
									</button>
									<button
										type="button"
										onClick={() => {
											if (!isAuthenticated) {
												setShowLoginPrompt(true);
												return;
											}
											actions.setRenderMode(getSSRMode());
										}}
										className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${!isCSR
											? 'bg-background text-foreground shadow-sm font-semibold'
											: 'text-muted-foreground hover:text-foreground'
											}`}
										title="Remote Server Rendering"
									>
										<CloudIcon width={13} height={13} />
										<span>Remote</span>
									</button>
								</div>
							</div>
						</div>
					)}


					<div>
						<Button
							onClick={handleExport}
							className="w-full"
							disabled={(!canExport && exportType === "mp4") || isProcessingPi}
						>
							{isProcessingPi ? "Loading Ad..." : (!canExport && exportType === "mp4" ? "Login to Export" : "Export")}
						</Button>
					</div>
				</PopoverContent>
			</Popover>

			{/* Login Prompt Modal */}
			<ExportLoginPrompt
				open={showLoginPrompt}
				onOpenChange={setShowLoginPrompt}
				remainingExports={remainingExports}
			/>
		</>
	);
};

const MobileMenu = ({ stateManager, projectName }: { stateManager: StateManager; projectName: string }) => {
	const { actions, exportType } = useDownloadState();
	const { isAuthenticated } = useAuthStore();
	const [open, setOpen] = useState(false);
	const [showLoginPrompt, setShowLoginPrompt] = useState(false);
	const [isProcessingPi, setIsProcessingPi] = useState(false);

	const { user } = useAuthStore();
	const { buyVipPass } = usePiPayment();
	const { isAdNetworkSupported, showInterstitial } = usePiAds();

	const { renderMode } = useDownloadState();
	const { canExportAnonymously, incrementExportCount, getRemainingExports } = useExportLimitStore();

	const isVip = Boolean(user?.is_vip);

	const isCSR = renderMode === 'csr';
	const remainingExports = getRemainingExports();
	const canExport = isAuthenticated || (isCSR && canExportAnonymously());

	const handleSave = () => {
		if (!isAuthenticated) {
			setOpen(false);
			setShowLoginPrompt(true);
			return;
		}
		// TODO: Implement save for mobile
		setOpen(false);
	};

	const handleBuyVip = async () => {
		try {
			setIsProcessingPi(true);
			const res = await buyVipPass(1.0);
			if (res.success) {
				toast.success("Successfully purchased VIP Pass!");
			} else if (res.error) {
				toast.error(res.error);
			}
		} catch (e: any) {
			toast.error(e?.message || "Purchase failed. Try again.");
		} finally {
			setIsProcessingPi(false);
		}
	};

	const handleShare = () => {
		if (!isAuthenticated) {
			setOpen(false);
			setShowLoginPrompt(true);
			return;
		}
		// TODO: Implement share for mobile
		setOpen(false);
	};

	const handleResize = (width: number, height: number, name: string) => {
		executeResizeAndAutoFit(width, height, name);
		setOpen(false);
	};





	const handleExport = async () => {
		// Check if user can export
		if (!isAuthenticated) {
			if (!isCSR) {
				// SSR requires login
				setShowLoginPrompt(true);
				return;
			}
			if (!canExportAnonymously()) {
				// Free exports exhausted
				setShowLoginPrompt(true);
				return;
			}
			// Increment anonymous export count
			incrementExportCount();
		}

		// Pi Network Monetization Check
		if (!isVip && isAuthenticated) {
			try {
				setIsProcessingPi(true);
				console.log("[Export] Showing Pi Interstitial Ad before video render (Mobile)...");
				await showInterstitial();
			} catch (adErr) {
				console.warn("[Export] Pi Ad display error (Mobile):", adErr);
			} finally {
				setIsProcessingPi(false);
			}
		}

		const data: IDesign = {
			id: generateId(),
			...stateManager.toJSON()
		};

		console.log({ data });

		actions.setState({ payload: data });
		setOpen(false); // Close popover when export starts
		actions.startExport();
	};


	const handleRenderModeToggle = () => {
		if (!isAuthenticated && isCSR) {
			// Anonymous trying to switch to SSR - show login
			setShowLoginPrompt(true);
			return;
		}
		// Toggle between CSR and configured SSR mode

		const ssrMode = getSSRMode();
		actions.setRenderMode(isCSR ? ssrMode : 'csr');
	};

	return (
		<>
			<DropdownMenu open={open} onOpenChange={setOpen}>
				<DropdownMenuTrigger asChild>
					<Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 shrink-0">
						<MoreHorizontal width={18} />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-56 z-[250]">
					{/* Login/Register for anonymous users */}
					{!isAuthenticated && (
						<>
							<DropdownMenuItem onClick={() => { setOpen(false); window.location.href = '/auth/login'; }}>
								<LogIn className="mr-2 h-4 w-4" />
								Sign In
							</DropdownMenuItem>
							<DropdownMenuSeparator />
						</>
					)}

					{/* Resize Options */}
					<DropdownMenuItem onClick={() => handleResize(1920, 1080, "16:9")}>
						<ProportionsIcon className="mr-2 h-4 w-4" />
						16:9 (Landscape)
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => handleResize(1080, 1920, "9:16")}>
						<ProportionsIcon className="mr-2 h-4 w-4" />
						9:16 (Portrait)
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => handleResize(1080, 1080, "1:1")}>
						<ProportionsIcon className="mr-2 h-4 w-4" />
						1:1 (Square)
					</DropdownMenuItem>

					<DropdownMenuSeparator />

					{/* Save - requires auth */}
					<DropdownMenuItem onClick={handleSave}>
						<SaveIcon className="mr-2 h-4 w-4" />
						Save Project
						{!isAuthenticated && <Lock className="ml-auto h-3 w-3 text-yellow-500" />}
					</DropdownMenuItem>

					{/* Share - requires auth */}
					<DropdownMenuItem onClick={handleShare}>
						<ShareIcon className="mr-2 h-4 w-4" />
						Share
						{!isAuthenticated && <Lock className="ml-auto h-3 w-3 text-yellow-500" />}
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					{/* Render Mode Section */}
					<div className="px-2 py-1.5 flex flex-col gap-1.5">
						<div className="flex items-center justify-between text-xs text-muted-foreground">
							<span className="flex items-center gap-1.5 font-medium">
								<SwitchCamera className="h-3.5 w-3.5" />
								Render Mode
							</span>
							<span className="text-[10px] text-emerald-500 font-semibold">
								{isCSR ? "CSR (Default)" : "Remote"}
							</span>
						</div>
						<div className="flex items-center rounded-lg bg-muted p-1 border border-border/50">
							<button
								type="button"
								onClick={() => actions.setRenderMode('csr')}
								className={`flex-1 flex items-center justify-center gap-1.5 py-1 text-xs font-medium rounded-md transition-all ${isCSR
									? 'bg-background text-foreground shadow-sm font-semibold'
									: 'text-muted-foreground hover:text-foreground'
									}`}
							>
								<MonitorIcon width={13} height={13} />
								<span>CSR</span>
							</button>
							<button
								type="button"
								onClick={() => {
									if (!isAuthenticated) {
										setOpen(false);
										setShowLoginPrompt(true);
										return;
									}
									actions.setRenderMode(getSSRMode());
								}}
								className={`flex-1 flex items-center justify-center gap-1.5 py-1 text-xs font-medium rounded-md transition-all ${!isCSR
									? 'bg-background text-foreground shadow-sm font-semibold'
									: 'text-muted-foreground hover:text-foreground'
									}`}
							>
								<CloudIcon width={13} height={13} />
								<span>Remote</span>
							</button>
						</div>
					</div>
					<DropdownMenuSeparator />
					{/* Pi Payment Section - Bottom */}
					{/* <DropdownMenuItem>
            <VipPaymentButton />
          </DropdownMenuItem> */}

					{/* Export - requires auth */}
					<DropdownMenuItem onClick={handleExport} disabled={isProcessingPi}>
						<Download className="mr-2 h-4 w-4" />
						{isProcessingPi ? "Loading..." : `Export ${exportType.toUpperCase()}`}
						{!isAuthenticated && <Lock className="ml-auto h-3 w-3 text-yellow-500" />}
					</DropdownMenuItem>

					{/* VIP Upgrade Menu */}
					{isAuthenticated && !isVip && (
						<>
							<DropdownMenuSeparator />
							<DropdownMenuItem onClick={handleBuyVip} className="text-primary font-semibold" disabled={isProcessingPi}>
								{isProcessingPi ? "Processing..." : "Get VIP (1 Pi)"}
							</DropdownMenuItem>
						</>
					)}

					{/* Legal Links for Pi Compliance */}
					<DropdownMenuSeparator />
					<DropdownMenuItem onClick={() => { setOpen(false); window.location.href = '/terms'; }}>
						Terms of Service
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => { setOpen(false); window.location.href = '/privacy'; }}>
						Privacy Policy
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
};

interface ResizeOptionProps {
	label: string;
	icon: string;
	value: ResizeValue;
	description: string;
}

interface ResizeValue {
	width: number;
	height: number;
	name: string;
}

const RESIZE_OPTIONS: ResizeOptionProps[] = [
	{
		label: "16:9",
		icon: "landscape",
		description: "YouTube ads",
		value: {
			width: 1920,
			height: 1080,
			name: "16:9",
		},
	},
	{
		label: "9:16",
		icon: "portrait",
		description: "TikTok, YouTube Shorts",
		value: {
			width: 1080,
			height: 1920,
			name: "9:16",
		},
	},
	{
		label: "1:1",
		icon: "square",
		description: "Instagram, Facebook posts",
		value: {
			width: 1080,
			height: 1080,
			name: "1:1",
		},
	},
];
export const executeResizeAndAutoFit = (
	newWidth: number,
	newHeight: number,
	name: string
) => {
	const { trackItemsMap, size: oldSize } = useStore.getState();

	// 1. Dispatch canvas resize
	dispatch(DESIGN_RESIZE, {
		payload: { width: newWidth, height: newHeight, name }
	});

	// 2. Auto-fit and center all existing media items
	if (trackItemsMap && Object.keys(trackItemsMap).length > 0) {
		const payloadUpdates: Record<string, any> = {};

		Object.entries(trackItemsMap).forEach(([id, item]) => {
			if (!item || !item.details) return;

			const details = item.details as any;
			const type = item.type;

			if (
				type === "video" ||
				type === "image" ||
				type === "illustration" ||
				type === "shape"
			) {
				const itemW = details.width || oldSize.width || newWidth;
				const itemH = details.height || oldSize.height || newHeight;

				// Calculate scale that fits the media inside the new canvas
				const fitScale = Math.min(newWidth / itemW, newHeight / itemH);

				// Center item in new canvas
				const newLeft = `${(newWidth - itemW) / 2}px`;
				const newTop = `${(newHeight - itemH) / 2}px`;

				payloadUpdates[id] = {
					details: {
						...details,
						left: newLeft,
						top: newTop,
						transform: `scale(${fitScale})`
					}
				};
			} else if (type === "text" || type === "caption") {
				// Proportionally scale coordinates for text/captions
				const curLeft = parseFloat(details.left || "0");
				const curTop = parseFloat(details.top || "0");
				const scaleX = newWidth / (oldSize.width || newWidth);
				const scaleY = newHeight / (oldSize.height || newHeight);

				payloadUpdates[id] = {
					details: {
						...details,
						left: `${curLeft * scaleX}px`,
						top: `${curTop * scaleY}px`
					}
				};
			}
		});

		if (Object.keys(payloadUpdates).length > 0) {
			dispatch(EDIT_OBJECT, {
				payload: payloadUpdates
			});
		}
	}
};

const ResizeVideo = () => {
	const handleResize = (options: ResizeValue) => {
		executeResizeAndAutoFit(options.width, options.height, options.name);
	};
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button className="z-10 h-7 gap-2" variant="outline" size={"sm"}>
					<ProportionsIcon className="h-4 w-4" />
					<div>Resize</div>
				</Button>
			</PopoverTrigger>
			<PopoverContent className="z-[250] w-60 px-2.5 py-3">
				<div className="text-sm">
					{RESIZE_OPTIONS.map((option, index) => (
						<ResizeOption
							key={index}
							label={option.label}
							icon={option.icon}
							value={option.value}
							handleResize={handleResize}
							description={option.description}
						/>
					))}
				</div>
			</PopoverContent>
		</Popover>
	);
};

const ResizeOption = ({
	label,
	icon,
	value,
	description,
	handleResize,
}: ResizeOptionProps & { handleResize: (payload: ResizeValue) => void }) => {
	const Icon = Icons[icon as "text"];
	return (
		<div
			onClick={() => handleResize(value)}
			className="flex cursor-pointer items-center rounded-md p-2 hover:bg-zinc-50/10"
		>
			<div className="w-8 text-muted-foreground">
				<Icon size={20} />
			</div>
			<div>
				<div>{label}</div>
				<div className="text-xs text-muted-foreground">{description}</div>
			</div>
		</div>
	);
};

// Share button with auth check
const ShareButton = ({
	isAuthenticated,
	isMediumScreen
}: {
	isAuthenticated: boolean;
	isMediumScreen: boolean;
}) => {
	const [showLoginPrompt, setShowLoginPrompt] = useState(false);

	const handleClick = () => {
		if (!isAuthenticated) {
			setShowLoginPrompt(true);
			return;
		}
		// TODO: Implement share functionality
	};

	return (
		<>
			<Button
				className="flex h-7 gap-1 border border-border"
				variant="outline"
				size={isMediumScreen ? "sm" : "icon"}
				onClick={handleClick}
			>
				<ShareIcon width={18} />{" "}
				<span className="hidden md:block">Share</span>
			</Button>
			<ExportLoginPrompt
				open={showLoginPrompt}
				onOpenChange={setShowLoginPrompt}
				remainingExports={0}
			/>
		</>
	);
};
