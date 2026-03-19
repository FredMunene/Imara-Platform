# Imara Protocol — MVP Documentation

> Generated: 2026-03-19 | Track 1: EVM Smart Contract | Target: Polkadot Hub EVM

---

## Table of Contents

1. [PRD — Product Requirements Document](#prd)
2. [ADR — Architecture Decision Records](#adr)
3. [Architecture Overview](#architecture)
4. [What to Reuse vs. Change](#delta)
5. [Resources & References](#resources)

---

## 1. PRD — Product Requirements Document {#prd}

### 1.1 Problem Statement

Coordination in decentralized teams fails because there is no consequence for under-delivery. People commit to tasks, then ghost. The platform currently supports ideation and team formation but lacks trustless enforcement of task completion.

### 1.2 Goal

Ship an MVP of Imara Protocol that demonstrates **stake-to-commit, deliver-to-earn, fail-and-get-slashed** on Polkadot Hub EVM within a hackathon time window (~3 hours of contract + integration work).

### 1.3 Users

| Role | Description |
|------|-------------|
| Task Creator | Creates a task with a required stake amount and deadline |
| Participant | Stakes tokens to join a task, submits proof of work |
| Verifier | Reviews submission and calls verifyAndResolve (manual for MVP) |

For MVP the task creator acts as verifier.

### 1.4 User Stories

**Must Have (MVP)**

- As a Task Creator, I can create a task with a title, description, stake requirement, and deadline so that only committed participants join.
- As a Participant, I can stake the required amount of ETH/tokens and join an open task.
- As a Participant, I can submit a link or text as proof of work for a task I joined.
- As a Task Creator/Verifier, I can approve or reject a submission, which triggers reward payout or slash.
- As any user, I can view all open tasks and their status from the frontend.

**Nice to Have (if time allows)**

- Emit a cross-chain intent event readable by Base Sepolia.
- Track a simple on-chain reputation score per address (number of tasks completed successfully).
- Paginate or filter tasks by status (open, in-progress, resolved).

### 1.5 Functional Requirements

| ID | Requirement |
|----|-------------|
| F-01 | Contract: `createTask(title, stakeRequired, deadline)` — stores task, emits `TaskCreated` event |
| F-02 | Contract: `stakeAndJoin(taskId)` — requires `msg.value == stakeRequired`, one participant per task for MVP |
| F-03 | Contract: `submitWork(taskId, proofLink)` — participant submits proof string |
| F-04 | Contract: `verifyAndResolve(taskId, approved)` — creator approves/rejects; approved → refund + bonus from pool; rejected → slash |
| F-05 | Frontend: Task list page showing all tasks (title, stake, deadline, status) |
| F-06 | Frontend: Create Task form (title, description, stake amount in ETH, deadline) |
| F-07 | Frontend: Task detail view with Join (stake) button and Submit Work form |
| F-08 | Frontend: Verify panel (visible only to task creator) with Approve / Reject buttons |
| F-09 | Wallet: MetaMask connection to Polkadot Hub EVM chain (chainId to be confirmed at deploy time) |

### 1.6 Non-Functional Requirements

- Contract must compile and deploy on Polkadot Hub EVM (EVM-compatible, Solidity ≥ 0.8).
- Frontend must be runnable with `npm run dev` without additional infrastructure.
- No backend server required — all state from contract events + direct calls.
- Contract must be verified on the Polkadot Hub block explorer (if available) for demo.

### 1.7 Out of Scope (MVP)

- Multi-participant tasks (one participant per task for MVP simplicity).
- Token-based staking (ETH-native for MVP, token staking is follow-on).
- Automated/oracle-based verification.
- IPFS proof storage (plain string link for MVP).
- The existing Supabase database (tasks live fully on-chain for MVP demo).

---

## 2. ADR — Architecture Decision Records {#adr}

### ADR-001: Deploy a new `Imara.sol` instead of modifying `Staking.sol`

**Status:** Accepted

**Context:** The existing `Staking.sol` implements a global APR-based staking pool (fixed 0.0003 ETH, 18.67% APR). This is fundamentally different from task-specific commitment staking with slash mechanics.

**Decision:** Write a new `Imara.sol` contract. Keep `Staking.sol` and `TokenFactory.sol` untouched so existing deployed features still work.

**Consequences:**
- Clean separation of concerns.
- Existing staking dashboard and token creation remain functional.
- New contract has its own deploy address that the MVP UI points to.

---

### ADR-002: Use ETH-native staking (not ERC20 tokens) for MVP

**Status:** Accepted

**Context:** The platform has ERC20 token creation via `TokenFactory.sol` but integrating a custom token into the staking flow adds approval transactions, token distribution complexity, and more surface area for bugs.

**Decision:** Use `msg.value` ETH for staking in the MVP. The stake amount is denominated in ETH set by the task creator.

**Consequences:**
- Simpler UX (one transaction to join).
- Slashed ETH stays in the contract (future: send to reward pool or burn).
- Token-based staking is a post-MVP upgrade path.

---

### ADR-003: Task Creator = Verifier for MVP

**Status:** Accepted

**Context:** Decentralized verification (DAO vote, oracle, multi-sig) is complex and out of scope for a 3-hour build.

**Decision:** `verifyAndResolve` is gated to `task.creator`. The creator calls it with a boolean `approved` flag.

**Consequences:**
- Trust assumption: creator is honest. Acceptable for hackathon demo.
- Upgradeable: replace with multi-sig or DAO vote by changing the modifier.

---

### ADR-004: Keep Supabase for profile/idea data; contract is source of truth for task state

**Status:** Accepted

**Context:** The existing app stores project ideas, profiles, and images in Supabase. The new MVP needs task state (stakes, submissions, outcomes) to be trustless.

**Decision:** Task creation, staking, submission, and resolution live entirely on-chain. The frontend reads contract events and view functions — no Supabase for task data. Profile and idea data remain in Supabase.

**Consequences:**
- MVP demo is fully trustless for the task lifecycle.
- No Supabase schema changes needed.
- Slower reads (RPC calls vs SQL) — acceptable for demo scale.

---

### ADR-005: Target Polkadot Hub EVM; use ethers.js (already in project)

**Status:** Accepted

**Context:** The project already uses `ethers.js` 6.x in `utils/config.jsx` and `utils/stake.jsx`. Thirdweb is also installed but adds abstraction overhead.

**Decision:** Use raw `ethers.js` with `window.ethereum` (MetaMask) for MVP contract calls — same pattern as existing `utils/stake.jsx`. Configure MetaMask to add Polkadot Hub EVM as a custom network.

**Polkadot Hub EVM Network Config (to confirm at deploy):**
```
Network Name: Polkadot Hub
RPC URL: https://westend-asset-hub-eth-rpc.polkadot.io  (Westend testnet)
Chain ID: 420420421
Currency Symbol: WND
Block Explorer: https://blockscout-westend-asset-hub.parity-chains.parity.io
```
> Cross-check chain ID at deploy time — Polkadot Asset Hub EVM may use a different ID on mainnet vs testnet.

**Consequences:**
- Minimal new dependencies.
- Pattern is familiar to existing code — low risk.

---

### ADR-006: Single-participant tasks for MVP

**Status:** Accepted

**Context:** Multi-participant tasks require tracking an array of participants, per-participant work submissions, and proportional reward distribution — significant added complexity.

**Decision:** Each task has exactly one `participant` slot. `stakeAndJoin` reverts if already taken.

**Consequences:**
- Simple mapping: `taskId → Task struct`.
- Demo flow is linear and easy to walk through.
- Multi-participant is a clear upgrade path (change `address participant` to `address[] participants`).

---

## 3. Architecture Overview {#architecture}

### 3.1 High-Level Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Browser / MetaMask                    │
└──────────────────────────┬──────────────────────────────┘
                           │ ethers.js (window.ethereum)
┌──────────────────────────▼──────────────────────────────┐
│              React Frontend (Vite)                       │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  TaskList    │  │  CreateTask  │  │   TaskDetail  │  │
│  │  (Home.jsx   │  │  (extends    │  │   (extends    │  │
│  │   extended)  │  │  CreateIdea) │  │   ViewIdea)   │  │
│  └──────────────┘  └──────────────┘  └───────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │         utils/imara.jsx  (NEW)                   │    │
│  │   - createTask()  - stakeAndJoin()               │    │
│  │   - submitWork()  - verifyAndResolve()           │    │
│  │   - getTasks()    - getTask(id)                  │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  Existing (unchanged):                                   │
│  utils/config.jsx (TokenFactory) | utils/stake.jsx       │
│  SupabaseClient.jsx (profiles/ideas) | Auth              │
└──────────────────────────┬──────────────────────────────┘
                           │ RPC
         ┌─────────────────▼──────────────────┐
         │       Polkadot Hub EVM              │
         │                                     │
         │  ┌──────────────────────────────┐   │
         │  │       Imara.sol  (NEW)        │   │
         │  │                              │   │
         │  │  createTask()                │   │
         │  │  stakeAndJoin()              │   │
         │  │  submitWork()                │   │
         │  │  verifyAndResolve()          │   │
         │  │                              │   │
         │  │  Events:                     │   │
         │  │  TaskCreated                 │   │
         │  │  ParticipantJoined           │   │
         │  │  WorkSubmitted               │   │
         │  │  TaskResolved                │   │
         │  └──────────────────────────────┘   │
         │                                     │
         │  ┌─────────────┐ ┌───────────────┐  │
         │  │ Staking.sol │ │TokenFactory   │  │
         │  │ (existing)  │ │.sol (existing)│  │
         │  └─────────────┘ └───────────────┘  │
         └────────────────────────────────────-┘
                           │
              (Optional - if time allows)
                           │
         ┌─────────────────▼──────────────────┐
         │           Base Sepolia              │
         │   ImaraReceiver.sol (cross-chain)   │
         │   - logs TaskResolved event         │
         └────────────────────────────────────┘
```

### 3.2 Smart Contract: `Imara.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Imara {

    enum Status { Open, InProgress, Completed, Failed }

    struct Task {
        uint256 id;
        address creator;
        string title;
        string description;
        uint256 stakeRequired;   // in wei
        uint256 deadline;        // unix timestamp
        address participant;
        string proofLink;
        Status status;
        bool resolved;
    }

    uint256 public taskCount;
    mapping(uint256 => Task) public tasks;

    // reputation[address] = number of tasks completed
    mapping(address => uint256) public reputation;

    event TaskCreated(uint256 indexed taskId, address indexed creator, uint256 stakeRequired, uint256 deadline);
    event ParticipantJoined(uint256 indexed taskId, address indexed participant, uint256 staked);
    event WorkSubmitted(uint256 indexed taskId, address indexed participant, string proofLink);
    event TaskResolved(uint256 indexed taskId, address indexed participant, bool approved, uint256 payout);

    modifier onlyCreator(uint256 taskId) {
        require(msg.sender == tasks[taskId].creator, "Not task creator");
        _;
    }

    function createTask(
        string calldata title,
        string calldata description,
        uint256 stakeRequired,
        uint256 deadline
    ) external returns (uint256) {
        require(deadline > block.timestamp, "Deadline must be in future");
        uint256 id = taskCount++;
        tasks[id] = Task({
            id: id,
            creator: msg.sender,
            title: title,
            description: description,
            stakeRequired: stakeRequired,
            deadline: deadline,
            participant: address(0),
            proofLink: "",
            status: Status.Open,
            resolved: false
        });
        emit TaskCreated(id, msg.sender, stakeRequired, deadline);
        return id;
    }

    function stakeAndJoin(uint256 taskId) external payable {
        Task storage task = tasks[taskId];
        require(task.status == Status.Open, "Task not open");
        require(task.participant == address(0), "Task already taken");
        require(msg.value == task.stakeRequired, "Incorrect stake amount");
        require(msg.sender != task.creator, "Creator cannot join own task");
        task.participant = msg.sender;
        task.status = Status.InProgress;
        emit ParticipantJoined(taskId, msg.sender, msg.value);
    }

    function submitWork(uint256 taskId, string calldata proofLink) external {
        Task storage task = tasks[taskId];
        require(task.participant == msg.sender, "Not task participant");
        require(task.status == Status.InProgress, "Task not in progress");
        require(block.timestamp <= task.deadline, "Deadline passed");
        task.proofLink = proofLink;
        emit WorkSubmitted(taskId, msg.sender, proofLink);
    }

    function verifyAndResolve(uint256 taskId, bool approved) external onlyCreator(taskId) {
        Task storage task = tasks[taskId];
        require(!task.resolved, "Already resolved");
        require(task.status == Status.InProgress, "Task not in progress");
        task.resolved = true;

        if (approved) {
            task.status = Status.Completed;
            reputation[task.participant]++;
            uint256 payout = task.stakeRequired; // refund stake; bonus = 0 for MVP (no reward pool)
            payable(task.participant).transfer(payout);
            emit TaskResolved(taskId, task.participant, true, payout);
        } else {
            task.status = Status.Failed;
            // stake stays in contract (slash); optionally send to creator as reward
            // payable(task.creator).transfer(task.stakeRequired); // optional
            emit TaskResolved(taskId, task.participant, false, 0);
        }
    }

    // Creator can reclaim stake if deadline passed with no participant
    function reclaimExpiredTask(uint256 taskId) external onlyCreator(taskId) {
        Task storage task = tasks[taskId];
        require(task.status == Status.Open, "Task not open");
        require(block.timestamp > task.deadline, "Deadline not passed");
        task.resolved = true;
        task.status = Status.Failed;
    }

    function getAllTasks() external view returns (Task[] memory) {
        Task[] memory all = new Task[](taskCount);
        for (uint256 i = 0; i < taskCount; i++) {
            all[i] = tasks[i];
        }
        return all;
    }

    receive() external payable {}
}
```

### 3.3 Frontend Modules

| Module | Action | Notes |
|--------|--------|-------|
| `utils/imara.jsx` | **Create new** | ethers.js wrapper for Imara.sol — mirrors pattern of `utils/stake.jsx` |
| `utils/imaraAbi.json` | **Create new** | ABI output from `forge build` |
| `components/CreateTask.jsx` | **Create new** (adapt CreateIdea.jsx) | Remove Supabase, add stakeRequired + deadline fields |
| `components/TaskList.jsx` | **Create new** (adapt Home.jsx) | Read tasks from contract instead of Supabase |
| `components/TaskDetail.jsx` | **Create new** (adapt ViewIdea.jsx) | StakeAndJoin button, SubmitWork form, Verify panel |
| `App.jsx` | **Edit** | Add routes: `/tasks`, `/tasks/create`, `/tasks/:id` |
| `components/Auth.jsx` | **Reuse as-is** | Wallet connection already works |
| `main.jsx` | **Reuse as-is** | ThirdwebProvider still needed for wallet UI |

### 3.4 Data Flow

```
CREATE TASK
User fills CreateTask form
  → utils/imara.createTask(title, desc, stakeWei, deadlineTimestamp)
  → Imara.sol emits TaskCreated(id, creator, stake, deadline)
  → Frontend navigates to /tasks

JOIN TASK
User clicks "Stake & Join" on TaskDetail
  → utils/imara.stakeAndJoin(taskId, {value: stakeRequired})
  → Imara.sol: moves status Open → InProgress, records participant
  → UI refreshes task status

SUBMIT WORK
Participant clicks Submit, enters proof URL
  → utils/imara.submitWork(taskId, proofLink)
  → Imara.sol stores proofLink on Task struct

VERIFY
Creator sees proof link, clicks Approve or Reject
  → utils/imara.verifyAndResolve(taskId, true/false)
  → Imara.sol: approved → refunds stake to participant; rejected → stake slashed
  → TaskResolved event emitted, UI shows outcome
```

---

## 4. What to Reuse vs. Change {#delta}

### 4.1 Keep Unchanged

| Item | Why |
|------|-----|
| `Staking.sol` (deployed) | Separate staking product, live on chain |
| `TokenFactory.sol` (deployed) | ERC20 token creation still useful |
| `components/Auth.jsx` | Wallet + email auth works fine |
| `components/Index.jsx` | Landing page |
| `components/BuilderProfile.jsx` | Builder onboarding |
| `components/StakingProfile.jsx` | Community staking profiles |
| `components/stake.jsx` | APR staking dashboard |
| `components/token.jsx` | Token creation UI |
| `utils/config.jsx` | TokenFactory interaction |
| `utils/stake.jsx` | Existing staking interaction |
| `utils/SupabaseClient.jsx` | Profile/idea storage (untouched) |
| `AuthContext.jsx` | Supabase auth context |
| `Infura.jsx` | IPFS upload (not needed for MVP but keep) |
| All Supabase DB tables | Profile and idea data unaffected |

### 4.2 Create (New Files)

| File | Description |
|------|-------------|
| `backend/src/Imara.sol` | Core protocol contract |
| `backend/test/Imara.t.sol` | Foundry tests for happy path + slash |
| `backend/script/DeployImara.s.sol` | Foundry deploy script |
| `front-end/src/utils/imara.jsx` | ethers.js helpers for Imara.sol |
| `front-end/src/utils/imaraAbi.json` | Contract ABI post-compile |
| `front-end/src/components/CreateTask.jsx` | Task creation form |
| `front-end/src/components/TaskList.jsx` | Browse all on-chain tasks |
| `front-end/src/components/TaskDetail.jsx` | Task view + join + submit + verify |

### 4.3 Edit (Minimal Changes)

| File | Change |
|------|--------|
| `front-end/src/App.jsx` | Add 3 new routes: `/tasks`, `/tasks/create`, `/tasks/:id` |
| `front-end/src/components/Home.jsx` | Add "Protocol Tasks" link/button to nav |
| `front-end/src/components/Index.jsx` | Add Imara Protocol to feature list on landing |
| `front-end/.env.local` | Add `VITE_IMARA_CONTRACT_ADDRESS=<deployed_address>` |

### 4.4 Adapt (Heavy Inspiration From Existing)

| New File | Based On | Key Differences |
|----------|----------|-----------------|
| `CreateTask.jsx` | `CreateIdea.jsx` | No Supabase; adds stakeRequired (ETH), deadline (datetime); calls `imara.createTask()` |
| `TaskList.jsx` | `Home.jsx` | Reads from contract `getAllTasks()` not Supabase; shows stake, deadline, status badges |
| `TaskDetail.jsx` | `ViewIdea.jsx` | Shows proofLink, status; Join/Submit/Verify buttons conditionally rendered by role |
| `utils/imara.jsx` | `utils/stake.jsx` | Multiple function wrappers instead of one; uses `VITE_IMARA_CONTRACT_ADDRESS` |

---

## 5. Resources & References {#resources}

### 5.1 Polkadot Hub EVM

| Resource | URL |
|----------|-----|
| Polkadot Asset Hub EVM docs | https://docs.substrate.io/reference/frame-pallets/#evm |
| Westend Asset Hub RPC | https://westend-asset-hub-eth-rpc.polkadot.io |
| Westend Blockscout explorer | https://blockscout-westend-asset-hub.parity-chains.parity.io |
| Polkadot EVM tutorial | https://docs.moonbeam.network (compatible patterns) |
| Add Westend to MetaMask | Chain ID: 420420421, Symbol: WND |
| Faucet for WND (testnet) | https://faucet.polkadot.io (select Westend Asset Hub) |

### 5.2 Smart Contract Development

| Resource | URL |
|----------|-----|
| Foundry book | https://book.getfoundry.sh |
| Foundry deploy to custom RPC | `forge create --rpc-url <RPC> --private-key <PK> src/Imara.sol:Imara` |
| OpenZeppelin contracts v5 | Already installed in backend (`@openzeppelin/contracts ^5.2.0`) |
| Solidity 0.8 docs | https://docs.soliditylang.org/en/v0.8.20 |
| ETH transfer patterns | Use `.transfer()` for MVP; consider ReentrancyGuard for production |

### 5.3 Frontend / ethers.js

| Resource | URL |
|----------|-----|
| ethers.js v6 docs | https://docs.ethers.org/v6 |
| MetaMask custom network | https://docs.metamask.io/wallet/reference/wallet_addethereumchain |
| Existing stake.jsx pattern | `front-end/src/utils/stake.jsx` — direct reference for new `imara.jsx` |

### 5.4 Cross-Chain (Optional Stretch)

| Resource | URL |
|----------|-----|
| Polkadot XCM overview | https://wiki.polkadot.network/docs/learn-xcm |
| Base Sepolia faucet | https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet |
| LayerZero (EVM cross-chain events) | https://layerzero.network/developers |
| Simple cross-chain pattern | Emit event on Polkadot Hub, read with off-chain listener on Base |

### 5.5 Existing Project Contract Addresses

| Contract | Address | Network |
|----------|---------|---------|
| TokenFactory.sol | `0x7E81E4697863cAB4FE4C0d820baCbc9e9843e3dD` | Current EVM chain |
| Staking.sol | `0x65225a4E25977A00E766dF66269774e5f24b2d55` | Current EVM chain |
| Imara.sol | TBD — deploy to Polkadot Hub EVM | Westend Asset Hub |

---

## 6. Build Order (Recommended 3-Hour Sprint)

```
[0:00 - 0:30]  Write and compile Imara.sol (Foundry)
               Run: forge build
               Run: forge test (basic happy path test)

[0:30 - 1:00]  Deploy to Westend Asset Hub EVM
               Run: forge create --rpc-url https://westend-asset-hub-eth-rpc.polkadot.io
               Copy ABI to front-end/src/utils/imaraAbi.json
               Set VITE_IMARA_CONTRACT_ADDRESS in .env.local

[1:00 - 1:30]  Build utils/imara.jsx
               Wire createTask, stakeAndJoin, submitWork, verifyAndResolve, getAllTasks

[1:30 - 2:15]  Build TaskList.jsx + CreateTask.jsx
               Adapt from Home.jsx and CreateIdea.jsx patterns

[2:15 - 2:50]  Build TaskDetail.jsx
               Conditional rendering: Open → Join button; InProgress (participant) → Submit;
               InProgress (creator) → Verify panel

[2:50 - 3:00]  Wire routes in App.jsx, smoke test full flow
               Demo: Create → Join → Submit → Approve → check ETH returned
```

### 6.1 Progress Checklist — 2026-03-19

- [x] Added `backend/src/Imara.sol`.
- [x] Added `backend/test/Imara.t.sol` and verified it with `forge test`.
- [x] Added `backend/script/DeployImara.s.sol`.
- [x] Generated `front-end/src/utils/imaraAbi.json` from the Foundry build output.
- [x] Added `front-end/src/utils/imara.jsx` with contract helpers and `wallet_addEthereumChain` support.
- [x] Added `front-end/src/components/TaskList.jsx`.
- [x] Added `front-end/src/components/CreateTask.jsx`.
- [x] Added `front-end/src/components/TaskDetail.jsx`.
- [x] Wired `/tasks`, `/tasks/create`, and `/tasks/:id` in `front-end/src/App.jsx`.
- [x] Verified the frontend compiles with `npm run build`.
- [ ] Deploy `Imara.sol` to Westend Asset Hub and set the final `VITE_IMARA_CONTRACT_ADDRESS`.
- [ ] Run the full wallet-to-wallet demo flow on the deployed contract.

---

## 7. Known Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Polkadot Hub EVM chain not accessible / RPC down | Have Sepolia fallback: same contract, different RPC |
| MetaMask not detecting custom chain | Pre-add network via `wallet_addEthereumChain` in `utils/imara.jsx` |
| `getAllTasks()` gas limit for large arrays | Cap at 100 tasks for demo; use event indexing in production |
| Slash funds stuck in contract | Add `withdrawSlashed()` owned by deployer for demo cleanup |
| Single participant per task feels limited | Frame as "bounty claim" model — clear and intuitive for demo |
| ReentrancyGuard not added | Low risk for MVP (no complex callback logic); note in code comment |
