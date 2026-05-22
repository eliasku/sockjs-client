import * as random from "./utils/random";
import * as escape from "./utils/escape";
import * as urlUtils from "./utils/url";
import * as eventUtils from "./utils/event";
import { createTransportUtils } from "./utils/transport";
import * as objectUtils from "./utils/object";
import * as browser from "./utils/browser";

import { Event } from "./event/event";
import { EventTarget } from "./event/eventtarget";
import { loc } from "./location";
import { CloseEvent } from "./event/close";
import { TransportMessageEvent } from "./event/trans-message";
import { InfoReceiver } from "./info-receiver";

const debug = (...args: any[]) => __DEBUG__ && console.log("[sockjs-client:main]", ...args);

let transports: any;

export class SockJS extends EventTarget {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  static version = __SOCKJS_VERSION__;

  readyState: number = 0;
  extensions: string = "";
  protocol: string = "";
  url!: string;
  _transportsWhitelist: any;
  _transportOptions: any;
  _timeout: number = 0;
  _generateSessionId: (() => string) | null = null;
  _server: string = "";
  _origin: string | null = null;
  _urlInfo: any;
  _ir: any;
  _rto: number = 0;
  _transUrl!: string;
  _transports: any[] = [];
  _transport: any = null;
  transport: string | null = null;
  _transportTimeoutId: any = null;
  onopen?: (e: any) => void;
  onmessage?: (msg: any) => void;
  onclose?: (e: any) => void;
  onerror?: (e: any) => void;

  constructor(url: string, protocols?: string | string[], options?: any) {
    super();

    this.readyState = SockJS.CONNECTING;
    this.extensions = "";
    this.protocol = "";

    options = options || {};
    this._transportsWhitelist = options.transports;
    this._transportOptions = options.transportOptions || {};
    this._timeout = options.timeout || 0;

    const sessionId = options.sessionId || 8;
    if (typeof sessionId === "function") {
      this._generateSessionId = sessionId;
    } else if (typeof sessionId === "number") {
      this._generateSessionId = function () {
        return random.string(sessionId);
      };
    } else {
      throw new TypeError("If sessionId is used in the options, it needs to be a number or a function.");
    }

    this._server = options.server || random.numberString(1000);

    // Step 1 of WS spec - parse and validate the url. Issue #8
    const parsedUrl = new URL(url);
    if (!parsedUrl.host || !parsedUrl.protocol) {
      throw new SyntaxError(`The URL '${url}' is invalid`);
    } else if (parsedUrl.hash) {
      throw new SyntaxError("The URL must not contain a fragment");
    } else if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      throw new SyntaxError(
        `The URL's scheme must be either 'http:' or 'https:'. '${parsedUrl.protocol}' is not allowed.`,
      );
    }

    const secure = parsedUrl.protocol === "https:";
    // Step 2 - don't allow secure origin with an insecure protocol
    if (loc.protocol === "https:" && !secure) {
      // exception is 127.0.0.0/8 and ::1 urls
      if (!urlUtils.isLoopbackAddr(parsedUrl.hostname)) {
        throw new Error(
          "SecurityError: An insecure SockJS connection may not be initiated from a page loaded over HTTPS",
        );
      }
    }

    // Step 3 - check port access - no need here
    // Step 4 - parse protocols argument
    if (!protocols) {
      protocols = [];
    } else if (!Array.isArray(protocols)) {
      protocols = [protocols];
    }

    // Step 5 - check protocols argument
    const sortedProtocols = protocols.toSorted();
    sortedProtocols.forEach(function (proto: string, i: number) {
      if (!proto) {
        throw new SyntaxError(`The protocols entry '${proto}' is invalid.`);
      }
      if (i < sortedProtocols.length - 1 && proto === sortedProtocols[i + 1]) {
        throw new SyntaxError(`The protocols entry '${proto}' is duplicated.`);
      }
    });

    // Step 6 - convert origin
    const o = urlUtils.getOrigin(loc.href);
    this._origin = o ? o.toLowerCase() : null;

    // remove the trailing slash
    const pathname = parsedUrl.pathname.replace(/\/+$/, "");
    const search = parsedUrl.search;
    const hash = "";
    this.url = parsedUrl.origin + pathname + search + hash;

    debug("using url", this.url);
    debug("using url", this.url);

    // Step 7 - start connection in background
    // obtain server info
    // http://sockjs.github.io/sockjs-protocol/sockjs-protocol-0.3.3.html#section-26
    this._urlInfo = {
      nullOrigin: !browser.hasDomain(),
      sameOrigin: urlUtils.isOriginEqual(this.url, loc.href),
      sameScheme: urlUtils.isSchemeEqual(this.url, loc.href),
    };

    this._ir = new InfoReceiver(this.url, this._urlInfo);
    this._ir.once("finish", this._receiveInfo.bind(this));
  }

  close(code?: number, reason?: string): void {
    // Step 1
    if (code && !userSetCode(code)) {
      throw new Error("InvalidAccessError: Invalid code");
    }
    // Step 2.4 states the max is 123 bytes, but we are just checking length
    if (reason && reason.length > 123) {
      throw new SyntaxError("reason argument has an invalid length");
    }

    // Step 3.1
    if (this.readyState === SockJS.CLOSING || this.readyState === SockJS.CLOSED) {
      return;
    }

    // TODO look at docs to determine how to set this
    const wasClean = true;
    this._close(code || 1000, reason || "Normal closure", wasClean);
  }

  send(data: string): void {
    // #13 - convert anything non-string to string
    // TODO this currently turns objects into [object Object]
    if (typeof data !== "string") {
      data = "" + data;
    }
    if (this.readyState === SockJS.CONNECTING) {
      throw new Error("InvalidStateError: The connection has not been established yet");
    }
    if (this.readyState !== SockJS.OPEN) {
      return;
    }
    this._transport.send(escape.quote(data));
  }

  _receiveInfo(info: any, rtt: number, status: number): void {
    debug("_receiveInfo", rtt);
    this._ir = null;
    if (!info) {
      this._close(status || 1002, "Cannot connect to server");
      return;
    }

    // establish a round-trip timeout (RTO) based on the
    // round-trip time (RTT)
    this._rto = this.countRTO(rtt);
    // allow server to override url used for the actual transport
    this._transUrl = info.base_url ? info.base_url : this.url;
    info = objectUtils.extend(info, this._urlInfo);
    debug("info", info);
    // determine list of desired and supported transports
    const enabledTransports = transports.filterToEnabled(this._transportsWhitelist, info);
    this._transports = enabledTransports.main;
    debug(this._transports.length + " enabled transports");

    this._connect();
  }

  _connect(): void {
    for (let Transport = this._transports.shift(); Transport; Transport = this._transports.shift()) {
      debug("attempt", Transport.transportName);
      if (Transport.needBody) {
        if (
          !(globalThis as any).document.body ||
          (typeof (globalThis as any).document.readyState !== "undefined" &&
            (globalThis as any).document.readyState !== "complete" &&
            (globalThis as any).document.readyState !== "interactive")
        ) {
          debug("waiting for body");
          this._transports.unshift(Transport);
          eventUtils.attachEvent("load", this._connect.bind(this));
          return;
        }
      }

      // calculate timeout based on RTO and round trips. Default to 5s
      const timeoutMs = Math.max(this._timeout, this._rto * Transport.roundTrips || 5000);
      this._transportTimeoutId = setTimeout(this._transportTimeout.bind(this), timeoutMs);
      debug("using timeout", timeoutMs);

      const transportUrl = urlUtils.addPath(this._transUrl, `/${this._server}/${this._generateSessionId!()}`);
      const options = this._transportOptions[Transport.transportName];
      debug("transport url", transportUrl);
      const transportObj = new Transport(transportUrl, this._transUrl, options);
      transportObj.on("message", this._transportMessage.bind(this));
      transportObj.once("close", this._transportClose.bind(this));
      transportObj.transportName = Transport.transportName;
      this._transport = transportObj;

      return;
    }
    this._close(2000, "All transports failed", false);
  }

  _transportTimeout(): void {
    debug("_transportTimeout");
    if (this.readyState === SockJS.CONNECTING) {
      if (this._transport) {
        this._transport.close();
      }

      this._transportClose(2007, "Transport timed out");
    }
  }

  _transportMessage(msg: string): void {
    debug("_transportMessage", msg);

    const type = msg.slice(0, 1);
    const content = msg.slice(1);
    let payload: any;

    // first check for messages that don't need a payload
    switch (type) {
      case "o":
        this._open();
        return;
      case "h":
        this.dispatchEvent(new Event("heartbeat"));
        debug("heartbeat", this.transport);
        return;
    }

    if (content) {
      try {
        payload = JSON.parse(content);
      } catch (_e) {
        debug("bad json", content);
      }
    }

    if (typeof payload === "undefined") {
      debug("empty payload", content);
      return;
    }

    switch (type) {
      case "a":
        if (Array.isArray(payload)) {
          payload.forEach((p: any) => {
            debug("message", this.transport, p);
            this.dispatchEvent(new TransportMessageEvent(p));
          });
        }
        break;
      case "m":
        debug("message", this.transport, payload);
        this.dispatchEvent(new TransportMessageEvent(payload));
        break;
      case "c":
        if (Array.isArray(payload) && payload.length === 2) {
          this._close(payload[0], payload[1], true);
        }
        break;
    }
  }

  _transportClose(code: number, reason: string): void {
    debug("_transportClose", this.transport, code, reason);
    if (this._transport) {
      clearTimeout(this._transportTimeoutId);
      this._transport.removeAllListeners();
      this._transport = null;
      this.transport = null;
      this._transportTimeoutId = null;
    }

    if (!userSetCode(code) && code !== 2000 && this.readyState === SockJS.CONNECTING) {
      this._connect();
      return;
    }

    this._close(code, reason);
  }

  _open(): void {
    debug("_open", this._transport && this._transport.transportName, this.readyState);
    if (this.readyState === SockJS.CONNECTING) {
      if (this._transportTimeoutId) {
        clearTimeout(this._transportTimeoutId);
        this._transportTimeoutId = null;
      }
      this.readyState = SockJS.OPEN;
      this.transport = this._transport.transportName;
      this.dispatchEvent(new Event("open"));
      debug("connected", this.transport);
    } else {
      // The server might have been restarted, and lost track of our
      // connection.
      this._close(1006, "Server lost session");
    }
  }

  _close(code: number, reason: string, wasClean?: boolean): void {
    debug("_close", this.transport, code, reason, wasClean, this.readyState);
    let forceFail = false;

    if (this._ir) {
      forceFail = true;
      this._ir.close();
      this._ir = null;
    }
    if (this._transport) {
      this._transport.close();
      this._transport = null;
      this.transport = null;
    }

    if (this.readyState === SockJS.CLOSED) {
      throw new Error("InvalidStateError: SockJS has already been closed");
    }

    this.readyState = SockJS.CLOSING;
    setTimeout(
      function (this: SockJS) {
        this.readyState = SockJS.CLOSED;

        if (forceFail) {
          this.dispatchEvent(new Event("error"));
        }

        const e = new CloseEvent("close");
        e.wasClean = wasClean || false;
        e.code = code || 1000;
        e.reason = reason;

        this.dispatchEvent(e);
        this.onmessage = this.onclose = this.onerror = undefined;
        debug("disconnected");
      }.bind(this),
      0,
    );
  }

  // See: http://www.erg.abdn.ac.uk/~gerrit/dccp/notes/ccid2/rto_estimator/
  // and RFC 2988.
  countRTO(rtt: number): number {
    // In a local environment, when using IE8/9 and the `jsonp-polling`
    // transport the time needed to establish a connection (the time that pass
    // from the opening of the transport to the call of `_dispatchOpen`) is
    // around 200msec (the lower bound used in the article above) and this
    // causes spurious timeouts. For this reason we calculate a value slightly
    // larger than that used in the article.
    if (rtt > 100) {
      return 4 * rtt; // rto > 400msec
    }
    return 300 + rtt; // 300msec < rto <= 400msec
  }
}

function userSetCode(code: number): boolean {
  return code === 1000 || (code >= 3000 && code <= 4999);
}

import { bootstrap_iframe } from "./iframe-bootstrap";

export function createSockJS(availableTransports: any[]): typeof SockJS {
  transports = createTransportUtils(availableTransports);
  bootstrap_iframe(SockJS, availableTransports);
  return SockJS;
}
