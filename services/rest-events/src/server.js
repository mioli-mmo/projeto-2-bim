const express = require("express");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 4001;

app.use(cors());
app.use(express.json());

let nextId = 3;
const events = [
  { id: "evt-1", name: "Tech Meetup", date: "2026-02-20", location: "Campus A" },
  { id: "evt-2", name: "Game Jam", date: "2026-03-05", location: "Lab B" }
];

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/events", (req, res) => {
  res.json({ items: events });
});

app.get("/events/:id", (req, res) => {
  const event = events.find((item) => item.id === req.params.id);
  if (!event) {
    return res.status(404).json({ error: "event_not_found" });
  }
  return res.json(event);
});

app.post("/events", (req, res) => {
  const { name, date, location } = req.body || {};
  if (!name || !date || !location) {
    return res.status(400).json({ error: "missing_fields" });
  }
  const event = {
    id: `evt-${nextId++}`,
    name,
    date,
    location
  };
  events.push(event);
  return res.status(201).json(event);
});

app.listen(port, () => {
  console.log(`rest-events running on port ${port}`);
});
