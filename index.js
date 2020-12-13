// var gpstracker = require("gpstracker");
var { Server } = require("gps-tracker-server");
const app = require("express")();
const bodyParser = require("body-parser");
const T303Adapter = require('./controllers/tracker303/Adapter303');

const mongoose = require("mongoose");
var Schema = mongoose.Schema;

var schemaLog = new Schema(
  {
    description: String,
    event: Object,
  },
  {
    collection: "logs",
    timestamps: true,
    versionKey: false,
  }
);

var LogModel = mongoose.model("LogModel", schemaLog);
mongoose.connect("mongodb://localhost:27017/logsGPS", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.connection.on("error", (err) => {
  console.log("err", err);
});
mongoose.connection.on("connected", (err, res) => {
  console.log("connected");
});
/* var server = gpstracker.create().listen(5050, function () {
  console.log(
    "listening your gps trackers on port",
    server.trackers.on("connected", function (tracker) { console.log(tracker);})
  );
});

server.trackers.on("connected", function (tracker) {

  console.log("tracker connected with imei:", tracker.imei);

  tracker.on("help me", function () {
    console.log(tracker.imei + " pressed the help button!!".red);
  });

  tracker.on("position", function (position) {
    console.log("tracker {" + tracker.imei + "}: lat",
      position.lat, "lng", position.lng);
  });

  tracker.trackEvery(10).seconds();
}); */

async function start() {

  try {
    let adapter = new T303Adapter();
    let server = new Server(adapter);

    server.on('connections', device => {
      //set alarm offline
      device.maxInterval = 120 * 1000 //ten minutes
      device.alarmOffline = true;
      device.startTimerStatusOnline();
      await LogModel.create({
        description: device.UID,
        event: 'device start'
      })

    })

    server.on('tracker', (msg, device) => {
      await LogModel.create({
        description: device.UID,
        event: msg
      })

    })

    server.on('alarms', (info, device) => {
      await LogModel.create({
        description: device.UID,
        event: info
      })
    });

    server.on('disconnections', device => {
      await LogModel.create({
        description: device.UID,
        event: 'disconnect'
      })
      console.log(device.UID);
    });

    await server.run();
  } catch (err) {
    console.log(err);
    await LogModel.create({
      description: err,
      event: 'error'
    })
    process.exit(1);
  }

}

start();

app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json());

app.listen(8090, () =>
  console.log("Server running on port:", 8090)
);