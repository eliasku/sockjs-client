import { AbstractXHRObject } from "../browser/abstract-xhr";

class XHRCorsObject extends AbstractXHRObject {
  static enabled: boolean;

  constructor(method: string, url: string, payload?: string, opts?: any) {
    super(method, url, payload, opts);
  }
}

XHRCorsObject.enabled = AbstractXHRObject.enabled && AbstractXHRObject.supportsCORS;

export { XHRCorsObject };
