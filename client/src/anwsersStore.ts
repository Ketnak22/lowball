import { writable } from "svelte/store";
import type { UserAnswer } from "./interfaces";

export const anwsers = writable<UserAnswer[]>(undefined);