import { Complaint } from '@/types';

export const formatDate = (value: string | Date): string => {
	const date = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(date.getTime())) {
		return 'Invalid date';
	}
	return date.toLocaleDateString('en-IN', {
		year: 'numeric',
		month: 'short',
		day: '2-digit'
	});
};

export const isValidEmail = (email: string): boolean => {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const isValidPhoneNumber = (phone: string): boolean => {
	return /^\d{10}$/.test(phone);
};

export const truncateText = (text: string, maxLength = 120): string => {
	if (text.length <= maxLength) {
		return text;
	}
	return `${text.slice(0, maxLength).trim()}...`;
};

export const sortComplaintsByDate = (complaints: Complaint[]): Complaint[] => {
	return [...complaints].sort((a, b) => {
		const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
		const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
		return bTime - aTime;
	});
};
