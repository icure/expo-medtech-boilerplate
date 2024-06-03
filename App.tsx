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
import {ScrollView, StatusBar, useColorScheme} from 'react-native';

import {Router} from './navigation/Router';

import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import {store, persistor} from './redux/store';
import {Text} from 'react-native'

import { polyfillWindowCryptoWithStrongRandom } from '@icure/expo-kryptom'

Buffer = require("@craftzdog/react-native-buffer").Buffer;

import '@azure/core-asynciterator-polyfill'

polyfillWindowCryptoWithStrongRandom()

const App = () => {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: '#FFFDFE',
    flex: 1,
  };

  return (
    <Provider store={store}>
      <PersistGate persistor={persistor} loading={<Text>Loading...</Text>}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={backgroundStyle.backgroundColor}
        />
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={backgroundStyle}>
          <Router />
        </ScrollView>
      </PersistGate>
    </Provider>
  );
};

export default App;
