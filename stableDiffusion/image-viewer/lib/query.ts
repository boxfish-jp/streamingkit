const query = async (limit: number, offset: number) => {
  const url =
    process.env.ENDPOINT +
    `/id?iaddtime=${new Date(
      new Date().getTime() - 1000 * 60 * 60 * 24
    ).toLocaleString("sv-SE")}`;
  console.log(url);
  const res = await fetch(url, { cache: "no-cache" });
  const result = (await res.json()) as {
    results: {
      id: number;
      iaddtime: string;
      path: string;
      prompt: string;
      negative: string;
    }[];
  };
  return result.results;
};

export default query;
