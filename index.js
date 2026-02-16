import { Buffer } from "buffer";
import { getRandomValues as expoCryptoGetRandomValues } from "expo-crypto";

// Polyfill Buffer globally
if (typeof globalThis.Buffer === "undefined") {
  globalThis.Buffer = Buffer;
}

// Polyfill crypto.getRandomValues globally
try {
  class Crypto {
    getRandomValues = expoCryptoGetRandomValues;
  }
  const webCrypto = typeof globalThis.crypto !== "undefined" ? globalThis.crypto : new Crypto();
  if (typeof globalThis.crypto === "undefined") {
    Object.defineProperty(globalThis, "crypto", {
      configurable: true,
      enumerable: true,
      get: () => webCrypto,
    });
  }
} catch (e) {
  console.warn("[Polyfill] crypto setup failed:", e);
}

import "expo-router/entry";
