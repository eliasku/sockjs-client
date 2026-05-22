import { AbstractXHRObject } from "../browser/abstract-xhr";

export class XHRLocalObject extends AbstractXHRObject {
  static enabled: boolean;

  constructor(method: string, url: string, payload?: string, _opts?: any) {
    super(method, url, payload, { noCredentials: true });
  }
}

XHRLocalObject.enabled = AbstractXHRObject.enabled;
