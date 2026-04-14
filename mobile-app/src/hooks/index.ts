import { useCallback, useEffect, useMemo, useState } from 'react';
import { UserRole } from '@/types';
import { useAuthStore } from '@store/index';
import storageService from '@services/storage/storageService';

export function useIsAuthenticated(): boolean {
	return useAuthStore(state => state.isAuthenticated);
}

export function useCurrentUser() {
	return useAuthStore(state => state.user);
}

export function useUserRole(): UserRole | null {
	const user = useCurrentUser();
	return user?.role ?? null;
}

export function useAsync<T>(operation: () => Promise<T>, runImmediately = false) {
	const [data, setData] = useState<T | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const execute = useCallback(async (): Promise<T> => {
		setIsLoading(true);
		setError(null);
		try {
			const result = await operation();
			setData(result);
			return result;
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Unexpected error';
			setError(message);
			throw err;
		} finally {
			setIsLoading(false);
		}
	}, [operation]);

	useEffect(() => {
		if (runImmediately) {
			void execute();
		}
	}, [execute, runImmediately]);

	return { data, isLoading, error, execute };
}

export function useDebounce<T>(value: T, delayMs = 300): T {
	const [debouncedValue, setDebouncedValue] = useState(value);

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedValue(value);
		}, delayMs);

		return () => clearTimeout(timer);
	}, [value, delayMs]);

	return debouncedValue;
}

type FormErrors<T> = Partial<Record<keyof T, string>>;

export function useForm<T extends Record<string, unknown>>(initialValues: T) {
	const [values, setValues] = useState<T>(initialValues);
	const [errors, setErrors] = useState<FormErrors<T>>({});

	const setFieldValue = useCallback(<K extends keyof T>(field: K, fieldValue: T[K]) => {
		setValues(prev => ({ ...prev, [field]: fieldValue }));
	}, []);

	const setFieldError = useCallback(<K extends keyof T>(field: K, message: string) => {
		setErrors(prev => ({ ...prev, [field]: message }));
	}, []);

	const clearFieldError = useCallback(<K extends keyof T>(field: K) => {
		setErrors(prev => {
			const next = { ...prev };
			delete next[field];
			return next;
		});
	}, []);

	const resetForm = useCallback(() => {
		setValues(initialValues);
		setErrors({});
	}, [initialValues]);

	return {
		values,
		errors,
		setFieldValue,
		setFieldError,
		clearFieldError,
		resetForm,
		isValid: useMemo(() => Object.keys(errors).length === 0, [errors])
	};
}

export function useLocalStorage<T>(key: string, defaultValue: T) {
	const [value, setValue] = useState<T>(defaultValue);

	useEffect(() => {
		let active = true;
		storageService
			.getPreference<T>(key, defaultValue)
			.then(stored => {
				if (active) {
					setValue(stored);
				}
			})
			.catch(() => {
				if (active) {
					setValue(defaultValue);
				}
			});

		return () => {
			active = false;
		};
	}, [key, defaultValue]);

	const setStoredValue = useCallback(
		async (nextValue: T) => {
			setValue(nextValue);
			await storageService.savePreferences(key, nextValue);
		},
		[key]
	);

	return [value, setStoredValue] as const;
}
