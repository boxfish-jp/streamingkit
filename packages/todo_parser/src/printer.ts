import type { GroupTask, Task, UnitTask } from "./type.js";

const unitTaskPrinter = (unit: UnitTask, depth: number): string =>
  `${"*".repeat(depth)}${unit.status === "NONE" ? " " : ` ${unit.status} `}${unit.title} \n`;

const groupTaskPrinter = (group: GroupTask, depth: number): string => {
  const lines = [
    `${"*".repeat(depth)}${group.status ? ` ${group.status} ` : " "}${group.title} \n`,
  ];
  for (const task of group.tasks) {
    if (task.type === "unit") {
      lines.push(unitTaskPrinter(task, depth + 1));
    } else if (task.type === "group") {
      lines.push(groupTaskPrinter(task, depth + 1));
    }
  }
  return lines.join("");
};

const printTask = (tasks: Task[]): string => {
  const lines = [];
  for (const task of tasks) {
    if (task.type === "unit") {
      lines.push(unitTaskPrinter(task, 1));
    } else if (task.type === "group") {
      lines.push(groupTaskPrinter(task, 1));
    }
  }
  return lines.join("");
};

const todo: Task[] = [
  {
    type: "group",
    title: "effectページをhubで配信しよう",
    tasks: [
      { type: "unit", title: "effectページのビルド方法の調査", status: "DONE" },
      {
        type: "unit",
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
        status: "DONE",
        title: "パーサーの自作",
        tasks: [
          {
            type: "unit",
            title: "パーサの作り方調べる",
            status: "DONE",
          },
          {
            type: "unit",
            title: "足し算引き算パーサで練習",
            status: "DONE",
          },
        ],
      },
      {
        type: "group",
        title: "要件定義",
        tasks: [
          {
            type: "unit",
            title: "表示するものを決める",
            status: "DONE",
          },
          {
            type: "unit",
            title: "具体的にどう表示するか決める",
            status: "THINKING",
          },
        ],
      },
    ],
  },
];

console.log(printTask(todo));
