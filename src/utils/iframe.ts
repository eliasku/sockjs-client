import * as eventUtils from "./event";

const debug = (...args: any[]) => console.log("[sockjs-client:utils:iframe]", ...args);

const WPrefix = "_jp";
let currentWindowId: string | null = null;

function polluteGlobalNamespace(): void {
  if (!(WPrefix in (globalThis as any))) {
    (globalThis as any)[WPrefix] = {};
  }
}

function postMessage(type: string, data?: string): void {
  if ((globalThis as any).parent !== globalThis) {
    (globalThis as any).parent.postMessage(
      JSON.stringify({
        windowId: currentWindowId,
        type: type,
        data: data || "",
      }),
      "*",
    );
  } else {
    debug("Cannot postMessage, no parent window.", type, data);
  }
}

interface IfaceResult {
  post: (msg: any, origin: string) => void;
  cleanup: () => void;
  loaded: () => void;
}

function createIframe(iframeUrl: string, errorCallback: (err: string) => void): IfaceResult {
  let iframe: HTMLIFrameElement | null = (globalThis as any).document.createElement("iframe");
  let tref: ReturnType<typeof setTimeout>;
  let unloadRef: string | null;
  const unattach = function () {
    debug("unattach");
    clearTimeout(tref);
    try {
      (iframe as any).onload = null;
    } catch {
      // intentionally empty
    }
    (iframe as any).onerror = null;
  };
  const cleanup = function () {
    debug("cleanup");
    if (iframe) {
      unattach();
      setTimeout(function () {
        if (iframe) {
          iframe.parentNode!.removeChild(iframe);
        }
        iframe = null;
      }, 0);
      if (unloadRef !== null && unloadRef !== undefined) {
        eventUtils.unloadDel(unloadRef!);
      }
    }
  };
  const onerror = function (err: string) {
    debug("onerror", err);
    if (iframe) {
      cleanup();
      errorCallback(err);
    }
  };
  const post = function (msg: any, origin: string) {
    debug("post", msg, origin);
    setTimeout(function () {
      try {
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage(msg, origin);
        }
      } catch {
        // intentionally empty
      }
    }, 0);
  };

  iframe!.src = iframeUrl;
  iframe!.style.display = "none";
  iframe!.style.position = "absolute";
  iframe!.onerror = function () {
    onerror("onerror");
  };
  iframe!.onload = function () {
    debug("onload");
    clearTimeout(tref);
    tref = setTimeout(function () {
      onerror("onload timeout");
    }, 2000);
  };
  (globalThis as any).document.body.appendChild(iframe!);
  tref = setTimeout(function () {
    onerror("timeout");
  }, 15000);
  unloadRef = eventUtils.unloadAdd(cleanup);
  return {
    post: post,
    cleanup: cleanup,
    loaded: unattach,
  };
}

function setCurrentWindowId(id: string | null): void {
  currentWindowId = id;
}

let iframeEnabled = false;
if ((globalThis as any).document) {
  iframeEnabled =
    typeof (globalThis as any).postMessage === "function" || typeof (globalThis as any).postMessage === "object";
}

export {
  WPrefix,
  currentWindowId,
  setCurrentWindowId,
  polluteGlobalNamespace,
  postMessage,
  createIframe,
  iframeEnabled,
};
