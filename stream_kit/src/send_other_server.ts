import type { Comment } from "./comment";

interface OtherServer {
	url: URL;
	method: string;
	body: (comment: Comment) => string | undefined;
}

const otherServers: OtherServer[] = [
	{
		url: new URL("http://localhost:2525/chat"),
		method: "POST",
		body: (comment: Comment) =>
			JSON.stringify({
				who: comment.who,
				content: comment.content,
				unixTime: Date.now(),
				point: false,
			}),
	},
];

export const sendOtherServer = async (comment: Comment) => {
	const requestsServer = otherServers.map(
		(otherServer) =>
			new Promise((resolve) => {
				fetch(otherServer.url, {
					method: otherServer.method,
					body: otherServer.body(comment),
					headers: {
						"content-type": "application/json",
					},
				})
					.then((response) => {
						resolve(response);
					})
					.catch((error) => {
						resolve(null); // Resolve even on failure to prevent program stop
					});
			}),
	);
	Promise.all(requestsServer);
};
