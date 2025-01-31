import { readFileSync, writeFileSync } from "node:fs";

export const eduRegist = (word: string, replace: string) => {
	const eduData = getEducationData();
	eduData[word] = replace;
	const eduJson = JSON.stringify(eduData, null, 2);
	writeFile(eduJson);
};

export const eduRemove = (word: string) => {
	const eduData = getEducationData();
	delete eduData[word];
	const eduJson = JSON.stringify(eduData, null, 2);
	writeFile(eduJson);
};

export const getEducationData = () => {
	return JSON.parse(readFileSync("./education.json", "utf-8")) as {
		[key: string]: string;
	};
};

const writeFile = (data: string) => {
	try {
		writeFileSync("./education.json", data);
	} catch (error) {
		console.log(error);
	}
};
