const dgram = require("dgram");
const net = require("net");

const udpPort = process.env.UDP_PORT || 7001;
const tcpPort = process.env.TCP_PORT || 7002;
const gatewayUrl = process.env.GATEWAY_URL || "http://localhost:4000";

const udpServer = dgram.createSocket("udp4");
const tcpServer = net.createServer();

udpServer.on("listening", () => {
  console.log(`udp server listening on ${udpPort}`);
});

udpServer.on("message", (msg, rinfo) => {
  const payload = msg.toString();
  console.log(`[udp] ${rinfo.address}:${rinfo.port} -> ${payload}`);
  sendTelemetry("udp", payload, `${rinfo.address}:${rinfo.port}`);
});

udpServer.bind(udpPort);

tcpServer.on("connection", (socket) => {
  console.log("tcp client connected", socket.remoteAddress, socket.remotePort);

  socket.on("data", (data) => {
    const payload = data.toString().trim();
    console.log(`[tcp] ${payload}`);
    socket.write(`ACK ${new Date().toISOString()} ${payload}\n`);
    sendTelemetry("tcp", payload, `${socket.remoteAddress}:${socket.remotePort}`);
  });

  socket.on("close", () => {
    console.log("tcp client disconnected");
  });
});

tcpServer.listen(tcpPort, () => {
  console.log(`tcp server listening on ${tcpPort}`);
});

const sendTelemetry = async (protocol, payload, source) => {
  try {
    await fetch(`${gatewayUrl}/api/telemetry/tcp-udp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ protocol, payload, source })
    });
  } catch (error) {
    console.warn("telemetry failed", error.message || error);
  }
};
