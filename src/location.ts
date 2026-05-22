export const loc: Pick<Location, "origin" | "protocol" | "host" | "port" | "href" | "hash"> = (globalThis as any)
  .location ?? {
  origin: "http://localhost:80",
  protocol: "http:",
  host: "localhost",
  port: "80",
  href: "http://localhost/",
  hash: "",
};
