import {combineReducers} from '@reduxjs/toolkit';
import {persistConfig, app} from '../config/state';
import {persistReducer} from 'redux-persist';
import { api } from '../services/api';
import {patientApiRtk} from '../services/patientApi';

export const appReducer = combineReducers({
    icure: app.reducer,
    medTechApi: api.reducer,
    patientApi: patientApiRtk.reducer
});

export const persistedReducer = persistReducer(persistConfig, appReducer);

export type AppState = ReturnType<typeof appReducer>;