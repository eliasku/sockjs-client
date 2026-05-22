import { Event } from "./event";

class CloseEvent extends Event {
  wasClean: boolean;
  code: number;
  reason: string;

  constructor(type?: string) {
    super("close");
    this.initEvent("close", false, false);
    this.wasClean = false;
    this.code = 0;
    this.reason = "";
  }
}

export { CloseEvent };
