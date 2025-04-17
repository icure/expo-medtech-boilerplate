import {createAction, createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit';

import {
	Aes,
	Rsa,
	Hmac,
	StrongRandom,
	Digest
} from '@icure/expo-kryptom';


import {setSavedCredentials} from '../config/state';

import {FetchBaseQueryError} from '@reduxjs/toolkit/query';

import {
	AuthenticationMethod,
	AuthenticationProcessTelecomType,
	CaptchaOptions,
	CardinalSdk, Challenge,
	User
} from "@icure/cardinal-sdk";
import AuthenticationWithProcessStep = CardinalSdk.AuthenticationWithProcessStep;
import {polyfillFetch} from "../polyfills/FetchPolyfill";
import {resolveChallenge, Solution} from "@icure/expo-kerberus";
import {AsyncStorageImpl} from "../utils/storage";

export interface CardinalSdkState {
	email?: string;
	token?: string;
	user?: User;
	keyPair?: { publicKey: string; privateKey: string };
	online: boolean;
	invalidEmail: boolean;
	invalidToken: boolean;
	firstName?: string;
	lastName?: string;
	dateOfBirth?: number;
	mobilePhone?: string;
	kerberusProgress: number;
}

const initialState: CardinalSdkState = {
	email: undefined,
	token: undefined,
	user: undefined,
	keyPair: undefined,
	online: false,
	invalidEmail: false,
	invalidToken: false,
	firstName: undefined,
	lastName: undefined,
	dateOfBirth: undefined,
	mobilePhone: undefined,
	kerberusProgress: 0,
};

let authProcess: AuthenticationWithProcessStep | undefined = undefined;
const apiCache: Record<string, CardinalSdk> = {};

const onKerberusProgress = createAction<number>('cardinalApi/onProgress');

export const startAuthentication = createAsyncThunk('cardinalApi/startAuthentication', async (_payload, {getState, dispatch}) => {
	const {
		cardinalApi: {email, firstName, lastName},
	} = getState() as { cardinalApi: CardinalSdkState };

	if (!email) {
		throw new Error('No email provided');
	}

	polyfillFetch()

	let solution: Solution;

	try {
		const response = await fetch(`https://msg-gw.icure.cloud/${process.env.EXPO_PUBLIC_EXTERNAL_SERVICES_SPEC_ID}/challenge`, {
			method: 'GET',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			}
		});

		const challenge: Challenge = JSON.parse(await response.text());
		console.log(challenge)

		solution = await resolveChallenge(challenge, process.env.EXPO_PUBLIC_EXTERNAL_SERVICES_SPEC_ID!!);
	} catch (e) {
		console.error(`Couldn't get challenge: ${e}`)
		throw e;
	}

	try {
		const authenticationStep = await CardinalSdk.initializeWithProcess(
			undefined,
			"https://api.icure.cloud",
			"https://msg-gw.icure.cloud",
			process.env.EXPO_PUBLIC_EXTERNAL_SERVICES_SPEC_ID!!,
			process.env.EXPO_PUBLIC_EMAIL_AUTHENTICATION_PROCESS_ID!!,
			AuthenticationProcessTelecomType.Email,
			email,
			// new CaptchaOptions.Kerberus.Delegated({ onProgress: (progress) => dispatch(onKerberusProgress(progress)) }),
			new CaptchaOptions.Kerberus.Computed({solution}),
			new AsyncStorageImpl(),
			{
				firstName,
				lastName
			},
			{
				encryptedFields: {
					patient: ["notes", "addresses"]
				},
				cryptoService: {
					aes: Aes,
					digest: Digest,
					hmac: Hmac,
					rsa: Rsa,
					strongRandom: StrongRandom
				} as any
			}
		)

		authProcess = authenticationStep

		return authenticationStep;
	}
	catch (e) {
		console.error(`Couldn't start authentication: ${e}`)
		throw e;
	}

});

export const completeAuthentication = createAsyncThunk('cardinalApi/completeAuthentication', async (_payload, {
	getState,
	dispatch
}) => {
	const {
		cardinalApi: {token},
	} = getState() as { cardinalApi: CardinalSdkState };

	if (!authProcess) {
		throw new Error('No authProcess provided');
	}

	if (!token) {
		throw new Error('No token provided');
	}

	try {
		const sdk = await authProcess.completeAuthentication(token);
		const currentUser = await sdk.user.getCurrentUser();

		authProcess = undefined;
		apiCache[`${currentUser.groupId}/${currentUser.id}`] = sdk;

		const longToken = await sdk.user.getToken(
			currentUser.id,
			'boilerplate-cardinal-sdk',
			{
				tokenValidity: 30 * 24 * 60 * 60
			}
		);

		dispatch(setSavedCredentials({
			login: `${currentUser.groupId}/${currentUser.id}`,
			token: longToken,
			tokenTimestamp: +Date.now()
		}));

		return currentUser;
	} catch (e) {
		console.error(`Couldn't complete authentication: ${e}`)
		throw e;
	}
});

export const login = createAsyncThunk('cardinalApi/login', async (_, {getState}) => {
	const {
		cardinalApi: {email, token},
	} = getState() as { cardinalApi: CardinalSdkState };

	if (!email) {
		throw new Error('No email provided');
	}

	if (!token) {
		throw new Error('No token provided');
	}

	const api = await CardinalSdk.initialize(
		undefined,
		"https://api.icure.cloud",
		new AuthenticationMethod.UsingCredentials.UsernameLongToken(email, token),
		new AsyncStorageImpl(),
		{
			encryptedFields: {
				patient: ["notes", "addresses"]
			},
			cryptoService: {
				aes: Aes,
				digest: Digest,
				hmac: Hmac,
				rsa: Rsa,
				strongRandom: StrongRandom
			} as any
		}
	)

	const user = await api.user.getCurrentUser();

	apiCache[`${user.groupId}/${user.id}`] = api;

	return user;
});

export const api = createSlice({
	name: 'cardinalApi',
	initialState,
	reducers: {
		setRegistrationInformation: (state, {payload: {firstName, lastName, email}}: PayloadAction<{
			firstName: string;
			lastName: string;
			email: string
		}>) => {
			state.firstName = firstName;
			state.lastName = lastName;
			state.email = email;
		},
		setToken: (state, {payload: {token}}: PayloadAction<{ token: string }>) => {
			state.token = token;
			state.invalidToken = false;
		},
		setEmail: (state, {payload: {email}}: PayloadAction<{ email: string }>) => {
			state.email = email;
			state.invalidEmail = false;
		},
	},
	extraReducers: builder => {
		builder.addCase(onKerberusProgress, (state, action) => {
			state.kerberusProgress = action.payload;
		})
		builder.addCase(startAuthentication.fulfilled, (state, {payload: authProcess}) => {

		});
		builder.addCase(startAuthentication.rejected, (state, {}) => {
			state.invalidEmail = true;
		});
		builder.addCase(completeAuthentication.fulfilled, (state, {payload: user}) => {
			state.user = user as User;
			state.online = true;
		});
		builder.addCase(completeAuthentication.rejected, (state, {}) => {
			state.invalidToken = true;
		});
		builder.addCase(login.fulfilled, (state, {payload: user}) => {
			state.user = user as User;
			state.online = true;
		});
		builder.addCase(login.rejected, (state, {}) => {
			state.invalidToken = true;
			state.online = false;
		});
	},
});

function getError(e: Error): FetchBaseQueryError {
	return {status: 'CUSTOM_ERROR', error: e.message, data: undefined};
}

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

	const cachedApi = apiCache[`${user.groupId}/${user.id}`];

	return cachedApi;
};

export const currentUser = (getState: () => unknown) => {
	const state = getState() as { cardinalApi: CardinalSdkState };
	return state.cardinalApi.user;
};

export const cardinalApi = async (getState: () => unknown) => {
	const state = getState() as { cardinalApi: CardinalSdkState };
	return await getApiFromState(() => state);
};

export const {setRegistrationInformation, setToken, setEmail} = api.actions;