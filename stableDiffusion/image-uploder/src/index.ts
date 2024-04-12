import { Hono } from 'hono';

type Bindings = {
	imageDB: R2Bucket;
	pathDB: D1Database;
};

const maxAge = 60 * 60 * 24 * 30;

const app = new Hono<{ Bindings: Bindings }>();

app.get('/', (c) => c.text('Hello World'));

app.post('/upload', async (c) => {
	const body = await c.req.parseBody();
	const file = body.upload as File;
	const negative = body.negative as string;
	const prompt = body.prompt as string;
	const bucket = c.env.imageDB;
	const filename = `${new Date().getTime()}-${file.name}`;
	const response = await bucket.put(filename, await file.arrayBuffer(), {
		httpMetadata: {
			contentType: file.type,
		},
	});

	const sql = `INSERT INTO imagePath (path, prompt, negative) VALUES ('${filename}', '${prompt}', '${negative}')`;
	let result = await c.env.pathDB.prepare(sql).all();
	console.log(result);

	return c.json(
		{
			message: `put ${filename} successfully!`,
			object: response,
			filename,
		},
		200
	);
});

app.get('/img/:key', async (c) => {
	const key = c.req.param('key');

	const object = await c.env.imageDB.get(key);
	if (!object) return c.notFound();
	const data = await object.arrayBuffer();
	const contentType = object.httpMetadata?.contentType ?? '';

	return c.body(data, 200, {
		'Cache-Control': `public, max-age=${maxAge}`,
		'Content-Type': contentType,
	});
});

app.get('/id', async (c) => {
	const time = c.req.query('iaddtime');
	const limit = Number(c.req.query('limit'));
	let offset = Number(c.req.query('offset'));

	if (time) {
		const sql = `SELECT * FROM imagePath WHERE iaddtime >= '${time}'`;
		let result = await c.env.pathDB.prepare(sql).all();
		return c.json(result, 200);
	}
	if (limit) {
		if (!offset) {
			offset = 0;
		}
		const sql = `SELECT * FROM imagePath ORDER BY 'id' LIMIT ${limit} OFFSET ${offset}`;
		console.log(sql);
		let result = await c.env.pathDB.prepare(sql).all();
		return c.json(result, 200);
	}
});

export default app;
