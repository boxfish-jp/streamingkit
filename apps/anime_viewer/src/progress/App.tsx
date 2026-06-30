import { useAnimeInfo } from "@/components/use_anime_info";

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function App() {
  const { animeInfo } = useAnimeInfo();

  if (!animeInfo) return null;

  const progress = formatTime(animeInfo.progress);
  const duration = formatTime(animeInfo.duration);

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
      <span style={{ fontSize: "4rem" }}>
        {progress} / {duration}
      </span>
    </div>
  );
}

export default App;
