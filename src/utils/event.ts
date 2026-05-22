import * as random from "./random";

const onUnload: Record<string, Function> = {};
let afterUnload = false;

export function attachEvent(event: string, listener: EventListener): void {
  (globalThis as any).addEventListener(event, listener, false);
}

export function detachEvent(event: string, listener: EventListener): void {
  (globalThis as any).removeEventListener(event, listener, false);
}

export function unloadAdd(listener: Function): string {
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

if ("onpagehide" in globalThis) {
  attachEvent("pagehide", pagehide as any);
} else {
  attachEvent("unload", unloadTriggered as any);
}
