import puppeteer from "puppeteer";

export const getStreamingInfo = async () => {
	// Launch the browser and open a new blank page
	const browser = await puppeteer.launch({
		browser: "firefox",
		executablePath: "C:\\Program Files\\Mozilla Firefox\\firefox.exe",
		userDataDir:
			"C:\\Users\\boxfi\\AppData\\Roaming\\Mozilla\\Firefox\\Profiles\\ep4ax7am.default-release",
	});
	const page = await browser.newPage();

	// Navigate the page to a URL
	await page.goto("https://live.nicovideo.jp/watch/user/98746932");

	const data = await page.evaluate(() => {
		const scriptTag = document.getElementById("embedded-data");
		return scriptTag ? scriptTag.getAttribute("data-props") : null;
	});
	if (!data) {
		console.error("Failed to get data from the page");
		return;
	}
	const jsonData = JSON.parse(data);
	const nicoWsurl = jsonData.site.relive.webSocketUrl as string;
	const vposBaseTime = jsonData.program.vposBaseTime as number;
	const liveId = jsonData.program.nicoliveProgramId as string;
	await browser.close();

	return { nicoWsurl, vposBaseTime, liveId };
};
