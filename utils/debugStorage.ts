import { MMKV } from 'react-native-mmkv';

/**
 * Debug utilities for inspecting MMKV storage
 * Import and call these functions from your components to debug persistence
 */

const storage = new MMKV({ id: 'redux-storage' });

export const debugStorage = {
  /**
   * List all keys in MMKV storage
   */
  listAllKeys: () => {
    const keys = storage.getAllKeys();
    console.log('🔍 [Debug] All MMKV keys:', keys);
    return keys;
  },

  /**
   * Get a specific value from storage
   */
  getValue: (key: string) => {
    const value = storage.getString(key);
    console.log(`🔍 [Debug] Value for key "${key}":`, value);
    return value;
  },

  /**
   * Get all data from storage
   */
  getAllData: () => {
    const keys = storage.getAllKeys();
    const data: Record<string, string | undefined> = {};

    keys.forEach(key => {
      data[key] = storage.getString(key);
    });

    console.log('🔍 [Debug] All MMKV data:', JSON.stringify(data, null, 2));
    return data;
  },

  /**
   * Clear all data from storage (USE WITH CAUTION)
   */
  clearAll: () => {
    console.log('⚠️  [Debug] Clearing all MMKV storage...');
    storage.clearAll();
    console.log('✅ [Debug] MMKV storage cleared');
  },

  /**
   * Get the persisted Redux state
   */
  getPersistedState: () => {
    const persistKey = 'persist:cardinalApi';
    const value = storage.getString(persistKey);

    if (value) {
      try {
        const parsed = JSON.parse(value);
        console.log('🔍 [Debug] Persisted Redux state:', JSON.stringify(parsed, null, 2));
        return parsed;
      } catch (e) {
        console.error('❌ [Debug] Failed to parse persisted state:', e);
      }
    } else {
      console.log('ℹ️  [Debug] No persisted state found');
    }
    return null;
  }
};

// Example usage:
// import { debugStorage } from './utils/debugStorage';
// debugStorage.getAllData();
// debugStorage.getPersistedState();

