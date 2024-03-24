import getWss from "../../lib/get_wss";

test("getWss", async () => {
  const liveId = "lv344713041";
  const wss = await getWss(liveId);
  if (wss) {
    expect(wss).toMatch(
      /^wss:\/\/a\.live2\.nicovideo\.jp\/unama\/wsapi\/v2\/watch\/48190124458560/
    );
  }
  expect(wss).toBeDefined();
});
