import React, { useEffect, useState } from 'react';
import { ArrowLeft, CalendarClock, Coins, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  connectWallet,
  createTask,
  getConnectedAddress,
  parseContractError,
  shortenAddress,
  toUnixTimestamp,
} from '../utils/imara';

function CreateTask() {
  const navigate = useNavigate();
  const [walletAddress, setWalletAddress] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const defaultDeadline = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(12, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  })();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    stakeEth: '',
    deadline: defaultDeadline,
  });

  useEffect(() => {
    let ignore = false;

    const loadWalletAddress = async () => {
      try {
        const address = await getConnectedAddress();

        if (!ignore) {
          setWalletAddress(address);
        }
      } catch (loadError) {
        if (!ignore) {
          setError(parseContractError(loadError));
        }
      }
    };

    loadWalletAddress();

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const deadlineTimestamp = toUnixTimestamp(formData.deadline);

    if (!Number.isFinite(deadlineTimestamp) || deadlineTimestamp <= Math.floor(Date.now() / 1000)) {
      setError('Deadline must be in the future');
      return;
    }

    setSubmitting(true);

    try {
      const result = await createTask(
        formData.title.trim(),
        formData.description.trim(),
        formData.stakeEth.trim(),
        deadlineTimestamp,
      );

      navigate(result.taskId !== null ? `/tasks/${result.taskId}` : '/tasks');
    } catch (submitError) {
      setError(parseContractError(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-800 text-white">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute left-10 top-10 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-10 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
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

        <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
          <div className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-8 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm uppercase tracking-[0.25em] text-blue-300">Create Task</div>
              <h1 className="mt-3 text-4xl font-bold">Open a commitment-based task</h1>
              <p className="mt-3 max-w-xl text-gray-300">
                Define the task, required stake, and deadline. The task lives fully on-chain and the creator resolves the result.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-gray-300">
              {walletAddress ? `Creator ${shortenAddress(walletAddress)}` : 'Wallet required'}
            </div>
          </div>

          {error ? (
            <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-200">
              {error}
            </div>
          ) : null}

          {!walletAddress ? (
            <div className="rounded-3xl border border-dashed border-white/15 bg-black/20 p-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-300">
                <Wallet className="h-7 w-7" />
              </div>
              <h2 className="text-2xl font-semibold">Connect MetaMask to create a task</h2>
              <p className="mt-3 text-gray-300">
                The create flow writes directly to the deployed Imara contract on Polkadot Hub EVM.
              </p>
              <button
                type="button"
                onClick={handleConnectWallet}
                disabled={connecting}
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-blue-500 px-5 py-3 font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Wallet className="h-4 w-4" />
                {connecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-300">Task Title</span>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(event) => setFormData((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Ship the landing page, write the docs, integrate the wallet..."
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-blue-400"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-300">Description</span>
                <textarea
                  value={formData.description}
                  onChange={(event) => setFormData((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Describe the expected output and the proof the participant should submit."
                  className="h-40 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-blue-400"
                  required
                />
              </label>

              <div className="grid gap-6 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-300">
                    <Coins className="h-4 w-4 text-blue-300" />
                    Stake Required (ETH)
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.0001"
                    value={formData.stakeEth}
                    onChange={(event) => setFormData((current) => ({ ...current, stakeEth: event.target.value }))}
                    placeholder="0.01"
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-blue-400"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-300">
                    <CalendarClock className="h-4 w-4 text-blue-300" />
                    Deadline
                  </span>
                  <input
                    type="datetime-local"
                    value={formData.deadline}
                    min={new Date().toISOString().slice(0, 16)}
                    onChange={(event) => setFormData((current) => ({ ...current, deadline: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-blue-400"
                    required
                  />
                </label>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-gray-300">
                The creator is the verifier for this MVP. If the task is approved, the participant gets their stake back. If it is rejected, the stake remains slashed in the contract.
              </div>

              <div className="flex flex-col gap-3 pt-4 sm:flex-row">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-2xl bg-blue-500 px-5 py-3 font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? 'Creating task...' : 'Create Task'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/tasks')}
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-gray-200 transition hover:bg-white/10"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default CreateTask;
