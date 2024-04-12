import Image from "next/image";
import query from "@/lib/query";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

export default async function Home() {
  const images = await query(10, 0);
  images.reverse();

  const fullPaths = images.map(
    (image) => `${process.env.ENDPOINT}/img/${image.path}`
  );
  return (
    <main className="m-8 flex flex-col gap-5 items-center">
      {fullPaths.map((path, id) => (
        <Card key={id} className="rounded-3xl">
          <CardContent>
            <img className="mt-6 mx-auto" src={path} alt="AIで生成した画像" />
          </CardContent>
          <CardFooter className="flex gap-3 items-stretch mx-auto">
            <Card>
              <CardHeader>positive prompt</CardHeader>
              <CardContent>{images[id].prompt}</CardContent>
            </Card>
            <Card>
              <CardHeader>negative prompt</CardHeader>
              <CardContent>{images[id].negative}</CardContent>
            </Card>
          </CardFooter>
        </Card>
      ))}
    </main>
  );
}
