<script lang="ts">
  import { connectionLost } from './game';
  import { t } from './i18n';
  import { socket } from './socket';
</script>

<section class="screen">
  <div class="spacer"></div>

  <div class="paper card" role="status" style="--tilt: -2deg">
    <div class="dots" aria-hidden="true">
      <span></span><span></span><span></span>
    </div>
    <span class="hand heading">{$t.connection.heading}</span>
    <p class="hint">{$connectionLost ? $t.connection.lost : $t.connection.trying}</p>
  </div>

  <div class="spacer"></div>

  <button class="btn secondary" onclick={() => socket.connect()}>{$t.connection.retry}</button>
</section>

<style>
  .card {
    margin: 0 10px;
    padding: 28px 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    text-align: center;
  }
  .heading {
    font-size: 40px;
    line-height: 1.1;
  }
  .dots {
    display: flex;
    gap: 10px;
  }
  .dots span {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--ink);
    animation: pulse 1.2s ease-in-out infinite;
  }
  .dots span:nth-child(2) {
    animation-delay: 0.2s;
  }
  .dots span:nth-child(3) {
    animation-delay: 0.4s;
  }
  @keyframes pulse {
    0%,
    100% {
      opacity: 0.25;
    }
    50% {
      opacity: 1;
    }
  }

  @media (min-width: 900px) {
    .screen {
      justify-content: center;
      align-items: center;
    }
    .card {
      width: 100%;
      max-width: 520px;
    }
    .btn {
      max-width: 320px;
    }
  }
</style>
