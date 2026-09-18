// Types based on Kysely schema to replace Prisma imports
// File: lib/types.ts
import type { IDesign } from "@/types/editor";

// ==========================================
// 1. CÁC INTERFACE CHO DATABASE (Dành cho Kysely)
// ==========================================
export interface Database {
	projects: ProjectTable;
	users: UserTable;
	sessions: SessionTable;
}

export interface ProjectTable {
	id: string;
	name: string;
	description: string | null;
	thumbnail_url: string | null;
	design_data: IDesign;
	user_id: string | null;
	is_public: boolean;
	tags: string[];
	created_at: Date;
	updated_at: Date;
	last_accessed_at: Date | null;
}

export interface UserTable {
	id: string;
	name: string;
	pi_uid: string;
	username: string;
	avatar_url: string | null;
	credits: number;
	is_vip: boolean;
	last_login: Date | null;
	created_at: Date;
	updated_at: Date;
}

export interface SessionTable {
	id: string;
	user_id: string;
	token: string;
	expires_at: Date;
	created_at: Date;
	last_accessed: Date;
}

// ==========================================
// 2. CÁC INTERFACE CHO API VÀ GIAO DIỆN FRONTEND
// ==========================================
export interface Project {
	id: string;
	name: string;
	description: string | null;
	thumbnail_url: string | null;
	design_data: IDesign;
	user_id: string | null;
	is_public: boolean;
	tags: string[];
	created_at: Date;
	updated_at: Date;
	last_accessed_at: Date | null;
}

export interface CreateProjectRequest {
	name: string;
	description?: string;
	design_data: IDesign;
	is_public?: boolean;
	tags?: string[];
	user_id?: string;
}

export interface UpdateProjectRequest {
	name?: string;
	description?: string;
	design_data?: IDesign;
	is_public?: boolean;
	tags?: string[];
}

export interface ProjectListItem {
	id: string;
	name: string;
	description: string | null;
	thumbnail_url: string | null;
	created_at: Date;
	updated_at: Date;
	last_accessed_at: Date | null;
	tags: string[];
	is_public: boolean;
}

export interface User {
	id: string;
	name: string;
	pi_uid: string;
	username: string;
	avatar_url: string | null;
	email: string | null;
	credits: number;
	is_vip: boolean;
	remove_ads?: boolean;
	remote_render_until?: Date | null;
	created_at: Date;
	updated_at: Date;
	last_login: Date | null;
}

export interface PiLoginRequest {
	accessToken?: string;
	isBypass?: boolean;
}

export interface AuthResponse {
	user: User;
	session: {
		token: string;
		expires_at: Date;
	};
}

export interface Session {
	id: string;
	user_id: string;
	token: string;
	expires_at: Date;
	created_at: Date;
	last_accessed: Date;
}

export interface Token {
	id: string;
	name: string;
	key: string;
	createdAt: Date;
	expiresAt: Date;
	userId: string;
}

export interface Upload {
	id: string;
	fileName: string;
	filePath: string;
	fileSize: number;
	contentType: string;
	metadata: any | null;
	folder: string | null;
	type: "VIDEO" | "IMAGE" | "AUDIO" | "DOCUMENT" | "OTHER";
	method: "USER" | "API" | "SYSTEM" | "OTHER";
	origin: "USER_CREATED" | "AI_GENERATED" | "UNKNOWN";
	status: "PENDING" | "COMPLETED" | "FAILED";
	userId: string;
	createdAt: Date;
	updatedAt: Date;
	isPreview: boolean;
}

// ==========================================
// 3. PI NETWORK PAYMENT & ADS INTERFACES
// ==========================================
export interface PiPaymentData {
	amount: number;
	memo: string;
	metadata: Record<string, any>;
}

export interface PiPaymentCallbacks {
	onReadyForServerApproval: (paymentId: string) => Promise<void> | void;
	onReadyForServerCompletion: (paymentId: string, txid: string) => Promise<void> | void;
	onCancel: (paymentId: string) => Promise<void> | void;
	onError: (error: Error, payment?: any) => Promise<void> | void;
}

export interface PaymentRecord {
	id: string;
	user_id: string | null;
	user_uid: string;
	amount: number;
	memo: string;
	metadata: Record<string, any>;
	txid: string | null;
	status: 'INITIALIZED' | 'APPROVED' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
	created_at: Date;
	updated_at: Date;
}

export interface AdRewardResponse {
	success: boolean;
	rewardGranted?: boolean;
	newCredits?: number;
	error?: string;
}

