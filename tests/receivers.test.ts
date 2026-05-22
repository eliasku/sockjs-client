import { describe, it, expect } from "bun:test";
import { XHRFake } from "../src/transport/sender/xhr-fake";
import { XhrReceiver } from "../src/transport/receiver/xhr";

describe("Receivers", () => {
  describe("xhr", () => {
    it("emits multiple messages for multi-line response", done => {
      const xhr = new XhrReceiver("test", XHRFake);
      const responses = ["test", "multiple", "lines", "{}"];
      let i = 0;
      xhr.on("message", (msg: any) => {
        expect(msg).toBe(responses[i]);
        i++;
      });
      xhr.on("close", () => {
        xhr.removeAllListeners();
        done();
      });
      xhr._chunkHandler(200, "test\nmultiple\nlines");
    });

    it("emits no messages for an empty string response", done => {
      const xhr = new XhrReceiver("test", XHRFake);
      let i = 0;
      const responses = ["{}"];
      xhr.on("message", (msg: any) => {
        expect(i).toBeLessThan(responses.length);
        expect(msg).toBe(responses[i]);
        i++;
      });
      xhr.on("close", () => {
        xhr.removeAllListeners();
        done();
      });
      xhr._chunkHandler(200, "");
    });
  });
});
