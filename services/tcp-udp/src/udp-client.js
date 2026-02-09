const dgram = require("dgram");

const udpPort = process.env.UDP_PORT || 7001;
const udpHost = process.env.UDP_HOST || "127.0.0.1";

const client = dgram.createSocket("udp4");
const eventId = process.env.EVENT_ID || "evt-1";
const attendee = process.env.ATTENDEE || "Ana";

const message = `CHECKIN ${eventId} ${attendee}`;

client.send(Buffer.from(message), udpPort, udpHost, (err) => {
  if (err) {
    console.error("udp send failed", err);
  } else {
    console.log(`udp sent: ${message}`);
  }
  client.close();
});
