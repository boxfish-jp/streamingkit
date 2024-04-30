import { useState, useEffect } from "hono/jsx";
import { render } from "hono/jsx/dom";

function StreamDataDisplay() {
  const [data, setData] = useState<string | null>(null);

  useEffect(() => {
    const fetchDataFromStream = async () => {
      try {
        const response = await fetch("http://localhost:5173/");
        if (!response.body) {
          throw new Error("Response body is null");
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          const decodeChunk = decoder.decode(value, { stream: true });
          if (decodeChunk == "noMessageSet") {
            console.log("no message set");
            setData(" ");
          } else {
            setData(decodeChunk);
          }
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchDataFromStream();
  }, []);

  return (
    <div>
      <p class={"text-3xl text-white mx-auto"}>{data}</p>
    </div>
  );
}

function App() {
  return (
    <html>
      <body>
        <StreamDataDisplay />
      </body>
    </html>
  );
}

const root = document.getElementById("root");
if (!root) {
  throw new Error("Root element not found");
}
render(<App />, root);
