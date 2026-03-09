export const taskStatusList = [
  "TODO",
  "THINKING",
  "DEVELOPING",
  "TEST",
  "BUILDING",
  "DONE",
  "CANCELED",
] as const;

export type TaskStatus = (typeof taskStatusList)[number];
