import { AjaxBasedTransport } from "./lib/ajax-based";
import { XdrStreamingTransport } from "./xdr-streaming";
import { XhrReceiver } from "./receiver/xhr";
import { XDRObject } from "./sender/xdr";

class XdrPollingTransport extends AjaxBasedTransport {
  static enabled: any;
  static transportName: string = "xdr-polling";
  static roundTrips: number = 2;

  constructor(transUrl: string) {
    if (!XDRObject.enabled) {
      throw new Error("Transport created when disabled");
    }
    super(transUrl, "/xhr", XhrReceiver, XDRObject);
  }
}

XdrPollingTransport.enabled = XdrStreamingTransport.enabled;

export { XdrPollingTransport };
