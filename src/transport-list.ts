import { WebSocketTransport } from "./transport/websocket";
import { XhrStreamingTransport } from "./transport/xhr-streaming";
import { XdrStreamingTransport } from "./transport/xdr-streaming";
import { EventSourceTransport } from "./transport/eventsource";
import { createIframeWrapTransport } from "./transport/lib/iframe-wrap";
import { HtmlFileTransport } from "./transport/htmlfile";
import { XhrPollingTransport } from "./transport/xhr-polling";
import { XdrPollingTransport } from "./transport/xdr-polling";
import { JsonPTransport } from "./transport/jsonp-polling";

const transportList: any[] = [
  // streaming transports
  WebSocketTransport,
  XhrStreamingTransport,
  XdrStreamingTransport,
  EventSourceTransport,
  createIframeWrapTransport(EventSourceTransport),

  // polling transports
  HtmlFileTransport,
  createIframeWrapTransport(HtmlFileTransport),
  XhrPollingTransport,
  XdrPollingTransport,
  createIframeWrapTransport(XhrPollingTransport),
  JsonPTransport,
];

export { transportList };
