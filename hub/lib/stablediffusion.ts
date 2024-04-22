import sdCommandType from "../types/sdCommandType";
import * as dotenv from "dotenv";
dotenv.config();

const makeImgTxt = async (prompts: sdCommandType) => {
  const body = {
    prompt: prompts.prompt,
    negativePrompt: prompts.negative,
    batchSize: prompts.batch,
    steps: prompts.steps,
  };
  const res = await fetch("http://127.0.0.1:7860/sdapi/v1/txt2img", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  const img: string = data.images[0];
  const decode = new File([Buffer.from(img, "base64")], "image.png");

  const url = process.env.ENDPOINT + "/upload";
  // const bodyImg = { upload: img };
  const formData = new FormData();
  formData.append("upload", decode);
  formData.append("prompt", prompts.prompt);
  formData.append("negative", prompts.negative);
  const res2 = await fetch(url, {
    method: "POST",
    body: formData,
  });
  if (res2.status !== 200) {
    return "生成に失敗しました。";
  } else {
    return "生成に成功しました。";
  }
};

export default makeImgTxt;
