import {combineReducers} from '@reduxjs/toolkit';
import {app} from '../config/state';
import { api } from '../services/api';
import {patientApiRtk} from '../services/patientApi';

export const appReducer = combineReducers({
    icure: app.reducer,
    cardinalApi: api.reducer,
    patientApi: patientApiRtk.reducer
});

export type AppState = ReturnType<typeof appReducer>;