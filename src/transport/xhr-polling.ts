import { AjaxBasedTransport } from "./lib/ajax-based";
import { XhrReceiver } from "./receiver/xhr";
import { XHRCorsObject } from "./sender/xhr-cors";
import { XHRLocalObject } from "./sender/xhr-local";

class XhrPollingTransport extends AjaxBasedTransport {
  static enabled: any;
  static transportName: string = "xhr-polling";
  static roundTrips: number = 2;

  constructor(transUrl: string) {
    if (!XHRLocalObject.enabled && !XHRCorsObject.enabled) {
      throw new Error("Transport created when disabled");
    }
    super(transUrl, "/xhr", XhrReceiver, XHRCorsObject);
  }
}

XhrPollingTransport.enabled = function (info: any): boolean {
  if (info.nullOrigin) {
    return false;
  }

  if (XHRLocalObject.enabled && info.sameOrigin) {
    return true;
  }
  return XHRCorsObject.enabled;
};

export { XhrPollingTransport };
