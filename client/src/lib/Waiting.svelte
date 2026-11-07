<script lang="ts">
  import type { PlayerView } from '@lowball/shared';
  import { initials } from './format';
  import { t } from './i18n';

  let {
    players,
    meId,
    done,
    doneLabel,
  }: {
    players: PlayerView[];
    meId: string | undefined;
    done: (player: PlayerView) => boolean;
    doneLabel: string;
  } = $props();

  const waiting = $derived(
    players.filter((p) => !done(p)).map((p) => (p.id === meId ? $t.waiting.you : p.name)),
  );
  const description = $derived(
    players.map((p) => `${p.name}: ${done(p) ? doneLabel : $t.waiting.stillThinking}`).join(', '),
  );
</script>

<div class="waiting">
  <div class="avatars" role="img" aria-label={description}>
    {#each players as player (player.id)}
      <span class="avatar" class:pending={!done(player)}>{initials(player.name)}</span>
    {/each}
  </div>
  <p class="label" aria-live="polite">
    {waiting.length > 0 ? $t.waiting.waitingFor(waiting) : $t.waiting.everyoneDone}
  </p>
</div>

<style>
  .waiting {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    margin-top: 4px;
    text-align: center;
  }
  .avatars {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px;
  }
</style>
