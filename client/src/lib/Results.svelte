<script lang="ts">
  import { payoutMultiplier, type AnswerView, type RoomView } from '@lowball/shared';
  import Countdown from './Countdown.svelte';
  import { formatNumber, signed } from './format';
  import { me } from './game';

  let { room }: { room: RoomView } = $props();

  const TILTS = ['-2deg', '1.5deg', '2deg', '-1deg'];

  const result = $derived(room.round?.result ?? null);
  const unit = $derived(room.round?.unit ?? '');
  const myChange = $derived(($me && result?.tokenChanges[$me.id]) ?? 0);

  function nameOf(playerId: string): string {
    if (playerId === $me?.id) return 'You';
    return room.players.find((p) => p.id === playerId)?.name ?? 'Left the game';
  }

  function payout(answer: AnswerView): { text: string; win: boolean } {
    if (!result) return { text: '', win: false };
    const multiplier = payoutMultiplier(answer.value, result.correctAnswer, result.closestAnswer);
    if (multiplier === 2) return { text: 'exact! 2x', win: true };
    if (multiplier === 1.5) return { text: 'closest! 1.5x', win: true };
    if (multiplier === 1) return { text: 'within 25%: 1x', win: false };
    return {
      text: answer.value > result.correctAnswer ? 'too high: lost' : 'too low: lost',
      win: false,
    };
  }

  const summary = $derived.by(() => {
    if (!result) return '';
    if (result.closestAnswer === null) return 'Every answer went over, so every bet was lost.';
    const closest = (room.round?.answers ?? []).filter((a) => a.value === result.closestAnswer);
    const names = closest.map((a) => nameOf(a.playerId)).join(', ');
    const off = result.correctAnswer - result.closestAnswer;
    return off === 0
      ? `${names} got it exactly right.`
      : `Closest without going over: ${names}, ${formatNumber(off)} ${unit} short.`;
  });
</script>

<section class="screen">
  <header class="topbar ruled">
    <span class="hand">round {room.round?.number} / {room.totalRounds}</span>
    <span class="hand">results</span>
  </header>

  {#if result}
    <div class="reveal">
      <div class="correct">
        <span class="label question">{room.round?.question}</span>
        <span class="label">Correct answer</span>
        <div class="correct-line">
          <span class="hand big">{formatNumber(result.correctAnswer)}</span>
          <span class="muted unit">{unit}</span>
        </div>
      </div>
      <div class="stack summary">
        <p class="hint">{summary}</p>
        <p class="hint">
          Your bets: <strong>{signed(myChange)}</strong>. You have {$me?.tokens} tokens.
        </p>
      </div>
    </div>

    <ul class="cards">
      {#each room.round?.answers ?? [] as answer, index (answer.playerId)}
        {@const label = payout(answer)}
        <li
          class="paper card"
          class:circled={answer.value === result.closestAnswer}
          style="--tilt: {TILTS[index % TILTS.length]}; animation-delay: {index * 120}ms"
        >
          <span class="name">{nameOf(answer.playerId)}</span>
          <span class="hand pen value">{formatNumber(answer.value)}</span>
          <span class="label">
            off by {formatNumber(Math.abs(answer.value - result.correctAnswer))}
            {unit}
          </span>
          <span class="hand payout" class:win={label.win}>{label.text}</span>
        </li>
      {/each}
    </ul>
  {/if}

  <div class="spacer"></div>
  <Countdown endsAt={room.phaseEndsAt} label="Ranking in" />
</section>

<style>
  .reveal {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 4px;
  }
  .correct {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .question {
    font-size: 17px;
    margin-bottom: 8px;
  }
  .correct-line {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }
  .big {
    margin-right: 0.1em;
    font-size: 72px;
    line-height: 1;
    overflow-wrap: anywhere;
  }
  .unit {
    font-size: 20px;
  }
  .summary {
    gap: 4px;
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
    animation: reveal 300ms ease-out both;
  }
  .card.circled::after {
    content: '';
    position: absolute;
    inset: -10px;
    border: 2.5px solid var(--pencil);
    border-radius: 48% 52% 46% 54%;
    transform: rotate(-3deg);
    pointer-events: none;
  }
  .name {
    font-size: 16px;
    font-weight: 600;
  }
  .value {
    font-size: 38px;
    line-height: 1.1;
    overflow-wrap: anywhere;
  }
  .card .label {
    font-size: 15px;
  }
  .payout {
    font-size: 24px;
    line-height: 1.1;
    color: var(--ink-soft);
  }
  .payout.win {
    color: var(--pencil);
  }

  @keyframes reveal {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }

  @media (min-width: 900px) {
    .reveal {
      flex-direction: row;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: flex-end;
      gap: 24px 48px;
      margin-top: 0;
    }
    .question {
      font-size: 20px;
      margin-bottom: 10px;
    }
    .big {
      font-size: 120px;
      line-height: 0.9;
    }
    .unit {
      font-size: 26px;
    }
    .summary {
      max-width: 22rem;
    }
    .summary .hint {
      font-size: 18px;
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
    .card.circled::after {
      inset: -12px;
    }
    .name {
      font-size: 18px;
    }
    .value {
      font-size: 52px;
      line-height: 1.05;
    }
    .card .label {
      font-size: 16px;
    }
    .payout {
      font-size: 28px;
    }
  }
</style>
