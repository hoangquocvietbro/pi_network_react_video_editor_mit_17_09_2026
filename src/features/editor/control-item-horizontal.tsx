import React, { useEffect, useRef, useState } from "react";
import useStore from "./store/use-store";
import {
	IAudio,
	IImage,
	ITrackItem,
	ITrackItemAndDetails,
	IVideo,
} from "@/types/editor";
import useLayoutStore from "./store/use-layout-store";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useIsLargeScreen } from "@/hooks/use-media-query";
import { Icons } from "@/components/shared/icons";
import BasicText from "./control-item/basic-text";
import BasicImage from "./control-item/basic-image";
import BasicVideo from "./control-item/basic-video";
import BasicAudio from "./control-item/basic-audio";
import { motion, PanInfo, useAnimation } from "framer-motion";
import ColorPicker from "@/components/color-picker";
import { dispatch, EDIT_OBJECT } from "@/lib/events";
import { Label } from "@/components/ui/label";

const ActiveControlItem = ({
	trackItem,
	handleMenuItemClick,
}: {
	trackItem?: ITrackItemAndDetails;
	handleMenuItemClick: (menuItem: string, label: string) => void;
}) => {
	return (
		<>
			{
				{
					text: <ItemText handleMenuItemClick={handleMenuItemClick} />,
					image: <ItemImage handleMenuItemClick={handleMenuItemClick} />,
					video: <ItemVideo handleMenuItemClick={handleMenuItemClick} />,
					audio: <ItemAudio handleMenuItemClick={handleMenuItemClick} />,
				}[trackItem?.type as "text"]
			}
		</>
	);
};

const ColorPickerControl = ({
	trackItem,
}: {
	trackItem?: ITrackItemAndDetails;
}) => {
	const [localValue, setLocalValue] = useState<string>("#ffffff");
	const [open, setOpen] = useState(false);
	const isLargeScreen = useIsLargeScreen();

	useEffect(() => {
		// Get the current color from track item details based on type
		let currentColor = "#ffffff";
		if (trackItem?.type === "text") {
			currentColor = trackItem.details?.color || "#ffffff";
		} else if (trackItem?.type === "image" || trackItem?.type === "video") {
			currentColor = trackItem.details?.background || "#ffffff";
		}
		setLocalValue(currentColor);
	}, [trackItem]);

	const handleColorChange = (color: string) => {
		setLocalValue(color);

		// Update the appropriate property based on track item type
		const updatePayload: any = {};

		if (trackItem?.type === "text") {
			updatePayload.color = color;
		} else if (trackItem?.type === "image" || trackItem?.type === "video") {
			updatePayload.background = color;
		}

		dispatch(EDIT_OBJECT, {
			payload: {
				[trackItem?.id || ""]: {
					details: updatePayload,
				},
			},
		});
	};

	return (
		<div className="flex flex-col gap-4 p-4">
			<Label className="font-sans text-xs font-semibold">Color</Label>
			<div className="flex items-center pb-4 justify-center">
				<ColorPicker
					value={localValue}
					format="hex"
					gradient={true}
					solid={true}
					onChange={handleColorChange}
					allowAddGradientStops={true}
				/>
			</div>
		</div>
	);
};

const StrokeColorPickerControl = ({
	trackItem,
}: {
	trackItem?: ITrackItemAndDetails;
}) => {
	const [localValue, setLocalValue] = useState<string>("#000000");
	const [open, setOpen] = useState(false);
	const isLargeScreen = useIsLargeScreen();
	const { setControItemDrawerOpen } = useLayoutStore();

	useEffect(() => {
		// Get the current border color from track item details
		const currentBorderColor = trackItem?.details?.borderColor || "#000000";
		setLocalValue(currentBorderColor);
	}, [trackItem]);

	const handleColorChange = (color: string) => {
		setLocalValue(color);

		// Update the border color using the dispatch system
		dispatch(EDIT_OBJECT, {
			payload: {
				[trackItem?.id || ""]: {
					details: {
						borderColor: color,
					},
				},
			},
		});
	};

	const handleClose = () => {
		setControItemDrawerOpen(false);
	};

	return (
		<div className="flex flex-col gap-4 p-4">
			<Label className="font-sans text-xs font-semibold">Stroke Color</Label>

			<div className="flex items-center pb-4 justify-center">
				<ColorPicker
					value={localValue}
					format="hex"
					gradient={true}
					solid={true}
					onChange={handleColorChange}
					allowAddGradientStops={true}
				/>
			</div>
		</div>
	);
};

const ShadowColorPickerControl = ({
	trackItem,
}: {
	trackItem?: ITrackItemAndDetails;
}) => {
	const [localValue, setLocalValue] = useState<string>("#000000");
	const isLargeScreen = useIsLargeScreen();
	const { setControItemDrawerOpen } = useLayoutStore();

	useEffect(() => {
		// Get the current shadow color from track item details
		const currentShadowColor =
			trackItem?.details?.boxShadow?.color || "#000000";
		setLocalValue(currentShadowColor);
	}, [trackItem]);

	const handleColorChange = (color: string) => {
		setLocalValue(color);

		// Update the shadow color using the dispatch system
		dispatch(EDIT_OBJECT, {
			payload: {
				[trackItem?.id || ""]: {
					details: {
						boxShadow: {
							...trackItem?.details?.boxShadow,
							color: color,
						},
					},
				},
			},
		});
	};

	const handleClose = () => {
		setControItemDrawerOpen(false);
	};

	return (
		<div className="flex flex-col gap-4 p-4">
			<Label className="font-sans text-xs font-semibold">Shadow Color</Label>

			<div className="flex items-center pb-4 justify-center">
				<ColorPicker
					value={localValue}
					format="hex"
					gradient={true}
					solid={true}
					onChange={handleColorChange}
					allowAddGradientStops={true}
				/>
			</div>
		</div>
	);
};

const BackgroundColorPickerControl = ({
	trackItem,
}: {
	trackItem?: ITrackItemAndDetails;
}) => {
	const [localValue, setLocalValue] = useState<string>("#ffffff");
	const isLargeScreen = useIsLargeScreen();
	const { setControItemDrawerOpen } = useLayoutStore();

	useEffect(() => {
		// Get the current background color from track item details
		const currentBackgroundColor = trackItem?.details?.background || "#ffffff";
		setLocalValue(currentBackgroundColor);
	}, [trackItem]);

	const handleColorChange = (color: string) => {
		setLocalValue(color);

		// Update the background color using the dispatch system
		dispatch(EDIT_OBJECT, {
			payload: {
				[trackItem?.id || ""]: {
					details: {
						background: color,
					},
				},
			},
		});
	};

	const handleClose = () => {
		setControItemDrawerOpen(false);
	};

	return (
		<div className="flex flex-col gap-4 p-4">
			<Label className="font-sans text-xs font-semibold">
				Background Color
			</Label>

			<div className="flex items-center pb-4 justify-center">
				<ColorPicker
					value={localValue}
					format="hex"
					gradient={true}
					solid={true}
					onChange={handleColorChange}
					allowAddGradientStops={true}
				/>
			</div>
		</div>
	);
};

const ControlItem = ({
	trackItem,
	feature,
}: {
	trackItem?: ITrackItemAndDetails;
	feature: string;
}) => {
	// First check if it's a custom feature (like strokeColor, color, shadowColor, backgroundColor)
	if (feature === "strokeColor") {
		return <StrokeColorPickerControl trackItem={trackItem} />;
	}

	if (feature === "color") {
		return <ColorPickerControl trackItem={trackItem} />;
	}

	if (feature === "shadowColor") {
		return <ShadowColorPickerControl trackItem={trackItem} />;
	}

	if (feature === "backgroundColor") {
		return <BackgroundColorPickerControl trackItem={trackItem} />;
	}

	// Then check track item type for standard features
	return (
		<>
			{
				{
					text: (
						<BasicText
							trackItem={trackItem as ITrackItem & any}
							type={feature}
						/>
					),
					image: (
						<BasicImage
							trackItem={trackItem as ITrackItem & IImage}
							type={feature}
						/>
					),
					video: (
						<BasicVideo
							trackItem={trackItem as ITrackItem & IVideo}
							type={feature}
						/>
					),
					audio: (
						<BasicAudio
							trackItem={trackItem as ITrackItem & IAudio}
							type={feature}
						/>
					),
				}[trackItem?.type as "text"]
			}
		</>
	);
};

export default function ControlItemHorizontal() {
	const { activeIds, trackItemsMap, transitionsMap } = useStore();
	const [trackItem, setTrackItem] = useState<ITrackItem | null>(null);
	const { setTrackItem: setLayoutTrackItem } = useLayoutStore();
	const isLargeScreen = useIsLargeScreen();
	const {
		setTypeControlItem,
		typeControlItem,
		setControItemDrawerOpen,
		controItemDrawerOpen,
		setLabelControlItem,
		setCropTarget
	} = useLayoutStore();

	// Framer Motion controls
	const controls = useAnimation();

	useEffect(() => {
		if (activeIds.length === 1) {
			const [id] = activeIds;
			const trackItem = trackItemsMap[id];
			if (trackItem) {
				setTrackItem(trackItem);
				setLayoutTrackItem(trackItem);
			} else console.log(transitionsMap[id]);
		} else {
			setTrackItem(null);
			setLayoutTrackItem(null);
		}
	}, [activeIds, trackItemsMap]);
	const handleMenuItemClick = (menuItem: string, label: string) => {
		if (menuItem === "crop" && trackItem) {
			setCropTarget(trackItem);
			return;
		}
		if (!isLargeScreen) {
			setControItemDrawerOpen(true);
			setTypeControlItem(menuItem);
			setLabelControlItem(label);
		}
	};
	const drawerRef = useRef<HTMLDivElement>(null);
	const scrollAreaRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			const target = event.target as Node;

			const clickedOutsideDrawer =
				drawerRef.current && !drawerRef.current.contains(target);
			const clickedOutsideScrollArea =
				scrollAreaRef.current && !scrollAreaRef.current.contains(target);

			if (clickedOutsideDrawer && clickedOutsideScrollArea) {
				setControItemDrawerOpen(false);
			}
		}

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// Handle drag end with Framer Motion
	const handleDragEnd = (event: any, info: PanInfo) => {
		const { offset, velocity } = info;

		// Close drawer if dragged down more than 50px or with sufficient velocity
		if (offset.y > 50 || velocity.y > 500) {
			setControItemDrawerOpen(false);
		} else {
			// Animate back to original position
			controls.start({
				y: 0,
				transition: { type: "spring", damping: 25, stiffness: 300 },
			});
		}
	};

	// Animation variants
	const drawerVariants = {
		hidden: { y: "100%" },
		visible: {
			y: 0,
			transition: {
				type: "spring",
				damping: 25,
				stiffness: 300,
				duration: 0.3,
			},
		},
		exit: {
			y: "100%",
			transition: {
				type: "spring",
				damping: 25,
				stiffness: 300,
				duration: 0.2,
			},
		},
	};

	return (
		<>
			<div className="flex h-12 items-center border-t border-border/80 bg-background/95 backdrop-blur px-2 w-full select-none">
				<div
					ref={scrollAreaRef}
					className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scrollbar-none py-1 w-full"
					style={{
						scrollbarWidth: "none",
						msOverflowStyle: "none",
						WebkitOverflowScrolling: "touch"
					}}
				>
					{trackItem && (
						<ActiveControlItem
							trackItem={trackItem as ITrackItem & any}
							handleMenuItemClick={handleMenuItemClick}
						/>
					)}
				</div>
			</div>
			{!isLargeScreen && controItemDrawerOpen && (
				<motion.div
					className="fixed inset-0 z-50 flex items-end pointer-events-none"
					initial="hidden"
					animate="visible"
					exit="exit"
					variants={drawerVariants}
				>
					<motion.div
						ref={drawerRef}
						className="bg-background mb-12 w-full max-h-[80vh] min-h-[340px] rounded-t-lg border-t shadow-lg pointer-events-auto"
						drag="y"
						dragConstraints={{ top: 0, bottom: 0 }}
						dragElastic={0.1}
						onDragEnd={handleDragEnd}
						animate={controls}
						whileDrag={{ scale: 0.98 }}
						transition={{ type: "spring", damping: 25, stiffness: 300 }}
					>
						<div className="flex flex-col h-full">
							<div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-border/50">
								<span className="text-xs font-semibold text-zinc-300 capitalize">
									{typeControlItem || "Options"}
								</span>
								<motion.div
									className="h-1 w-16 bg-zinc-700 rounded-full cursor-grab active:cursor-grabbing touch-none"
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
								/>
								<Button
									variant="ghost"
									size="icon"
									className="h-7 w-7 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800"
									onClick={() => setControItemDrawerOpen(false)}
								>
									<Icons.close width={14} />
								</Button>
							</div>
							<div className="flex-1 overflow-auto">
								<ControlItem
									trackItem={trackItem as ITrackItem & any}
									feature={typeControlItem}
								/>
							</div>
						</div>
					</motion.div>
				</motion.div>
			)}
		</>
	);
}
type Item = {
	icon: React.ComponentType<{ width: number }>;
	label: string;
	id: string;
};

const ItemGroup = ({
	items,
	handleMenuItemClick,
}: {
	items: Item[];
	handleMenuItemClick: (menuItem: string, label: string) => void;
}) => {
	const { typeControlItem } = useLayoutStore();
	return (
		<div className="flex items-center gap-1.5 min-w-max px-1">
			{items.map(({ label, id, icon: Icon }, index) => {
				const isActive = typeControlItem === id;
				return (
					<Button
						key={index}
						onClick={() => handleMenuItemClick(id, label)}
						variant="outline"
						size="sm"
						className={`h-8 gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border shadow-sm transition-all shrink-0 active:scale-95 ${isActive
							? "border-primary bg-primary/15 text-primary font-semibold hover:bg-primary/20 hover:text-primary"
							: "border-border/80 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white"
							}`}
					>
						{Icon && <Icon width={13} />}
						<span>{label}</span>
					</Button>
				);
			})}
		</div>
	);
};

const ItemText = ({
	handleMenuItemClick,
}: {
	handleMenuItemClick: (menuItem: string, label: string) => void;
}) => (
	<ItemGroup
		items={[
			{ icon: Icons.preset, label: "Preset", id: "textPreset" },
			{ icon: Icons.style, label: "Styles", id: "textControls" },
			{ icon: Icons.animation, label: "Animations", id: "animations" },
			{ icon: Icons.fontStroke, label: "Stroke", id: "fontStroke" },
			{ icon: Icons.fontShadow, label: "Shadow", id: "fontShadow" },
		]}
		handleMenuItemClick={handleMenuItemClick}
	/>
);

const ItemImage = ({
	handleMenuItemClick,
}: {
	handleMenuItemClick: (menuItem: string, label: string) => void;
}) => (
	<ItemGroup
		items={[
			{ icon: Icons.crop, label: "Crop", id: "crop" },
			{ icon: Icons.basic, label: "Basic", id: "basic" },
			{ icon: Icons.animation, label: "Animations", id: "animations" },
			{ icon: Icons.outline, label: "Outline", id: "outline" },
			{ icon: Icons.shadow, label: "Shadow", id: "shadow" },
		]}
		handleMenuItemClick={handleMenuItemClick}
	/>
);

const ItemVideo = ({
	handleMenuItemClick,
}: {
	handleMenuItemClick: (menuItem: string, label: string) => void;
}) => (
	<ItemGroup
		items={[
			{ icon: Icons.crop, label: "Crop", id: "crop" },
			{ icon: Icons.basic, label: "Basic", id: "basic" },
			{ icon: Icons.animation, label: "Animations", id: "animations" },
			{ icon: Icons.outline, label: "Outline", id: "outline" },
			{ icon: Icons.shadow, label: "Shadow", id: "shadow" },
		]}
		handleMenuItemClick={handleMenuItemClick}
	/>
);

const ItemAudio = ({
	handleMenuItemClick,
}: {
	handleMenuItemClick: (menuItem: string, label: string) => void;
}) => (
	<ItemGroup
		items={[
			{ icon: Icons.audio, label: "Replace", id: "replace" },
			{ icon: Icons.speed, label: "Speed", id: "speed" },
			{ icon: Icons.volume, label: "Volume", id: "volume" },
		]}
		handleMenuItemClick={handleMenuItemClick}
	/>
);
