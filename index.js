// var gpstracker = require("gpstracker");
var { Server } = require("gps-tracker-server");
const app = require("express")();
const bodyParser = require("body-parser");
const T303Adapter = require('./controllers/tracker303/Adapter303');

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

      console.log('device start', device.UID);
    })

    server.on('tracker', (msg, device) => {
      console.log(msg, device.UID);
    })

    server.on('alarms', (info, device) => {
      console.log(info, device.UID);
    });

    server.on('disconnections', device => {
      console.log(device.UID);
    });

    await server.run();
  } catch (err) {
    console.log(err);
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