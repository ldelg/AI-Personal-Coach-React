export type ChatMsg = {
  role: "system" | "user" | "assistant";
  content: string;
};