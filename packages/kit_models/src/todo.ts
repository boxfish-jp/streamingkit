export interface TodoChangedMessage {
  type: "todoChanged";
  oldFile: string;
  newFile: string;
}

export interface TodoShowMessage {
  type: "todoShow";
  instruction: "show" | "hide";
}
