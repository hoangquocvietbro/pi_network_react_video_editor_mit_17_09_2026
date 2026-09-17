"use client";
import Timeline from "./timeline";
import useStore from "./store/use-store";
import Navbar from "./navbar";
import useTimelineEvents from "./hooks/use-timeline-events";
import Scene from "./scene";
import { SceneRef } from "./scene/scene.types";
import StateManager, { DESIGN_LOAD } from "@designcombo/state";
import { useEffect, useRef, useState } from "react";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ImperativePanelHandle } from "react-resizable-panels";
import { getCompactFontData, loadFonts } from "./utils/fonts";
import { SECONDARY_FONT, SECONDARY_FONT_URL } from "./constants/constants";
import MenuList from "./menu-list";
import { MenuItem } from "./menu-item";
import { ControlItem } from "./control-item";
import CropModal from "./crop-modal/crop-modal";
import useDataState from "./store/use-data-state";
import { FONTS } from "./data/fonts";
import FloatingControl from "./control-item/floating-controls/floating-control";
import { useSceneStore } from "@/store/use-scene-store";
import { dispatch } from "@designcombo/events";
import MenuListHorizontal from "./menu-list-horizontal";
import { useIsLargeScreen } from "@/hooks/use-media-query";
import { ITrackItem } from "@designcombo/types";
import useLayoutStore from "./store/use-layout-store";
import ControlItemHorizontal from "./control-item-horizontal";
import { AuthProvider } from "../../components/auth/auth-provider";
import { useProjectStore } from "../../store/use-project-store";
import { ProjectLoadDialog } from "../../components/project-management/project-load-dialog";

const stateManager = new StateManager({
	size: {
		width: 1080,
		height: 1920,
	},
});

const initPlayload = {
	size: {
		width: 1080,
		height: 1920,
	},
	mediaFiles: [],
	backgroundColor: "#000000",
	trackItems: [],
	transitions: [],
	aspectRatio: 16 / 9,
	backgroundVideos: [],
	bgm: {
		id: 0,
		name: "",
		duration: 0,
		url: "",
		volume: 1,
	},
	name: "Untitled Video",
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString(),
};

const Editor = ({ tempId, id }: { tempId?: string; id?: string }) => {
	const [projectName, setProjectName] = useState<string>("Untitled video");
	const { scene } = useSceneStore();
	const timelinePanelRef = useRef<ImperativePanelHandle>(null);
	const sceneRef = useRef<SceneRef>(null);
	const { timeline, playerRef } = useStore();
	const { activeIds, trackItemsMap, transitionsMap } = useStore();
	const [loaded, setLoaded] = useState(false);
	const [trackItem, setTrackItem] = useState<ITrackItem | null>(null);
	const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false);
	const {
		setTrackItem: setLayoutTrackItem,
		setFloatingControl,
		setLabelControlItem,
		setTypeControlItem,
	} = useLayoutStore();
	const isLargeScreen = useIsLargeScreen();

	// Project management
	const {
		currentProject,
		projectName: storeProjectName,
		loadProject,
		setProjectName: setStoreProjectName,
		clearCurrentProject
	} = useProjectStore();
	useTimelineEvents();

	const { setCompactFonts, setFonts } = useDataState();
	// Load project if ID is provided
	useEffect(() => {
		if (id && id !== 'new') {
			loadProjectFromId(id);
		} else {
			// Load default initPlayload data for new projects
			dispatch(DESIGN_LOAD, { payload: initPlayload });
		}
	}, [id]);

	// Load project from ID
	const loadProjectFromId = async (projectId: string) => {
		try {
			await loadProject(projectId);
			// The project data will be loaded via the store effect
		} catch (error) {
			console.error('Failed to load project:', error);
			// Fallback to initPlayload data
			dispatch(DESIGN_LOAD, { payload: initPlayload });
		}
	};

	// Load project design data when current project changes
	useEffect(() => {
		if (currentProject && currentProject.design_data) {
			dispatch(DESIGN_LOAD, { payload: currentProject.design_data });
			setProjectName(currentProject.name);
		}
	}, [currentProject]);

	// Sync project name with store
	useEffect(() => {
		if (storeProjectName && storeProjectName !== projectName) {
			setProjectName(storeProjectName);
		}
	}, [storeProjectName]);


	useEffect(() => {
		setCompactFonts(getCompactFontData(FONTS));
		setFonts(FONTS);
	}, []);

	useEffect(() => {
		loadFonts([
			{
				name: SECONDARY_FONT,
				url: SECONDARY_FONT_URL,
			},
		]);
	}, []);

	useEffect(() => {
		const screenHeight = window.innerHeight;
		const desiredHeight = 300;
		const percentage = (desiredHeight / screenHeight) * 100;
		timelinePanelRef.current?.resize(percentage);
	}, []);

	const handleTimelineResize = () => {
		const timelineContainer = document.getElementById("timeline-container");
		if (!timelineContainer) return;

		const isSmall = window.innerWidth < 768;
		const container =
			timelineContainer.querySelector<HTMLElement>(".relative.flex-1");
		const width =
			container?.clientWidth ||
			(timelineContainer.clientWidth - (isSmall ? 0 : 40));

		timeline?.resize(
			{
				height: timelineContainer.clientHeight - 90,
				width,
			},
			{
				force: true,
			},
		);

		// Trigger zoom recalculation when timeline is resized
		setTimeout(() => {
			sceneRef.current?.recalculateZoom();
		}, 100);
	};

	useEffect(() => {
		const onResize = () => handleTimelineResize();
		window.addEventListener("resize", onResize);
		return () => window.removeEventListener("resize", onResize);
	}, [timeline]);

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

	useEffect(() => {
		setFloatingControl("");
		setLabelControlItem("");
		setTypeControlItem("");
	}, [isLargeScreen]);

	useEffect(() => {
		setLoaded(true);
	}, []);

	// Handle project loading
	const handleProjectLoad = (projectId: string) => {
		// Update URL to reflect loaded project
		window.history.pushState({}, '', `/edit/${projectId}`);
	};

	// Handle project name change
	const handleProjectNameChange = (name: string) => {
		setProjectName(name);
		setStoreProjectName(name);
	};
	return (
		<div className="flex h-screen w-screen flex-col">
			<Navbar
				projectName={projectName}
				user={null}
				stateManager={stateManager}
				setProjectName={handleProjectNameChange}
			/>
			<div className="flex flex-1">
				{isLargeScreen && (
					<div className="bg-muted  flex flex-none border-r border-border/80 h-[calc(100vh-44px)]">
						<MenuList />
						<MenuItem />
					</div>
				)}
				<ResizablePanelGroup style={{ flex: 1 }} direction="vertical">
					<ResizablePanel className="relative" defaultSize={70}>
						<FloatingControl />
						<div className="flex h-full flex-1">
							{/* Sidebar only on large screens - conditionally mounted */}

							<div
								style={{
									width: "100%",
									height: "100%",
									position: "relative",
									flex: 1,
									overflow: "hidden",
								}}
							>
								<CropModal />
								<Scene ref={sceneRef} stateManager={stateManager} />
							</div>
						</div>
					</ResizablePanel>
					<ResizableHandle />
					<ResizablePanel
						className="min-h-[50px]"
						ref={timelinePanelRef}
						defaultSize={30}
						onResize={handleTimelineResize}
					>
						{playerRef && <Timeline stateManager={stateManager} />}
					</ResizablePanel>
					{!isLargeScreen && !trackItem && loaded && <MenuListHorizontal />}
					{!isLargeScreen && trackItem && <ControlItemHorizontal />}
				</ResizablePanelGroup>
				<ControlItem />
			</div>

			{/* Project Load Dialog */}
			<ProjectLoadDialog
				open={isLoadDialogOpen}
				onOpenChange={setIsLoadDialogOpen}
				onProjectLoad={handleProjectLoad}
			/>
		</div>
	);
};

export default Editor;
