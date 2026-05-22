import * as iframeUtils from "../../utils/iframe";
import * as urlUtils from "../../utils/url";
import { EventEmitter } from "../../event/emitter";
import * as random from "../../utils/random";

const debug = (...args: any[]) => console.log("[sockjs-client:receiver:htmlfile]", ...args);

const axo = ["Active"].concat("Object").join("X");

class HtmlfileReceiver extends EventEmitter {
  id: string;
  iframeObj: any;

  constructor(url: string) {
    super();
    debug(url);
    const self = this;
    iframeUtils.polluteGlobalNamespace();

    this.id = "a" + random.string(6);
    url = urlUtils.addQuery(url, `c=${decodeURIComponent(`${iframeUtils.WPrefix}.${this.id}`)}`);

    debug("using htmlfile", HtmlfileReceiver.htmlfileEnabled);
    const constructFunc = HtmlfileReceiver.htmlfileEnabled ? iframeUtils.createHtmlfile : iframeUtils.createIframe;

    (globalThis as any)[iframeUtils.WPrefix][this.id] = {
      start: function () {
        debug("start");
        self.iframeObj.loaded();
      },
      message: function (data: string) {
        debug("message", data);
        self.emit("message", data);
      },
      stop: function () {
        debug("stop");
        self._cleanup();
        self._close("network");
      },
    };
    this.iframeObj = constructFunc(url, function () {
      debug("callback");
      self._cleanup();
      self._close("permanent");
    });
  }

  abort(): void {
    debug("abort");
    this._cleanup();
    this._close("user");
  }

  _cleanup(): void {
    debug("_cleanup");
    if (this.iframeObj) {
      this.iframeObj.cleanup();
      this.iframeObj = null;
    }
    delete (globalThis as any)[iframeUtils.WPrefix][this.id];
  }

  _close(reason: string): void {
    debug("_close", reason);
    this.emit("close", null, reason);
    this.removeAllListeners();
  }

  static htmlfileEnabled: boolean = false;
  static enabled: boolean;
}

if (axo in globalThis) {
  try {
    HtmlfileReceiver.htmlfileEnabled = !!new (globalThis as any)[axo]("htmlfile");
  } catch (x) {
    // intentionally empty
  }
}

HtmlfileReceiver.enabled = HtmlfileReceiver.htmlfileEnabled || iframeUtils.iframeEnabled;

export { HtmlfileReceiver };
