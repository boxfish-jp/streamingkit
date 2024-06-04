import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { split } from "sentence-splitter";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { path: "/socket/" });

const makeData = (message: string) => {
  const sentences = split(message);
  const data = sentences.map((sentence) => {
    return {
      text: sentence.raw,
      time: (sentence.raw.length / 4.3) * 1000,
    };
  });
  return data;
};

app.get("/", (req, res) => {
  res.send("Hello World!");
  console.log(req.query);
  const messsage = (req.query.message as string) || "";
  io.emit("message", JSON.stringify(makeData(messsage)));
});

app.use(express.static("public"));

io.on("connection", (socket) => {
  console.log("connected");
  socket.on("message", (message) => {
    io.emit("message", "Hello from server!");
    console.log("Received message:", message);
  });
});

app.listen(3000, "192.168.68.118", () => {
  console.log("Server started at http://192.168.68.118:3000");
});

httpServer.listen(3000, () => {
  console.log("Chat server started at http://localhost:3000/socket/");
});

console.log("Server started at http://localhost:3000");
