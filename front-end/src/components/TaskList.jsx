import React, { useEffect, useState } from 'react';
import { ArrowRight, Briefcase, PlusCircle, RefreshCcw, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  connectWallet,
  formatTaskDeadline,
  formatTaskStake,
  getAllTasks,
  getConnectedAddress,
  getTaskStatusLabel,
  parseContractError,
  shortenAddress,
} from '../utils/imara';

const statusClasses = {
  0: 'bg-sky-500/15 text-sky-300 border border-sky-500/30',
  1: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
  2: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  3: 'bg-rose-500/15 text-rose-300 border border-rose-500/30',
};

function TaskList() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [walletAddress, setWalletAddress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');

  const loadTasks = async ({ keepLoading = true } = {}) => {
    if (keepLoading) {
      setLoading(true);
    }

    setError('');

    try {
      const [taskData, connectedAddress] = await Promise.all([
        getAllTasks(),
        getConnectedAddress(),
      ]);

      setTasks(taskData);
      setWalletAddress(connectedAddress);
    } catch (loadError) {
      setError(parseContractError(loadError));
    } finally {
      if (keepLoading) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    let ignore = false;

    loadTasks();

    const handleAccountsChanged = (accounts) => {
      if (!ignore) {
        setWalletAddress(accounts[0] ?? null);
      }
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
  }, []);

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

  const statusCounts = tasks.reduce(
    (counts, task) => {
      counts[task.status] += 1;
      return counts;
    },
    [0, 0, 0, 0],
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-800 text-white">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
      </div>

      <div className="relative container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="mb-4 text-sm text-gray-400 transition-colors hover:text-white"
            >
              Back to IMARA
            </button>
            <h1 className="text-4xl font-bold">Commitment Tasks</h1>
            <p className="mt-3 max-w-2xl text-gray-300">
              Stake to commit, submit work on-chain, and resolve tasks through a creator-verified MVP flow.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-300">
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
              onClick={() => navigate('/tasks/create')}
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-400"
            >
              <PlusCircle className="h-4 w-4" />
              Create Task
            </button>
          </div>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-4">
          {[
            { label: 'Open', value: statusCounts[0] },
            { label: 'In Progress', value: statusCounts[1] },
            { label: 'Completed', value: statusCounts[2] },
            { label: 'Failed', value: statusCounts[3] },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
            >
              <div className="text-sm text-gray-400">{item.label}</div>
              <div className="mt-2 text-3xl font-semibold">{item.value}</div>
            </div>
          ))}
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Task Board</h2>
          <button
            type="button"
            onClick={() => loadTasks({ keepLoading: false })}
            className="inline-flex items-center gap-2 text-sm text-gray-300 transition hover:text-white"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {error ? (
          <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-5 text-rose-200">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-gray-300">
            Loading tasks from Polkadot Hub EVM...
          </div>
        ) : null}

        {!loading && !error && tasks.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-300">
              <Briefcase className="h-7 w-7" />
            </div>
            <h3 className="text-2xl font-semibold">No tasks yet</h3>
            <p className="mt-3 text-gray-300">
              Create the first commitment task to start the demo flow.
            </p>
            <button
              type="button"
              onClick={() => navigate('/tasks/create')}
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-blue-500 px-5 py-3 font-semibold text-white transition hover:bg-blue-400"
            >
              <PlusCircle className="h-4 w-4" />
              Create the first task
            </button>
          </div>
        ) : null}

        {!loading && !error && tasks.length > 0 ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {tasks.map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() => navigate(`/tasks/${task.id}`)}
                className="group rounded-3xl border border-white/10 bg-white/5 p-6 text-left backdrop-blur-sm transition hover:-translate-y-1 hover:border-blue-400/40 hover:bg-white/10"
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm uppercase tracking-[0.25em] text-gray-500">
                      Task #{task.id}
                    </div>
                    <h3 className="mt-2 text-2xl font-semibold text-white">{task.title}</h3>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusClasses[task.status]}`}>
                    {getTaskStatusLabel(task.status)}
                  </span>
                </div>

                <p className="mb-6 line-clamp-3 text-gray-300">
                  {task.description}
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  <TaskMeta label="Stake Required" value={formatTaskStake(task.stakeRequired)} />
                  <TaskMeta label="Deadline" value={formatTaskDeadline(task.deadline)} />
                  <TaskMeta label="Creator" value={shortenAddress(task.creator)} />
                  <TaskMeta label="Participant" value={shortenAddress(task.participant)} />
                </div>

                <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-blue-300 transition group-hover:text-blue-200">
                  View details
                  <ArrowRight className="h-4 w-4" />
                </div>
              </button>
            ))}
          </div>
        ) : null}
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

export default TaskList;
