const express = require("express");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 4002;

app.use(cors());
app.use(express.json());

let nextId = 1;
const checkins = [];

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/checkins", (req, res) => {
  const { eventId } = req.query;
  const items = eventId
    ? checkins.filter((item) => item.eventId === eventId)
    : checkins;
  res.json({ items });
});

app.post("/checkins", (req, res) => {
  const { eventId, attendeeName } = req.body || {};
  if (!eventId || !attendeeName) {
    return res.status(400).json({ error: "missing_fields" });
  }
  const checkin = {
    id: `chk-${nextId++}`,
    eventId,
    attendeeName,
    timestamp: new Date().toISOString()
  };
  checkins.push(checkin);
  return res.status(201).json(checkin);
});

app.listen(port, () => {
  console.log(`rest-checkins running on port ${port}`);
});
