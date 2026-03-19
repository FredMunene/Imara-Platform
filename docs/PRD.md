# Product Requirements Document
## Imara Protocol — Commitment-Based Coordination MVP
**Version:** 1.0
**Date:** 2026-03-19
**Track:** Polkadot Hackathon — Track 1: EVM Smart Contract
**Target Chain:** Polkadot Hub TestNet (EVM)

---

## 1. Overview

### 1.1 What is Imara Protocol?

Imara Protocol is a trustless accountability layer for decentralized work. Participants stake ETH to join a task, submit proof of completion, and are either rewarded (stake returned) or slashed (stake forfeited) based on outcome. The protocol enforces commitment on-chain — no intermediaries, no ghost contributors.

**Core loop:**
```
Stake to commit → Deliver to earn → Fail and get slashed
```

### 1.2 Why Now?

The existing Imara Platform already supports ideation, team formation, and project staking. The missing piece is *task-level enforcement*: once a team forms, there is no on-chain consequence for failing to deliver. This MVP closes that gap and demonstrates it as a live demo on Polkadot Hub EVM.

### 1.3 Success Criteria for Hackathon Demo

> Current status on 2026-03-19: the original MVP contract is deployed at `0x1314382ac047A386711DD062d1ac1aA8b83f2e0B`, the frontend is wired to that address, and the wallet-to-wallet demo flow has been completed on Polkadot Hub TestNet. The repository now also contains an OpenZeppelin-secured revision of `Imara.sol` using `Ownable`, `Pausable`, and `ReentrancyGuard`; that revision is tested locally and its ABI is synced to the frontend, but it still needs a fresh deployment and one repeat smoke test.

- [x] Original MVP `Imara.sol` deployed and verified on Polkadot Hub TestNet
- [x] Task can be created via the frontend UI
- [x] A second wallet can stake and join that task
- [x] The participant submits a proof link
- [x] The creator approves → ETH is returned to participant
- [x] The creator rejects → ETH remains slashed in contract
- [x] All state changes are visible in the frontend and on the block explorer
- [x] OpenZeppelin-secured `Imara.sol` implemented and tested locally
- [ ] OpenZeppelin-secured `Imara.sol` redeployed and verified on Polkadot Hub TestNet
- [ ] Frontend switched to the new sponsor-track deployment address
- [ ] Wallet-to-wallet smoke test rerun against the OpenZeppelin deployment

---

## 2. Users & Roles

| Role | Who They Are | What They Do |
|------|-------------|--------------|
| **Task Creator** | Project lead, builder, DAO coordinator | Creates task, sets stake amount and deadline, verifies submission |
| **Participant** | Contributor, freelancer, team member | Discovers task, stakes ETH to join, submits proof of work |
| **Observer** | Any connected or unconnected user | Views task list and task status (read-only) |

> MVP simplification: Task Creator = Verifier. One participant per task.

---

## 3. User Stories

### Must Have

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| US-01 | As a Task Creator, I can create a task with a title, description, required stake amount (ETH), and deadline | Task stored on-chain; `TaskCreated` event emitted; task appears in task list |
| US-02 | As a Participant, I can view all open tasks and see the stake required and deadline | Task list loads from contract; shows title, stake, deadline, status |
| US-03 | As a Participant, I can stake the exact ETH amount and join an open task | `stakeAndJoin` succeeds; task status changes to InProgress; join button disappears |
| US-04 | As a Participant, I can submit a URL or text string as proof of my completed work | `submitWork` succeeds; proof link visible on task detail page |
| US-05 | As a Task Creator, I can approve a submission — participant gets their stake back | `verifyAndResolve(true)` called; ETH transferred back; task status = Completed |
| US-06 | As a Task Creator, I can reject a submission — participant is slashed | `verifyAndResolve(false)` called; ETH stays in contract; task status = Failed |
| US-07 | As any user, I can connect my MetaMask wallet to Polkadot Hub EVM | MetaMask prompts to add custom network; wallet address shown in UI |

### Nice to Have

| ID | Story |
|----|-------|
| US-08 | Participant reputation score (tasks completed) visible on their profile |
| US-09 | Task Creator can reclaim ETH from an expired task with no participant |
| US-10 | Cross-chain event emitted on task resolution (Base Sepolia listener) |
| US-11 | Task filtering by status (Open / InProgress / Completed / Failed) |

---

## 4. Functional Requirements

### 4.1 Smart Contract (`Imara.sol`)

| ID | Function | Requirement |
|----|----------|-------------|
| FR-01 | `createTask` | Accepts title (string), description (string), stakeRequired (uint256 in wei), deadline (uint256 unix timestamp). Validates deadline > now. Stores task. Emits `TaskCreated`. Returns taskId. |
| FR-02 | `stakeAndJoin` | Accepts taskId. Requires `msg.value == stakeRequired`. Requires task status == Open. Requires participant slot empty. Requires caller != creator. Sets participant, changes status to InProgress. Emits `ParticipantJoined`. |
| FR-03 | `submitWork` | Accepts taskId, proofLink (string). Requires caller == task.participant. Requires status == InProgress. Requires block.timestamp <= deadline. Stores proofLink. Emits `WorkSubmitted`. |
| FR-04 | `verifyAndResolve` | Accepts taskId, approved (bool). Requires caller == task.creator. Requires not yet resolved. If approved: refund stakeRequired to participant, set status = Completed, increment reputation[participant]. If rejected: set status = Failed (stake stays in contract). Emits `TaskResolved`. |
| FR-05 | `getAllTasks` | Returns all Task structs as an array. View function. Used by frontend to display task list. |
| FR-06 | `reclaimExpiredTask` | Accepts taskId. Requires caller == creator. Requires status == Open. Requires deadline passed. Sets status = Failed. No ETH transferred (no participant staked). |
| FR-07 | Admin controls & events | Inherit OpenZeppelin `Ownable`, `Pausable`, and `ReentrancyGuard`. Expose owner-only `pause()`, `unpause()`, and `withdrawSlashed(recipient, amount)` that can only withdraw slashed funds beyond `pendingStakeTotal`. Emit `TaskCreated(taskId, creator, stakeRequired, deadline)`, `ParticipantJoined(taskId, participant, staked)`, `WorkSubmitted(taskId, participant, proofLink)`, `TaskResolved(taskId, participant, approved, payout)`, and `SlashedFundsWithdrawn(recipient, amount)`. |

### 4.2 Frontend Pages & Components

| ID | Component | Requirement |
|----|-----------|-------------|
| FR-08 | `/tasks` — TaskList | Calls `getAllTasks()` on load. Renders cards per task: title, stake (in ETH), deadline (human-readable), status badge. "Create Task" button top-right. Clicking a card navigates to `/tasks/:id`. |
| FR-09 | `/tasks/create` — CreateTask | Form fields: Title (text), Description (textarea), Stake Required (number, ETH), Deadline (datetime-local). Submit calls `createTask()`. On success, navigate to `/tasks`. Wallet must be connected. |
| FR-10 | `/tasks/:id` — TaskDetail | Shows all task fields. Conditional UI: (a) Open + not creator → "Stake & Join" button; (b) InProgress + caller is participant → "Submit Work" form with text input; (c) InProgress + caller is creator → "Approve" and "Reject" buttons + proof link shown; (d) Resolved → outcome banner (Completed / Failed). |
| FR-11 | Wallet connection | MetaMask connection prompt on any action requiring a wallet. Auto-prompt to add Polkadot Hub EVM network if not already added. Show connected address in navbar. |
| FR-12 | `utils/imara.jsx` | Exports: `createTask(title, desc, stakeEth, deadlineTimestamp)`, `stakeAndJoin(taskId, stakeWei)`, `submitWork(taskId, proofLink)`, `verifyAndResolve(taskId, approved)`, `getAllTasks()`, `getTask(taskId)`. Uses `VITE_IMARA_CONTRACT_ADDRESS` env var. |

### 4.3 Configuration

| ID | Item | Requirement |
|----|------|-------------|
| FR-13 | `App.jsx` routes | Add: `/tasks` → TaskList, `/tasks/create` → CreateTask, `/tasks/:id` → TaskDetail |
| FR-14 | `.env.local` | Add `VITE_IMARA_CONTRACT_ADDRESS=<deployed_address>` after deploy |
| FR-15 | Network config | Polkadot Hub TestNet: RPC `https://eth-rpc-testnet.polkadot.io/`, Chain ID `420420417`, Symbol `PAS` |

---

## 5. Non-Functional Requirements

| ID | Category | Requirement |
|----|----------|-------------|
| NFR-01 | Compatibility | Contract must compile with Solidity ^0.8.20, deploy on any EVM-compatible chain |
| NFR-02 | Simplicity | No backend server. All task state read directly from contract via ethers.js. |
| NFR-03 | Dev environment | `npm run dev` starts frontend with no additional setup beyond `.env.local` |
| NFR-04 | Security (MVP) | The sponsor-track contract uses OpenZeppelin `Ownable`, `Pausable`, and `ReentrancyGuard`. Slashed-fund withdrawal is owner-gated and limited to funds not counted in `pendingStakeTotal`. |
| NFR-05 | UX | All on-chain actions show a loading/pending state. Errors surface as readable messages (not raw revert strings). |
| NFR-06 | Demo-readiness | The currently deployed MVP contract is verified on Polkadot Hub TestNet Blockscout. The OpenZeppelin-secured redeploy should also be verified before final sponsor-track submission. |

---

## 6. Out of Scope (MVP)

| Item | Why deferred |
|------|-------------|
| Multi-participant tasks | Requires proportional reward distribution — post-MVP |
| ERC20 token staking | Adds approve() transaction — complexity not needed for demo |
| Oracle / automated verification | Requires Chainlink or UMA — out of 3-hour scope |
| DAO vote on task outcomes | Governance contract — post-MVP |
| IPFS proof storage | Plain string link is sufficient for demo |
| Supabase for task data | Contract is source of truth for all task state |
| TypeScript migration | Existing codebase is JS; no value in converting now |
| Mobile responsive polish | Demo is desktop MetaMask flow |

---

## 7. Implementation Steps

### Status Update — 2026-03-19

- [x] `backend/src/Imara.sol` implemented for task creation, join, submission, resolution, and expired-task reclaim.
- [x] OpenZeppelin `Ownable`, `Pausable`, and `ReentrancyGuard` added to `backend/src/Imara.sol` for sponsor-track hardening.
- [x] `backend/test/Imara.t.sol` expanded to 31 behavior/security tests and `forge test --match-path test/Imara.t.sol` passes locally.
- [x] `backend/script/DeployImara.s.sol` added.
- [x] Original MVP `Imara.sol` deployed to Polkadot Hub TestNet at `0x1314382ac047A386711DD062d1ac1aA8b83f2e0B` and verified on Blockscout.
- [x] ABI exported to `front-end/src/utils/imaraAbi.json` and resynced after the OpenZeppelin refactor.
- [x] `front-end/src/utils/imara.jsx` added with read/write helpers and Polkadot Hub network setup.
- [x] Routes added in `front-end/src/App.jsx` for `/tasks`, `/tasks/create`, and `/tasks/:id`.
- [x] `TaskList.jsx`, `CreateTask.jsx`, and `TaskDetail.jsx` implemented.
- [x] Frontend production build passes locally with `npm run build`.
- [x] `front-end/.env.local` currently points to the original deployed `VITE_IMARA_CONTRACT_ADDRESS`.
- [x] End-to-end wallet smoke test completed on the deployed Polkadot Hub TestNet MVP contract.
- [ ] OpenZeppelin-secured `Imara.sol` redeployed to Polkadot Hub TestNet and verified on Blockscout.
- [ ] `front-end/.env.local` and Vercel env updated with the new sponsor-track address.
- [ ] End-to-end wallet smoke test repeated on the OpenZeppelin-secured deployment.

### Phase 1 — Smart Contract (0:00–1:00)

**Step 1: Write `Imara.sol`** *(30 min)*
- Location: `backend/src/Imara.sol`
- Implement all 7 contract functions from FR-01 to FR-07
- Use the reference implementation in `docs.md §3.2` as the starting point
- Add `receive() external payable {}` to accept ETH
- Do NOT modify `Staking.sol` or `TokenFactory.sol`

**Step 2: Write Foundry test** *(10 min)*
- Location: `backend/test/Imara.t.sol`
- Test happy path: create → join → submit → approve → assert ETH returned
- Test slash path: create → join → submit → reject → assert ETH in contract
- Run: `cd backend && forge test`

**Step 3: Write deploy script** *(5 min)*
- Location: `backend/script/DeployImara.s.sol`
- Standard Foundry deploy script

**Step 4: Deploy to Polkadot Hub TestNet** *(15 min)*
```bash
cd backend
forge create \
  --rpc-url https://eth-rpc-testnet.polkadot.io/ \
  --private-key $PRIVATE_KEY \
  src/Imara.sol:Imara
```
- Copy deployed address to clipboard
- Copy ABI from `backend/out/Imara.sol/Imara.json` → `artifacts.abi`

---

### Phase 2 — Frontend Utilities (1:00–1:30)

**Step 5: Copy ABI** *(2 min)*
- Copy ABI array from `backend/out/Imara.sol/Imara.json`
- Save to `front-end/src/utils/imaraAbi.json`

**Step 6: Create `utils/imara.jsx`** *(25 min)*
- Mirror the pattern of existing `utils/stake.jsx`
- Add `addPolkadotHubNetwork()` helper that calls `wallet_addEthereumChain`
- Export all 6 functions: `createTask`, `stakeAndJoin`, `submitWork`, `verifyAndResolve`, `getAllTasks`, `getTask`
- Read `VITE_IMARA_CONTRACT_ADDRESS` from env
- Set `.env.local` with deployed address

**Step 7: Add routes to `App.jsx`** *(3 min)*
```jsx
<Route path="/tasks" element={<TaskList />} />
<Route path="/tasks/create" element={<CreateTask />} />
<Route path="/tasks/:id" element={<TaskDetail />} />
```

---

### Phase 3 — Frontend Components (1:30–2:50)

**Step 8: Build `TaskList.jsx`** *(20 min)*
- Adapt `Home.jsx` structure
- On mount: call `getAllTasks()`, store in state
- Render task cards: title, stake (format wei → ETH), deadline (format timestamp → date string), status badge (color-coded: Open=blue, InProgress=yellow, Completed=green, Failed=red)
- "Create Task" button → navigate to `/tasks/create`
- Card click → navigate to `/tasks/:id`

**Step 9: Build `CreateTask.jsx`** *(20 min)*
- Adapt `CreateIdea.jsx` structure (remove Supabase calls, remove image upload)
- Form fields: Title, Description, Stake Required (ETH input), Deadline (datetime-local)
- On submit: convert ETH → wei (`ethers.parseEther`), convert datetime → unix timestamp
- Call `createTask()`, show pending state, navigate to `/tasks` on success
- Require wallet connected before showing form

**Step 10: Build `TaskDetail.jsx`** *(40 min)*
- Adapt `ViewIdea.jsx` structure
- On mount: call `getTask(id)` from URL param
- Display: title, description, creator address, stake, deadline, status, participant, proofLink
- **Conditional panels** (the core of this component):
  - `status == Open && caller != creator` → "Stake & Join" button (calls `stakeAndJoin`, value = stakeRequired)
  - `status == InProgress && caller == participant` → text input + "Submit Work" button (calls `submitWork`)
  - `status == InProgress && caller == creator && proofLink set` → show proof link + "Approve" / "Reject" buttons (call `verifyAndResolve`)
  - `status == Completed` → green banner "Task Completed — stake returned to participant"
  - `status == Failed` → red banner "Task Failed — stake slashed"

---

### Phase 4 — Integration & Polish (2:50–3:00)

**Step 11: Smoke test full flow** *(10 min)*
- Wallet A (creator): connect → `/tasks/create` → submit → see task in list
- Wallet B (participant): connect → click task → "Stake & Join" → "Submit Work"
- Wallet A: return to task → see proof → click "Approve" → verify ETH returned
- Wallet A: create second task → Wallet B joins + submits → Wallet A clicks "Reject" → verify ETH slashed

---

## 8. What You Need

### Tools & Environment

| Item | Status | Action |
|------|--------|--------|
| Node.js + npm | Required | Already installed (existing frontend runs) |
| Foundry (`forge`) | Required | Install: `curl -L https://foundry.paradigm.xyz \| bash && foundryup` |
| MetaMask browser extension | Required | Add Polkadot Hub TestNet as a custom network |
| Private key with PAS tokens | Required | Get PAS from the faucet (see below) |
| Supabase account | Already set up | No changes needed |

### Accounts & Keys

| Item | How to Get |
|------|-----------|
| PAS testnet tokens | https://faucet.polkadot.io → select Polkadot Hub TestNet / Paseo EVM → paste your EVM address |
| Private key for deploy | Export from MetaMask. Store as `PRIVATE_KEY` env var. Never commit to git. |
| Thirdweb Client ID | Already in `.env.local` as `VITE_THIRDWEB_CLIENT_ID` |
| Supabase URL + Key | Already in `.env.local` |

### Environment Variables (`.env.local`)

```bash
# Existing (keep)
VITE_THIRDWEB_CLIENT_ID=<existing>
VITE_SUPABASE_URL=<existing>
VITE_SUPABASE_KEY=<existing>
VITE_PROJECTID=<existing>
VITE_PROJECTSECRET=<existing>

# Current live MVP deployment (pre-OpenZeppelin refactor)
VITE_IMARA_CONTRACT_ADDRESS=0x1314382ac047A386711DD062d1ac1aA8b83f2e0B

# Replace this after deploying the OpenZeppelin-secured sponsor-track version
# VITE_IMARA_CONTRACT_ADDRESS=<new_sponsor_track_deployment>
```

### New Files to Create

```
backend/
  src/Imara.sol                         ← core protocol contract
  test/Imara.t.sol                      ← foundry tests
  script/DeployImara.s.sol              ← deploy script

front-end/src/
  utils/imara.jsx                       ← ethers.js wrappers
  utils/imaraAbi.json                   ← compiled ABI
  components/CreateTask.jsx             ← create task form
  components/TaskList.jsx               ← browse tasks
  components/TaskDetail.jsx             ← task view + join + submit + verify
```

### Files to Edit

```
front-end/src/App.jsx                   ← add 3 routes
front-end/src/components/Home.jsx       ← add "Tasks" nav link
front-end/.env.local                    ← add VITE_IMARA_CONTRACT_ADDRESS
```

### Network Config (add to MetaMask)

```
Network Name:  Polkadot Hub TestNet
RPC URL:       https://eth-rpc-testnet.polkadot.io/
Chain ID:      420420417
Symbol:        PAS
Explorer:      https://blockscout-testnet.polkadot.io/
```

---

## 9. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Polkadot Hub TestNet RPC is down/slow | Medium | High | Have Sepolia as fallback RPC — same contract deploys there |
| MetaMask rejects custom network | Low | Medium | Use `wallet_addEthereumChain` programmatically in `imara.jsx` |
| PAS faucet dry | Medium | High | Use two MetaMask accounts, fund both from faucet early |
| `getAllTasks()` too expensive (large array) | Low | Low | Cap demo at <10 tasks; not a real issue for hackathon |
| Reentrancy on ETH transfer | Low | Medium | Addressed in the repo with OpenZeppelin `ReentrancyGuard`; redeploy required to get that protection on-chain |
| ETH amount mismatch on join | Medium | Low | Frontend reads `stakeRequired` from contract and passes exact value |

---

## 10. Demo Script (2 minutes)

1. **Show contract** on Polkadot Hub TestNet Blockscout — "This is live on Polkadot Hub EVM"
2. **Wallet A** opens `/tasks/create` — fills form, sets 0.01 PAS stake, 1-hour deadline — submits
3. Task appears in `/tasks` list
4. **Switch to Wallet B** — click task — click "Stake & Join" — approve MetaMask transaction
5. Wallet B types proof link — clicks "Submit Work"
6. **Switch back to Wallet A** — see proof link — click "Approve"
7. Show Wallet B's balance increased by 0.01 PAS — **stake returned, commitment honored**
8. Create second task — B joins — B submits — A clicks "Reject" — show stake slashed
9. Close with: "Trustless accountability. Stake to commit. Fail and get slashed. Live on Polkadot."
