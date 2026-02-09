const http = require("http");
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const soap = require("soap");
const { WebSocketServer } = require("ws");

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 4000;

const restEventsUrl = process.env.REST_EVENTS_URL || "http://localhost:4001";
const restCheckinsUrl = process.env.REST_CHECKINS_URL || "http://localhost:4002";
const soapWsdlUrl = process.env.SOAP_WSDL_URL || "http://localhost:5000/?wsdl";

app.use(cors());
app.use(express.json());

let soapClientPromise = null;

const getSoapClient = () => {
  if (!soapClientPromise) {
    soapClientPromise = soap.createClientAsync(soapWsdlUrl);
  }
  return soapClientPromise;
};

const addLinks = (baseUrl, resource, links) => {
  return {
    ...resource,
    _links: links
  };
};

const wss = new WebSocketServer({ server, path: "/ws/checkins" });

const broadcastJson = (payload) => {
  const message = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(message);
    }
  });
};

wss.on("connection", (ws) => {
  ws.send(JSON.stringify({ type: "welcome", message: "connected" }));
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api", (req, res) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const wsProtocol = req.secure ? "wss" : "ws";
  const wsBaseUrl = `${wsProtocol}://${req.get("host")}`;
  res.json({
    _links: {
      self: { href: `${baseUrl}/api` },
      events: { href: `${baseUrl}/api/events` },
      checkins: { href: `${baseUrl}/api/checkins` },
      legacyEvent: { href: `${baseUrl}/api/legacy/events/{id}` },
      wsCheckins: { href: `${wsBaseUrl}/ws/checkins` }
    }
  });
});

app.get("/api/events", async (req, res) => {
  try {
    const response = await axios.get(`${restEventsUrl}/events`);
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const items = response.data.items.map((item) =>
      addLinks(baseUrl, item, {
        self: { href: `${baseUrl}/api/events/${item.id}` },
        checkins: { href: `${baseUrl}/api/checkins?eventId=${item.id}` }
      })
    );
    return res.json(
      addLinks(baseUrl, { items }, {
        self: { href: `${baseUrl}/api/events` },
        create: { href: `${baseUrl}/api/events`, method: "POST" }
      })
    );
  } catch (error) {
    return res.status(502).json({ error: "rest_events_unavailable" });
  }
});

app.get("/api/events/:id", async (req, res) => {
  try {
    const response = await axios.get(`${restEventsUrl}/events/${req.params.id}`);
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    return res.json(
      addLinks(baseUrl, response.data, {
        self: { href: `${baseUrl}/api/events/${req.params.id}` },
        checkins: { href: `${baseUrl}/api/checkins?eventId=${req.params.id}` }
      })
    );
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ error: "event_not_found" });
    }
    return res.status(502).json({ error: "rest_events_unavailable" });
  }
});

app.post("/api/events", async (req, res) => {
  try {
    const response = await axios.post(`${restEventsUrl}/events`, req.body);
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    return res.status(201).json(
      addLinks(baseUrl, response.data, {
        self: { href: `${baseUrl}/api/events/${response.data.id}` },
        checkins: { href: `${baseUrl}/api/checkins?eventId=${response.data.id}` }
      })
    );
  } catch (error) {
    if (error.response && error.response.status === 400) {
      return res.status(400).json({ error: "missing_fields" });
    }
    return res.status(502).json({ error: "rest_events_unavailable" });
  }
});

app.get("/api/checkins", async (req, res) => {
  try {
    const response = await axios.get(`${restCheckinsUrl}/checkins`, {
      params: req.query
    });
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const items = response.data.items.map((item) =>
      addLinks(baseUrl, item, {
        self: { href: `${baseUrl}/api/checkins?eventId=${item.eventId}` },
        event: { href: `${baseUrl}/api/events/${item.eventId}` }
      })
    );
    return res.json(
      addLinks(baseUrl, { items }, {
        self: { href: `${baseUrl}/api/checkins` },
        create: { href: `${baseUrl}/api/checkins`, method: "POST" }
      })
    );
  } catch (error) {
    return res.status(502).json({ error: "rest_checkins_unavailable" });
  }
});

app.post("/api/checkins", async (req, res) => {
  try {
    const response = await axios.post(`${restCheckinsUrl}/checkins`, req.body);
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const payload = addLinks(baseUrl, response.data, {
      self: { href: `${baseUrl}/api/checkins?eventId=${response.data.eventId}` },
      event: { href: `${baseUrl}/api/events/${response.data.eventId}` }
    });
    broadcastJson({ type: "checkin", data: payload });
    return res.status(201).json(payload);
  } catch (error) {
    if (error.response && error.response.status === 400) {
      return res.status(400).json({ error: "missing_fields" });
    }
    return res.status(502).json({ error: "rest_checkins_unavailable" });
  }
});

app.get("/api/legacy/events/:id", async (req, res) => {
  try {
    const client = await getSoapClient();
    const [result] = await client.GetEventLegacyAsync({ id: req.params.id });
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    return res.json(
      addLinks(baseUrl, result, {
        self: { href: `${baseUrl}/api/legacy/events/${req.params.id}` },
        events: { href: `${baseUrl}/api/events` }
      })
    );
  } catch (error) {
    return res.status(502).json({ error: "soap_service_unavailable" });
  }
});

server.listen(port, () => {
  console.log(`gateway running on port ${port}`);
});
