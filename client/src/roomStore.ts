import { writable } from "svelte/store";

export const currentRoom = writable("");

currentRoom.subscribe(value => {
    console.log(`Current room: ${value}`);
})