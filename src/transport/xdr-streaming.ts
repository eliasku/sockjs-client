import { AjaxBasedTransport } from "./lib/ajax-based";
import { XhrReceiver } from "./receiver/xhr";
import { XDRObject } from "./sender/xdr";

class XdrStreamingTransport extends AjaxBasedTransport {
  static enabled: any;
  static transportName: string = "xdr-streaming";
  static roundTrips: number = 2;

  constructor(transUrl: string) {
    if (!XDRObject.enabled) {
      throw new Error("Transport created when disabled");
    }
    super(transUrl, "/xhr_streaming", XhrReceiver, XDRObject);
  }
}

XdrStreamingTransport.enabled = function (info: any): boolean {
  if (info.cookie_needed || info.nullOrigin) {
    return false;
  }
  return XDRObject.enabled && info.sameScheme;
};

export { XdrStreamingTransport };
