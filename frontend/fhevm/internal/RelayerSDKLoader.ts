import { SDK_CDN_URL, SDK_LOCAL_URL } from "./constants";

type TraceType = (message?: unknown, ...optionalParams: unknown[]) => void;

function isRelayerSDKAvailable(w: any, trace?: TraceType): boolean {
  const ok = typeof w !== "undefined" && "relayerSDK" in w && typeof w.relayerSDK?.createInstance === "function";
  if (!ok && trace) trace("[RelayerSDKLoader] window.relayerSDK not ready");
  return ok;
}

export class RelayerSDKLoader {
  private _trace?: TraceType;
  constructor(parameters?: { trace?: TraceType }) {
    this._trace = parameters?.trace;
  }

  public isLoaded() {
    if (typeof window === "undefined") {
      return false;
    }
    return isRelayerSDKAvailable(window, this._trace);
  }

  public load(): Promise<void> {
    if (typeof window === "undefined") {
      return Promise.reject(new Error("RelayerSDKLoader: can only be used in the browser."));
    }
    if (this.isLoaded()) {
      return Promise.resolve();
    }
    const tryLoad = (src: string) =>
      new Promise<void>((resolve, reject) => {
        const existingScript = document.querySelector(`script[src="${src}"]`);
        if (existingScript) {
          if (!this.isLoaded()) {
            reject(new Error("RelayerSDKLoader: window.relayerSDK invalid"));
            return;
          }
          resolve();
          return;
        }
        const script = document.createElement("script");
        script.src = src;
        script.type = "text/javascript";
        script.async = true;
        script.onload = () => {
          if (!this.isLoaded()) {
            reject(new Error(`RelayerSDKLoader: SDK loaded from ${src} but window.relayerSDK invalid`));
            return;
          }
          resolve();
        };
        script.onerror = () => {
          reject(new Error(`RelayerSDKLoader: Failed to load ${src}`));
        };
        document.head.appendChild(script);
      });

    return tryLoad(SDK_CDN_URL).catch(async () => {
      if (this._trace) this._trace("[RelayerSDKLoader] CDN failed, fallback to local");
      return tryLoad(SDK_LOCAL_URL);
    });
  }
}


