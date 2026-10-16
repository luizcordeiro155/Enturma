/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS test server. */
// Local-only SMTP sink for real email integration tests; never sends mail onward.
const net = require("node:net");
const http = require("node:http");
const messages = [];
net
  .createServer((socket) => {
    let buffer = "",
      data = false,
      lines = [],
      recipient = "";
    socket.setTimeout(30000, () => socket.destroy());
    socket.write("220 Enturma local test SMTP\r\n");
    socket.on("data", (chunk) => {
      buffer += chunk.toString();
      let end;
      while ((end = buffer.indexOf("\r\n")) >= 0) {
        const line = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        if (data) {
          if (line !== ".") {
            lines.push(line.startsWith("..") ? line.slice(1) : line);
            continue;
          }
          messages.push({ recipient, raw: lines.join("\r\n") });
          if (messages.length > 1000) messages.shift();
          lines = [];
          data = false;
          socket.write("250 Message accepted\r\n");
          continue;
        }
        if (/^(EHLO|HELO)/i.test(line))
          socket.write("250-localhost\r\n250 SIZE 4000000\r\n");
        else if (/^RCPT TO:/i.test(line)) {
          recipient = line.match(/<([^>]+)>/)?.[1] ?? "";
          socket.write("250 OK\r\n");
        } else if (/^DATA/i.test(line)) {
          data = true;
          socket.write("354 End with dot\r\n");
        } else if (/^QUIT/i.test(line)) socket.end("221 Bye\r\n");
        else socket.write("250 OK\r\n");
      }
    });
    socket.on("error", () => {});
  })
  .listen(1025, "127.0.0.1");
http
  .createServer((req, res) => {
    const recipient = new URL(req.url, "http://localhost").searchParams.get(
      "recipient",
    );
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    res.end(JSON.stringify(messages.filter((m) => m.recipient === recipient)));
  })
  .listen(1026, "127.0.0.1");
console.log("Local SMTP test sink ready on 127.0.0.1:1025");
