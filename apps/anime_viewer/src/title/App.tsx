import { useAnimeInfo } from "@/components/use_anime_info";

function App() {
  const { animeInfo } = useAnimeInfo();

  if (!animeInfo) return null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundColor: "transparent",
        color: "white",
        fontFamily: "sans-serif",
        textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
      }}
    >
      <h1 style={{ fontSize: "4rem", margin: "0" }}>
        {animeInfo?.title || ""}
      </h1>
      <h2 style={{ fontSize: "4rem", margin: "0.5rem 0" }}>
        {animeInfo?.episode || ""}
      </h2>
    </div>
  );
}

export default App;
