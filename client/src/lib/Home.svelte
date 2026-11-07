<script lang="ts">
  import {
    MAX_NAME_LENGTH,
    ROOM_CODE_LENGTH,
    type Ack,
    type JoinedRoom,
    type ErrorCode,
  } from '@lowball/shared';
  import { actions, connectionLost } from './game';
  import { t } from './i18n';
  import LanguageSwitch from './LanguageSwitch.svelte';
  import { wide } from './media';

  type Step = 'start' | 'create' | 'join';

  let step = $state<Step>('start');
  let name = $state('');
  let code = $state('');
  let error = $state<ErrorCode | null>(null);
  let busy = $state(false);

  // On a phone the start screen and the form are separate steps; on a desktop both are shown.
  const showIntro = $derived($wide || step === 'start');
  const showForm = $derived($wide || step !== 'start');
  const askForCode = $derived($wide || step === 'join');

  function go(next: Step) {
    step = next;
    error = null;
  }

  async function run(request: () => Promise<Ack<JoinedRoom>>) {
    busy = true;
    error = null;
    const response = await request();
    busy = false;
    if (!response.ok) error = response.error;
  }

  const create = () => run(() => actions.createRoom(name));
  const join = () => run(() => actions.joinRoom(code, name));

  function submit(event: SubmitEvent) {
    event.preventDefault();
    if (askForCode) join();
    else create();
  }
</script>

<section class="screen" class:roomy={showIntro}>
  <div class="lang"><LanguageSwitch /></div>

  <div class="columns home">
    {#if showIntro}
      <div class="column intro">
        <h1 class="brand hand">Lowball</h1>
        <p class="pitch">{$t.home.pitch}</p>
        <p class="hint desktop-only">{$t.home.devices}</p>

        <div class="paper sample" style="--tilt: 3deg" aria-hidden="true">
          <span class="label">{$t.home.sampleQuestion}</span>
          <div class="sample-line">
            <span class="hand pen">{$t.home.sampleValue}</span>
            <span class="muted">{$t.home.sampleUnit}</span>
          </div>
        </div>

        {#if $connectionLost}
          <p class="note" role="status">{$t.home.connectionLost}</p>
        {/if}

        {#if !$wide}
          <div class="spacer"></div>
          <div class="stack">
            <button class="btn" onclick={() => go('create')}>{$t.home.create}</button>
            <button class="btn secondary" onclick={() => go('join')}>{$t.home.join}</button>
          </div>
          <p class="label center">{$t.home.noInstall}</p>
        {/if}
      </div>
    {/if}

    {#if showForm}
      <div class="column entry">
        {#if !$wide}
          <button class="text-btn back" onclick={() => go('start')}>
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 6l-6 6l6 6"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            {$t.home.back}
          </button>
          <h1 class="title">{askForCode ? $t.home.join : $t.home.create}</h1>
          <p class="hint">
            {askForCode ? $t.home.joinHint : $t.home.createHint}
          </p>
        {/if}

        <form id="entry" class="paper card" style="--tilt: {$wide ? -1 : 1.5}deg" onsubmit={submit}>
          {#if $wide}
            <h2 class="card-title">{$t.home.join}</h2>
          {/if}

          <div class="field-group">
            <label for="name" class="label">{$t.home.name}</label>
            <input
              id="name"
              class="field"
              bind:value={name}
              maxlength={MAX_NAME_LENGTH}
              autocomplete="nickname"
            />
          </div>

          {#if askForCode}
            <div class="field-group">
              <label for="code" class="label">{$t.home.code}</label>
              <input
                id="code"
                class="field code"
                bind:value={code}
                inputmode="numeric"
                autocomplete="off"
                maxlength={ROOM_CODE_LENGTH}
                aria-describedby="code-hint"
              />
              <span id="code-hint" class="label">{$t.home.codeHint}</span>
            </div>
          {/if}

          {#if $wide}
            <button class="btn" disabled={busy}>{$t.home.joinButton}</button>
            <div class="or" aria-hidden="true">{$t.home.or}</div>
            <button type="button" class="btn secondary" disabled={busy} onclick={create}>
              {$t.home.createNew}
            </button>
          {/if}
        </form>

        <div class="error-slot" aria-live="polite">
          {#if error}<p class="error">{$t.errors[error]}</p>{/if}
        </div>

        {#if !$wide}
          <div class="spacer"></div>
          <button class="btn" form="entry" disabled={busy}>
            {askForCode ? $t.home.joinButton : $t.home.createButton}
          </button>
        {/if}
      </div>
    {/if}
  </div>
</section>

<style>
  .lang {
    display: flex;
    justify-content: flex-end;
    margin: -8px -6px 0 0;
  }
  .roomy {
    padding-top: 20px;
  }
  .roomy .lang {
    margin-bottom: 4px;
  }
  .brand {
    font-size: 64px;
    line-height: 1;
  }
  .pitch {
    font-size: 19px;
  }
  .desktop-only {
    display: none;
  }
  .sample {
    margin: 36px 28px 0 44px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .sample-line {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    border-bottom: 2px solid var(--pen);
  }
  .sample-line .hand {
    font-size: 48px;
    line-height: 1.1;
  }
  .sample-line .muted {
    padding-bottom: 8px;
  }
  .back {
    align-self: flex-start;
    text-decoration: none;
  }
  .card {
    margin: 12px 2px 0;
    padding: 20px 20px 22px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .code {
    letter-spacing: 0.12em;
  }
  .or {
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--ink-soft);
    font-size: 16px;
  }
  .or::before,
  .or::after {
    content: '';
    flex-grow: 1;
    height: 1px;
    background: var(--ink-faint);
  }

  @media (min-width: 900px) {
    .roomy {
      padding-top: 24px;
    }
    .lang {
      margin: 0;
    }
    .home {
      flex-grow: 1;
      align-items: center;
    }
    .intro {
      flex-basis: 440px;
      gap: 24px;
    }
    .brand {
      font-size: 104px;
      line-height: 0.95;
    }
    .pitch {
      max-width: 32rem;
      font-size: 22px;
    }
    .desktop-only {
      display: block;
      max-width: 32rem;
      font-size: 18px;
    }
    .sample {
      max-width: 340px;
      margin: 24px 0 0 48px;
      padding: 18px 22px;
    }
    .sample-line .hand {
      font-size: 56px;
    }
    .entry {
      flex: 1 1 380px;
      max-width: 480px;
      gap: 8px;
    }
    .card {
      margin: 0;
      padding: 32px 32px 28px;
    }
    .card-title {
      font-size: 26px;
      font-weight: 600;
    }
    .field {
      height: 60px;
      font-size: 44px;
    }
  }
</style>
