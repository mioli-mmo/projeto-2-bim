const amqp = require("amqplib");

const queueName = process.env.RMQ_QUEUE || "events.created";
const amqpUrl = process.env.RMQ_URL || "amqp://localhost";

const start = async () => {
  const connection = await amqp.connect(amqpUrl);
  const channel = await connection.createChannel();

  await channel.assertQueue(queueName, { durable: true });
  console.log(`mom-notify listening on queue ${queueName}`);

  channel.consume(queueName, (msg) => {
    if (!msg) return;
    const payload = msg.content.toString();
    console.log(`[notify] ${payload}`);
    channel.ack(msg);
  });
};

start().catch((error) => {
  console.error("mom-notify failed", error);
  process.exit(1);
});
