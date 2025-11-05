import { ReadableStream } from "web-streams-polyfill";
// @ts-ignore
import { fetch as textStreamingFetch, Headers, Request, Response } from "react-native-fetch-api";
import {defineLazyObjectProperty} from "./LazyValuePolyfill";

const cardinalFetch = (input: string | URL | globalThis.Request, init?: RequestInit) => {
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
  defineLazyObjectProperty(global, 'fetch', () => cardinalFetch);
  defineLazyObjectProperty(global, 'Headers', () => Headers);
  defineLazyObjectProperty(global, 'Request', () => Request);
  defineLazyObjectProperty(global, 'Response', () => Response);
  defineLazyObjectProperty(global, 'ReadableStream', () => ReadableStream);
}
