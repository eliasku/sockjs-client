import { AjaxBasedTransport } from "./lib/ajax-based";
import { EventSourceReceiver } from "./receiver/eventsource";
import { XHRCorsObject } from "./sender/xhr-cors";

const EventSourceBrowserDriver: any = (globalThis as any).EventSource;

export class EventSourceTransport extends AjaxBasedTransport {
  static enabled: any;
  static transportName: string = "eventsource";
  static roundTrips: number = 2;

  constructor(transUrl: string) {
    if (!EventSourceTransport.enabled()) {
      throw new Error("Transport created when disabled");
    }

    super(transUrl, "/eventsource", EventSourceReceiver, XHRCorsObject);
  }
}

EventSourceTransport.enabled = function (): boolean {
  return !!EventSourceBrowserDriver;
};
