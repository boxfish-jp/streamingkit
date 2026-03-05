type TaskStatus =
  | "TODO"
  | "THINKING"
  | "DEVELOPING"
  | "TEST"
  | "BUILDING"
  | "DONE"
  | "CANCELED"
  | "NONE";

type UnitTask = {
  type: "task";
  title: string;
  status: TaskStatus;
};

type TaskGroup = {
  type: "group";
  title: string;
  tasks: Task[];
};

type Task = UnitTask | TaskGroup;

/*
const todo: Task[] = [
  {
    type: "group",
    title: "effectページをhubで配信しよう",
    tasks: [
      { type: "task", title: "effectページのビルド方法の調査", status: "DONE" },
      {
        type: "task",
        title: "effectページのhubへの配信方法の調査",
        status: "DEVELOPING",
      },
    ],
  },
  {
    type: "group",
    title: "プログラミング配信において、現在の進捗を表示する",
    tasks: [
      {
        type: "group",
        title: "パーサーの自作",
        tasks: [
          {
            type: "task",
            title: "パーサの作り方調べる",
            status: "DONE",
          },
          {
            type: "task",
            title: "足し算引き算パーサで練習",
            status: "DONE",
          },
        ],
      },
    ],
  },
];
*/
