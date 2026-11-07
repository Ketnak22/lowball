<script lang="ts">
    import { currentRoom } from "../roomStore";
    import { socket } from "../socketStore";
  import { gameState } from "../usersStore";

  import type { Response } from "../interfaces";

    function createRoom(username: string) {
        $socket.emit("create-room", username, (room: string, response: Response) => {
            if (!response.success) {
                alert(`Failed to create room!\nReason: ${response.message}`);
                return;
            }
            console.log(`Created and joined room ${room}`);
            $currentRoom = room;
            $gameState = "waiting";
        })
    }
</script>

<div class="room-button">
    <button onclick={() => {
        const username = prompt("Enter username: ");
        if (username !== null) {
            createRoom(username);
        }
    }} class="btn green-btn">Create room</button>
</div>