const syncOnJoin = async (socket, id) => {
  const usersId = await io.in(id).allSockets();
  const uniqueUsersId = [...usersId];
  if (!uniqueUsersId) return;
  socket.to(uniqueUsersId[0]).emit("serverEventsHandler", {
    type: "askCurrentData",
    currentData: { newSocketId: socket.id },
  });
};

export function handleRoomsEvents({ type, id, socket }) {
  if (type === "new") {
    socket.join(id);
  }

  if (type === "join") {
    socket.join(id);
    syncOnJoin(socket, id);
  }
}

export function handlePlayerEvents({
  type,
  event,
  roomId,
  currentData,
  socket,
}) {
  if (type === "playerEvent") {
    socket.to(roomId).emit("serverEventsHandler", {
      type,
      event,
      currentData,
    });
  }

  if (type === "loadVideo") {
    socket.to(roomId).emit("serverEventsHandler", {
      type,
      currentData,
    });
  }

  if (type === "sendCurrentRoomInfo") {
    socket.to(currentData.newSocketId).emit("serverEventsHandler", {
      currentData,
      type: "recieveCurrentRoomData",
    });
  }
}

export function handleChatEvents({ roomId, message, user, type, socket }) {
  socket.to(roomId).emit("chatHandler", { message, user, type });
}
