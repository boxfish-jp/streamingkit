import { useEffect, useState } from "react";
import { getTodo } from "./get_todo";
import { useSocket } from "./socket";

export const useDisplay = () => {
  const todo = getTodo();
  const [display, setDisplay] = useState(false);
  const [addOnMessage] = useSocket();
  const [time, setTime] = useState(0);

  useEffect(() => {
    const remove = addOnMessage((message) => {
      if (message.type === "todoShow") {
        setTime(15000);
        setDisplay(true);
      }
    });
    return () => {
      remove();
    };
  }, [addOnMessage]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: todoをフックにしてほしいから
  useEffect(() => {
    setTime(10000);
    setDisplay(true);
  }, [todo]);

  useEffect(() => {
    if (!display) return;
    if (time <= 0) {
      setDisplay(false);
      return;
    }
    const timer = setTimeout(() => {
      setTime((prev) => prev - 1000);
    }, 1000);
    return () => clearTimeout(timer);
  }, [time, display]);

  return [display];
};
