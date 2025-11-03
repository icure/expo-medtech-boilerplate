import React from 'react';
import {ScrollView, StatusBar, useColorScheme} from 'react-native';

import {Router} from './navigation/Router';

import {Provider} from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import {store, persistor} from './redux/store';

import { polyfillFetch } from "./polyfills/FetchPolyfill";
import { View, ActivityIndicator, Text } from 'react-native';

polyfillFetch()

const AppContent = () => {
	const isDarkMode = useColorScheme() === 'dark';

	const backgroundStyle = {
		backgroundColor: '#FFFDFE',
		flex: 1,
	};

	return (
		<>
			<StatusBar
				barStyle={isDarkMode ? 'light-content' : 'dark-content'}
				backgroundColor={backgroundStyle.backgroundColor}
			/>
			<ScrollView
				contentInsetAdjustmentBehavior="automatic"
				style={backgroundStyle}>
				<Router/>
			</ScrollView>
		</>
	);
};

const App = () => {
	return (
		<Provider store={store}>
			<PersistGate
				loading={
					<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFDFE' }}>
						<ActivityIndicator size="large" color="#007AFF" />
						<Text style={{ marginTop: 16, fontSize: 16, color: '#666' }}>
							Loading...
						</Text>
					</View>
				}
				persistor={persistor}
				onBeforeLift={() => {
					console.log('🔄 [PersistGate] State rehydration complete');
					const state = store.getState();
					console.log('📊 [PersistGate] Rehydrated state:', JSON.stringify(state.cardinalApi, null, 2));
				}}
			>
				<AppContent />
			</PersistGate>
		</Provider>
	);
};

export default App;

