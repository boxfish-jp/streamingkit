import * as dotenv from "dotenv";
dotenv.config();

const makeImgTxt = async (
  prompt: string,
  negativePrompt: string,
  batchSize?: number,
  steps?: number
) => {
  batchSize = batchSize ? batchSize : 1;
  steps = steps ? steps : 50;
  const prompts = {
    prompt: prompt,
    negative_prompt: negativePrompt,
    batch_size: batchSize,
    steps: steps,
  };

  const res = await fetch("http://127.0.0.1:7860/sdapi/v1/txt2img", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(prompts),
  });
  const data = await res.json();
  const img: string = data.images[0];
  const decode = new File([Buffer.from(img, "base64")], "image.png");

  const url = process.env.ENDPOINT + "/upload";
  // const bodyImg = { upload: img };
  const formData = new FormData();
  formData.append("upload", decode);
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
