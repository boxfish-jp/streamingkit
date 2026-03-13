export interface TodoChangedMessage {
  type: "todoChanged";
  oldFile: string;
  newFile: string;
}
