export function randomBytes(length: number): Uint8Array | number[] {
  const bytes = new Uint8Array(length);
  (globalThis as any).crypto.getRandomValues(bytes);
  return bytes;
}
