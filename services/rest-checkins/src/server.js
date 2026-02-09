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
  const { eventId, status } = req.query;
  let items = checkins;
  if (eventId) {
    items = items.filter((item) => item.eventId === eventId);
  }
  if (status) {
    items = items.filter((item) => item.status === status);
  }
  res.json({ items });
});

app.get("/checkins/:id", (req, res) => {
  const checkin = checkins.find((item) => item.id === req.params.id);
  if (!checkin) {
    return res.status(404).json({ error: "checkin_not_found" });
  }
  return res.json(checkin);
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
    status: "pending",
    timestamp: new Date().toISOString()
  };
  checkins.push(checkin);
  return res.status(201).json(checkin);
});

app.patch("/checkins/:id", (req, res) => {
  const { status } = req.body || {};
  if (!status || !["approved", "rejected"].includes(status)) {
    return res.status(400).json({ error: "invalid_status" });
  }
  const checkin = checkins.find((item) => item.id === req.params.id);
  if (!checkin) {
    return res.status(404).json({ error: "checkin_not_found" });
  }
  checkin.status = status;
  checkin.updatedAt = new Date().toISOString();
  return res.json(checkin);
});

app.listen(port, () => {
  console.log(`rest-checkins running on port ${port}`);
});
