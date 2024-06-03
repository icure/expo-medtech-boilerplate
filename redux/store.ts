import {configureStore} from '@reduxjs/toolkit';
import {persistedReducer} from './reducer';
import {persistStore} from 'redux-persist';
import { patientApiRtk } from '../services/patientApi';

export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({serializableCheck: false, immutableCheck: false})
        .concat(
          patientApiRtk.middleware,
        ),
});
export const persistor = persistStore(store);

export type AppDispatch = typeof store.dispatch;