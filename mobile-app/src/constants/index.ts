const toNumber = (value: string | undefined, fallback: number): number => {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
};

export const API_CONFIG = {
	baseUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080/api/v1',
	timeoutMs: toNumber(process.env.EXPO_PUBLIC_API_TIMEOUT, 30000)
};

export const STORAGE_KEYS = {
	user: '@civic_saathi/user',
	accessToken: '@civic_saathi/auth/access-token',
	refreshToken: '@civic_saathi/auth/refresh-token',
	preferencePrefix: '@civic_saathi/preferences/'
};

export const APP_COLORS = {
	primary: '#0F766E',
	surface: '#FFFFFF',
	background: '#F4F6FA',
	text: '#0F172A'
};
