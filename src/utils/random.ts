const _randomStringChars = "abcdefghijklmnopqrstuvwxyz012345";

export function string(length: number): string {
  const max = _randomStringChars.length;
  const bytes = new Uint8Array(length);
  (globalThis as any).crypto.getRandomValues(bytes);
  const ret: string[] = [];
  for (let i = 0; i < length; i++) {
    ret.push(_randomStringChars.charAt(bytes[i]! % max));
  }
  return ret.join("");
}

export function number(max: number): number {
  return Math.floor(Math.random() * max);
}

export function numberString(max: number): string {
  const t = ("" + (max - 1)).length;
  const p = "0".repeat(t);
  return (p + number(max)).slice(-t);
}
