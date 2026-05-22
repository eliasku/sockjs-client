import * as urlUtils from "./utils/url";
import * as eventUtils from "./utils/event";
import { FacadeJS } from "./facade";
import { InfoReceiverIframe } from "./info-iframe-receiver";
import * as iframeUtils from "./utils/iframe";
import { loc } from "./location";

const debug = (...args: any[]) => __DEBUG__ && console.log("[sockjs-client:iframe-bootstrap]", ...args);

export function bootstrap_iframe(SockJS: any, availableTransports: any[]): void {
  const transportMap: Record<string, any> = {};
  availableTransports.forEach(function (at: any) {
    if (at.facadeTransport) {
      transportMap[at.facadeTransport.transportName] = at.facadeTransport;
    }
  });

  transportMap[InfoReceiverIframe.transportName] = InfoReceiverIframe;
  let parentOrigin: string | undefined;

  SockJS.bootstrap_iframe = function () {
    let facade: any;
    iframeUtils.setCurrentWindowId(loc.hash.slice(1));
    const onMessage = function (e: any) {
      if (e.source !== parent) {
        return;
      }
      if (typeof parentOrigin === "undefined") {
        parentOrigin = e.origin;
      }
      if (e.origin !== parentOrigin) {
        return;
      }

      let iframeMessage: any;
      try {
        iframeMessage = JSON.parse(e.data);
      } catch {
        debug("bad json", e.data);
        return;
      }

      if (iframeMessage.windowId !== iframeUtils.currentWindowId) {
        return;
      }
      switch (iframeMessage.type) {
        case "s":
          let p: any[];
          try {
            p = JSON.parse(iframeMessage.data);
          } catch {
            debug("bad json", iframeMessage.data);
            break;
          }
          const version = p[0];
          const transport = p[1];
          const transUrl = p[2];
          const baseUrl = p[3];
          debug(version, transport, transUrl, baseUrl);
          if (version !== SockJS.version) {
            throw new Error(`Incompatible SockJS! Main site uses: "${version}", the iframe: "${SockJS.version}".`);
          }

          if (!urlUtils.isOriginEqual(transUrl, loc.href) || !urlUtils.isOriginEqual(baseUrl, loc.href)) {
            throw new Error(
              `Can't connect to different domain from within an iframe. (${loc.href}, ${transUrl}, ${baseUrl})`,
            );
          }
          facade = new FacadeJS(new transportMap[transport](transUrl, baseUrl));
          break;
        case "m":
          facade._send(iframeMessage.data);
          break;
        case "c":
          if (facade) {
            facade._close();
          }
          facade = null;
          break;
      }
    };

    eventUtils.attachEvent("message", onMessage);

    iframeUtils.postMessage("s");
  };
}
