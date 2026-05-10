export type UserRole = 'CITIZEN' | 'WORKER' | 'OFFICER' | 'ADMIN' | 'DEPARTMENT_ADMIN' | 'SUPERADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  city?: string;
  state?: string;
  status?: string;
  verified?: boolean;
  createdAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

export type ComplaintStatus =
  | 'SUBMITTED'
  | 'VERIFIED'
  | 'ROUTED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REOPENED'
  | 'REJECTED'
  | 'ESCALATED';

export type ComplaintPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'VERY_LOW';

export interface Complaint {
  id: string;
  title: string;
  description?: string;
  status: ComplaintStatus;
  priority?: ComplaintPriority;
  category?: string;
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
  createdAt?: string;
  updatedAt?: string;
}

export interface Department {
  id: string;
  name: string;
  code?: string;
  categoryType?: string;
  city?: string;
  active?: boolean;
  headName?: string;
  email?: string;
  phone?: string;
}

export interface Worker {
  id: string;
  userId?: string;
  name?: string;
  email?: string;
  designation?: string;
  departmentId?: string;
  departmentName?: string;
  available?: boolean;
  activeComplaintsCount?: number;
}

export interface Assignment {
  id: string;
  complaintId: string;
  complaintTitle?: string;
  departmentId: string;
  departmentName?: string;
  workerId?: string;
  workerName?: string;
  status: 'PENDING' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'COMPLETED' | 'ESCALATED';
  priority?: ComplaintPriority;
  slaDeadline?: string;
  assignedAt?: string;
  completedAt?: string;
  escalationReason?: string;
  notes?: string;
}

export interface Notification {
  id: string;
  message: string;
  read: boolean;
  type?: string;
  userId?: string;
  createdAt?: string;
}

export interface AnalyticsDashboard {
  totalComplaints?: number;
  openComplaints?: number;
  resolvedComplaints?: number;
  escalatedComplaints?: number;
  avgResolutionHours?: number;
  slaBreachRate?: number;
  complaintsByStatus?: Record<string, number>;
  complaintsByCategory?: Record<string, number>;
  complaintsByDepartment?: Record<string, number>;
}

export interface PagedResponse<T> {
  data: T[];
  currentPage: number;
  totalItems: number;
  totalPages: number;
  status: string;
}
