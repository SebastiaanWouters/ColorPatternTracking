import express from "express";
import * as http from "http";
import socketio from "socket.io";
import * as path from "path";

console.log("Starting server...");

const staticFolder = path.resolve(__dirname);
const htmlFolder = path.resolve(staticFolder);

export const app = express();
const server = http.createServer(app);
export const io = socketio.listen(server, { pingTimeout: 60000 * 15 });

app.use(express.static(staticFolder));

const port = process.env.PORT || "3000";

app.get("/", (req, res) => {
  res.sendFile(path.resolve(htmlFolder + "/index.html"));
});

app.get("/slave", (req, res) => {
  res.sendFile(path.resolve(htmlFolder + "/slave.html"));
});

server.listen(port, () => {
  console.log(`Server listening on port: ${port}`);
});

io.on("connect", (socket: socketio.Socket) => {
  console.log("New connection!");
  socket.on("request-blanco", () => {
    io.emit("display-blanco");
  });
  socket.on("request-top-left", () => {
    io.emit("display-top-left");
  });
  socket.on("request-top-right", () => {
    console.log("ok");
    io.emit("display-top-right");
  });
  socket.on("request-bottom-right", () => {
    io.emit("display-bottom-right");
  });
  socket.on("request-bottom-left", () => {
    io.emit("display-bottom-left");
  });
  socket.on("request-animation", () => {
    io.emit("display-animation");
  });
  socket.on("notify-animation-end", () => {
    console.log("ANIMATION ENDED");
    io.emit("slave-ended-animation");
  });

  socket.on("request-black", () => {
    io.emit("display-black");
  });
  socket.on("notify-black", () => {
    io.emit("slave-displayed-black");
  });

  socket.on(
    "send-corner-size",
    (msg: {
      cornerBoxSize: number;
      innerWidth: number;
      innerHeight: number;
    }) => {
      console.log(JSON.stringify(msg));
      io.emit("receive-corner-size", {
        cornerBoxSize: msg.cornerBoxSize,
        innerWidth: msg.innerWidth,
        innerHeight: msg.innerHeight,
      });
    }
  );
});
