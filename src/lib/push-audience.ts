export type PushAudience = "motoristas" | "passageiros" | "todos";

export const PUSH_AUDIENCE_OPTIONS: { value: PushAudience; label: string }[] = [
  { value: "passageiros", label: "Passageiros" },
  { value: "motoristas", label: "Motoristas" },
  { value: "todos", label: "Todos" },
];

export const PUSH_MAX_TITLE = 120;
export const PUSH_MAX_BODY = 4000;
export const PUSH_MAX_IDS = 2000;
