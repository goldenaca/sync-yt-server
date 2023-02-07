const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);

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
  const syncOnJoin = async (id) => {
    const usersId = await io.in(id).allSockets();
    const uniqueUsersId = [...usersId];
    if (!uniqueUsersId) return;
    socket.to(uniqueUsersId[0]).emit("serverEventsHandler", {
      type: "askCurrentData",
      currentData: { newSocketId: socket.id },
    });
  };

  socket.on("roomHandler", ({ id, type, user }) => {
    if (type === "new") {
      socket.join(id);
    }

    if (type === "join") {
      let messageData = {
        messageType: "event",
        messageContent: "joined the room.",
        messageOwner: user,
      };
      setTimeout(() => socket.to(id).emit("chat", messageData), 2000);
      socket.join(id);
      syncOnJoin(id);
    }
  });

  socket.on(
    "serverEventsHandler",
    ({ type, event, roomId, currentData, user }) => {
      let messageData;

      if (type === "playerEvent") {
        messageData = {
          messageType: "event",
          messageContent:
            event === "PLAY" ? "played the video." : "stopped the video.",
          messageOwner: user,
        };

        socket.to(roomId).emit("serverEventsHandler", {
          type,
          event,
          currentData,
        });
        socket.to(roomId).emit("chat", messageData);
      }

      if (type === "loadVideo") {
        messageData = {
          messageType: "event",
          messageContent: "selected a video.",
          messageOwner: user,
        };

        socket.to(roomId).emit("serverEventsHandler", {
          type,
          currentData,
        });
        socket.to(roomId).emit("chat", messageData);
      }

      if (type === "sendCurrentRoomInfo") {
        socket.to(currentData.newSocketId).emit("serverEventsHandler", {
          currentData,
          type: "recieveCurrentRoomData",
        });
      }
    }
  );

  socket.on("chat", ({ roomId, message, user }) => {
    let messageData = {
      messageType: "external",
      messageContent: message,
      messageOwner: user,
    };

    socket.to(roomId).emit("chat", messageData);
  });

  socket.on("disconnect", (reason) => {
    console.log("User: ", socket.id, " now is offline because: ", reason);
  });
});

const port = process.env.PORT || 4000;
http.listen(port, () => {
  console.log("listening on: " + port);
});
