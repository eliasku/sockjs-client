const Driver: any = (globalThis as any).WebSocket || (globalThis as any).MozWebSocket;

export const WebSocketBrowserDriver: ((url: string, protocols?: string | string[], options?: any) => any) | undefined =
  Driver
    ? function (url: string, protocols?: string | string[], options?: any) {
        return new Driver(url, protocols, options);
      }
    : undefined;
