import { describe, it, expect } from "vite-plus/test";
import { XHRFake } from "../src/transport/sender/xhr-fake";
import { XhrReceiver } from "../src/transport/receiver/xhr";

describe("Receivers", () => {
  describe("xhr", () => {
    it("emits multiple messages for multi-line response", async () => {
      const xhr = new XhrReceiver("test", XHRFake);
      const responses = ["test", "multiple", "lines", "{}"];
      let i = 0;
      xhr.on("message", (msg: any) => {
        expect(msg).toBe(responses[i]);
        i++;
      });
      const { promise: closed, resolve } = Promise.withResolvers<void>();
      xhr.on("close", () => {
        xhr.removeAllListeners();
        resolve();
      });
      xhr._chunkHandler(200, "test\nmultiple\nlines");
      await closed;
    });

    it("emits no messages for an empty string response", async () => {
      const xhr = new XhrReceiver("test", XHRFake);
      let i = 0;
      const responses = ["{}"];
      xhr.on("message", (msg: any) => {
        expect(i).toBeLessThan(responses.length);
        expect(msg).toBe(responses[i]);
        i++;
      });
      const { promise: closed, resolve } = Promise.withResolvers<void>();
      xhr.on("close", () => {
        xhr.removeAllListeners();
        resolve();
      });
      xhr._chunkHandler(200, "");
      await closed;
    });
  });
});
