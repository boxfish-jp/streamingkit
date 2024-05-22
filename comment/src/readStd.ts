const readStd = async () => {
  process.stdin.on("data", async (chunk: string) => {
    console.log(chunk.toString().trim());
  });
};

export default readStd;
