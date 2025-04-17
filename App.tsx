/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * Generated with the TypeScript template
 * https://github.com/react-native-community/react-native-template-typescript
 *
 * @format
 */

import React from 'react';
import {ScrollView, StatusBar, Text, useColorScheme} from 'react-native';

import {Router} from './navigation/Router';

import {Provider} from 'react-redux';
import {store} from './redux/store';

import {polyfillWindowCryptoWithStrongRandom} from '@icure/expo-kryptom'
import '@azure/core-asynciterator-polyfill'
import {polyfillTextEncoder} from "./polyfills/TextEncoderPolyfill";

(window as any).crypto = global.crypto

Buffer = require("@craftzdog/react-native-buffer").Buffer;

polyfillWindowCryptoWithStrongRandom()
polyfillTextEncoder()

const App = () => {
	const isDarkMode = useColorScheme() === 'dark';

	const backgroundStyle = {
		backgroundColor: '#FFFDFE',
		flex: 1,
	};

	return (
		<>
			<Provider store={store}>
				<StatusBar
					barStyle={isDarkMode ? 'light-content' : 'dark-content'}
					backgroundColor={backgroundStyle.backgroundColor}
				/>
				<ScrollView
					contentInsetAdjustmentBehavior="automatic"
					style={backgroundStyle}>
					<Router/>
				</ScrollView>
			</Provider>
		</>
	);
};

export default App;
