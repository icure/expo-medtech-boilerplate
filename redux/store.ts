import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  createTransform
} from 'redux-persist';
import { mmkvReduxStorage } from './persistence';
import { patientApiRtk } from '../services/patientApi';
import {api, CardinalSdkState} from '../services/api';
import {CardinalSdk, User} from "@icure/cardinal-sdk";

// ============================================================================
// Redux Persist Configuration
// ============================================================================

const persistConfig = {
  key: 'cardinalApi',
  storage: mmkvReduxStorage,
  version: 1,
  debug: __DEV__, // Enable debug mode in development
};

// Wrap the cardinalApi reducer with persistReducer
const persistedCardinalApiReducer = persistReducer(persistConfig, api.reducer);

// ============================================================================
// Redux Store Configuration
// ============================================================================

export const store = configureStore({
  reducer: {
    cardinalApi: persistedCardinalApiReducer,
    [patientApiRtk.reducerPath]: patientApiRtk.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
      immutableCheck: false,
    }).concat(patientApiRtk.middleware),
});

// Create persistor
export const persistor = persistStore(store);

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Enable refetchOnFocus and refetchOnReconnect behaviors
setupListeners(store.dispatch);



