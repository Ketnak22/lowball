<script lang="ts">
    import { onMount } from "svelte";
    import { socket } from "../socketStore";
    import { users, gameState } from "../usersStore";
    import type { User, Response } from "../interfaces";
  import { anwsers } from "../anwsersStore";

    interface RankingUser {
        username: string;
        tokens: number;
    }

    let playerRankings = $state<RankingUser[]>([]);
    let loading = $state(true);
    let endOfGame = $state(false);

    onMount(() => {
        $socket.emit("get-player-rankings", (rankings: RankingUser[]) => {
            playerRankings = rankings;
            loading = false;
        });
    });

    $socket.on("next-question", () => {
        $gameState = "answering";
    });

    $socket.on("end-of-game", () => {
        endOfGame = true;
    });

    // function startNewGame() {
    //     anwsers.set([]);
    //     users.update((u) => u.map(user => ({ ...user, ready: false })));
    //     $socket.emit("start-new-game", (successfull: Response) => {
    //         if (successfull.success) {
    //             $gameState = "waiting";
    //         } else {
    //             alert("Error starting new game");
    //         }
    //     });
    // }


    function exit() {
        window.location.reload();
    }
</script>

<div class="player-ranking-card">
    {#if loading}
        <div class="loader">Loading...</div>
    {:else}
        <h2 class="ranking-title">{endOfGame ? "Final Rankings" : "Player Rankings"}</h2>
        <ul class="ranking-list">
            {#each playerRankings as user, index}
                <li class="ranking-item{index === 0 ? ' first-place' : ''}{index === 1 ? ' second-place' : ''}{index === 2 ? ' third-place' : ''}">
                    <span class="rank">{index + 1}.</span>
                    <span class="username">{user.username}</span>
                    <span class="tokens">Tokens: {user.tokens}</span>
                    {#if index === 0}
                        <span class="badge gold">🥇</span>
                    {:else if index === 1}
                        <span class="badge silver">🥈</span>
                    {:else if index === 2}
                        <span class="badge bronze">🥉</span>
                    {/if}
                </li>
            {/each}
        </ul>
        {#if endOfGame}
            <!-- <button onclick={startNewGame} class="btn green-btn new-game-btn">Start New Game</button> -->
            <button onclick={exit} class="btn green-btn back-btn">Exit</button>
        {/if}
    {/if}
</div>

<style>
    .player-ranking-card {
        background: linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%);
        border-radius: 1.2em;
        box-shadow: 0 6px 24px rgba(80, 80, 120, 0.18);
        padding: 36px 48px 32px 48px;
        max-width: 420px;
        margin: 40px auto;
        display: flex;
        flex-direction: column;
        align-items: center;
        color: #222;
        position: relative;
    }
    .ranking-title {
        font-size: 2.1rem;
        font-weight: 700;
        margin-bottom: 18px;
        color: #4b3869;
        letter-spacing: 1px;
        text-shadow: 0 2px 8px rgba(120, 80, 180, 0.08);
    }
    .ranking-list {
        list-style: none;
        padding: 0;
        margin: 0 0 18px 0;
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 10px;
    }
    .ranking-item {
        background: #f9f9f9;
        border: 1px solid #e0d7f3;
        border-radius: 0.6em;
        padding: 13px 18px;
        font-size: 1.08rem;
        color: #333;
        display: flex;
        align-items: center;
        gap: 12px;
        transition: box-shadow 0.2s, transform 0.2s;
        box-shadow: 0 1px 4px rgba(120, 80, 180, 0.06);
        position: relative;
    }
    .ranking-item:hover {
        box-shadow: 0 4px 16px rgba(120, 80, 180, 0.13);
        transform: scale(1.03);
    }
    .first-place {
        background: #ffe082 !important;
        color: #4b3869;
        border: none;
    }
    .second-place {
        background: #e0e0e0 !important;
        color: #4b3869;
        border: none;
    }
    .third-place {
        background: #ffccbc !important;
        color: #4b3869;
        border: none;
    }
    .rank {
        font-weight: bold;
        font-size: 1.1em;
        width: 2em;
        text-align: right;
    }
    .username {
        flex-grow: 1;
        margin-left: 10px;
        font-weight: 600;
        color: #6c47a6;
    }
    .tokens {
        color: #4b3869;
        font-weight: 500;
        margin-right: 8px;
    }
    .badge {
        display: inline-block;
        padding: 2px 10px;
        border-radius: 1em;
        font-size: 1.1em;
        font-weight: 700;
        margin-left: 8px;
        letter-spacing: 0.5px;
        box-shadow: 0 1px 4px rgba(120, 80, 180, 0.08);
    }
    .badge.gold {
        background: #ffd700;
        color: #4b3869;
    }
    .badge.silver {
        background: #c0c0c0;
        color: #4b3869;
    }
    .badge.bronze {
        background: #cd7f32;
        color: #fff;
    }
    .loader {
        font-size: 1.2em;
        color: #6c47a6;
        padding: 30px 0;
        text-align: center;
    }
</style>