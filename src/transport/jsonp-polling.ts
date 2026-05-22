import { SenderReceiver } from "./lib/sender-receiver";
import { JsonpReceiver } from "./receiver/jsonp";
import { jsonpSender } from "./sender/jsonp";

class JsonPTransport extends SenderReceiver {
  static enabled: any;
  static transportName: string = "jsonp-polling";
  static roundTrips: number = 1;
  static needBody: boolean = true;

  constructor(transUrl: string) {
    if (!JsonPTransport.enabled()) {
      throw new Error("Transport created when disabled");
    }
    super(transUrl, "/jsonp", jsonpSender, JsonpReceiver);
  }
}

JsonPTransport.enabled = function (): boolean {
  return !!(globalThis as any).document;
};

export { JsonPTransport };
