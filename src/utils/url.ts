export function getOrigin(url: string | null): string | null {
  if (!url) {
    return null;
  }
  const p = new URL(url);
  if (p.protocol === "file:") {
    return null;
  }
  let port = p.port;
  if (!port) {
    port = p.protocol === "https:" ? "443" : "80";
  }
  return `${p.protocol}//${p.hostname}:${port}`;
}

export function isOriginEqual(a: string, b: string): boolean {
  return getOrigin(a) === getOrigin(b);
}

export function isSchemeEqual(a: string, b: string): boolean {
  return a.split(":")[0] === b.split(":")[0];
}

export function addPath(url: string, path: string): string {
  const qs = url.split("?");
  return `${qs[0]}${path}${qs[1] ? `?${qs[1]}` : ""}`;
}

export function addQuery(url: string, q: string): string {
  return `${url}${url.indexOf("?") === -1 ? `?${q}` : `&${q}`}`;
}

export function isLoopbackAddr(addr: string): boolean {
  return /^127\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})$/i.test(addr) || /^\[::1\]$/.test(addr);
}
