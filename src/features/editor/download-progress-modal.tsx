import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useDownloadState } from "./store/use-download-state";
import { Button } from "@/components/ui/button";
import { DialogDescription, DialogTitle } from "@radix-ui/react-dialog";
import {
	CircleCheckIcon,
	XCircleIcon,
	AlertTriangleIcon,
	MonitorIcon,
	CloudIcon,
	ServerIcon,
	Loader2Icon,
	DownloadIcon,
	Share2Icon,
	CloudUploadIcon,
	CopyIcon,
	CheckIcon
} from "lucide-react";
import { toast } from "sonner";

const DownloadProgressModal = () => {
	const {
		progress,
		displayProgressModal,
		output,
		actions,
		renderMode,
		csrProgress,
		exporting,
		errorMessage
	} = useDownloadState();

	const isCompleted = csrProgress.phase === 'completed' || progress >= 100;
	const isError = csrProgress.phase === 'error';
	const isCancelled = csrProgress.phase === 'cancelled';
	const isCSR = renderMode === 'csr';
	const isSSRLocal = renderMode === 'ssr-local';

	const isPiBrowser = typeof window !== 'undefined' && Boolean((window as any).Pi || /PiBrowser/i.test(navigator.userAgent));
	const [isDownloading, setIsDownloading] = useState(false);
	const [isSharing, setIsSharing] = useState(false);
	const [isCloudSaving, setIsCloudSaving] = useState(false);
	const [cloudUrl, setCloudUrl] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);

	// 1. Direct download (Local memory, 0 MB upload)
	const handleDirectDownload = async () => {
		try {
			setIsDownloading(true);
			await actions.downloadDirect();
			toast.success("Download started!");
		} catch (err: any) {
			console.error("Download error:", err);
			toast.error(err?.message || "Direct download failed. Please try Cloud Save.");
		} finally {
			setIsDownloading(false);
		}
	};

	// 2. Share via Apps (Zalo, Facebook, native share sheet)
	const handleShare = async () => {
		try {
			setIsSharing(true);
			await actions.shareOutput();
		} catch (err: any) {
			if (err?.name !== 'AbortError') {
				console.error("Share error:", err);
				toast.error(err?.message || "Failed to open share dialog.");
			}
		} finally {
			setIsSharing(false);
		}
	};

	// 3. Save to Cloud & Open in Chrome
	const handleCloudSave = async () => {
		try {
			setIsCloudSaving(true);
			toast.info("Uploading video to Cloud...");
			const url = await actions.cloudSaveOutput();
			setCloudUrl(url);
			if (isPiBrowser) {
				toast.success("Saved to Cloud! Opening in Chrome to download...");
			} else {
				toast.success("Video uploaded to Cloud successfully!");
			}
		} catch (err: any) {
			console.error("Cloud save error:", err);
			toast.error(err?.message || "Failed to upload to Cloud.");
		} finally {
			setIsCloudSaving(false);
		}
	};

	const handleCopyLink = async () => {
		if (!cloudUrl) return;
		try {
			await navigator.clipboard.writeText(cloudUrl);
			setCopied(true);
			toast.success("Cloud link copied to clipboard!");
			setTimeout(() => setCopied(false), 2000);
		} catch {
			toast.error("Failed to copy link.");
		}
	};

	const handleClose = () => {
		actions.setDisplayProgressModal(false);
		if (!exporting) {
			actions.reset();
			setCloudUrl(null);
		}
	};

	const handleCancel = () => {
		actions.cancelExport();
	};

	// Get phase display text
	const getPhaseText = () => {
		if (isSSRLocal) return 'Processing on local server...';
		if (!isCSR) return 'Processing on cloud...';

		switch (csrProgress.phase) {
			case 'preparing':
				return 'Preparing...';
			case 'rendering':
				return `Rendering frame ${csrProgress.renderedFrames} of ${csrProgress.totalFrames}`;
			case 'encoding':
				return `Encoding frame ${csrProgress.encodedFrames} of ${csrProgress.totalFrames}`;
			case 'completed':
				return 'Export completed!';
			case 'cancelled':
				return 'Export cancelled';
			case 'error':
				return 'Export failed';
			default:
				return 'Exporting...';
		}
	};

	// Get mode display
	const getModeDisplay = () => {
		if (isCSR) {
			return (
				<>
					<MonitorIcon className="h-3 w-3" />
					<span>Browser</span>
				</>
			);
		} else if (isSSRLocal) {
			return (
				<>
					<ServerIcon className="h-3 w-3" />
					<span>Server (Local)</span>
				</>
			);
		} else {
			return (
				<>
					<CloudIcon className="h-3 w-3" />
					<span>Cloud</span>
				</>
			);
		}
	};

	return (
		<Dialog
			open={displayProgressModal}
			onOpenChange={handleClose}
		>
			<DialogContent className="flex min-h-[420px] max-h-[92vh] flex-col gap-0 bg-background p-0 sm:max-w-[460px] overflow-y-auto">
				<DialogTitle className="hidden" />
				<DialogDescription className="hidden" />

				{/* Header */}
				<div className="flex h-12 items-center justify-between border-b px-4 shrink-0">
					<span className="font-medium">Exporting Video</span>
					<div className="flex items-center gap-1 text-muted-foreground text-xs mr-6">
						{getModeDisplay()}
					</div>
				</div>

				{/* Content */}
				<div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
					{/* Completed State */}
					{isCompleted && (
						<div className="flex flex-col items-center gap-3 text-center w-full py-2">
							<CircleCheckIcon className="h-12 w-12 text-green-500" />
							<div>
								<div className="text-xl font-bold">Export Complete!</div>
								<div className="text-xs text-muted-foreground mt-1">
									Your video is ready to download or share.
								</div>

							</div>

							<div className="flex flex-col items-center gap-2.5 w-full max-w-sm mt-1">
								{/* Button 1: Direct Download */}
								<Button
									onClick={handleDirectDownload}
									size="default"
									disabled={isDownloading || isSharing || isCloudSaving}
									className="w-full gap-2 shadow-sm font-medium"
								>
									{isDownloading ? (
										<>
											<Loader2Icon className="h-4 w-4 animate-spin" />
											<span>Downloading...</span>
										</>
									) : (
										<>
											<DownloadIcon className="h-4 w-4" />
											<span>Direct Download</span>
										</>
									)}
								</Button>

								{/* Button 2: Share via Apps */}
								<Button
									variant="outline"
									size="default"
									onClick={handleShare}
									disabled={isDownloading || isSharing || isCloudSaving}
									className="w-full gap-2 font-medium"
								>
									{isSharing ? (
										<>
											<Loader2Icon className="h-4 w-4 animate-spin" />
											<span>Opening Share...</span>
										</>
									) : (
										<>
											<Share2Icon className="h-4 w-4 text-blue-500" />
											<span>Share via Apps</span>
										</>
									)}
								</Button>

								{/* Button 3: Save to Cloud & Open in Chrome */}
								<Button
									variant="secondary"
									size="default"
									onClick={handleCloudSave}
									disabled={isDownloading || isSharing || isCloudSaving}
									className="w-full gap-2 font-medium border"
								>
									{isCloudSaving ? (
										<>
											<Loader2Icon className="h-4 w-4 animate-spin" />
											<span>Saving to Cloud...</span>
										</>
									) : (
										<>
											<CloudUploadIcon className="h-4 w-4 text-purple-600" />
											<span>Save to Cloud &amp; Open in Chrome</span>
										</>
									)}
								</Button>

								{/* Cloud URL link display with Copy button if uploaded */}
								{cloudUrl && (
									<div className="flex items-center gap-2 w-full mt-1 p-2 bg-muted/60 border rounded-md text-xs text-left">
										<span className="truncate flex-1 font-mono text-muted-foreground">{cloudUrl}</span>
										<Button
											size="sm"
											variant="ghost"
											className="h-7 px-2 gap-1 text-xs shrink-0"
											onClick={handleCopyLink}
										>
											{copied ? (
												<>
													<CheckIcon className="h-3 w-3 text-green-500" />
													<span className="text-green-500">Copied</span>
												</>
											) : (
												<>
													<CopyIcon className="h-3 w-3" />
													<span>Copy</span>
												</>
											)}
										</Button>
									</div>
								)}

								{isPiBrowser && (
									<p className="text-[11px] text-muted-foreground text-center mt-1">
										* If Direct Download is blocked by Pi Browser, use &quot;Save to Cloud &amp; Open in Chrome&quot;.
									</p>
								)}
							</div>
						</div>
					)}
					{/* Error State */}
					{isError && (
						<div className="flex flex-col items-center gap-4 text-center">
							<XCircleIcon className="h-16 w-16 text-red-500" />
							<div>
								<div className="text-xl font-bold">Export Failed</div>
								<div className="text-muted-foreground max-w-sm">
									{errorMessage || 'An error occurred during export.'}
								</div>
							</div>
							<div className="flex gap-2">
								<Button variant="outline" onClick={handleClose}>
									Close
								</Button>
								<Button onClick={() => actions.startExport()}>
									Try Again
								</Button>
							</div>
						</div>
					)}

					{/* Cancelled State */}
					{isCancelled && (
						<div className="flex flex-col items-center gap-4 text-center">
							<AlertTriangleIcon className="h-16 w-16 text-yellow-500" />
							<div>
								<div className="text-xl font-bold">Export Cancelled</div>
								<div className="text-muted-foreground">
									The export was cancelled.
								</div>
							</div>
							<Button variant="outline" onClick={handleClose}>
								Close
							</Button>
						</div>
					)}
					{/* In Progress State */}
					{exporting && !isCompleted && !isError && !isCancelled && (
						<div className="flex w-full flex-col items-center gap-6">
							<Loader2Icon className="h-12 w-12 animate-spin text-primary" />

							<div className="text-center">
								<div className="text-4xl font-bold">{progress}%</div>
								<div className="mt-2 text-sm text-muted-foreground">
									{getPhaseText()}
								</div>
							</div>

							<div className="w-full max-w-xs h-2 bg-muted rounded-full overflow-hidden">
								<div
									className="h-full bg-primary transition-all duration-300"
									style={{ width: `${progress}%` }}
								/>
							</div>

							{isCSR && (
								<div className="text-center text-xs text-muted-foreground">
									<div className="text-yellow-500">Keep this tab visible for best performance</div>
								</div>
							)}

							<Button variant="outline" onClick={handleCancel}>
								Cancel Export
							</Button>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog >
	);
};

export default DownloadProgressModal;
