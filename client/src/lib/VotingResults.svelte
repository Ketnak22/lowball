<script lang="ts">
    import { onMount } from "svelte";

    import { socket } from "../socketStore";
    import { gameState, users } from "../usersStore";
    import type { Question, UserAnswer, Response } from "../interfaces";

    import { userAnswers } from "../ userAnswersStore";


    let correctAnswer: number;
    let closestAnswer: number | null;
    let tokens: number = 0;
    let allUsersTokens: number[] = [];
    let unit = "";

    let loading = true;

    onMount(() => {
        $socket.emit("get-voting-results", (r_correctAnswer: number, r_closestAnswer: number, r_unit: string, r_tokens: number, r_allUsersTokens: number[]) => {
            correctAnswer = r_correctAnswer;
            closestAnswer = r_closestAnswer;
            unit = r_unit;
            tokens = r_tokens;
            allUsersTokens = r_allUsersTokens;
            loading = false;
        });
    });

    $socket.on("show-ranking", () => {
        $gameState = "showingRanking";
    });
</script>

<div class="voting-results-card">
    {#if loading}
        <div class="loader">Loading...</div>
    {:else}
        <h2 class="results-title">Voting Results</h2>
        <div class="answer-section">
            <div class="answer-info">
                <span class="label">Correct Answer:</span>
                <span class="value">{correctAnswer} {unit}</span>
                <span class="badge correct">✔</span>
            </div>
        </div>
        <ul class="answers-list">
            {#each $userAnswers as userAnswer}
                <li class="answer-item{userAnswer.answer === correctAnswer ? ' correct-answer' : ''}{userAnswer.answer === closestAnswer ? ' closest-answer' : ''}">
                    <span class="answer-value">{userAnswer.answer} {unit}</span>
                    {#if userAnswer.answer === correctAnswer}
                        <span class="badge correct">Correct</span>
                    {/if}
                    {#if userAnswer.answer === closestAnswer && userAnswer.answer !== correctAnswer}
                        <span class="badge closest">Closest</span>
                    {/if}
                </li>
            {/each}
        </ul>
        <div class="tokens-section">
            <span class="tokens-label">Current tokens:</span>
            <span class="tokens-value">{tokens}</span>
        </div>
    {/if}
</div>

<style>
    .voting-results-card {
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
    .results-title {
        font-size: 2.1rem;
        font-weight: 700;
        margin-bottom: 18px;
        color: #4b3869;
        letter-spacing: 1px;
        text-shadow: 0 2px 8px rgba(120, 80, 180, 0.08);
    }
    .answer-section {
        width: 100%;
        margin-bottom: 18px;
        display: flex;
        justify-content: center;
    }
    .answer-info {
        background: #fff;
        border-radius: 0.7em;
        padding: 12px 22px;
        box-shadow: 0 2px 8px rgba(120, 80, 180, 0.07);
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 1.1rem;
    }
    .label {
        font-weight: 600;
        color: #6c47a6;
    }
    .value {
        font-weight: 500;
        color: #333;
    }
    .answers-list {
        list-style: none;
        padding: 0;
        margin: 0 0 18px 0;
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 10px;
    }
    .answer-item {
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
    }
    .answer-item:hover {
        box-shadow: 0 4px 16px rgba(120, 80, 180, 0.13);
        transform: scale(1.03);
    }
    .correct-answer {
        background: #4caf50 !important;
        color: #fff;
        border: none;
    }
    .closest-answer:not(.correct-answer) {
        background: #ff9800 !important;
        color: #fff;
        border: none;
    }
    .badge {
        display: inline-block;
        padding: 2px 10px;
        border-radius: 1em;
        font-size: 0.95em;
        font-weight: 600;
        margin-left: 8px;
        letter-spacing: 0.5px;
        box-shadow: 0 1px 4px rgba(120, 80, 180, 0.08);
    }
    .badge.correct {
        background: #4caf50;
        color: #fff;
    }
    .badge.closest {
        background: #ff9800;
        color: #fff;
    }
    .tokens-section {
        margin-top: 18px;
        background: #fff;
        border-radius: 0.7em;
        padding: 10px 22px;
        box-shadow: 0 2px 8px rgba(120, 80, 180, 0.07);
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 1.1rem;
        font-weight: 600;
        color: #6c47a6;
    }
    .tokens-label {
        color: #6c47a6;
    }
    .tokens-value {
        color: #4b3869;
        font-weight: 700;
        font-size: 1.2em;
    }
    .loader {
        font-size: 1.2em;
        color: #6c47a6;
        padding: 30px 0;
        text-align: center;
    }
</style>