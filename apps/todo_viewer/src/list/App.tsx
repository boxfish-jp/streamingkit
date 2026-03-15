import { Badge } from "@workspace/ui/components/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { useDisplay } from "@/components/display";
import { getTodo } from "@/components/get_todo";

export function App() {
  const [display] = useDisplay();
  const todo = getTodo();
  const parent = todo?.tree[0]?.children[0];
  const children = (parent?.children || []).slice(-3);
  return (
    display &&
    parent && (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{parent?.title || ""}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {children.length > 0 &&
            children.map((child) => {
              const childStatus = getStatusBadgeInfo(child.newStatus);
              return (
                childStatus && (
                  <Card className="w-full max-w-sm gap-3">
                    <CardContent>
                      <Badge className={childStatus.color}>
                        {childStatus.text}
                      </Badge>
                    </CardContent>
                    <CardHeader>
                      <CardTitle>{child.title}</CardTitle>
                    </CardHeader>
                  </Card>
                )
              );
            })}
        </CardContent>
      </Card>
    )
  );
}

const getStatusBadgeInfo = (status: string) => {
  switch (status) {
    case "":
      return { text: "No Status", color: "gray" };
    case "TODO":
      return {
        text: "未着手",
        color:
          "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
      };
    case "THINKING":
      return {
        text: "考え中",
        color:
          "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
      };
    case "DEVELOPING":
      return {
        text: "開発中",
        color: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
      };
    case "TEST":
      return {
        text: "テスト",
        color: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
      };

    case "BUILDING":
      return {
        text: "ビルドの調整",
        color:
          "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
      };
    case "DONE":
      return {
        text: "完了",
        color:
          "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
      };
    case "CANCELED":
      return {
        text: "未定",
        color: "bg-gray-50 text-gray-700 dark:bg-gray-950 dark:text-gray-300",
      };
  }
};
