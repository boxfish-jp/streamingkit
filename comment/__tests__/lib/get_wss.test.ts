import getWss from "../../lib/get_wss";

test("getWss", async () => {
  const liveId = "lv342978597";
  const wss = await getWss(liveId);
  console.log("wss=", wss);
  if (wss) {
    expect(wss).toMatch(
      /^wss:\/\/a\.live2\.nicovideo\.jp\/wsapi\/v2\/watch\/lv342978597/
    );
  } else {
    expect(undefined).toBeDefined();
  }
});
