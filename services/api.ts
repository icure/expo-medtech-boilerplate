import {createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit';

import {nitroKryptomCryptoService} from '@icure/nitro-kryptom';

import {AuthenticationMethod, CardinalSdk, randomUuid, User,} from "@icure/cardinal-sdk";
import {AsyncStorageImpl} from "../utils/storage";

type ReduxableUser = Pick<User, 'id' | 'groupId'>

export type CardinalSdkState = {
	tokenKey?: string;
	token?: string;
	user?: ReduxableUser;
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

	// Clear Redux state
	dispatch(deleteReloginInfo({}))

	// Clear persisted state using redux-persist
	const { persistor } = await import('../redux/store')
	await persistor.purge()
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

export const setupRelogin = createAsyncThunk('cardinalApi/setupRelogin', async (sdk: CardinalSdk, {getState, dispatch}) => {
	console.log('🔐 [setupRelogin] Starting relogin setup...');

	const user = await sdk.user.getCurrentUser()
	console.log('👤 [setupRelogin] Got current user:', user.id);

	const tokenKey = randomUuid()
	console.log('🔑 [setupRelogin] Generated token key:', tokenKey);

	const token = await sdk.user.getToken(user.id, tokenKey, { tokenValidity: 60 * 60 * 24 * 14 })
	console.log('🎫 [setupRelogin] Got token (length):', token.length);

	apiCache[`${user.groupId}/${user.id}`] = sdk;
	console.log('💾 [setupRelogin] Cached SDK for:', `${user.groupId}/${user.id}`);

	const credentials = { user: { id: user.id, groupId: user.groupId }, token, tokenKey };
	console.log('📦 [setupRelogin] Dispatching credentials:', JSON.stringify(credentials, null, 2));

	dispatch(setReloginInfo(credentials))

	console.log('✅ [setupRelogin] Setup complete!');
});

export const api = createSlice({
	name: 'cardinalApi',
	initialState,
	reducers: {
		setReloginInfo: (
			state,
			{ payload: { token, tokenKey, user } }: PayloadAction<{ token: string, tokenKey: string, user: ReduxableUser }>
		) => {
			console.log('🔄 [setReloginInfo] Updating Redux state with credentials');
			console.log('🔄 [setReloginInfo] User:', JSON.stringify(user));
			console.log('🔄 [setReloginInfo] Token length:', token.length);
			console.log('🔄 [setReloginInfo] TokenKey:', tokenKey);

			state.token = token;
			state.tokenKey = tokenKey;
			state.user = user;

			console.log('✅ [setReloginInfo] Redux state updated');
		},
		deleteReloginInfo: (
			state,
			{}: PayloadAction<{}>
		) => {
			console.log('🗑️  [deleteReloginInfo] Clearing credentials from Redux state');
			if (state.token != undefined) delete state.token
			if (state.tokenKey != undefined) delete state.tokenKey
			if (state.user != undefined) delete state.user
			console.log('✅ [deleteReloginInfo] Redux state cleared');
		}
	}
});

// Export actions for direct use
export const { setReloginInfo, deleteReloginInfo } = api.actions;

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
