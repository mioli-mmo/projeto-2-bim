const net = require("net");

const tcpPort = process.env.TCP_PORT || 7002;
const tcpHost = process.env.TCP_HOST || "127.0.0.1";
const eventId = process.env.EVENT_ID || "evt-1";
const attendee = process.env.ATTENDEE || "Ana";

const client = net.createConnection({ port: tcpPort, host: tcpHost }, () => {
  const payload = `CONFIRM ${eventId} ${attendee}`;
  client.write(payload + "\n");
});

client.on("data", (data) => {
  console.log(`tcp received: ${data.toString().trim()}`);
  client.end();
});

client.on("error", (err) => {
  console.error("tcp error", err);
});
