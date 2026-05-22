export function hasDomain(): boolean {
  if (!(globalThis as any).document) {
    return true;
  }
  try {
    return !!(globalThis as any).document.domain;
  } catch {
    return false;
  }
}
