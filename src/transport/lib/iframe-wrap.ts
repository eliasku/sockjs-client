import { IframeTransport } from "../iframe";
import * as objectUtils from "../../utils/object";

interface TransportLike {
  enabled: (info: any) => boolean;
  transportName: string;
  roundTrips: number;
}

function createIframeWrapTransport(transport: TransportLike) {
  class IframeWrapTransport extends IframeTransport {
    static enabled: any;
    static transportName: string;
    static needBody: boolean;
    static roundTrips: number;
    static facadeTransport: TransportLike;

    constructor(transUrl: string, baseUrl: string) {
      super(transport.transportName, transUrl, baseUrl);
    }
  }

  IframeWrapTransport.enabled = function (_url: string, info: any): boolean {
    if (!(globalThis as any).document) {
      return false;
    }

    const iframeInfo = objectUtils.extend({}, info);
    iframeInfo.sameOrigin = true;
    return transport.enabled(iframeInfo) && IframeTransport.enabled();
  };

  IframeWrapTransport.transportName = `iframe-${transport.transportName}`;
  IframeWrapTransport.needBody = true;
  IframeWrapTransport.roundTrips = IframeTransport.roundTrips + transport.roundTrips - 1;

  IframeWrapTransport.facadeTransport = transport;

  return IframeWrapTransport;
}

export { createIframeWrapTransport };
