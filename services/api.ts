import {createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit';

import {nitroKryptomCryptoService} from '@icure/nitro-kryptom';

import {AuthenticationMethod, CardinalSdk, randomUuid, User,} from "@icure/cardinal-sdk";
import {MmkvStorageFacade} from "../utils/storage";

export type CardinalSdkState = {
	tokenKey?: string;
	token?: string;
	userPojo?: any;
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
		cardinalApi: { userPojo, token },
	} = getState() as { cardinalApi: CardinalSdkState };

	if (token == undefined || userPojo == undefined) {
		throw new Error("Can't relogin");
	}

	const user = User.fromJSON(userPojo, false, ["ReduxState.user"])

	apiCache[`${user.groupId}/${user.id}`] = await CardinalSdk.initialize(
		undefined,
		"https://api.icure.cloud",
		new AuthenticationMethod.UsingCredentials.UsernameLongToken(`${user.groupId}/${user.id}`, token),
		new MmkvStorageFacade(),
		{
			encryptedFields: {
				patient: ["notes", "addresses"]
			},
			cryptoService: nitroKryptomCryptoService
		}
	);

	return userPojo;
});

export const sdkProvider = createAsyncThunk('cardinalApi/sdk', async (_, {getState}) => {
	const {
		cardinalApi
	} = getState() as { cardinalApi: CardinalSdkState };

	const api = await getApiFromState(() => cardinalApi)

	if (api == undefined) throw new Error("Sdk is not initialized")

	return api;
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

	const credentials = { userPojo: user.toJSON(), token, tokenKey };
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
			{ payload: { token, tokenKey, userPojo } }: PayloadAction<{ token: string, tokenKey: string, userPojo: object }>
		) => {
			console.log('🔄 [setReloginInfo] Updating Redux state with credentials');
			console.log('🔄 [setReloginInfo] User:', JSON.stringify(userPojo));
			console.log('🔄 [setReloginInfo] Token length:', token.length);
			console.log('🔄 [setReloginInfo] TokenKey:', tokenKey);

			state.token = token;
			state.tokenKey = tokenKey;
			state.userPojo = userPojo;

			console.log('✅ [setReloginInfo] Redux state updated');
		},
		deleteReloginInfo: (
			state,
			{}: PayloadAction<{}>
		) => {
			console.log('🗑️  [deleteReloginInfo] Clearing credentials from Redux state');
			if (state.token != undefined) delete state.token
			if (state.tokenKey != undefined) delete state.tokenKey
			if (state.userPojo != undefined) delete state.userPojo
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
	const {userPojo} = cardinalApiState;

	if (userPojo == undefined) {
		return undefined;
	}

	const user = User.fromJSON(userPojo)

	return apiCache[`${user.groupId}/${user.id}`];
};

export const currentUser = (getState: () => unknown) => {
	const state = getState() as { cardinalApi: CardinalSdkState };
	const userPojo = state.cardinalApi.userPojo
	if (userPojo == undefined) return undefined
	return User.fromJSON(userPojo);
};

export const cardinalApi = async (getState: () => unknown) => {
	const state = getState() as { cardinalApi: CardinalSdkState };
	return await getApiFromState(() => state);
};
