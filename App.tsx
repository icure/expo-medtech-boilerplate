import React from 'react';
import {ScrollView, StatusBar, useColorScheme} from 'react-native';

import {Router} from './navigation/Router';

import {Provider} from 'react-redux';
import {store} from './redux/store';

import { polyfillFetch } from "./polyfills/FetchPolyfill";

polyfillFetch()

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
