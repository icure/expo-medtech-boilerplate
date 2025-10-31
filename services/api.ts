import {createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit';

import {nitroKryptomCryptoService} from '@icure/nitro-kryptom';

import {AuthenticationMethod, CardinalSdk, randomUuid, User,} from "@icure/cardinal-sdk";
import {AsyncStorageImpl} from "../utils/storage";

export type CardinalSdkState = {
	tokenKey?: string;
	token?: string;
	user?: User;
}

const initialState: CardinalSdkState = {}

const apiCache: Record<string, CardinalSdk> = {};

export const logout = createAsyncThunk('cardinalApi/logout', async (_payload, {
	getState,
	dispatch
}) => {
	const { cardinalApi } = getState() as { cardinalApi: CardinalSdkState };
	const sdk = await getApiFromState(() => cardinalApi)

	if (sdk == null) throw new Error("Can't logout, no SDK")

	// TODO delete user token

	api.actions.deleteReloginInfo({})
});

export const relogin = createAsyncThunk('cardinalApi/relogin', async (_, {getState}) => {
	const {
		cardinalApi: { user, token },
	} = getState() as { cardinalApi: CardinalSdkState };

	if (!token || !user) {
		throw new Error("Can't relogin");
	}

	apiCache[`${user.groupId}/${user.id}`] = await CardinalSdk.initialize(
		undefined,
		"https://api.icure.cloud",
		new AuthenticationMethod.UsingCredentials.UsernameLongToken(`${user.groupId}/${user.id}`, token),
		new AsyncStorageImpl(),
		{
			encryptedFields: {
				patient: ["notes", "addresses"]
			},
			cryptoService: nitroKryptomCryptoService
		}
	);

	return user;
});

export const setupRelogin = createAsyncThunk('cardinalApi/setupRelogin', async (sdk: CardinalSdk, {getState}) => {
	const user = await sdk.user.getCurrentUser()
	const tokenKey = randomUuid()
	const token = await sdk.user.getToken(user.id, tokenKey, { tokenValidity: 60 * 60 * 24 * 14 })

	apiCache[`${user.groupId}/${user.id}`] = sdk;

	api.actions.setReloginInfo({ user, token, tokenKey })
});

export const api = createSlice({
	name: 'cardinalApi',
	initialState,
	reducers: {
		setReloginInfo: (
			state,
			{ payload: { token, tokenKey, user } }: PayloadAction<{ token: string, tokenKey: string, user: User }>
		) => {
			state.token = token;
			state.tokenKey = tokenKey;
			state.user = user
		},
		deleteReloginInfo: (
			state,
			{}: PayloadAction<{}>
		) => {
			if (state.token != undefined) delete state.token
			if (state.tokenKey != undefined) delete state.tokenKey
			if (state.user != undefined) delete state.user
		}
	}
});

export const getApiFromState = async (getState: () => CardinalSdkState | {
	cardinalApi: CardinalSdkState
} | undefined): Promise<CardinalSdk | undefined> => {
	const state = getState();
	if (!state) {
		throw new Error('No state found');
	}
	const cardinalApiState = 'cardinalApi' in state ? state.cardinalApi : state;
	const {user} = cardinalApiState;

	if (!user) {
		return undefined;
	}

	return apiCache[`${user.groupId}/${user.id}`];
};

export const currentUser = (getState: () => unknown) => {
	const state = getState() as { cardinalApi: CardinalSdkState };
	return state.cardinalApi.user;
};

export const cardinalApi = async (getState: () => unknown) => {
	const state = getState() as { cardinalApi: CardinalSdkState };
	return await getApiFromState(() => state);
};
