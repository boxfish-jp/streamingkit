export interface AddEducationMessage {
  type: "addEducation";
  key: string;
  value: string;
}

export interface RemoveEducationMessage {
  type: "removeEducation";
  key: string;
}
