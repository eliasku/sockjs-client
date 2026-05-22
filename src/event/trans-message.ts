import { Event } from "./event";

class TransportMessageEvent extends Event {
  data: any;

  constructor(data: any) {
    super("message");
    this.initEvent("message", false, false);
    this.data = data;
  }
}

export { TransportMessageEvent };
