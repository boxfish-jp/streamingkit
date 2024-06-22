import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { split } from "sentence-splitter";
import cors from "cors";

const app = express();
app.use(cors({ origin: "*", credentials: true, optionsSuccessStatus: 200 }));
const httpServer = createServer(app);
const io = new Server(httpServer, {
  path: "/socket/",
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

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

app.listen(2525, "192.168.68.118", () => {
  console.log("Server started at http://192.168.68.118:2525");
});

httpServer.listen(3535, "192.168.68.118", () => {
  console.log("Chat server started at http://192.168.68.118:3535/socket/");
});

console.log("Server started at http://localhost:2525");
