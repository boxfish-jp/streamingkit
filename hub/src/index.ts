process.stdin.resume();
process.stdin.setEncoding("utf8");

process.stdin.on("data", function (chunk: string) {
  console.log(chunk);
});
