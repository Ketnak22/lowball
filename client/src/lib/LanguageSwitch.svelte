<script lang="ts">
  import { languages, locale, t } from './i18n';
</script>

<div class="switch" role="group" aria-label={$t.language}>
  {#each languages as { code, name }, index (code)}
    {#if index > 0}<span class="divider" aria-hidden="true"></span>{/if}
    <button
      type="button"
      class="hand"
      lang={code}
      aria-label={name}
      aria-pressed={$locale === code}
      onclick={() => locale.set(code)}
    >
      {code}
    </button>
  {/each}
</div>

<style>
  .switch {
    display: inline-flex;
    align-items: center;
  }
  button {
    min-width: 44px;
    min-height: 44px;
    padding: 0 6px;
    border: none;
    background: none;
    color: var(--ink-soft);
    font-size: 24px;
    line-height: 1;
    text-transform: uppercase;
    cursor: pointer;
  }
  .divider {
    width: 1.5px;
    height: 22px;
    background: var(--ink-faint);
  }
  button[aria-pressed='true'] {
    color: var(--pen);
    text-decoration: underline;
    text-decoration-thickness: 2px;
    text-underline-offset: 4px;
  }
  button:hover {
    color: var(--ink);
  }
  button:focus-visible {
    outline: 3px solid var(--pen);
    outline-offset: 2px;
  }
</style>
