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
  address?: string;
  aadharNumber?: string;
  zoneNumber?: number;
  profileComplete?: boolean;
  departmentCode?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

export type ComplaintStatus =
  | 'OPEN'
  | 'SUBMITTED'
  | 'DUPLICATE_CHECKED'
  | 'VERIFIED'
  | 'ROUTED'
  | 'ASSIGNED'
  | 'ACKNOWLEDGED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'VERIFIED_FOR_CLOSURE'
  | 'CLOSED'
  | 'REOPENED'
  | 'REJECTED'
  | 'ESCALATED'
  | 'CANCELLED';

export type ComplaintPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'VERY_LOW';

export interface Complaint {
  id: string;
  complaintNumber?: string;
  title: string;
  description?: string;
  status: ComplaintStatus;
  priority?: string;
  category?: string;
  userId?: string;
  userName?: string;
  departmentId?: string;
  departmentName?: string;
  assignedWorkerId?: string;
  assignedWorkerName?: string;
  latitude?: number;
  longitude?: number;
  location?: string;
  address?: string;
  city?: string;
  imageUrls?: string[];
  verificationMethod?: string;
  aiSummary?: string;
  slaDeadline?: string;
  escalatedAt?: string;
  resolvedAt?: string;
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
  description?: string;
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
  status?: string;
  activeComplaintsCount?: number;
  complaintsAssigned?: number;
  complaintsResolved?: number;
  profileImageUrl?: string;
  previousWorks?: string;
}

export interface Assignment {
  id: string;
  complaintId: string;
  complaintTitle?: string;
  departmentId?: string;
  departmentName?: string;
  workerId?: string;
  workerName?: string;
  assignedWorkerId?: string;
  assignedWorkerName?: string;
  status: 'ASSIGNED' | 'ACCEPTED' | 'REJECTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'PENDING' | 'ACKNOWLEDGED' | 'ESCALATED';
  priority?: string;
  slaDeadline?: string;
  assignedAt?: string;
  completedAt?: string;
  rejectionReason?: string;
  escalationReason?: string;
  notes?: string;
  isAutoAssigned?: boolean;
  completionImages?: string[];
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
  averageResolutionTime?: number;
  slaBreachRate?: number;
  complaintsByStatus?: Record<string, number>;
  complaintsByCategory?: Record<string, number>;
  complaintsByDepartment?: Record<string, number>;
  departments?: number;
  workers?: number;
  citySatisfactionScore?: number;
}

export interface Feedback {
  id: string;
  complaintId: string;
  userId?: string;
  userName?: string;
  rating: number;
  comment?: string;
  isSatisfied?: boolean;
  createdAt?: string;
}

export interface ReopenRequest {
  id: string;
  complaintId: string;
  userId?: string;
  userName?: string;
  reason?: string;
  reopenCount?: number;
  status: 'REQUESTED' | 'APPROVED' | 'REJECTED';
  createdAt?: string;
}

export interface PagedResponse<T> {
  content: T[];
  pageable: any;
  totalElements: number;
  totalPages: number;
  last: boolean;
  size: number;
  number: number;
  sort: any;
  numberOfElements: number;
  first: boolean;
  empty: boolean;
}
