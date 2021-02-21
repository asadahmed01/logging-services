var net = require("net");
const { createLogger, format, transports } = require("winston");
const serverAddress = "config.env";

const { combine, timestamp, label, printf } = format;

var server = net.createServer(function (socket) {
  socket.write("Hello From Server...\r\n");
  //socket.pipe(socket);

  const myFormat = printf(({ level, message, IP, label, timestamp }) => {
    return `Time_Stamp: ${timestamp} | label: ${label} | level:  ${level} | Message: ${message} | IP Address: ${IP}`;
  });

  socket.on("data", function (data) {
    const logger = createLogger({
      level: "info",
      format: combine(
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),

        //timestamp(),
        myFormat
      ),
      defaultMeta: { service: "user-service" },
      transports: [new transports.File({ filename: "combined.txt" })],
    });
    //const obj = JSON.parse(data);
    console.log("DATA " + socket.remoteAddress);
    console.log("client says: " + data);

    logger.log({
      level: "info",
      label: "Client Connected!",
      message: data.toString(),
      IP: server.address().address,
    });
  });

  socket.on("error", function (error) {
    const logger = createLogger({
      level: "info",
      format: combine(
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),

        //timestamp(),
        myFormat
      ),
      defaultMeta: { service: "user-service" },
      transports: [
        new transports.File({ filename: "combined.txt", level: "error" }),
      ],
    });

    logger.log({
      level: "error",
      label: "Error occurred!",
      message: error,
      IP: socket.remoteAddress,
    });
    console.log("Error : " + error);
  });

  socket.on("close", function (data) {
    const logger = createLogger({
      level: "info",
      format: combine(
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),

        //timestamp(),
        myFormat
      ),
      defaultMeta: { service: "user-service" },
      transports: [new transports.File({ filename: "combined.txt" })],
    });

    logger.log({
      level: "info",
      label: "Client disconnected!",
      message: data,
      IP: socket.remoteAddress,
    });
    console.log("connection closed");
  });
});

server.listen(serverAddress.labelSERVER_PORT, "127.0.0.1", function () {
  console.log(`sever listening at...${process.env.PORT}`);
});
