import {createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit';

import * as ExpoKryptomModule from '@icure/expo-kryptom';

import storage from '../utils/storage';
import {setSavedCredentials} from '../config/state';

import {FetchBaseQueryError} from '@reduxjs/toolkit/query';
import {
	AnonymousMedTechApi,
	AuthenticationProcess,
	MedTechApi,
	NativeCryptoPrimitivesBridge,
	Patient,
	ua2b64,
	User
} from '@icure/medical-device-sdk';
import {SimpleMedTechCryptoStrategies} from '@icure/medical-device-sdk/src/services/MedTechCryptoStrategies';

export interface MedTechApiState {
	email?: string;
	token?: string;
	user?: User;
	keyPair?: { publicKey: string; privateKey: string };
	authProcess?: AuthenticationProcess;
	online: boolean;
	invalidEmail: boolean;
	invalidToken: boolean;
	firstName?: string;
	lastName?: string;
	dateOfBirth?: number;
	mobilePhone?: string;
	captcha?: string;
}

const initialState: MedTechApiState = {
	email: undefined,
	token: undefined,
	user: undefined,
	keyPair: undefined,
	authProcess: undefined,
	online: false,
	invalidEmail: false,
	invalidToken: false,
	firstName: undefined,
	lastName: undefined,
	dateOfBirth: undefined,
	mobilePhone: undefined,
	captcha: undefined,
};

const apiCache: { [key: string]: MedTechApi | AnonymousMedTechApi } = {};

export const startAuthentication = createAsyncThunk('medTechApi/startAuthentication', async (_payload, {getState}) => {
	const {
		medTechApi: {email, firstName, lastName, captcha},
	} = getState() as { medTechApi: MedTechApiState };

	if (!email) {
		throw new Error('No email provided');
	}

	const anonymousApiBuilder = new AnonymousMedTechApi.Builder()
		.withCrypto(new NativeCryptoPrimitivesBridge(ExpoKryptomModule))
		.withCryptoStrategies(new SimpleMedTechCryptoStrategies())
		.withMsgGwSpecId(process.env.EXPO_PUBLIC_EXTERNAL_SERVICES_SPEC_ID!!)
		.withAuthProcessByEmailId(process.env.EXPO_PUBLIC_EMAIL_AUTHENTICATION_PROCESS_ID!!)
		.withAuthProcessBySmsId(process.env.EXPO_PUBLIC_SMS_AUTHENTICATION_PROCESS_ID!!)
		.withStorage(storage)

		if (process.env.EXPO_PUBLIC_API_URL) {
			anonymousApiBuilder.withICureBaseUrl(process.env.EXPO_PUBLIC_API_URL);
		}

	const anonymousApi = await anonymousApiBuilder.build();

	const captchaType = 'friendly-captcha';

	let authProcess: AuthenticationProcess;

	try {
		authProcess = await anonymousApi.authenticationApi.startAuthentication({
			recaptcha: captcha!!,
			email,
			firstName,
			lastName,
			recaptchaType: captchaType
		});
	} catch (e) {
		console.error(`Couldn't start authentication: ${e}`)
	}

	apiCache[`${authProcess!!.login}/${authProcess!!.requestId}`] = anonymousApi;

	return authProcess!!;
});

export const completeAuthentication = createAsyncThunk('medTechApi/completeAuthentication', async (_payload, {
	getState,
	dispatch
}) => {
	const {
		medTechApi: {authProcess, token},
	} = getState() as { medTechApi: MedTechApiState };

	if (!authProcess) {
		throw new Error('No authProcess provided');
	}

	if (!token) {
		throw new Error('No token provided');
	}

	const anonymousApi = apiCache[`${authProcess.login}/${authProcess.requestId}`] as AnonymousMedTechApi;
	try {
		const result = await anonymousApi.authenticationApi.completeAuthentication(authProcess, token);
		const api = result.medTechApi;
		const user = await api.userApi.getLoggedUser();

		apiCache[`${result.groupId}/${result.userId}`] = api;
		delete apiCache[`${authProcess.login}/${authProcess.requestId}`];

		dispatch(setSavedCredentials({
			login: `${result.groupId}/${result.userId}`,
			token: result.token,
			tokenTimestamp: +Date.now()
		}));

		return user != null ? User.toJSON(user) : undefined;
	} catch (e) {
		console.error(`Couldn't complete authentication: ${e}`)
		throw e;
	}
});

export const login = createAsyncThunk('medTechApi/login', async (_, {getState}) => {
	const {
		medTechApi: {email, token},
	} = getState() as { medTechApi: MedTechApiState };

	if (!email) {
		throw new Error('No email provided');
	}

	if (!token) {
		throw new Error('No token provided');
	}

	const apiBuilder = new MedTechApi.Builder()
		.withCrypto(new NativeCryptoPrimitivesBridge(ExpoKryptomModule))
		.withCryptoStrategies(new SimpleMedTechCryptoStrategies())
		.withStorage(storage)
		.withMsgGwSpecId(process.env.EXPO_PUBLIC_EXTERNAL_SERVICES_SPEC_ID!!)
		.withAuthProcessByEmailId(process.env.EXPO_PUBLIC_EMAIL_AUTHENTICATION_PROCESS_ID!!)
		.withAuthProcessBySmsId(process.env.EXPO_PUBLIC_SMS_AUTHENTICATION_PROCESS_ID!!)
		.withUserName(email)
		.withPassword(token)

	if (process.env.EXPO_PUBLIC_API_URL) {
		apiBuilder.withICureBaseUrl(process.env.EXPO_PUBLIC_API_URL);
	}

	const api = await apiBuilder.build();
	const user = await api.userApi.getLoggedUser();

	apiCache[`${user.groupId}/${user.id}`] = api;

	return User.toJSON(user);
});

export const api = createSlice({
	name: 'medTechApi',
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
		setCaptcha: (state, {payload: {captcha}}: PayloadAction<{ captcha: string }>) => {
			state.captcha = captcha;
		},
	},
	extraReducers: builder => {
		builder.addCase(startAuthentication.fulfilled, (state, {payload: authProcess}) => {
			state.authProcess = authProcess;
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

export const guard = async <T>(guardedInputs: unknown[], lambda: () => Promise<T>): Promise<{
	error: FetchBaseQueryError
} | { data: T }> => {
	console.log('guardedInputs', guardedInputs);
	if (guardedInputs.some(x => !x)) {
		return {data: undefined};
	}
	try {
		const res = await lambda();
		console.log('res', res);
		const curate = (result: T): T => {
			console.log('result', result);
			return (
				result === null || result === undefined
					? null
					: res instanceof ArrayBuffer
						? ua2b64(res)
						: Array.isArray(result)
							? result.map(curate)
							: result instanceof Patient
								? Patient.toJSON(result)
								: result
			) as T;
		};
		const curated = curate(res);
		console.log('curated', curated);
		return {data: curated};
	} catch (e) {
		console.error('Error', e);
		return {error: getError(e as Error)};
	}
};

function getError(e: Error): FetchBaseQueryError {
	return {status: 'CUSTOM_ERROR', error: e.message, data: undefined};
}

export const getApiFromState = async (getState: () => MedTechApiState | {
	medTechApi: MedTechApiState
} | undefined): Promise<MedTechApi | undefined> => {
	const state = getState();
	if (!state) {
		throw new Error('No state found');
	}
	const medTechApiState = 'medTechApi' in state ? state.medTechApi : state;
	const {user} = medTechApiState;

	if (!user) {
		return undefined;
	}

	const cachedApi = apiCache[`${user.groupId}/${user.id}`] as MedTechApi;

	return cachedApi;
};

export const currentUser = (getState: () => unknown) => {
	const state = getState() as { medTechApi: MedTechApiState };
	return state.medTechApi.user;
};

export const medTechApi = async (getState: () => unknown) => {
	const state = getState() as { medTechApi: MedTechApiState };
	return await getApiFromState(() => state);
};

export const {setRegistrationInformation, setToken, setEmail, setCaptcha} = api.actions;