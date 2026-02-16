import { Buffer } from "buffer";
import { getRandomValues as expoCryptoGetRandomValues } from "expo-crypto";

// ─── Global Error Handlers ──────────────────────────────
// Catch unhandled promise rejections that kill the app silently on Android
if (typeof globalThis !== "undefined") {
  // Promise rejection handler
  const originalHandler = globalThis.ErrorUtils?.getGlobalHandler?.();
  if (globalThis.ErrorUtils) {
    globalThis.ErrorUtils.setGlobalHandler((error, isFatal) => {
      console.error("[GlobalError]", isFatal ? "FATAL:" : "NON-FATAL:", error);
      if (originalHandler) {
        originalHandler(error, isFatal);
      }
    });
  }
}

// ─── Polyfill Buffer globally ───────────────────────────
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
