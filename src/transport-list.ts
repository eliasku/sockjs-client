import { WebSocketTransport } from "./transport/websocket";
import { XhrStreamingTransport } from "./transport/xhr-streaming";
import { EventSourceTransport } from "./transport/eventsource";
import { createIframeWrapTransport } from "./transport/lib/iframe-wrap";
import { XhrPollingTransport } from "./transport/xhr-polling";
import { JsonPTransport } from "./transport/jsonp-polling";

export const transportList: any[] = [
  // streaming transports
  WebSocketTransport,
  XhrStreamingTransport,
  EventSourceTransport,
  createIframeWrapTransport(EventSourceTransport),

  // polling transports
  XhrPollingTransport,
  createIframeWrapTransport(XhrPollingTransport),
  JsonPTransport,
];
