import useStore from "../store/use-store";
import { useEffect, useRef, useState } from "react";
import { Droppable } from "@/components/ui/droppable";
import { PlusIcon } from "lucide-react";
import { DroppableArea } from "./droppable";
import useUploadStore from "../store/use-upload-store";

interface SceneEmptyProps {
	zoom: number;
	size: { width: number; height: number };
}
const SceneEmpty: React.FC<SceneEmptyProps> = ({ zoom, size }) => {

	const [isDraggingOver, setIsDraggingOver] = useState(false);

	const { setShowUploadModal } = useUploadStore();
	const onSelectFiles = (files: File[]) => {
		console.log({ files });
	};

	return (
		<div className="absolute inset-0 z-10 flex h-full w-full items-center justify-center pointer-events-none">
			<Droppable
				maxFileCount={4}
				maxSize={4 * 1024 * 1024}
				disabled={false}
				onValueChange={onSelectFiles}
				className="h-full w-full flex-1"
			>
				<DroppableArea
					onDragStateChange={setIsDraggingOver}
					className={`absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 transform items-center justify-center border border-dashed text-center transition-colors duration-200 ease-in-out pointer-events-auto ${isDraggingOver ? "border-white bg-white/10" : "border-white/20 hover:border-white/30"
						}`}
					style={{
						width: size.width,
						height: size.height,
						transform: `translate(-50%, -50%) scale(${zoom})`,
						transformOrigin: "center center"
					}}
				>
					<div
						className="flex flex-col items-center justify-center gap-3 cursor-pointer"
						onClick={() => setShowUploadModal(true)}
					>
						<div className="hover:bg-primary-dark cursor-pointer rounded-full border bg-primary p-2.5 text-secondary shadow-md transition-colors duration-200">
							<PlusIcon className="h-5 w-5" aria-hidden="true" />
						</div>
						<div className="flex flex-col gap-1">
							<p className="text-sm font-medium text-zinc-300">Click to upload media</p>
							<p className="text-xs text-muted-foreground">or drag and drop video / image here</p>
						</div>
					</div>
				</DroppableArea>
			</Droppable>
		</div>
	);
};

export default SceneEmpty;
