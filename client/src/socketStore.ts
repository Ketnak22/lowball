import { writable } from "svelte/store";

import { io } from "socket.io-client";

export const socket = writable(io(`${window.location.protocol}//${window.location.hostname}:3001`))