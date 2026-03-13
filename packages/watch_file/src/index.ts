import { join } from "node:path";
import { watch } from "chokidar";

type onChange = (event: "change" | "add" | "unlink", path: string) => void;

export const watchFile = async (
  searchPath: string,
  extension: string,
): Promise<{
  files: string[];
  on: (callback: onChange) => void;
  remove: () => void;
}> => {
  let on: onChange = () => {};
  const watchingFiles: string[] = [];
  await new Promise<void>((resolve) => {
    const watcher = watch(searchPath, {
      ignored: (path, stats) =>
        !!stats && stats?.isFile() && !path.endsWith(extension),
    });

    watcher.on("ready", () => {
      const watched = watcher.getWatched();
      for (const dir in watched) {
        for (const file of watched[dir]) {
          watchingFiles.push(join(dir, file));
        }
      }
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
    files: watchingFiles,
    on: (callback: onChange) => {
      on = callback;
    },
    remove: () => {
      on = () => {};
    },
  };
};
