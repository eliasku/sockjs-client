import { AbstractXHRObject } from "../browser/abstract-xhr";

class XHRLocalObject extends AbstractXHRObject {
  static enabled: boolean;

  constructor(method: string, url: string, payload?: string, opts?: any) {
    super(method, url, payload, { noCredentials: true });
  }
}

XHRLocalObject.enabled = AbstractXHRObject.enabled;

export { XHRLocalObject };
