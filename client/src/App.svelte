<script lang="ts">
  import { connected, room } from './lib/game';
  import Home from './lib/Home.svelte';
  import Lobby from './lib/Lobby.svelte';
  import Question from './lib/Question.svelte';
  import Ranking from './lib/Ranking.svelte';
  import Results from './lib/Results.svelte';
  import Voting from './lib/Voting.svelte';
</script>

<main>
  {#if !$connected}
    <p class="banner">Connecting to the server...</p>
  {/if}

  {#if !$room}
    <Home />
  {:else if $room.phase === 'lobby'}
    <Lobby room={$room} />
  {:else if $room.phase === 'answering'}
    <Question room={$room} />
  {:else if $room.phase === 'voting'}
    <Voting room={$room} />
  {:else if $room.phase === 'results'}
    <Results room={$room} />
  {:else}
    <Ranking room={$room} />
  {/if}
</main>
