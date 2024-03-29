import videoCommands from "../lib/videoCommands";

describe("videoCommands", () => {
  it("should return an array of commands", async () => {
    const commands = await videoCommands();
    expect(commands.length).toBeGreaterThan(41);
  });
});
