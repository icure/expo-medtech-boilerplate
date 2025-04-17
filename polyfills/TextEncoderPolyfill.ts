// @ts-ignore
import { polyfillGlobal } from 'react-native/Libraries/Utilities/PolyfillFunctions';

export function polyfillTextEncoder() {
  const { TextEncoder, TextDecoder } = require('text-encoding');

  polyfillGlobal('TextEncoder', () => TextEncoder);
  polyfillGlobal('TextDecoder', () => TextDecoder);
}