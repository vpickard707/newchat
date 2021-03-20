const socketIO = require("socket.io");
const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");

const dotenv = require("dotenv");
dotenv.config();

const mongoConnect = require("./config/mongo");
const Message = require("./models/message");
const fileUploader = require("./controllers/fileUploader");

const io = socketIO(process.env.SOCKET_PORT);
const app = express();

io.on("connect_error", (err) => {
  console.log(`connect_error due to ${err.message}`);
});
io.on("connect", (socket) => {
  console.log("Connection established");

  getMostRecentMessages()
    .then((results) => {
      socket.emit("mostRecentMessages", results.reverse());
    })
    .catch((error) => {
      socket.emit("mostRecentMessages", []);
    });

  socket.on("newChatMessage", (data) => {
    //send event to every single connected socket
    try {
      const message = new Message({
        user_name: data.user_name,
        user_avatar: data.user_avatar,
        message_text: data.message,
      });
      message
        .save()
        .then(() => {
          io.emit("newChatMessage", {
            user_name: data.user_name,
            user_avatar: data.user_avatar,
            message_text: data.message,
          });
        })
        .catch((error) => console.log("error: " + error));
    } catch (e) {
      console.log("error: " + e);
    }
  });
  socket.on("disconnect", () => {
    console.log("connection disconnected");
  });
});

/**
 * get 10 last messages
 * @returns {Promise<Model[]>}
 */
async function getMostRecentMessages() {
  return await Message.find().sort({ _id: -1 }).limit(10);
}

app.use((req, res, next) => {
  //allow access from every, elminate CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.removeHeader("x-powered-by");
  //set the allowed HTTP methods to be requested
  res.setHeader("Access-Control-Allow-Methods", "POST");
  //headers clients can use in their requests
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );
  //allow request to continue and be handled by routes
  next();
});

//sending json data
app.use(bodyParser.json());

//handle http request for username and image for upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

app.post(
  "/api/upload",
  upload.single("avatar"),
  fileUploader
);

/**
 *
 * @returns {Promise<void>}
 */
const initApp = async () => {
  try {
    await mongoConnect();
    console.log("DB connection established");
    app.listen(process.env.HTTP_PORT, () =>
      console.log(
        `HTTP Server listening on ${process.env.HTTP_PORT}`
      )
    );
  } catch (e) {
    throw e;
  }
};

initApp().catch((err) =>
  console.log(`Error on startup! ${err}`)
);
