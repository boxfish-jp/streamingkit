import { writeFileSync } from "node:fs";

const url = new URL("http://0.0.0.0:50020/");
url.searchParams.set("text", "うんこうんこ");
url.searchParams.set("channel", "1");
url.searchParams.set("character", "3");

const res = await fetch(url, { method: "POST" });

console.log("Status:", res.status);
console.log("Content-Type:", res.headers.get("Content-Type"));

if (res.ok) {
  const buffer = Buffer.from(await res.arrayBuffer());
  console.log("WAV size:", buffer.length, "bytes");
  writeFileSync("test_output.wav", buffer);
  console.log("Saved: test_output.wav");
} else {
  console.log("Error:", await res.text());
}
