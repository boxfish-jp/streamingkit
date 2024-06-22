import React from "https://cdn.skypack.dev/react@17";
import ReactDOM from "https://cdn.skypack.dev/react-dom@17";

const { useState } = React;

const socket = io("http://192.168.68.118:3535/", { path: "/socket" });
const App = () => {
  const [message, setMessage] = useState("");
  socket.on("message", async (message) => {
    const sentences = JSON.parse(message);

    for (const sentence of sentences) {
      setMessage(sentence.text);
      await new Promise((resolve) => setTimeout(resolve, sentence.time));
    }
    setMessage("");
  });

  return (
    <div class={"w-full"}>
      <div>
        <p
          class={"text-3xl text-white mx-auto font-bold w-fit"}
          style={{ WebkitTextStroke: "3px pink" }}
        >
          {message}
        </p>
      </div>
    </div>
  );
};
ReactDOM.render(<App />, document.getElementById("app"));
