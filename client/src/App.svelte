<script lang="ts">
  import { socket } from './socketStore';
  import JoinRoom from './lib/JoinRoom.svelte';
  import CreateRoom from './lib/CreateRoom.svelte';
  import { currentRoom } from './roomStore';
  import WaitingRoom from './lib/WaitingRoom.svelte';
  import { users, gameState } from './usersStore';
  import Question from './lib/Question.svelte';
  import Voting from './lib/Voting.svelte';
  import VotingResults from './lib/VotingResults.svelte';
  import PlayerRanking from './lib/PlayerRanking.svelte';
  import type { User } from './interfaces';

  $socket.on("connect", () => {
    console.log(`Connected with id: ${$socket.id}`);
  })

  $socket.on("connect_error", (error) => {
    throw new Error(`Error connecting to server: ${error}`);
  })

  // Update user list when new user joins, or disconnects
  $socket.on("update-players-list", (usersList: User[]) => {
      $users = usersList
  })
</script>

<main>
  {#if $gameState === "joining"}
    <CreateRoom />
    <JoinRoom />
  {:else if $gameState === "waiting"}
    <WaitingRoom />
  {:else if $gameState === "answering"}
    <Question />
  {:else if $gameState === "voting"}
    <Voting />
  {:else if $gameState === "showingResults"}
    <VotingResults />
  {:else if $gameState === "showingRanking"}
    <PlayerRanking />
  {/if}
</main>

<style>
</style>
