import Image from "next/image";
import query from "@/lib/query";

export default async function Home() {
  const images = await query(10, 0);

  const fullPaths = images.map(
    (image) => `${process.env.ENDPOINT}/img/${image.path}`
  );
  return (
    <main className="m-8 flex flex-col gap-5 items-center">
      {fullPaths.map((path, id) => (
        <div key={id}>
          <img src={path} alt="AIで生成した画像" />
        </div>
      ))}
    </main>
  );
}
