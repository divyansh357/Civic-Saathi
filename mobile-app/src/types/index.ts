export type UserRole = 'CITIZEN' | 'WORKER' | 'OFFICER' | 'ADMIN';

export interface User {
	id: string;
	name: string;
	email: string;
	phone?: string;
	role: UserRole;
	cityId?: string;
	city?: string;
	status?: string;
	verified?: boolean;
	profilePictureUrl?: string;
	address?: string;
	aadharNumber?: string;
	zoneNumber?: number;
	profileComplete?: boolean;
	municipalCode?: string;
}

export interface AuthTokens {
	accessToken: string;
	refreshToken?: string;
}

export type ComplaintStatus =
	| 'SUBMITTED'
	| 'VERIFIED'
	| 'ASSIGNED'
	| 'IN_PROGRESS'
	| 'RESOLVED'
	| 'CLOSED'
	| 'REOPENED';

export interface Complaint {
	id: string;
	complaintNumber?: string;
	title: string;
	description?: string;
	status: ComplaintStatus;
	category?: string;
	priority?: string;
	userId?: string;
	userName?: string;
	departmentId?: string;
	departmentName?: string;
	assignedWorkerId?: string;
	assignedWorkerName?: string;
	latitude?: number;
	longitude?: number;
	address?: string;
	city?: string;
	imageUrls?: string[];
	resolutionImages?: string[];
	aiSummary?: string;
	rating?: number;
	feedback?: string;
	createdAt?: string;
	updatedAt?: string;
}

export interface Assignment {
	id: string;
	complaintId: string;
	complaintNumber?: string;
	complaintTitle?: string;
	departmentId: string;
	departmentName?: string;
	workerId?: string;
	workerName?: string;
	status: 'PENDING' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'COMPLETED' | 'ESCALATED';
	priority?: string;
	slaDeadline?: string;
	assignedAt?: string;
	completedAt?: string;
	escalationReason?: string;
}

export interface Notification {
	id: string;
	message: string;
	read: boolean;
	type?: string;
	createdAt?: string;
}

export interface ApiError {
	message: string;
	status?: number;
	code?: string;
}
