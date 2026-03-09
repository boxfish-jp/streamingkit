import { parseTodo } from "../src/index.js";

const data = `
* TODO a
** TODO b
*** TODO c
* TODO a
** TODO c
*** TODO d
** TODO b
`;

console.log(JSON.stringify(parseTodo(data), null, 2));
