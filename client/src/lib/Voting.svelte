<script lang="ts">
  import type { Bet, ErrorCode, RoomView } from '@lowball/shared';
  import { locale, t } from './i18n';
  import { formatNumber } from './format';
  import { actions, me } from './game';
  import Waiting from './Waiting.svelte';

  let { room }: { room: RoomView } = $props();
  let stakes = $state<Record<string, number | null>>({});
  let error = $state<ErrorCode | null>(null);
  let busy = $state(false);

  const TILTS = ['-2deg', '1.5deg', '2deg', '-1deg'];

  const voted = $derived($me?.voted ?? false);
  const bets = $derived<Bet[]>(
    Object.entries(stakes)
      .filter((entry): entry is [string, number] => typeof entry[1] === 'number' && entry[1] > 0)
      .map(([playerId, amount]) => ({ playerId, amount })),
  );
  const staked = $derived(bets.reduce((sum, bet) => sum + bet.amount, 0));
  const left = $derived(($me?.tokens ?? 0) - staked);

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (voted || busy) return;
    if (bets.some((bet) => !Number.isInteger(bet.amount))) {
      error = 'betsInvalid';
      return;
    }
    if (left < 0) {
      error = 'notEnoughTokens';
      return;
    }
    busy = true;
    const response = await actions.placeBets(bets);
    busy = false;
    error = response.ok ? null : response.error;
  }
</script>

<section class="screen">
  <header class="topbar ruled">
    <span class="hand">{$t.common.round(room.round?.number ?? 0, room.totalRounds)}</span>
    <span class="hand">{$t.voting.topbar}</span>
  </header>

  <div class="intro">
    <span class="label">{room.round?.question[$locale]}</span>
    <p class="hint">{$t.voting.hint}</p>
  </div>

  <form class="stack" onsubmit={submit} novalidate>
    <ul class="cards">
      {#each room.round?.answers ?? [] as answer, index (answer.playerId)}
        <li class="paper card" style="--tilt: {TILTS[index % TILTS.length]}">
          <span class="whose"
            >{answer.playerId === $me?.id ? $t.voting.yourAnswer : $t.voting.answer}</span
          >
          <span class="value hand pen">{formatNumber(answer.value, $locale)}</span>
          <span class="label">{room.round?.unit[$locale]}</span>
          <label class="stake">
            <span class="label">{$t.voting.bet}</span>
            <input
              class="field"
              type="number"
              min="0"
              step="1"
              inputmode="numeric"
              placeholder="0"
              disabled={voted}
              bind:value={stakes[answer.playerId]}
              oninput={() => (error = null)}
              aria-label={$t.voting.betOn(formatNumber(answer.value, $locale))}
            />
          </label>
        </li>
      {/each}
    </ul>

    <div class="footer">
      <p class="balance" class:over={left < 0}>
        {$t.voting.tokensLeft} <span class="hand">{left}</span>
        <span class="muted">{$t.voting.of($me?.tokens ?? 0)}</span>
      </p>
      <div class="stack submit">
        <div class="error-slot" aria-live="polite">
          {#if error}<p class="error">{$t.errors[error]}</p>{/if}
        </div>
        <button class="btn" disabled={voted || busy}>
          {voted ? $t.voting.placed : bets.length > 0 ? $t.voting.place : $t.voting.skip}
        </button>
      </div>
    </div>
  </form>

  <Waiting
    players={room.players}
    meId={$me?.id}
    done={(player) => player.voted}
    doneLabel={$t.voting.doneLabel}
  />
</section>

<style>
  .intro {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-top: 4px;
  }
  .intro .label {
    font-size: 17px;
  }
  .cards {
    list-style: none;
    margin: 12px 0 0;
    padding: 6px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 22px 16px;
  }
  .card {
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .whose {
    font-size: 16px;
    font-weight: 600;
  }
  .value {
    font-size: 38px;
    line-height: 1.1;
    overflow-wrap: anywhere;
  }
  .stake {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    margin-top: 6px;
  }
  .stake .label {
    padding-bottom: 6px;
  }
  .stake .field {
    height: 44px;
    font-size: 32px;
    -moz-appearance: textfield;
    appearance: textfield;
  }
  .stake .field::-webkit-inner-spin-button,
  .stake .field::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  .footer {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .balance .hand {
    margin: 0 0.15em;
    font-size: 32px;
  }
  .balance.over,
  .balance.over .hand {
    color: var(--pencil);
    font-weight: 600;
  }

  @media (min-width: 900px) {
    .intro .label {
      font-size: 20px;
    }
    .cards {
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 28px 24px;
      padding: 10px;
    }
    .card {
      padding: 18px 20px;
      gap: 4px;
    }
    .whose {
      font-size: 18px;
    }
    .value {
      font-size: 52px;
      line-height: 1.05;
    }
    .footer {
      flex-direction: row;
      justify-content: space-between;
      align-items: flex-end;
    }
    .submit {
      width: 100%;
      max-width: 320px;
    }
  }
</style>
