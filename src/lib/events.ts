// MIT License - Internal Event Bus using RxJS
import { Subject, filter } from "rxjs";

export type EventBusData = {
	key: string;
	value?: {
		payload?: any;
		options?: any;
	};
};

export type Dispatcher = (
	key: string,
	value?: {
		payload?: any;
		options?: any;
	},
) => void;

export const subject = new Subject<EventBusData>();

export const dispatch: Dispatcher = (key: string, value?: { payload?: any; options?: any }) => {
	subject.next({ key, value });
};

export { filter };
export * from "@/constants/events";
