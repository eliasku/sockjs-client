import { Event } from "./event";

export class CloseEvent extends Event {
  wasClean: boolean;
  code: number;
  reason: string;

  constructor(_type?: string) {
    super("close");
    this.initEvent("close", false, false);
    this.wasClean = false;
    this.code = 0;
    this.reason = "";
  }
}
