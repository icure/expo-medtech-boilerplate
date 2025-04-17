import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import storage from '../utils/storage';
import {MMKV} from "react-native-mmkv";

// Configuration object for data persistence with Redux Persist
export const persistConfig = {
  key: 'icure',
  storage: storage,
  whitelist: ['icure'],
};

export interface State {
  savedCredentials?: {
    tokenTimestamp: number;
    login: string;
    token: string;
  };
}

const initialState = {} as State;

const mmkv = new MMKV();

export const app = createSlice({
  name: 'app',
  initialState: () => {
    const savedCredentialsJson = mmkv.getString('savedCredentials')
    if (savedCredentialsJson) {
        const savedCredentials = JSON.parse(savedCredentialsJson);
        return {savedCredentials} as State;
    }
    return initialState;
  },
  reducers: {
    setSavedCredentials(state, {payload: savedCredentials}: PayloadAction<{login: string; token: string; tokenTimestamp: number} | undefined>) {
      state.savedCredentials = savedCredentials;
      mmkv.set('savedCredentials', JSON.stringify(savedCredentials));
    },
    revertAll() {
      return initialState;
    },
  },
});

export const {setSavedCredentials, revertAll} = app.actions;