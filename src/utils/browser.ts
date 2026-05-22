export function isOpera(): boolean {
  return !!(globalThis as any).navigator && /opera/i.test((globalThis as any).navigator.userAgent);
}

export function isKonqueror(): boolean {
  return !!(globalThis as any).navigator && /konqueror/i.test((globalThis as any).navigator.userAgent);
}

export function hasDomain(): boolean {
  if (!(globalThis as any).document) {
    return true;
  }
  try {
    return !!(globalThis as any).document.domain;
  } catch (e) {
    return false;
  }
}
