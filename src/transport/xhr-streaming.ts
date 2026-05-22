import { AjaxBasedTransport } from "./lib/ajax-based";
import { XhrReceiver } from "./receiver/xhr";
import { XHRCorsObject } from "./sender/xhr-cors";
import { XHRLocalObject } from "./sender/xhr-local";
import * as browser from "../utils/browser";

class XhrStreamingTransport extends AjaxBasedTransport {
  static enabled: any;
  static transportName: string = "xhr-streaming";
  static roundTrips: number = 2;
  static needBody: boolean;

  constructor(transUrl: string) {
    if (!XHRLocalObject.enabled && !XHRCorsObject.enabled) {
      throw new Error("Transport created when disabled");
    }
    super(transUrl, "/xhr_streaming", XhrReceiver, XHRCorsObject);
  }
}

XhrStreamingTransport.enabled = function (info: any): boolean {
  if (info.nullOrigin) {
    return false;
  }
  if (browser.isOpera()) {
    return false;
  }

  return XHRCorsObject.enabled;
};

XhrStreamingTransport.needBody = !!(globalThis as any).document;

export { XhrStreamingTransport };
