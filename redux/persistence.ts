import { MMKV } from 'react-native-mmkv';
import { Storage } from 'redux-persist';

// ============================================================================
// MMKV Storage Adapter for Redux Persist
// ============================================================================

const mmkvStorage = new MMKV({ id: 'redux-storage' });

/**
 * Custom MMKV storage adapter for redux-persist
 * Implements the Storage interface required by redux-persist
 */
export const mmkvReduxStorage: Storage = {
  setItem: (key: string, value: string): Promise<void> => {
    console.log('💾 [MMKV Storage] Setting item:', key);
    console.log('💾 [MMKV Storage] Value length:', value.length);
    console.log('💾 [MMKV Storage] Value preview:', value.substring(0, 100) + '...');
    mmkvStorage.set(key, value);

    // Verify it was saved
    const verify = mmkvStorage.getString(key);
    if (verify === value) {
      console.log('✅ [MMKV Storage] Successfully verified write for key:', key);
    } else {
      console.error('❌ [MMKV Storage] Write verification failed for key:', key);
    }

    return Promise.resolve();
  },
  getItem: (key: string): Promise<string | null> => {
    const value = mmkvStorage.getString(key);
    console.log('📖 [MMKV Storage] Getting item:', key);
    console.log('📖 [MMKV Storage] Found value:', value ? `${value.length} characters` : 'null');
    if (value) {
      console.log('📖 [MMKV Storage] Value preview:', value.substring(0, 100) + '...');
    }
    return Promise.resolve(value ?? null);
  },
  removeItem: (key: string): Promise<void> => {
    console.log('🗑️  [MMKV Storage] Removing item:', key);
    mmkvStorage.delete(key);
    return Promise.resolve();
  },
};

