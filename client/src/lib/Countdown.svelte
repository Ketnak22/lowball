<script lang="ts">
  let { endsAt, label }: { endsAt: number | null; label: string } = $props();
  let now = $state(Date.now());

  $effect(() => {
    const timer = setInterval(() => (now = Date.now()), 250);
    return () => clearInterval(timer);
  });

  const seconds = $derived(endsAt === null ? null : Math.max(0, Math.ceil((endsAt - now) / 1000)));
</script>

{#if seconds !== null}
  <p class="countdown" role="timer">
    {label} <span class="hand">{seconds}</span> s
  </p>
{/if}

<style>
  .countdown {
    color: var(--ink-soft);
    text-align: center;
  }
  .hand {
    margin: 0 0.15em;
    font-size: 32px;
    color: var(--ink);
  }
</style>
