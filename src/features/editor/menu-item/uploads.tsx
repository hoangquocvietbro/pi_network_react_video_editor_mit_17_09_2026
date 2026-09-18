import { dispatch, ADD_AUDIO, ADD_IMAGE, ADD_VIDEO, EDIT_OBJECT, LAYER_DELETE } from "@/lib/events";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import {
	Music,
	Image as ImageIcon,
	Video as VideoIcon,
	Loader2,
	UploadIcon,
	Link as LinkIcon,
	AlertTriangle,
	X
} from "lucide-react";
import { generateId } from "../utils/id";
import { Button } from "@/components/ui/button";
import useUploadStore, { LocalMedia } from "../store/use-upload-store";
import ModalUpload, { extractVideoThumbnail, truncateFileName } from "@/components/modal-upload";
import useStore from "../store/use-store";
import { useRef } from "react";
// Helper to truncate file names while keeping extension: filename....ext
const truncateName = (name: string, maxLength: number = 13): string => {
	return truncateFileName(name, maxLength);
};
export const Uploads = () => {
	const { setShowUploadModal, localMedias, isMediaExpired, reuploadMedia, removeLocalMedia } = useUploadStore();
	const { trackItemsMap } = useStore();

	// Refs for hidden file inputs
	const reuploadInputRef = useRef<HTMLInputElement>(null);
	const pendingReuploadId = useRef<string | null>(null);
	const pendingReuploadType = useRef<'video' | 'audio' | 'image' | null>(null);

	// Group local medias by type
	const videos = localMedias.filter((m) => m.type === "video");
	const images = localMedias.filter((m) => m.type === "image");
	const audios = localMedias.filter((m) => m.type === "audio");

	const getMediaSrc = (media: LocalMedia): string => {
		return media.blobUrl || media.originalUrl || media.serverUrl || "";
	};

	// Handle re-upload for expired media
	const handleReuploadClick = (media: LocalMedia, e: React.MouseEvent) => {
		e.stopPropagation();
		pendingReuploadId.current = media.id;
		pendingReuploadType.current = media.type;

		if (reuploadInputRef.current) {
			reuploadInputRef.current.accept = media.type === 'video' ? 'video/*'
				: media.type === 'audio' ? 'audio/*'
					: 'image/*';
			reuploadInputRef.current.click();
		}
	};

	// Process re-upload file with validation
	const handleReuploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		const mediaId = pendingReuploadId.current;
		const mediaType = pendingReuploadType.current;

		if (!file || !mediaId) return;

		// Find the original media
		const media = localMedias.find(m => m.id === mediaId);
		if (!media) return;

		// Validate file name matches
		if (file.name !== media.name) {
			alert(`⚠️ File name mismatch!\n\nExpected: ${media.name}\nSelected: ${file.name}\n\nPlease select "${media.name}" or upload as a new asset.`);
			e.target.value = '';
			return;
		}

		// Get old blob URL before re-upload
		const oldBlobUrl = media.blobUrl;

		// Generate thumbnail
		let thumbnail: string | undefined;
		if (mediaType === 'video') {
			thumbnail = await extractVideoThumbnail(file);
		} else if (mediaType === 'image') {
			thumbnail = URL.createObjectURL(file);
		}

		// Re-upload and get new blob URL
		const newBlobUrl = reuploadMedia(mediaId, file, thumbnail);
		console.log('[Uploads] Media re-uploaded:', mediaId, 'new URL:', newBlobUrl);

		// Update design trackItemsMap - find and update track items using this media
		if (oldBlobUrl && trackItemsMap) {
			Object.entries(trackItemsMap).forEach(([itemId, item]) => {
				if (item.details?.src === oldBlobUrl || item.metadata?.localMediaId === mediaId) {
					dispatch(EDIT_OBJECT, {
						payload: {
							[itemId]: {
								details: { src: newBlobUrl },
								metadata: { previewUrl: thumbnail || item.metadata?.previewUrl }
							}
						}
					});
					console.log('[Uploads] Updated track item:', itemId, 'with new src');
				}
			});
		}

		// Reset
		pendingReuploadId.current = null;
		pendingReuploadType.current = null;
		e.target.value = '';
	};

	const handleAddVideo = (media: LocalMedia) => {
		if (isMediaExpired(media)) return;

		dispatch(ADD_VIDEO, {
			payload: {
				id: generateId(),
				details: { src: getMediaSrc(media) },
				metadata: { localMediaId: media.id, previewUrl: media.thumbnail }
			},
			options: { resourceId: "main", scaleMode: "fit" }
		});
	};

	const handleAddImage = (media: LocalMedia) => {
		if (isMediaExpired(media)) return;
		dispatch(ADD_IMAGE, {
			payload: {
				id: generateId(),
				type: "image",
				display: { from: 0, to: 5000 },
				details: { src: getMediaSrc(media) },
				metadata: { localMediaId: media.id }
			},
			options: {},
		});
	};

	const handleAddAudio = (media: LocalMedia) => {
		if (isMediaExpired(media)) return;
		dispatch(ADD_AUDIO, {
			payload: {
				id: generateId(),
				type: "audio",
				details: { src: getMediaSrc(media) },
				metadata: { localMediaId: media.id }
			},
			options: {},
		});
	};

	// Handle delete media
	const handleDeleteMedia = (media: LocalMedia, e: React.MouseEvent) => {
		e.stopPropagation();

		const mediaSrc = getMediaSrc(media);

		// Find track items using this media
		const itemsToDelete: string[] = [];
		if (trackItemsMap) {
			Object.entries(trackItemsMap).forEach(([itemId, item]) => {
				if (item.details?.src === mediaSrc || item.metadata?.localMediaId === media.id) {
					itemsToDelete.push(itemId);
				}
			});
		}

		// Confirm with user if there are items in timeline
		if (itemsToDelete.length > 0) {
			const confirmed = confirm(
				`⚠️ Delete "${media.name}"?\n\nThis asset is currently used in ${itemsToDelete.length} clip(s) on the timeline.\nDeleting will also remove these clips from your video.`
			);
			if (!confirmed) return;

			// Delete from timeline
			dispatch(LAYER_DELETE, {
				payload: { trackItemIds: itemsToDelete }
			});
			console.log('[Uploads] Deleted track items:', itemsToDelete);
		}

		// Remove from localMedias
		removeLocalMedia(media.id);
		console.log('[Uploads] Deleted media:', media.name);
	};

	// Render media card with expired badge and delete button
	const renderMediaCard = (
		media: LocalMedia,
		onAdd: (m: LocalMedia) => void,
		renderThumbnail: () => React.ReactNode
	) => {
		const expired = isMediaExpired(media);
		return (
			<div className="flex items-center gap-1.5 flex-col w-full min-w-0" key={media.id}>
				<Card
					className={`w-16 h-16 shrink-0 flex items-center justify-center overflow-hidden relative cursor-pointer ${expired ? 'opacity-60 border-yellow-500 border-2' : ''}`}
					onClick={() => !expired && onAdd(media)}
				>
					{renderThumbnail()}
					{/* Delete button */}
					<div
						className="absolute top-0.5 right-0.5 bg-red-600/80 hover:bg-red-600 rounded p-0.5 cursor-pointer z-10"
						onClick={(e) => handleDeleteMedia(media, e)}
						title="Delete media"
					>
						<X className="w-2.5 h-2.5 text-white" />
					</div>
					{media.source === 'url' && (
						<div className="absolute top-0.5 right-0.5 bg-black/60 rounded p-0.5">
							<LinkIcon className="w-2.5 h-2.5 text-white" />
						</div>
					)}
					{expired && (
						<div
							className="absolute inset-0 flex items-center justify-center bg-black/50 cursor-pointer"
							onClick={(e) => handleReuploadClick(media, e)}
							title={`⚠️ File expired: ${media.name}\nClick to re-select this file`}
						>
							<AlertTriangle className="w-6 h-6 text-yellow-400" />
						</div>
					)}
				</Card>
				<div
					className={`text-xs truncate w-full max-w-full text-center px-0.5 ${expired ? 'text-yellow-500' : 'text-muted-foreground'}`}
					title={media.name}
				>
					{truncateName(media.name, 12)}
				</div>
			</div>
		);
	};

	return (
		<div className="flex flex-1 flex-col">
			<div className="text-text-primary flex h-12 flex-none items-center px-4 text-sm font-medium">
				Your uploads
			</div>
			<ModalUpload />
			<div className="flex items-center justify-center px-4">
				<Button className="w-full cursor-pointer" onClick={() => setShowUploadModal(true)}>
					<UploadIcon className="w-4 h-4" />
					<span className="ml-2">Upload</span>
				</Button>
			</div>

			{/* Hidden file input for re-upload */}
			<input
				ref={reuploadInputRef}
				type="file"
				className="hidden"
				onChange={handleReuploadFile}
			/>

			<div className="flex flex-col gap-10 p-4">
				{/* Videos Section */}
				{videos.length > 0 && (
					<div>
						<div className="flex items-center gap-2 mb-2">
							<VideoIcon className="w-4 h-4 text-muted-foreground" />
							<span className="font-medium text-sm">Videos</span>
						</div>
						<ScrollArea className="max-h-32">
							<div className="grid grid-cols-3 gap-2 max-w-full">
								{videos.map((video) =>
									renderMediaCard(video, handleAddVideo, () =>
										video.thumbnail ? (
											<img src={video.thumbnail} alt={video.name} className="w-full h-full object-cover" />
										) : (
											<VideoIcon className="w-8 h-8 text-muted-foreground" />
										)
									)
								)}
							</div>
						</ScrollArea>
					</div >
				)}

				{/* Images Section */}
				{
					images.length > 0 && (
						<div>
							<div className="flex items-center gap-2 mb-2">
								<ImageIcon className="w-4 h-4 text-muted-foreground" />
								<span className="font-medium text-sm">Images</span>
							</div>
							<ScrollArea className="max-h-32">
								<div className="grid grid-cols-3 gap-2 max-w-full">
									{images.map((image) =>
										renderMediaCard(image, handleAddImage, () =>
											image.thumbnail || image.blobUrl || image.originalUrl ? (
												<img
													src={image.thumbnail || image.blobUrl || image.originalUrl}
													alt={image.name}
													className="w-full h-full object-cover"
												/>
											) : (
												<ImageIcon className="w-8 h-8 text-muted-foreground" />
											)
										)
									)}
								</div>
							</ScrollArea>
						</div >
					)
				}

				{/* Audios Section */}
				{
					audios.length > 0 && (
						<div>
							<div className="flex items-center gap-2 mb-2">
								<Music className="w-4 h-4 text-muted-foreground" />
								<span className="font-medium text-sm">Audios</span>
							</div>
							<ScrollArea className="max-h-32">
								<div className="grid grid-cols-3 gap-2 max-w-full">
									{audios.map((audio) =>
										renderMediaCard(audio, handleAddAudio, () => (
											<Music className="w-8 h-8 text-muted-foreground" />
										))
									)}
								</div>
							</ScrollArea>
						</div>
					)
				}
			</div >
		</div >
	);
};
