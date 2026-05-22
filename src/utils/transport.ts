const debug = (...args: any[]) => __DEBUG__ && console.log("[sockjs-client:utils:transport]", ...args);

export function createTransportUtils(availableTransports: any[]) {
  return {
    filterToEnabled: function (transportsWhitelist: any, info: any) {
      const transports: { main: any[]; facade: any[] } = {
        main: [],
        facade: [],
      };
      if (!transportsWhitelist) {
        transportsWhitelist = [];
      } else if (typeof transportsWhitelist === "string") {
        transportsWhitelist = [transportsWhitelist];
      }

      availableTransports.forEach(function (trans: any) {
        if (!trans) {
          return;
        }

        if (trans.transportName === "websocket" && info.websocket === false) {
          debug("disabled from server", "websocket");
          return;
        }

        if (transportsWhitelist.length && transportsWhitelist.indexOf(trans.transportName) === -1) {
          debug("not in whitelist", trans.transportName);
          return;
        }

        if (trans.enabled(info)) {
          debug("enabled", trans.transportName);
          transports.main.push(trans);
          if (trans.facadeTransport) {
            transports.facade.push(trans.facadeTransport);
          }
        } else {
          debug("disabled", trans.transportName);
        }
      });
      return transports;
    },
  };
}
