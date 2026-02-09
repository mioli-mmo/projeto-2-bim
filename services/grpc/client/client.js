const path = require("path");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

const grpcHost = process.env.GRPC_HOST || "localhost";
const grpcPort = process.env.GRPC_PORT || "50051";
const ticketId = process.env.TICKET_ID || "TCK-123";
const eventId = process.env.EVENT_ID || "evt-1";

const protoPath = path.join(__dirname, "..", "proto", "checkin.proto");
const packageDefinition = protoLoader.loadSync(protoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const proto = grpc.loadPackageDefinition(packageDefinition).checkin;

const client = new proto.TicketService(
  `${grpcHost}:${grpcPort}`,
  grpc.credentials.createInsecure()
);

client.ValidateTicket({ ticketId, eventId }, (err, response) => {
  if (err) {
    console.error("grpc error", err.message || err);
    process.exit(1);
  }
  console.log("grpc response", response);
});
