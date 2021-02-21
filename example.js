const net = require("net");
const { createLogger, format, transports } = require("winston");
const dotenv = require("dotenv");

dotenv.config();
const { combine, timestamp, label, printf } = format;
const server = net.createServer();

server.listen(process.env.PORT, process.env.IP_ADDRESS, function () {
  console.log(`sever listening at...${process.env.PORT}`);
});

let clientsList = [];

server.on("connection", function (socket) {
  let newClient = socket.remoteAddress;
  socket.write("Hollaaaaa");
  clientsList.push(newClient);

  const myFormat = printf(({ level, message, IP, label, timestamp }) => {
    return `Time_Stamp: ${timestamp} | level: ${level}  | label:  ${label} | Message: ${message} | IP Address: ${IP}`;
  });

  const logger = createLogger({
    //level: "info",
    format: combine(
      format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      myFormat
    ),
    defaultMeta: { service: "user-service" },
    transports: [new transports.File({ filename: "combined.txt" })],
  });

  logger.log({
    level: "info",
    label: "New Client Connected!",
    message: "Connected",
    IP: server.address().address,
  });

  socket.on("data", function (data) {
    console.log("DATA " + socket.remoteAddress + ": " + data);
    // Write the data back to all the connected, the client will receive it as data from the server
    clientsList.forEach(function (sock, index, array) {
      socket.write(
        socket.remoteAddress + ":" + socket.remotePort + " said " + data + "\n"
      );
      console.log(
        socket.remoteAddress +
          ":" +
          socket.remotePort +
          " said " +
          data.toString() +
          "\n"
      );
    });
  });

  socket.on("error", function (error) {
    logger.log({
      level: "error",
      label: "Error occurred!",
      message: error.message,
      IP: server.address().address,
    });
    console.log("Error : " + error.stack);
  });

  socket.on("close", function (data) {
    let index = clientsList.findIndex((client) => {
      return client.remoteAddress === socket.remoteAddress;
    });

    if (index !== -1) {
      clientsList.splice(index, 1);
    }

    clientsList.forEach((client) => {
      socket.write(`${client.remoteAddress}: disconnected`);
      console.log(`connection closed: ${client.remoteAddress}`);

      logger.log({
        level: "warn",
        label: "Client disconnected!",
        message: data,
        IP: socket.remoteAddress,
      });
    });
    logger.log({
      level: "warn",
      label: "Client disconnected!",
      message: data,
      IP: server.address().address,
    });
    console.log("connection closed \n\n");
  });
});
