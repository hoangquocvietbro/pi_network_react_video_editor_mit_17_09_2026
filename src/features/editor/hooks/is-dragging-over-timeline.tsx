import { useState, useEffect } from "react";
import { filter, subject, DRAG_END, DRAG_PREFIX, DRAG_START } from "@/lib/events";

export const useIsDraggingOverTimeline = () => {
	const [isDraggingOverTimeline, setIsDraggingOverTimeline] = useState(false);

	useEffect(() => {
		const dragEvents = subject.pipe(
			filter(({ key }) => key.startsWith(DRAG_PREFIX)),
		);

		const dragEventsSubscription = dragEvents.subscribe((obj) => {
			if (obj.key === DRAG_START) {
				setIsDraggingOverTimeline(true);
			} else if (obj.key === DRAG_END) {
				setIsDraggingOverTimeline(false);
			}
		});

		return () => dragEventsSubscription.unsubscribe();
	}, []);

	return isDraggingOverTimeline;
};
