<script lang="ts">
    import { socket } from "../socketStore";
    import { gameState } from "../usersStore";
    import type { Response } from "../interfaces";

    let answer = "";
    let waiting = false;

    let currentQuestion: string | null;
    $socket.emit("get-question", (question: string) => {
        currentQuestion = question;
    })

    $socket.on("all-users-answered", () => {
        waiting = false;
        gameState.set("voting");
    })

    function onAnswer() {
        if (isNaN(Number(answer)) || String(answer).trim() === "" || Number(answer) < 0) {
            alert("Please enter an answer");
            return;
        }
        $socket.emit("send-answer", answer, (response: Response) => {
            if (response.success) {
                waiting = true
            } else {
                alert(`Error sending answer\nReason: ${response.message}`);
            }
        })
    }
</script>

<div class="question-card">
    {#if currentQuestion !== null}
        {#if waiting}
            <div class="waiting-section">
                <span class="loader"></span>
                <p class="waiting-text">Waiting for other players...</p>
            </div>
        {:else}
            <div class="question-section">
                <h2 class="question-title">Question</h2>
                <p class="question-text">{currentQuestion}</p>
                <input bind:value={answer} type="text" name="answer" id="answer" class="answer-input" placeholder="Enter your answer...">
                <button on:click={onAnswer} class="btn answer-btn">Answer!</button>
            </div>
        {/if}
    {/if}
</div>

<style>
    .question-card {
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
    .question-title {
        font-size: 2rem;
        font-weight: 700;
        margin-bottom: 12px;
        color: #4b3869;
        letter-spacing: 1px;
        text-shadow: 0 2px 8px rgba(120, 80, 180, 0.08);
    }
    .question-text {
        color: #333;
        margin: 10px 0 18px 0;
        padding: 15px 20px;
        background-color: #fff;
        border: 1px solid #e0d7f3;
        border-radius: 0.5em;
        box-shadow: 0 2px 4px rgba(120, 80, 180, 0.07);
        font-size: 1.15rem;
        text-align: center;
        font-weight: 500;
    }
    .answer-input {
        width: 220px;
        padding: 12px;
        font-size: 1.08rem;
        border: 1px solid #ccc;
        border-radius: 0.5em;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        margin-bottom: 16px;
        transition: border-color 0.3s, box-shadow 0.3s;
        text-align: center;
    }
    .answer-input:focus {
        border-color: #6c47a6;
        box-shadow: 0 4px 8px rgba(108, 71, 166, 0.18);
        outline: none;
    }
    .answer-btn {
        background: #4caf50;
        color: #fff;
        border: none;
        border-radius: 0.5em;
        padding: 12px 28px;
        font-size: 1.1rem;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(76, 175, 80, 0.13);
        transition: background 0.2s, transform 0.2s;
    }
    .answer-btn:hover {
        background: #388e3c;
        transform: scale(1.04);
    }
    .waiting-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        min-height: 120px;
    }
    .waiting-text {
        color: #4b3869;
        font-size: 1.15rem;
        font-weight: 600;
        margin-top: 18px;
        background: none;
        border: none;
        box-shadow: none;
        padding: 0;
    }
    .loader {
        border: 4px solid #f3f3f3;
        border-top: 4px solid #6c47a6;
        border-radius: 50%;
        width: 36px;
        height: 36px;
        animation: spin 1s linear infinite;
        margin-bottom: 10px;
    }
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
</style>