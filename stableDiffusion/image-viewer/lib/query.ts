const query = async (limit: number, offset: number) => {
  const url = process.env.ENDPOINT + `/id?limit=${limit}&offset=${offset}`;
  const res = await fetch(url, { cache: "no-cache" });
  const result = (await res.json()) as {
    results: { id: number; iaddtime: string; path: string }[];
  };
  return result.results;
};

export default query;
