import { watch } from "chokidar";

type onChange = (event: "change" | "add" | "unlink", path: string) => void;
export const watchFile = async (
  searchPath: string,
  extension: string,
): Promise<{ on: (callback: onChange) => void; remove: () => void }> => {
  let on: onChange = () => {};
  await new Promise<void>((resolve) => {
    const watcher = watch(searchPath, {
      ignored: (path, stats) =>
        !!stats && stats?.isFile() && !path.endsWith(extension),
    });

    watcher.on("ready", () => {
      watcher.on("change", (path) => {
        on("change", path);
      });

      watcher.on("add", (path) => {
        on("add", path);
      });

      watcher.on("unlink", (path) => {
        on("unlink", path);
      });
      resolve();
    });
  });

  return {
    on: (callback: onChange) => {
      on = callback;
    },
    remove: () => {
      on = () => {};
    },
  };
};
