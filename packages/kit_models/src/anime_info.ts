export interface AnimeInfoMessage {
  type: "animeInfo";
  title: string;
  episode: string;
  progress: number;
  duration: number;
}
