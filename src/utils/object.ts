export function isObject(obj: any): boolean {
  const type = typeof obj;
  return type === "function" || (type === "object" && !!obj);
}

export function extend(obj: any, ...sources: any[]): any {
  if (!isObject(obj)) {
    return obj;
  }
  let source: any;
  let prop: string;
  for (let i = 0, length = sources.length; i < length; i++) {
    source = sources[i];
    for (prop in source) {
      if (Object.prototype.hasOwnProperty.call(source, prop)) {
        obj[prop] = source[prop];
      }
    }
  }
  return obj;
}
