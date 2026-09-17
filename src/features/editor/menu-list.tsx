import { memo, useCallback, useState } from "react";
import useLayoutStore from "./store/use-layout-store";
import { Icons } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import { MenuItem } from "./menu-item/menu-item";
import { useIsLargeScreen } from "@/hooks/use-media-query";
import { useAuthStore } from "../../store/use-auth-store";
import { ExportLoginPrompt } from "../../components/auth/export-login-prompt";
import { Lock } from "lucide-react";
// Define menu items configuration for better maintainability
const MENU_ITEMS = [
	{
		id: "uploads",
		icon: Icons.upload,
		label: "Uploads",
		ariaLabel: "Add and manage uploads",
		requiresAuth: false
	},
	{
		id: "texts",
		icon: Icons.type,
		label: "Texts",
		ariaLabel: "Add and edit text elements",
		requiresAuth: false
	},
	{
		id: "videos",
		icon: Icons.video,
		label: "Videos",
		ariaLabel: "Add and manage video content",
		requiresAuth: false
	},
	{
		id: "images",
		icon: Icons.image,
		label: "Images",
		ariaLabel: "Add and manage images",
		requiresAuth: false
	},
	{
		id: "audios",
		icon: Icons.audio,
		label: "Audio",
		ariaLabel: "Add and manage audio content",
		requiresAuth: false
	},
] as const;

// Memoized menu button component for better performance
const MenuButton = memo<{
	item: (typeof MENU_ITEMS)[number];
	isActive: boolean;
	isAuthenticated: boolean;
	onClick: (menuItem: string, requiresAuth: boolean) => void;
}>(({ item, isActive, isAuthenticated, onClick }) => {
	const handleClick = useCallback(() => {
		onClick(item.id, item.requiresAuth);
	}, [item.id, item.requiresAuth, onClick]);

	const IconComponent = item.icon;
	const showLockIcon = item.requiresAuth && !isAuthenticated;

	return (
		<Button
			onClick={handleClick}
			className={cn(
				"relative transition-colors duration-200 hover:bg-secondary/80",
				isActive
					? "bg-secondary text-secondary-foreground"
					: "text-muted-foreground hover:text-foreground",
			)}
			variant="ghost"
			size="icon"
			aria-label={item.ariaLabel}
			aria-pressed={isActive}
		>
			{IconComponent ? <IconComponent width={16} height={16} /> : null}
			{showLockIcon && (
				<Lock className="absolute -top-0.5 -right-0.5 w-3 h-3 text-yellow-500" />
			)}
		</Button>
	);
});

MenuButton.displayName = "MenuButton";

// Main MenuList component
function MenuList() {
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

	const handleMenuItemClick = useCallback(
		(menuItem: string, requiresAuth: boolean) => {
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
		},
		[isAuthenticated, isLargeScreen, setActiveMenuItem, setDrawerOpen, setShowMenuItem]
	);

	const handleDrawerOpenChange = useCallback(
		(open: boolean) => {
			setDrawerOpen(open);
		},
		[setDrawerOpen],
	);

	return (
		<>
			<nav
				className="flex w-14 flex-col items-center gap-1 border-r border-border/80 py-2"
				role="toolbar"
				aria-label="Editor tools"
			>
				{MENU_ITEMS.map((item) => {
					const isActive =
						(drawerOpen && activeMenuItem === item.id) ||
						(showMenuItem && activeMenuItem === item.id);

					return (
						<MenuButton
							key={item.id}
							item={item}
							isActive={isActive}
							isAuthenticated={isAuthenticated}
							onClick={handleMenuItemClick}
						/>
					);
				})}
			</nav>

			{/* Drawer only on mobile/tablet - conditionally mounted */}
			{!isLargeScreen && (
				<Drawer open={drawerOpen} onOpenChange={handleDrawerOpenChange}>
					<DrawerContent className="max-h-[80vh]">
						<DrawerHeader>
							<DrawerTitle className="capitalize">{activeMenuItem}</DrawerTitle>
						</DrawerHeader>
						<div className="flex-1 overflow-auto">
							<MenuItem />
						</div>
					</DrawerContent>
				</Drawer>
			)}

			{/* Login prompt for premium features */}
			<ExportLoginPrompt
				open={showLoginPrompt}
				onOpenChange={setShowLoginPrompt}
				remainingExports={0}
			/>
		</>
	);
}

export default memo(MenuList);
