const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const uuidv4 = require("uuid/v4");

const app = express();

const PORT = process.env.PORT || 9999;

const serviceInstanceID = uuidv4();

app.use(bodyParser.json());
app.use(morgan("common"));

// Obligatory 'ping' route
app.get("/ping", (req, res) => res.sendStatus(200));

let services = {};

let Service = {};
Service.register = function(service, hostname, port) {
  if (!services[service]) {
    services[service] = [];
  }
  services[service].push({ hostname, port });
};

Service.unregister = function(service, hostname, port) {
  const s = services[service];
  if (s) {
    const removed = s.filter(
      service => !(service.hostname === hostname && service.port === port)
    );
    services[service] = removed;
    return true; // item deleted
  }
  return false; // item not found
};

Service.discover = function(service) {
  const options = services[service];
  if (options) {
    return false;
  }
  return _randomArrayItem(options);
};

function _randomArrayItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

Service.list = function() {
  return services;
};

app.get("/", (req, res) => {
  res.json(Service.list());
});

app.post("/", (req, res) => {
  const { service, hostname, port } = req.body;
  Service.register(service, hostname, port);
  res.sendStatus(200);
});

app.post("/delete", (req, res) => {
  const { service, hostname, port } = req.body;
  const deleted = Service.unregister(service, hostname, port);
  if (deleted) {
    res.sendStatus(204);
  } else {
    res.sendStatus(200);
  }
});

app.post("/discover", (req, res) => {
  const { service } = req.body;
  const found = Service.discover(service);
  if (found) {
    const { hostname, port } = found;
    res.json({
      statusCode: 200,
      body: {
        hostname,
        port
      }
    });
  } else {
    res.sendStatus(404);
  }
});

const serviceName = "Service Registry";

app.listen(PORT, () =>
  console.log(
    `${serviceName} instance: ${serviceInstanceID} running on port: ${PORT}`
  )
);
