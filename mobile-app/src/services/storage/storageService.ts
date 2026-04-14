import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@constants/index';
import { AuthTokens, User } from '@/types';

class StorageService {
  async saveUser(user: User): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
  }

  async getUser(): Promise<User | null> {
    const rawValue = await AsyncStorage.getItem(STORAGE_KEYS.user);
    if (!rawValue) {
      return null;
    }

    try {
      return JSON.parse(rawValue) as User;
    } catch {
      return null;
    }
  }

  async clearUser(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.user);
  }

  async saveAuthTokens(tokens: AuthTokens): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.accessToken, tokens.accessToken);
    if (tokens.refreshToken) {
      await AsyncStorage.setItem(STORAGE_KEYS.refreshToken, tokens.refreshToken);
    }
  }

  async getAccessToken(): Promise<string | null> {
    return AsyncStorage.getItem(STORAGE_KEYS.accessToken);
  }

  async clearAuthTokens(): Promise<void> {
    await AsyncStorage.multiRemove([STORAGE_KEYS.accessToken, STORAGE_KEYS.refreshToken]);
  }

  async savePreferences<T>(key: string, value: T): Promise<void> {
    await AsyncStorage.setItem(`${STORAGE_KEYS.preferencePrefix}${key}`, JSON.stringify(value));
  }

  async getPreference<T>(key: string, fallbackValue: T): Promise<T> {
    const rawValue = await AsyncStorage.getItem(`${STORAGE_KEYS.preferencePrefix}${key}`);
    if (!rawValue) {
      return fallbackValue;
    }

    try {
      return JSON.parse(rawValue) as T;
    } catch {
      return fallbackValue;
    }
  }
}

const storageService = new StorageService();

export default storageService;
