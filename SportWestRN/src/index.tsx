import React from 'react';
import {Provider} from 'react-redux';
import App from './App';
import {store} from './store';
import 'react-native-url-polyfill/auto';

export default function Index() {
  return (
    <Provider store={store}>
      <App />
    </Provider>
  );
}
