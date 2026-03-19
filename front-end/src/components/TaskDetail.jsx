import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Link as LinkIcon,
  RefreshCcw,
  Wallet,
  XCircle,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  connectWallet,
  formatTaskDeadline,
  formatTaskStake,
  getConnectedAddress,
  getTask,
  getTaskStatusLabel,
  isZeroAddress,
  parseContractError,
  reclaimExpiredTask,
  shortenAddress,
  stakeAndJoin,
  submitWork,
  verifyAndResolve,
} from '../utils/imara';

const statusClasses = {
  0: 'bg-sky-500/15 text-sky-300 border border-sky-500/30',
  1: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
  2: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  3: 'bg-rose-500/15 text-rose-300 border border-rose-500/30',
};

function TaskDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const taskId = Number(id);

  const [task, setTask] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);
  const [proofInput, setProofInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;

    const loadTask = async () => {
      if (!Number.isFinite(taskId)) {
        setError('Invalid task id');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const [taskData, connectedAddress] = await Promise.all([
          getTask(taskId),
          getConnectedAddress(),
        ]);

        if (!ignore) {
          setTask(taskData);
          setWalletAddress(connectedAddress);
          setProofInput(taskData.proofLink || '');
        }
      } catch (loadError) {
        if (!ignore) {
          setError(parseContractError(loadError));
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadTask();

    const handleAccountsChanged = (accounts) => {
      setWalletAddress(accounts[0] ?? null);
    };

    if (window.ethereum?.on) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
    }

    return () => {
      ignore = true;

      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, [taskId]);

  const refreshTask = async () => {
    setLoading(true);
    setError('');

    try {
      const taskData = await getTask(taskId);
      setTask(taskData);
      setProofInput(taskData.proofLink || '');
    } catch (refreshError) {
      setError(parseContractError(refreshError));
    } finally {
      setLoading(false);
    }
  };

  const handleConnectWallet = async () => {
    setConnecting(true);
    setError('');

    try {
      await connectWallet();
      setWalletAddress(await getConnectedAddress());
    } catch (connectError) {
      setError(parseContractError(connectError));
    } finally {
      setConnecting(false);
    }
  };

  const runAction = async (action) => {
    setActionLoading(true);
    setError('');

    try {
      await action();
      await refreshTask();
    } catch (actionError) {
      setError(parseContractError(actionError));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <TaskFrame navigate={navigate}>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-gray-300">
          Loading task details...
        </div>
      </TaskFrame>
    );
  }

  if (error && !task) {
    return (
      <TaskFrame navigate={navigate}>
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-5 text-rose-200">
          {error}
        </div>
      </TaskFrame>
    );
  }

  if (!task) {
    return (
      <TaskFrame navigate={navigate}>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-gray-300">
          Task not found.
        </div>
      </TaskFrame>
    );
  }

  const normalizedWallet = walletAddress?.toLowerCase();
  const isCreator = normalizedWallet && normalizedWallet === task.creator.toLowerCase();
  const isParticipant = normalizedWallet && !isZeroAddress(task.participant) && normalizedWallet === task.participant.toLowerCase();
  const isOpen = task.status === 0;
  const isInProgress = task.status === 1;
  const deadlinePassed = task.deadline <= Math.floor(Date.now() / 1000);
  const proofSubmitted = Boolean(task.proofLink);

  return (
    <TaskFrame navigate={navigate}>
      {error ? (
        <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="mb-8 flex flex-col gap-5 rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur-sm lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-sm uppercase tracking-[0.25em] text-gray-400">Task #{task.id}</div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="text-4xl font-bold">{task.title}</h1>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusClasses[task.status]}`}>
              {getTaskStatusLabel(task.status)}
            </span>
          </div>
          <p className="mt-4 max-w-3xl text-gray-300">{task.description}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-gray-300">
            {walletAddress ? `Wallet ${shortenAddress(walletAddress)}` : 'Read-only mode'}
          </div>
          <button
            type="button"
            onClick={handleConnectWallet}
            disabled={connecting}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Wallet className="h-4 w-4" />
            {connecting ? 'Connecting...' : walletAddress ? 'Switch Wallet' : 'Connect Wallet'}
          </button>
          <button
            type="button"
            onClick={refreshTask}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium transition hover:bg-white/10"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <h2 className="text-xl font-semibold">Task Details</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <TaskMeta label="Stake Required" value={formatTaskStake(task.stakeRequired)} />
              <TaskMeta label="Deadline" value={formatTaskDeadline(task.deadline)} />
              <TaskMeta label="Creator" value={shortenAddress(task.creator)} />
              <TaskMeta label="Participant" value={shortenAddress(task.participant)} />
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <h2 className="text-xl font-semibold">Proof of Work</h2>
            {proofSubmitted ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm text-gray-400">
                  <LinkIcon className="h-4 w-4" />
                  Submitted proof
                </div>
                {isLikelyUrl(task.proofLink) ? (
                  <a
                    href={task.proofLink}
                    target="_blank"
                    rel="noreferrer"
                    className="break-all text-blue-300 transition hover:text-blue-200"
                  >
                    {task.proofLink}
                  </a>
                ) : (
                  <p className="whitespace-pre-wrap text-gray-200">{task.proofLink}</p>
                )}
              </div>
            ) : (
              <p className="mt-4 text-gray-300">
                No proof submitted yet.
              </p>
            )}
          </section>

          {task.status === 2 ? (
            <Banner
              tone="success"
              icon={<CheckCircle2 className="h-5 w-5" />}
              title="Task completed"
              description="The creator approved the submission and the participant’s stake was returned."
            />
          ) : null}

          {task.status === 3 ? (
            <Banner
              tone="danger"
              icon={<XCircle className="h-5 w-5" />}
              title={isZeroAddress(task.participant) ? 'Task expired' : 'Task failed'}
              description={
                isZeroAddress(task.participant)
                  ? 'The creator reclaimed an expired open task with no participant.'
                  : 'The creator rejected the submission and the participant’s stake remains slashed in the contract.'
              }
            />
          ) : null}
        </div>

        <div className="space-y-6">
          {isOpen && !isCreator ? (
            <ActionCard
              title="Join Task"
              description="Stake the required amount to commit yourself to this task."
            >
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => runAction(() => stakeAndJoin(task.id, task.stakeRequired))}
                className="w-full rounded-2xl bg-blue-500 px-5 py-3 font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionLoading ? 'Joining...' : `Stake & Join for ${formatTaskStake(task.stakeRequired)}`}
              </button>
            </ActionCard>
          ) : null}

          {isOpen && isCreator && deadlinePassed ? (
            <ActionCard
              title="Reclaim Expired Task"
              description="No participant joined before the deadline, so the creator can close the task."
            >
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => runAction(() => reclaimExpiredTask(task.id))}
                className="w-full rounded-2xl bg-rose-500 px-5 py-3 font-semibold text-white transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionLoading ? 'Reclaiming...' : 'Reclaim Expired Task'}
              </button>
            </ActionCard>
          ) : null}

          {isInProgress && isParticipant && !proofSubmitted ? (
            <ActionCard
              title="Submit Work"
              description="Submit a proof link or text summary before the deadline."
            >
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  runAction(() => submitWork(task.id, proofInput.trim()));
                }}
                className="space-y-4"
              >
                <textarea
                  value={proofInput}
                  onChange={(event) => setProofInput(event.target.value)}
                  className="h-36 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-blue-400"
                  placeholder="Paste a GitHub PR, a demo link, or a text summary of the work delivered."
                  required
                />
                <button
                  type="submit"
                  disabled={actionLoading || !proofInput.trim()}
                  className="w-full rounded-2xl bg-blue-500 px-5 py-3 font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {actionLoading ? 'Submitting...' : 'Submit Proof'}
                </button>
              </form>
            </ActionCard>
          ) : null}

          {isInProgress && isParticipant && proofSubmitted ? (
            <ActionCard
              title="Waiting for Review"
              description="Your proof is on-chain. The task creator can now approve or reject it."
            >
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                Submission received. Awaiting creator verification.
              </div>
            </ActionCard>
          ) : null}

          {isInProgress && isCreator && proofSubmitted ? (
            <ActionCard
              title="Verify Submission"
              description="Approve to refund the participant’s stake, or reject to slash it."
            >
              <div className="grid gap-3">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => runAction(() => verifyAndResolve(task.id, true))}
                  className="w-full rounded-2xl bg-emerald-500 px-5 py-3 font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {actionLoading ? 'Resolving...' : 'Approve Submission'}
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => runAction(() => verifyAndResolve(task.id, false))}
                  className="w-full rounded-2xl bg-rose-500 px-5 py-3 font-semibold text-white transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {actionLoading ? 'Resolving...' : 'Reject Submission'}
                </button>
              </div>
            </ActionCard>
          ) : null}

          {isInProgress && isCreator && !proofSubmitted ? (
            <ActionCard
              title="Awaiting Submission"
              description="The participant has joined, but they have not submitted proof yet."
            >
              <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
                <Clock3 className="mt-0.5 h-4 w-4 flex-shrink-0" />
                Check back after the participant submits their proof of work.
              </div>
            </ActionCard>
          ) : null}

          {!walletAddress ? (
            <ActionCard
              title="Read-Only View"
              description="Connect a wallet if you want to create, join, submit, or resolve tasks."
            >
              <button
                type="button"
                onClick={handleConnectWallet}
                disabled={connecting}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {connecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            </ActionCard>
          ) : null}

          {deadlinePassed && task.status === 0 && !isCreator ? (
            <ActionCard
              title="Task Past Deadline"
              description="This task is still open on-chain, but the deadline has already passed."
            >
              <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                Only the creator can close it with the reclaim action.
              </div>
            </ActionCard>
          ) : null}
        </div>
      </div>
    </TaskFrame>
  );
}

function TaskFrame({ children, navigate }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-800 text-white">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
      </div>

      <div className="relative container mx-auto px-4 py-8">
        <button
          type="button"
          onClick={() => navigate('/tasks')}
          className="mb-6 inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to task board
        </button>
        {children}
      </div>
    </div>
  );
}

function TaskMeta({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
      <div className="text-xs uppercase tracking-[0.2em] text-gray-500">{label}</div>
      <div className="mt-2 text-sm text-gray-200">{value}</div>
    </div>
  );
}

function ActionCard({ title, description, children }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-gray-300">{description}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Banner({ tone, icon, title, description }) {
  const toneClasses = tone === 'success'
    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
    : 'border-rose-500/30 bg-rose-500/10 text-rose-100';

  return (
    <section className={`rounded-3xl border p-5 ${toneClasses}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{icon}</div>
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="mt-2">{description}</p>
        </div>
      </div>
    </section>
  );
}

function isLikelyUrl(value) {
  return /^https?:\/\//i.test(value);
}

export default TaskDetail;
