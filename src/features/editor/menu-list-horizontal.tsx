import { useState, useCallback } from "react";
import useLayoutStore from "./store/use-layout-store";
import { Icons } from "@/components/shared/icons";
import { cn } from "@/lib/utils";
import {
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
	DrawerDescription,
} from "@/components/ui/drawer";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { MenuItem } from "./menu-item/menu-item";
import { useIsLargeScreen } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "../../store/use-auth-store";
import { ExportLoginPrompt } from "../../components/auth/export-login-prompt";
import { Lock, X } from "lucide-react";
// Define menu item data structure
interface MenuItemData {
	id: string;
	label: string;
	icon: React.ComponentType<{ width?: number }>;
	requiresAuth?: boolean;
}

// Menu items configuration
const menuItems: MenuItemData[] = [
	{
		id: "uploads",
		icon: Icons.upload,
		label: "Uploads",
		requiresAuth: false
	},
	{
		id: "texts",
		label: "Text",
		icon: Icons.type,
		requiresAuth: false
	},
	{
		id: "videos",
		label: "Video",
		icon: Icons.video,
		requiresAuth: false
	},
	{
		id: "images",
		label: "Images",
		icon: Icons.image,
		requiresAuth: false
	},
	{
		id: "audios",
		label: "Audio",
		icon: Icons.audio,
		requiresAuth: false
	},
	{
		id: "ai-voice",
		label: "AI Voice",
		icon: Icons.volume,
		requiresAuth: true // Premium
	}
];

// Reusable MenuButton component
interface MenuButtonProps {
	item: MenuItemData;
	isActive: boolean;
	isAuthenticated: boolean;
	onClick: (requiresAuth: boolean) => void;
}

function MenuButton({ item, isActive, isAuthenticated, onClick }: MenuButtonProps) {
	const showLock = item.requiresAuth && !isAuthenticated;
	const Icon = item.icon;

	return (
		<Button
			onClick={() => onClick(item.requiresAuth || false)}
			variant={isActive ? "default" : "ghost"}
			size={"sm"}
			className={cn(
				"h-9 px-3 gap-1.5 rounded-full text-xs font-medium transition-all active:scale-95 touch-manipulation shrink-0",
				isActive
					? "bg-primary text-primary-foreground shadow-sm shadow-primary/20 border-transparent"
					: "bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/50"
			)}
		>
			<Icon width={13} />
			<span>{item.label}</span>
			{showLock && (
				<Lock className="ml-0.5 w-3 h-3 text-yellow-500 shrink-0" />
			)}
		</Button>
	);
}

export default function MenuListHorizontal() {
	const {
		setActiveMenuItem,
		setShowMenuItem,
		activeMenuItem,
		showMenuItem,
		drawerOpen,
		setDrawerOpen,
	} = useLayoutStore();
	const { isAuthenticated } = useAuthStore();
	const [showLoginPrompt, setShowLoginPrompt] = useState(false);
	const isLargeScreen = useIsLargeScreen();

	const handleMenuItemClick = useCallback((menuItem: string, requiresAuth: boolean) => {
		// Check if feature requires auth and user is not authenticated
		if (requiresAuth && !isAuthenticated) {
			setShowLoginPrompt(true);
			return;
		}

		setActiveMenuItem(menuItem as any);
		// Use drawer on mobile, sidebar on desktop
		if (!isLargeScreen) {
			setDrawerOpen(true);
		} else {
			setShowMenuItem(true);
		}
	}, [isAuthenticated, isLargeScreen, setActiveMenuItem, setDrawerOpen, setShowMenuItem]);

	const isMenuItemActive = (itemId: string) => {
		return (
			(drawerOpen && activeMenuItem === itemId) ||
			(showMenuItem && activeMenuItem === itemId)
		);
	};


	const activeItemData = menuItems.find(m => m.id === activeMenuItem);
	return (
		<>
			<div className="flex h-12 items-center border-t border-border/80 bg-muted/90 backdrop-blur-sm pb-safe">
				<ScrollArea className="w-full px-2 no-scrollbar">
					<div className="flex items-center space-x-2 min-w-max px-2 py-1">
						{menuItems.map((item) => (
							<MenuButton
								key={item.id}
								item={item}
								isAuthenticated={isAuthenticated}
								isActive={isMenuItemActive(item.id)}
								onClick={(requiresAuth) => handleMenuItemClick(item.id, requiresAuth)}
							/>
						))}
					</div>
					<ScrollBar orientation="horizontal" className="hidden" />
				</ScrollArea>
			</div>

			{/* Drawer only on mobile/tablet - conditionally mounted */}
			{!isLargeScreen && (
				<Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
					<DrawerContent className="max-h-[85vh] min-h-[340px] mt-0 pb-safe bg-background/95 backdrop-blur-md border-t border-border">
						<VisuallyHidden>
							<DrawerHeader>
								<DrawerTitle>Menu Options</DrawerTitle>
								<DrawerDescription>
									Select from available menu options
								</DrawerDescription>
							</DrawerHeader>
						</VisuallyHidden>

						{/* Mobile Drawer Top Bar with Title and Close Button */}
						<div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60 shrink-0">
							<span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
								{activeItemData?.icon && <activeItemData.icon width={14} />}
								{activeItemData?.label || "Toolbox"}
							</span>
							<Button
								variant="ghost"
								size="icon"
								className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
								onClick={() => setDrawerOpen(false)}
								title="Close"
							>
								<X className="h-4 w-4" />
							</Button>
						</div>

						<div className="flex-1 overflow-y-auto">
							<MenuItem />
						</div>
					</DrawerContent>
				</Drawer>
			)}
		</>
	);
}
