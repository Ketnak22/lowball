import { writable } from "svelte/store";
import type { UserAnswer } from "./interfaces";

export const userAnswers = writable<UserAnswer[]>([]);