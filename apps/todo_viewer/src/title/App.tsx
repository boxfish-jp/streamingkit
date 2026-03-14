import { getTodo } from "@/components/get_todo";

export function App() {
  const todo = getTodo();
  const title = todo?.tree[0]?.title || "";
  console.log(todo?.tree);
  return <h1 className="font-medium text-4xl">{title}</h1>;
}
