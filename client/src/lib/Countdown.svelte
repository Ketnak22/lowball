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
  <p class="countdown">{label} {seconds}s</p>
{/if}

<style>
  .countdown {
    margin-top: 16px;
    font-weight: 600;
    color: #4b3869;
  }
</style>
