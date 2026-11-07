<script lang="ts">
    import { socket } from "../socketStore";
    import { users, gameState } from "../usersStore";
    import { currentRoom } from "../roomStore";
    import type { Response } from "../interfaces";
    
    function findUser(id: string | undefined)  {
        for (const user of $users) {
            if (user.id == id) return user;
        }
        return null
    }

    // Remove user from list when they disconnect
    $socket.on("user-disconnected", (userId: string) => {
        $users = $users.filter(v => v.id !== userId)
    })

    // Update user readyness in local list to 
    $socket.on("user-ready-update", (userId: string) => {
        if (!findUser(userId)) {
            console.warn(`User with id ${userId} not found in local list`);
            return;
        }

        findUser(userId)!.ready = true
        $users = [...$users] // Force Svelte to rerender
        console.log(`User ${userId} set to Ready`)
    })

    // Set local user to ready
    function setReady() {
        $socket.emit("user-ready", (response: Response) => {
            if (!response.success) {
                alert(`Failed to set ready status!\nReason: ${response.message}`);
                return;
            }
            console.log("User set to Ready");
        });
        findUser($socket.id)!.ready = true;
        $users = [...$users] // Force Svelte to rerender
    }
    // When all users are ready
    $socket.on("all-users-ready", () => {
        $gameState = "answering";
    })
</script>

<div class="waiting-room">
    <div class="room-info">
        <h1>{$currentRoom}</h1>
    </div>

    <div class="users-list">
        {#if $users.length == 0}
            <p>No users in the room</p>
        {:else}
            <ol>
                {#each $users as user}
                    <li class={user.ready ? "ready" : "not-ready"}>
                        <span>{user.username}</span>
                    </li>
                {/each}
            </ol>
        {/if}
    </div>
    <div class="ready-btn-container">
        {#each [findUser($socket.id)?.ready] as isReady}  
            <button onclick={setReady} disabled={isReady} class={"ready-btn btn green-btn" + " " + (isReady ? "disabled" : "")}>Ready</button>
        {/each}
    </div>
</div>

<style>
    .waiting-room {
        background: linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%);
        border-radius: 1.2em;
        box-shadow: 0 6px 24px rgba(80, 80, 120, 0.18);
        padding: 36px 48px 32px 48px;
        max-width: 900px;
        margin: 40px auto;
        display: flex;
        flex-direction: column;
        align-items: center;
        color: #222;
        position: relative;
        min-height: 60vh;
        width: 75vw;
    }

    .room-info {
        background: #4b3869;
        color: #fff;
        border-radius: 0.7em;
        padding: 18px 38px;
        font-size: 1.7rem;
        font-weight: 700;
        margin: 10px 0 24px 0;
        box-shadow: 0 2px 8px rgba(120, 80, 180, 0.10);
        letter-spacing: 1px;
    }

    .users-list {
        margin-top: 30px;
        width: 100%;
    }
    ol {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 1.2rem;
        list-style: none;
        padding: 0;
        margin: 0;
    }

    li {
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 120px;
        min-height: 60px;
        padding: 0 18px;
        border-radius: 0.7em;
        color: #fff;
        font-weight: 600;
        font-size: 1.1rem;
        background: #e57373;
        box-shadow: 0 2px 8px rgba(120, 80, 180, 0.08);
        transition: transform 0.2s, background 0.2s;
        overflow: hidden;
    }
    li:hover {
        transform: scale(1.07);
        z-index: 1;
    }

    li span {
        display: inline-block;
        max-width: 15ch;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        text-align: center;
    }
    .not-ready {
        background: #e57373 !important;
        border: 2px solid #e57373;
    }
    .ready {
        background: #4caf50 !important;
        border: 2px solid #388e3c;
        color: #fff;
        box-shadow: 0 2px 12px rgba(76, 175, 80, 0.13);
    }
    .disabled {
        background-color: #bdbdbd !important;
        pointer-events: none;
        color: #fff;
        opacity: 0.7;
    }
    .ready-btn {
        background: #4caf50;
        color: #fff;
        border: none;
        border-radius: 0.5em;
        padding: 14px 36px;
        font-size: 1.15rem;
        font-weight: 700;
        margin-top: 36px;
        box-shadow: 0 2px 8px rgba(76, 175, 80, 0.13);
        transition: background 0.2s, transform 0.2s;
        cursor: pointer;
    }
    .ready-btn:hover:not(:disabled) {
        background: #388e3c;
        transform: scale(1.04);
    }

    .ready-btn:disabled {
        background-color: #bdbdbd !important;
        pointer-events: none;
        color: #fff;
        opacity: 0.7;
    }
    p {
        color: #4b3869;
        font-size: 1.1rem;
        font-weight: 600;
        background: #fff;
        border-radius: 0.5em;
        padding: 15px 20px;
        border: 1px solid #e0d7f3;
        box-shadow: 0 2px 4px rgba(120, 80, 180, 0.07);
        text-align: center;
        margin: 0 auto 10px auto;
        max-width: 400px;
    }
    .ready-btn-container {
        width: 100%;
        display: flex;
        justify-content: center;
        position: absolute;
        left: 0;
        bottom: 32px;
    }
</style>