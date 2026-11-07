<script lang="ts">
  import { MAX_NAME_LENGTH, ROOM_CODE_LENGTH, type Ack, type JoinedRoom } from '@lowball/shared';
  import { actions, notice } from './game';
  import { wide } from './media';

  type Step = 'start' | 'create' | 'join';

  let step = $state<Step>('start');
  let name = $state('');
  let code = $state('');
  let error = $state<string | null>(null);
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
  <div class="columns home">
    {#if showIntro}
      <div class="column intro">
        <h1 class="brand hand">Lowball</h1>
        <p class="pitch">
          Everyone writes a number on their own card. Then you bet tokens on the answer you think is
          closest without going over.
        </p>
        <p class="hint desktop-only">Each player uses their own phone or computer.</p>

        <div class="paper sample" style="--tilt: 3deg" aria-hidden="true">
          <span class="label">How long is the Earth's equator?</span>
          <div class="sample-line">
            <span class="hand pen">40 075</span>
            <span class="muted">km</span>
          </div>
        </div>

        {#if $notice}
          <p class="note" role="status">{$notice}</p>
        {/if}

        {#if !$wide}
          <div class="spacer"></div>
          <div class="stack">
            <button class="btn" onclick={() => go('create')}>Create a room</button>
            <button class="btn secondary" onclick={() => go('join')}>Join a room</button>
          </div>
          <p class="label center">Runs in the browser, nothing to install.</p>
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
            Back
          </button>
          <h1 class="title">{askForCode ? 'Join a room' : 'Create a room'}</h1>
          <p class="hint">
            {askForCode
              ? 'The code is on the screen of the person who created the room.'
              : 'You will get a code to share with the other players.'}
          </p>
        {/if}

        <form id="entry" class="paper card" style="--tilt: {$wide ? -1 : 1.5}deg" onsubmit={submit}>
          {#if $wide}
            <h2 class="card-title">Join a room</h2>
          {/if}

          <div class="field-group">
            <label for="name" class="label">Your name</label>
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
              <label for="code" class="label">Room code</label>
              <input
                id="code"
                class="field code"
                bind:value={code}
                inputmode="numeric"
                autocomplete="off"
                maxlength={ROOM_CODE_LENGTH}
                aria-describedby="code-hint"
              />
              <span id="code-hint" class="label">
                {ROOM_CODE_LENGTH} digits, shown to whoever created the room.
              </span>
            </div>
          {/if}

          {#if $wide}
            <button class="btn" disabled={busy}>Join</button>
            <div class="or" aria-hidden="true">or</div>
            <button type="button" class="btn secondary" disabled={busy} onclick={create}>
              Create a new room
            </button>
          {/if}
        </form>

        <div class="error-slot" aria-live="polite">
          {#if error}<p class="error">{error}</p>{/if}
        </div>

        {#if !$wide}
          <div class="spacer"></div>
          <button class="btn" form="entry" disabled={busy}>
            {askForCode ? 'Join' : 'Create'}
          </button>
        {/if}
      </div>
    {/if}
  </div>
</section>

<style>
  .roomy {
    padding-top: 56px;
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
      padding-top: 64px;
      justify-content: center;
    }
    .home {
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
