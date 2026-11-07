<script lang="ts">
    import { socket } from "../socketStore";
    import { gameState, users } from "../usersStore";
    import { currentRoom } from "../roomStore";
    import type { Question, UserAnswer, Response } from "../interfaces";
    import { userAnswers } from "../ userAnswersStore";

    interface VotedAnswer {
        id: string;
        tokens: number;
    }

    let waiting = $state(false);

    let tokens = $state(0);
    let startingTokens: number;
    // svelte-ignore non_reactive_update
        let unit = "";
    // let anwsers = $state<UserAnswer[]>([]);
    let votedAnswers = $state<VotedAnswer[]>([]);
    $socket.emit("start-voting", (response: Response, r_anwsers: UserAnswer[], r_unit: string, r_tokens: number) => {
        if (!response.success) {
            alert(`Failed to start voting!\nReason: ${response.message}`);
            return;
        }

        if (r_tokens === -1) {
            alert("Something went wrong, please try again");
            return;
        }
        startingTokens = r_tokens;
        unit = r_unit;
        tokens = startingTokens;
        $userAnswers = r_anwsers.sort((a, b) => a.answer - b.answer); // Sort answers by value 
    });

    $socket.on("all-users-voted", () => {
        gameState.set("showingResults");
        waiting = false;
    })

    function hasUserAlreadyVotedForAnswer(answerId: string): boolean {
        return votedAnswers.some((votedAnswer) => votedAnswer.id === answerId);
    }

    function selectVote(answer: UserAnswer) {
        if (tokens <= 0) {
            alert("You have no tokens left");
            return;
        }

        if (hasUserAlreadyVotedForAnswer(answer.id)) {
            alert("You have already voted for this answer");
            return;
        }

        const bet = prompt(`You have ${tokens} tokens left. How much do you want to bet for ${answer.answer} ${unit}?`);
        if (isNaN(Number(bet)) || bet === null || bet === "") {
            return;
        }
        const betValue = Number(bet);

        if (betValue <= 0) {
            alert("You must bet a positive amount of tokens");
            return;
        }
        if (betValue > tokens) {
            alert("You don't have enough tokens!");
            return;
        }

        votedAnswers.push({ id: answer.id, tokens: betValue });
       
        tokens -= betValue;

        console.log(votedAnswers);
        console.log("Tokens left: ", tokens);
    }

    function clearVotes() {
        votedAnswers = [];
        tokens = startingTokens;

        console.log("Cleared votes, tokens: ", tokens);
    }

    function confirmVotes() {
        if (votedAnswers.length === 0) {
            alert("You have not voted for any answer");
        }

        $socket.emit("confirm-votes", votedAnswers, tokens, (response: Response) => {
            if (response.success) {
                votedAnswers = [];
                tokens = startingTokens;
                waiting = true;
            } else {
                alert(response.message);
            }
        });
    }
</script>

<div class="voting-card">
    {#if $userAnswers.length === 0}
        <div class="no-answers-section">
            <p class="info-text">No answers received yet.</p>
        </div>
    {:else}
        {#if !waiting}
            <h2 class="voting-title">Vote for the Best Answer</h2>
            <ul class="answers-list">
                {#each $userAnswers as userAnswer}
                    {#each [hasUserAlreadyVotedForAnswer(userAnswer.id)] as alreadyVoted}
                        <li class="answer-item{alreadyVoted ? ' voted' : ' not-voted'}">
                            <button class="vote-btn" onclick={() => selectVote(userAnswer)} disabled={alreadyVoted}>
                                {userAnswer.answer} {unit}
                            </button>
                        </li>
                    {/each}
                {/each}
            </ul>
            <div class="voting-actions">
                <button onclick={clearVotes} class="btn clear-btn">Clear</button>
                <button onclick={confirmVotes} class="btn confirm-btn">Confirm</button>
            </div>
            <div class="tokens-section">
                <span class="tokens-label">Tokens left:</span>
                <span class="tokens-value">{tokens}</span>
            </div>
        {:else}
            <div class="waiting-section">
                <span class="loader"></span>
                <p class="waiting-text">Waiting for other players to vote...</p>
            </div>
        {/if}
    {/if}
</div>

<style>
    .voting-card {
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
    .voting-title {
        font-size: 2rem;
        font-weight: 700;
        margin-bottom: 18px;
        color: #4b3869;
        letter-spacing: 1px;
        text-shadow: 0 2px 8px rgba(120, 80, 180, 0.08);
    }
    .info-text {
        color: #4b3869;
        font-size: 1.1rem;
        font-weight: 600;
        background: #fff;
        border-radius: 0.5em;
        padding: 15px 20px;
        border: 1px solid #e0d7f3;
        box-shadow: 0 2px 4px rgba(120, 80, 180, 0.07);
        text-align: center;
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
        margin: 0;
        padding: 0;
        background: none;
        border: none;
        box-shadow: none;
    }
    .vote-btn {
        width: 100%;
        color: #333;
        background: #f9f9f9;
        border: 1px solid #e0d7f3;
        border-radius: 0.6em;
        padding: 13px 18px;
        font-size: 1.08rem;
        font-weight: 600;
        text-align: center;
        box-shadow: 0 1px 4px rgba(120, 80, 180, 0.06);
        transition: box-shadow 0.2s, transform 0.2s, background 0.2s;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
    }
    .vote-btn:disabled {
        background: #ff9800;
        color: #fff;
        border: 1px solid #ff9800;
        cursor: not-allowed;
    }
    .vote-btn:not(:disabled):hover {
        box-shadow: 0 4px 16px rgba(120, 80, 180, 0.13);
        transform: scale(1.03);
        background: #e1bee7;
        border-color: #e1bee7;
    }
    .badge {
        background: #ff9800;
        color: #fff;
        border-radius: 1em;
        padding: 2px 10px;
        font-size: 0.95em;
        font-weight: 600;
        margin-left: 8px;
        letter-spacing: 0.5px;
        box-shadow: 0 1px 4px rgba(120, 80, 180, 0.08);
    }
    .voting-actions {
        display: flex;
        gap: 16px;
        margin-bottom: 12px;
    }
    .btn {
        border: none;
        border-radius: 0.5em;
        padding: 12px 28px;
        font-size: 1.1rem;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(76, 175, 80, 0.13);
        transition: background 0.2s, transform 0.2s;
    }
    .clear-btn {
        background: #e57373;
        color: #fff;
    }
    .clear-btn:hover {
        background: #c62828;
        transform: scale(1.04);
    }
    .confirm-btn {
        background: #4caf50;
        color: #fff;
    }
    .confirm-btn:hover {
        background: #388e3c;
        transform: scale(1.04);
    }
    .tokens-section {
        margin-top: 8px;
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