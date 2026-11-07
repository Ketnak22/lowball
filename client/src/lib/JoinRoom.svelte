<script lang="ts">
  import { currentRoom } from "../roomStore";
  import { socket } from "../socketStore";
  import { gameState } from "../usersStore";

  import type { Response } from "../interfaces";

  function joinRoom(roomId: string, username: string) {
    $socket.emit("join-room", roomId, username, (room: string, response: Response) => {
      if (!response.success) {
        alert(`Failed to join room ${room}!\nReason: ${response.message}`);
      } else {
        console.log(`Joined room ${room}`);
        $currentRoom = room;
        $gameState = "waiting";
      }
    })
  }
</script>

<div>
    <button onclick={() => {
      const roomId = prompt("Enter room id: ");
      const username = prompt("Enter username: ")
      if (roomId !== null && username !== null) {
        joinRoom(roomId, username);
      }
    }} class="btn green-btn">Join room</button>
</div>