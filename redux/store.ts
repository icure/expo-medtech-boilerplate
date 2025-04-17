import {configureStore} from '@reduxjs/toolkit';
import { patientApiRtk } from '../services/patientApi';
import {setupListeners} from "@reduxjs/toolkit/query";
import {api} from "../services/api";

export const store = configureStore({
  reducer: {
      [api.reducerPath]: api.reducer,
      [patientApiRtk.reducerPath]: patientApiRtk.reducer
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({serializableCheck: false, immutableCheck: false})
        .concat(
          patientApiRtk.middleware,
        ),
});

setupListeners(store.dispatch)

export type AppDispatch = typeof store.dispatch;