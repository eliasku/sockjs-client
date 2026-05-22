import * as random from "./random";

const onUnload: Record<string, Function> = {};
let afterUnload = false;
const isChromePackagedApp =
  typeof globalThis !== "undefined" &&
  (globalThis as any).chrome &&
  (globalThis as any).chrome.app &&
  (globalThis as any).chrome.app.runtime;

export function attachEvent(event: string, listener: EventListener): void {
  if (typeof (globalThis as any).addEventListener !== "undefined") {
    (globalThis as any).addEventListener(event, listener, false);
  } else if ((globalThis as any).document && (globalThis as any).attachEvent) {
    (globalThis as any).document.attachEvent("on" + event, listener);
    (globalThis as any).attachEvent("on" + event, listener);
  }
}

export function detachEvent(event: string, listener: EventListener): void {
  if (typeof (globalThis as any).removeEventListener !== "undefined") {
    (globalThis as any).removeEventListener(event, listener, false);
  } else if ((globalThis as any).document && (globalThis as any).detachEvent) {
    (globalThis as any).document.detachEvent("on" + event, listener);
    (globalThis as any).detachEvent("on" + event, listener);
  }
}

export function unloadAdd(listener: Function): string | null {
  if (isChromePackagedApp) {
    return null;
  }
  const ref = random.string(8);
  (onUnload as any)[ref] = listener;
  if (afterUnload) {
    setTimeout(triggerUnloadCallbacks, 0);
  }
  return ref;
}

export function unloadDel(ref: string): void {
  if (ref in onUnload) {
    delete (onUnload as any)[ref];
  }
}

export function triggerUnloadCallbacks(): void {
  for (const ref in onUnload) {
    onUnload[ref]?.();
    delete onUnload[ref];
  }
}

function unloadTriggered(): void {
  if (afterUnload) {
    return;
  }
  afterUnload = true;
  triggerUnloadCallbacks();
}

function pagehide(e: PageTransitionEvent): void {
  if (!e.persisted) unloadTriggered();
}

if (!isChromePackagedApp) {
  if ("onpagehide" in globalThis) {
    attachEvent("pagehide", pagehide as any);
  } else {
    attachEvent("unload", unloadTriggered as any);
  }
}
