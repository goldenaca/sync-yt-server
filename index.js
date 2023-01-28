const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const {
  handleRoomsEvents,
  handlePlayerEvents,
  handleChatEvents,
} = require("./utilis/socketHelpers");

app.use(function (request, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  if ("OPTIONS" === request.method) {
    res.send(200);
  } else {
    next();
  }
});

io.on("connection", (socket) => {
  console.log("User online with id: ", socket.id);

  socket.on("roomHandler", ({ id, type }) => {
    handleRoomsEvents({ type, id, socket });
  });

  socket.on("serverEventsHandler", ({ type, event, roomId, currentData }) => {
    handlePlayerEvents({ type, event, roomId, currentData });
  });

  socket.on("chatHandler", ({ roomId, message, user, type }) => {
    handleChatEvents({ roomId, message, user, type, socket });
  });

  socket.on("disconnect", (reason) => {
    console.log("User: ", socket.id, " now is offline because: ", reason);
  });
});

const port = process.env.PORT || 4000;
http.listen(port, () => {
  console.log("listening on: " + port);
});
