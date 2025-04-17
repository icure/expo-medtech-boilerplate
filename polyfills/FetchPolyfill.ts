// @ts-ignore
import { polyfillGlobal } from 'react-native/Libraries/Utilities/PolyfillFunctions';
import { ReadableStream } from "web-streams-polyfill";
// @ts-ignore
import { fetch as textStreamingFetch, Headers, Request, Response } from "react-native-fetch-api";

const icureFetch = (input: string | URL | globalThis.Request, init?: RequestInit) => {
  // TODO use non-streaming fetch for non-text requests
  // if isTextRequest
  return textStreamingFetch(input, {
    ...init,
    reactNative: { textStreaming: true }
  });
  // else
  // return fetch(input, init).then((response) => add synthetic body from array buffer)
}

export function polyfillFetch() {
  polyfillGlobal('fetch', () => icureFetch);
  polyfillGlobal('Headers', () => Headers);
  polyfillGlobal('Request', () => Request);
  polyfillGlobal('Response', () => Response);
  polyfillGlobal('ReadableStream', () => ReadableStream);
}