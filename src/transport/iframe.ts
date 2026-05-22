import { EventEmitter } from "../event/emitter";
import { version } from "../version";
import * as urlUtils from "../utils/url";
import * as iframeUtils from "../utils/iframe";
import * as eventUtils from "../utils/event";
import * as random from "../utils/random";

const debug = (...args: any[]) => console.log("[sockjs-client:transport:iframe]", ...args);

class IframeTransport extends EventEmitter {
  origin: string | null;
  baseUrl: string;
  transUrl: string;
  transport: string;
  windowId: string;
  iframeObj: any;
  onmessageCallback: ((e: any) => void) | null;

  static enabled: any;
  static transportName: string = "iframe";
  static roundTrips: number = 2;

  constructor(transport: string, transUrl: string, baseUrl: string) {
    super();
    if (!IframeTransport.enabled()) {
      throw new Error("Transport created when disabled");
    }

    this.origin = urlUtils.getOrigin(baseUrl);
    this.baseUrl = baseUrl;
    this.transUrl = transUrl;
    this.transport = transport;
    this.windowId = random.string(8);

    const iframeUrl = `${urlUtils.addPath(baseUrl, "/iframe.html")}#${this.windowId}`;
    debug(transport, transUrl, iframeUrl);

    this.iframeObj = iframeUtils.createIframe(iframeUrl, (r: any) => {
      debug("err callback");
      this.emit("close", 1006, `Unable to load an iframe (${r})`);
      this.close();
    });

    this.onmessageCallback = this._message.bind(this);
    eventUtils.attachEvent("message", this.onmessageCallback!);
  }

  close(): void {
    debug("close");
    this.removeAllListeners();
    if (this.iframeObj) {
      eventUtils.detachEvent("message", this.onmessageCallback!);
      try {
        this.postMessage("c");
      } catch {
        // intentionally empty
      }
      this.iframeObj.cleanup();
      this.iframeObj = null;
      this.onmessageCallback = this.iframeObj = null;
    }
  }

  _message(e: any): void {
    debug("message", e.data);
    if (!this.origin || !urlUtils.isOriginEqual(e.origin, this.origin)) {
      debug("not same origin", e.origin, this.origin);
      return;
    }

    let iframeMessage: any;
    try {
      iframeMessage = JSON.parse(e.data);
    } catch {
      debug("bad json", e.data);
      return;
    }

    if (iframeMessage.windowId !== this.windowId) {
      debug("mismatched window id", iframeMessage.windowId, this.windowId);
      return;
    }

    switch (iframeMessage.type) {
      case "s":
        this.iframeObj.loaded();
        this.postMessage("s", JSON.stringify([version, this.transport, this.transUrl, this.baseUrl]));
        break;
      case "t":
        this.emit("message", iframeMessage.data);
        break;
      case "c":
        let cdata: any;
        try {
          cdata = JSON.parse(iframeMessage.data);
        } catch {
          debug("bad json", iframeMessage.data);
          return;
        }
        this.emit("close", cdata[0], cdata[1]);
        this.close();
        break;
    }
  }

  postMessage(type: string, data?: string): void {
    debug("postMessage", type, data);
    this.iframeObj.post(
      JSON.stringify({
        windowId: this.windowId,
        type: type,
        data: data || "",
      }),
      this.origin,
    );
  }

  send(message: string): void {
    debug("send", message);
    this.postMessage("m", message);
  }
}

IframeTransport.enabled = function (): boolean {
  return iframeUtils.iframeEnabled;
};

export { IframeTransport };
