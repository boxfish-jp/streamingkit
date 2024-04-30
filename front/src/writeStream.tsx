import { StreamingApi } from "hono/utils/stream";

const writeStream = async (
  stream: StreamingApi,
  message: string,
  waitTime: number
) => {
  const quateTime = waitTime / 4;
  for (let i = 0; i < 4; i++) {
    await stream.write(message);
    await stream.sleep(quateTime);
  }
  await stream.sleep(waitTime % 4);
};

export default writeStream;
