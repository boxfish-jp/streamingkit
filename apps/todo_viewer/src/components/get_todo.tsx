import { useEffect, useState } from "react";
import { parseTodo, type UpdateResult } from "todo_parser";
import { useSocket } from "./socket";

export const getTodo = () => {
  const [todo, setTodo] = useState<null | UpdateResult>(null);
  const [addOnMessage] = useSocket();

  useEffect(() => {
    const remove = addOnMessage((message) => {
      if (message.type === "todoChanged") {
        const result = parseTodo(message.oldFile, message.newFile);
        console.log("todoChanged", result);
        if (result.activeTasks.length || result.doneTasks.length) {
          console.log("activeTasks", result.activeTasks);
          console.log("doneTasks", result.doneTasks);
          setTodo(result);
        }
      }
    });
    return () => {
      remove();
    };
  }, [addOnMessage]);

  return todo;
};
