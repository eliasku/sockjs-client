import { Event } from "./event";

export class TransportMessageEvent extends Event {
  data: any;

  constructor(data: any) {
    super("message");
    this.initEvent("message", false, false);
    this.data = data;
  }
}
