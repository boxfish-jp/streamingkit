const promptKey = ["p:", "n:", "b:", "s:"];

const cleanPrompt = (input: string, searchPrompt: string) => {
  let output = input;
  for (const key of promptKey) {
    if (key === searchPrompt) {
      continue;
    }
    const index = output.indexOf(key);
    if (index !== -1) {
      output = output.slice(0, index).trim();
    }
    output = output.trim();
  }
  output = output.replace(searchPrompt, "").trim().replace(",", "");
  return output;
};

const extractPrompt = (comment: string) => {
  const result: string[] = [];
  for (const key of promptKey) {
    const index = comment.indexOf(key);
    if (index !== -1) {
      const data = comment.slice(index).trim();
      console.log(data);
      result.push(cleanPrompt(data, key));
    } else {
      result.push("");
    }
  }
  return result;
};

export default extractPrompt;
