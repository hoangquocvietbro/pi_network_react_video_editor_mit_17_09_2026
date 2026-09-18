// MIT License - ID Generator
import { nanoid } from "nanoid";

export const generateId = (length: number = 10): string => {
	return nanoid(length);
};

export default generateId;
