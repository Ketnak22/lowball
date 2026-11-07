<script lang="ts">
  import type { ErrorCode, RoomView } from '@lowball/shared';
  import { t } from './i18n';
  import Countdown from './Countdown.svelte';
  import { initials, signed } from './format';
  import { actions, me } from './game';

  let { room }: { room: RoomView } = $props();
  let error = $state<ErrorCode | null>(null);

  const finished = $derived(room.phase === 'finished');
  const isHost = $derived($me?.id === room.hostId);
  const changes = $derived(room.round?.result?.tokenChanges ?? {});

  /** Sorted by tokens; players with equal tokens share a place. */
  const rows = $derived.by(() => {
    const sorted = [...room.players].sort(
      (a, b) => b.tokens - a.tokens || Number(b.id === $me?.id) - Number(a.id === $me?.id),
    );
    let place = 0;
    return sorted.map((player, index) => {
      if (index === 0 || player.tokens !== sorted[index - 1]?.tokens) place = index + 1;
      return { player, place, isMe: player.id === $me?.id };
    });
  });

  const leaders = $derived(rows.filter((row) => row.place === 1));
  const long = $derived(rows.length > 5);

  const heading = $derived.by(() => {
    const [first] = leaders;
    if (!first) return '';
    if (leaders.length > 1) return finished ? $t.ranking.tieFinal : $t.ranking.tieLead;
    if (first.isMe) return finished ? $t.ranking.youWin : $t.ranking.youLead;
    return finished ? $t.ranking.wins(first.player.name) : $t.ranking.leads(first.player.name);
  });

  const caption = $derived.by(() => {
    if (finished) return $t.ranking.summary(room.totalRounds, room.players.length);
    return $t.ranking.left(room.totalRounds - (room.round?.number ?? 0));
  });

  async function playAgain() {
    const response = await actions.restart();
    error = response.ok ? null : response.error;
  }
</script>

<section class="screen">
  <header class="topbar ruled">
    <span class="hand">
      {finished
        ? $t.ranking.topbarOver
        : $t.ranking.topbarAfter(room.round?.number ?? 0, room.totalRounds)}
    </span>
    <span class="hand">{$t.ranking.topbar}</span>
  </header>

  <div class="layout">
    <h1 class="title heading">{heading}</h1>

    <div class="paper sheet" style="--tilt: 1deg">
      <ol class="rows" class:long aria-label={$t.ranking.list}>
        {#each rows as { player, place, isMe } (player.id)}
          <li class:me={isMe}>
            <span class="hand place">{place}</span>
            <span class="avatar" aria-hidden="true">{initials(player.name)}</span>
            <span class="name" class:strong={isMe || (finished && place === 1)}>
              {isMe ? $t.common.you : player.name}
              {#if finished && place === 1}<span class="underline" aria-hidden="true"></span>{/if}
            </span>
            {#if !finished && changes[player.id]}
              <span class="label">{signed(changes[player.id] ?? 0)}</span>
            {/if}
            <span class="hand pen tokens">{player.tokens}</span>
          </li>
        {/each}
      </ol>
    </div>

    <p class="hint caption">
      {caption}
      {#if long}{$t.ranking.sticky}{/if}
    </p>

    <div class="stack actions">
      {#if finished}
        {#if isHost}
          <button class="btn" onclick={playAgain}>{$t.ranking.playAgain}</button>
        {:else}
          <p class="note">{$t.ranking.hostNote}</p>
        {/if}
        <button class="btn secondary" onclick={actions.leave}>{$t.ranking.leave}</button>
        <div class="error-slot" aria-live="polite">
          {#if error}<p class="error">{$t.errors[error]}</p>{/if}
        </div>
      {:else}
        <Countdown endsAt={room.phaseEndsAt} label={$t.ranking.next} />
      {/if}
    </div>
  </div>
</section>

<style>
  .layout {
    flex-grow: 1;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto auto auto 1fr;
    grid-template-areas: 'heading' 'sheet' 'caption' 'actions';
    gap: 16px;
  }
  .heading {
    grid-area: heading;
    margin-top: 8px;
  }
  .sheet {
    grid-area: sheet;
    margin: 8px 2px 0;
    padding: 8px 18px;
  }
  .caption {
    grid-area: caption;
    font-size: 16px;
  }
  .actions {
    grid-area: actions;
    align-self: end;
  }
  .rows {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
  }
  .rows.long {
    max-height: 50dvh;
    overflow-y: auto;
  }
  .rows li {
    min-height: 60px;
    display: flex;
    align-items: center;
    gap: 12px;
    border-bottom: 1px solid var(--grid);
    background: var(--paper);
  }
  .rows li:last-child {
    border-bottom: none;
  }
  .rows.long li.me {
    position: sticky;
    top: 0;
    bottom: 0;
    z-index: 1;
    box-shadow:
      0 -1.5px 0 var(--ink),
      0 1.5px 0 var(--ink);
  }
  .place {
    width: 22px;
    font-size: 32px;
    line-height: 1;
  }
  .name {
    position: relative;
    flex-grow: 1;
    min-width: 0;
    font-size: 18px;
  }
  .strong {
    font-weight: 600;
  }
  .underline {
    position: absolute;
    left: -4px;
    bottom: -4px;
    width: 72px;
    height: 3px;
    border-radius: 2px;
    background: var(--pencil);
    transform: rotate(-2deg);
  }
  .tokens {
    min-width: 48px;
    text-align: right;
    font-size: 32px;
    line-height: 1;
  }

  @media (min-width: 900px) {
    .layout {
      flex-grow: 0;
      grid-template-columns: minmax(0, 1fr) minmax(0, 560px);
      grid-template-rows: auto auto 1fr;
      grid-template-areas: 'heading sheet' 'caption sheet' 'actions sheet';
      gap: 16px 72px;
    }
    .heading {
      margin-top: 0;
    }
    .sheet {
      align-self: start;
      margin: 0;
      padding: 12px 28px;
    }
    .caption {
      font-size: 20px;
    }
    .actions {
      align-self: start;
      max-width: 360px;
      margin-top: 24px;
    }
    .actions :global(.countdown) {
      text-align: left;
    }
    .rows.long {
      max-height: 456px;
    }
    .rows li {
      min-height: 72px;
      gap: 16px;
    }
    .place {
      width: 28px;
      font-size: 40px;
    }
    .name {
      font-size: 22px;
    }
    .underline {
      bottom: -6px;
      width: 84px;
    }
    .tokens {
      min-width: 56px;
      font-size: 40px;
    }
  }
</style>
