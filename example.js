const net = require("net");
const { createLogger, format, transports } = require("winston");
const dotenv = require("dotenv");

let clientsList = [];
dotenv.config();
const { combine, timestamp, label, printf } = format;

//create the format of the log files
const myFormat = printf(({ level, message, IP, label, timestamp }) => {
  return `Time_Stamp: ${timestamp} | level: ${level.toUpperCase()}  | label:  ${label} | Message: ${message} | IP Address: ${IP}`;
});

//create the logger class

const logger = createLogger({
  //level: "info",
  format: combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    myFormat
  ),
  defaultMeta: { service: "user-service" },
  transports: [new transports.File({ filename: "logs.txt" })],
});

const server = net.createServer();

server.listen(process.env.PORT, process.env.IP_ADDRESS, function () {
  console.log(`sever listening at...${process.env.PORT}`);
});

server.on("connection", function (socket) {
  //the identity of the new client
  let newClient = socket.remoteAddress + ":" + socket.remotePort;
  //add the new client to the list
  clientsList.push(socket);
  //welcome the new client

  //socket.write("Welcome " + newClient);
  //notify to all the clients
  broadcast(newClient + " joined", socket);

  logger.log({
    level: "info",
    label: "client connected",
    message: newClient + " connected",
    IP: newClient,
  });

  //handle new messages from clients
  socket.on("data", function (data) {
    broadcast("\n" + newClient + ">>> " + data + "\n", socket);

    if (data.toString() === "auto") {
      logger.log({
        level: "info",
        label: "this level is information about the systme.",
        message: data.toString() + " test is running",
        IP: socket.remoteAddress + ":" + socket.remotePort,
      });

      logger.log({
        level: "debug",
        label: "this level is gives debug info about the system",
        message: data.toString() + " test is running",
        IP: socket.remoteAddress + ":" + socket.remotePort,
      });

      logger.log({
        level: "warn",
        label: "this level is gives warninng about the system",
        message: data.toString() + " test is running",
        IP: socket.remoteAddress + ":" + socket.remotePort,
      });

      logger.log({
        level: "error",
        label: "this level is gives errors about the system",
        message: data.toString() + " test is running",
        IP: socket.remoteAddress + ":" + socket.remotePort,
      });
    } else {
      //console.log(data);
      const payload = JSON.parse(data);
      const logLevel = payload.level.toString();
      const logDetails = payload.logMessage.toString();

      if (logLevel === "info") {
        logger.log({
          level: "info",
          label: "this level is information about the systme.",
          message: logDetails,
          IP: socket.remoteAddress + ":" + socket.remotePort,
        });
      }
      if (logLevel === "debug") {
        logger.log({
          level: "debug",
          label: "this level is gives debug info about the system",
          message: logDetails,
          IP: socket.remoteAddress + ":" + socket.remotePort,
        });
      }

      if (logLevel === "warn") {
        logger.log({
          level: "warn",
          label: "this level is gives warninng about the system",
          message: logDetails,
          IP: socket.remoteAddress + ":" + socket.remotePort,
        });
      }

      if (logLevel === "error") {
        logger.log({
          level: "error",
          label: "this level is gives errors about the system",
          message: logDetails,
          IP: socket.remoteAddress + ":" + socket.remotePort,
        });
      }
    }
  });

  socket.on("error", function (error) {
    console.log("Error : " + error.stack);
  });

  socket.on("end", function (data) {
    clientsList.splice(clientsList.indexOf(socket), 1);
    broadcast(newClient + " left the chat.\n");

    console.log(newClient + " connection closed \n\n");

    logger.log({
      level: "info",
      label: "Client disconnected",
      message: "client disconnected",
      IP: socket.remoteAddress + ":" + socket.remotePort,
    });
  });
});

// Send a message to all clients
function broadcast(message, sender) {
  clientsList.forEach(function (client) {
    // Don't want to send it to sender
    if (client === sender) client.write("");
    client.write(message);
  });
  // Log it to the server output too
  console.log(message);
}

// clientsList.forEach((client) => {
//   socket.write(`${client.remoteAddress}: disconnected`);
//   console.log(`connection closed: ${client.remoteAddress}`);
// });

// const myFormat = printf(({ level, message, IP, label, timestamp }) => {
//   return `Time_Stamp: ${timestamp} | level: ${level}  | label:  ${label} | Message: ${message} | IP Address: ${IP}`;
// });

// const logger = createLogger({
//   //level: "info",
//   format: combine(
//     format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
//     myFormat
//   ),
//   defaultMeta: { service: "user-service" },
//   transports: [new transports.File({ filename: "combined.txt" })],
// });

// logger.log({
//   level: "info",
//   label: "New Client Connected!",
//   message: "Connected",
//   IP: socket.remoteAddress + ":" + socket.remotePort,
// });
