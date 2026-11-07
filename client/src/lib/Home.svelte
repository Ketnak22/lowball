<script lang="ts">
  import { MAX_NAME_LENGTH, ROOM_CODE_LENGTH } from '@lowball/shared';
  import { actions, notice } from './game';

  let name = $state('');
  let code = $state('');
  let error = $state<string | null>(null);
  let busy = $state(false);

  async function run(request: () => ReturnType<typeof actions.createRoom>) {
    busy = true;
    error = null;
    const response = await request();
    busy = false;
    if (!response.ok) error = response.error;
  }

  function create(event: SubmitEvent) {
    event.preventDefault();
    run(() => actions.createRoom(name));
  }

  function join(event: SubmitEvent) {
    event.preventDefault();
    run(() => actions.joinRoom(code, name));
  }
</script>

<section class="card">
  <h1 class="title">Lowball</h1>
  <p class="subtitle">
    Guess the number, then bet on the answer you think lands closest without going over.
  </p>

  {#if $notice}
    <p class="info">{$notice}</p>
  {/if}

  <label class="field">
    <span>Your name</span>
    <input bind:value={name} maxlength={MAX_NAME_LENGTH} autocomplete="nickname" required />
  </label>

  <form onsubmit={create}>
    <button class="btn green-btn wide" disabled={busy}>Create a room</button>
  </form>

  <form class="join" onsubmit={join}>
    <input
      bind:value={code}
      placeholder="Room code"
      inputmode="numeric"
      maxlength={ROOM_CODE_LENGTH}
      aria-label="Room code"
    />
    <button class="btn green-btn" disabled={busy}>Join</button>
  </form>

  {#if error}
    <p class="error" role="alert">{error}</p>
  {/if}
</section>

<style>
  .subtitle {
    max-width: 32ch;
    margin: 0 auto 20px;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
    font-weight: 600;
  }
  form {
    width: 100%;
  }
  .wide {
    width: 100%;
  }
  .join {
    display: flex;
    gap: 10px;
    align-items: center;
  }
  .join input {
    flex: 1;
    min-width: 0;
  }
</style>
