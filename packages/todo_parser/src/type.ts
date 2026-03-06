export const taskStatusList = [
  "TODO",
  "THINKING",
  "DEVELOPING",
  "TEST",
  "BUILDING",
  "DONE",
  "CANCELED",
  "NONE",
] as const;

export type TaskStatus = (typeof taskStatusList)[number];

export type Task = {
  title: string;
  status: TaskStatus;
  children?: Task[];
};
