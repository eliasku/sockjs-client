import { HtmlfileReceiver } from "./receiver/htmlfile";
import { XHRLocalObject } from "./sender/xhr-local";
import { AjaxBasedTransport } from "./lib/ajax-based";

class HtmlFileTransport extends AjaxBasedTransport {
  static enabled: any;
  static transportName: string = "htmlfile";
  static roundTrips: number = 2;

  constructor(transUrl: string) {
    if (!(HtmlfileReceiver as any).enabled) {
      throw new Error("Transport created when disabled");
    }
    super(transUrl, "/htmlfile", HtmlfileReceiver, XHRLocalObject);
  }
}

HtmlFileTransport.enabled = function (info: any): boolean {
  return (HtmlfileReceiver as any).enabled && info.sameOrigin;
};

export { HtmlFileTransport };
