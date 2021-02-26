/*
 * Authors: Asad Ahmed,  Mohamed Abusultan
 * Date: Feb 24, 2021
 * Description: This program is the server for the logging services. The server receives all the details from
 * the client(s) such as the log level, the details of what triggered the the log. When the server receives these
 * details, it creates a text file and logs all the details that is necessary for identifying the nature of
 * incident and the client from which it came from.
 * The server has the capabilities of connecting to multiple clients at a time and log their respective details
 * all in one file.
 */

//import the necessary files
const net = require("net");
const { v4: uuidv4 } = require("uuid");
const { createLogger, format, transports } = require("winston");
const dotenv = require("dotenv");
const { combine, timestamp, label, printf } = format;

//the array that will hold all the connected clients
let clientsList = [];
//read the PORT number and the IP address from the .env file
dotenv.config();

//create the format of the log files
const myFormat = printf(({ level, message, IP, label, timestamp, ID }) => {
  return `Time_Stamp: ${timestamp} | Client_ID: ${ID} | level: ${level.toUpperCase()}  | label:  ${label} | Message: ${message} | IP Address: ${IP}`;
});

/*
 * Create the logger file that will be responsible for logging the details into the text file
 * this logger object uses the format we defined above to make the log files presentable
 */
const logger = createLogger({
  format: combine(
    //provide the date format that will appear on the logs
    format.timestamp({ format: "MMM DD YYYY HH:mm:ss" }),
    myFormat
  ),
  defaultMeta: { service: "user-service" },
  //create the file name of the text file that will contain the logs details
  transports: [new transports.File({ filename: "logs.txt" })],
});
//create the server
const server = net.createServer();
//fire the server to listen for connection
server.listen(process.env.PORT, process.env.IP_ADDRESS, function () {
  //display a message when the server is listening
  console.log(`sever listening at...${process.env.PORT}`);
});

//when the server is connected to a client
server.on("connection", function (socket) {
  //the identity of the new client
  let newClient = socket.remoteAddress + ":" + socket.remotePort;
  //generate a unique ID for each client that is connected
  const clientID = uuidv4();
  //add the new client to the list
  clientsList.push(socket);
  //welcome the new client

  //notify to all the clients that a new client has connected
  broadcast(newClient + " Connected", socket);
  console.log("Connected Clients: " + clientsList.length);
  //write the details of the connected client in addition to the time they established the connection
  logger.log({
    level: "info",
    label: "client connected",
    message: newClient + " connected",
    IP: newClient,
    ID: clientID,
  });

  //when a client sends data
  socket.on("data", function (data) {
    //broadcast the data sent back to the clients
    broadcast("\n" + newClient + ">>> " + data + "\n", socket);

    //parse the received data to convert it into JSON object
    const payload = JSON.parse(data);
    //loop through the json objects
    payload.forEach((item) => {
      //extract the level of the log as well as the message (details)
      const { level, message } = item;

      //if the level is info
      //log the appropriate details into the log
      if (level === "info") {
        logger.log({
          level: level,
          label: "info level",
          message: message,
          IP: socket.remoteAddress + ":" + socket.remotePort,
          ID: clientID,
        });
      }

      if (level === "debug") {
        logger.log({
          level: level,
          label: "Debugging the system",
          message: message,
          IP: socket.remoteAddress + ":" + socket.remotePort,
          ID: clientID,
        });
      }

      //if the level is warn
      //log the appropriate details into the log
      if (level === "warn") {
        logger.log({
          level: level,
          label: "warning the system",
          message: message,
          IP: socket.remoteAddress + ":" + socket.remotePort,
          ID: clientID,
        });
      }

      //if the level is error
      //log the appropriate details into the log
      if (level === "error") {
        logger.log({
          level: level,
          label: "Error occured in the system",
          message: message,
          IP: socket.remoteAddress + ":" + socket.remotePort,
          ID: clientID,
        });
      }
    });

    //if an error occurs that might be related to the connection
    socket.on("error", function (error) {
      console.log("Error : " + error.stack);
      //log the error message into the log file with the appropriate log level
      logger.log({
        level: "error",
        label: error.message,
        message: message,
        IP: socket.remoteAddress + ":" + socket.remotePort,
        ID: clientID,
      });
    });

    //When the connection ends from the client's side
    socket.on("end", function (data) {
      //find the specific client that disconnected and remove it from the connection list
      clientsList.splice(clientsList.indexOf(socket), 1);
      //broad cast to the clients that are still connected that a particular client disconnected
      broadcast(newClient + " left the chat.\n");

      console.log(newClient + " connection closed \n\n");
      //Log the details when a connection is closed
      logger.log({
        level: "info",
        label: "Client disconnected",
        message: "client disconnected",
        IP: socket.remoteAddress + ":" + socket.remotePort,
        ID: clientID,
      });
    });
  });
});

/*
 * Method: broadcast()
 * params: message, sender
 * return : None
 * Description: This method takes in a message and the sender that is sending the message
 * and it broadcasts that message to all the clients
 */
function broadcast(message, sender) {
  //loop through all the clients in the list
  clientsList.forEach(function (client) {
    // Don't want to send it to sender
    if (client === sender) client.write("");
    //send the message to the other clients
    client.write(message);
  });
}
