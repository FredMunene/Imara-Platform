import { ethers } from 'ethers';
import imaraAbi from './imaraAbi.json';

export const POLKADOT_HUB_NETWORK = {
  chainId: '0x190f1b41',
  chainName: 'Polkadot Hub TestNet',
  nativeCurrency: {
    name: 'Paseo',
    symbol: 'PAS',
    decimals: 18,
  },
  rpcUrls: ['https://eth-rpc-testnet.polkadot.io/'],
  blockExplorerUrls: ['https://blockscout-testnet.polkadot.io/'],
};

export const TASK_STATUS_LABELS = ['Open', 'In Progress', 'Completed', 'Failed'];

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

function getContractAddress() {
  const contractAddress = import.meta.env.VITE_IMARA_CONTRACT_ADDRESS;

  if (!contractAddress) {
    throw new Error('Missing VITE_IMARA_CONTRACT_ADDRESS in front-end/.env.local');
  }

  return contractAddress;
}

function normalizeBigNumber(value, fallback = '0') {
  if (!value) {
    return fallback;
  }

  if (ethers.BigNumber.isBigNumber(value)) {
    return value.toString();
  }

  return String(value);
}

function normalizeTask(task) {
  return {
    id: Number(normalizeBigNumber(task.id)),
    creator: task.creator,
    title: task.title,
    description: task.description,
    stakeRequired: normalizeBigNumber(task.stakeRequired),
    deadline: Number(normalizeBigNumber(task.deadline)),
    participant: task.participant,
    proofLink: task.proofLink,
    status: Number(task.status),
    resolved: Boolean(task.resolved),
  };
}

function getReadProvider() {
  return new ethers.providers.JsonRpcProvider(POLKADOT_HUB_NETWORK.rpcUrls[0]);
}

async function getInjectedProvider() {
  if (!window.ethereum) {
    throw new Error('MetaMask is required for wallet actions');
  }

  return new ethers.providers.Web3Provider(window.ethereum);
}

export async function getConnectedAddress() {
  if (!window.ethereum) {
    return null;
  }

  const accounts = await window.ethereum.request({ method: 'eth_accounts' });
  return accounts[0] ?? null;
}

export async function connectWallet() {
  const provider = await getInjectedProvider();
  await provider.send('eth_requestAccounts', []);
  return provider;
}

export async function addPolkadotHubNetwork() {
  if (!window.ethereum) {
    throw new Error('MetaMask is required for wallet actions');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: POLKADOT_HUB_NETWORK.chainId }],
    });
  } catch (error) {
    if (error?.code !== 4902) {
      throw error;
    }

    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [POLKADOT_HUB_NETWORK],
    });
  }
}

function getReadContract() {
  return new ethers.Contract(getContractAddress(), imaraAbi, getReadProvider());
}

async function getWriteContract() {
  await connectWallet();
  await addPolkadotHubNetwork();

  const provider = await getInjectedProvider();
  const signer = provider.getSigner();

  return new ethers.Contract(getContractAddress(), imaraAbi, signer);
}

export async function createTask(title, description, stakeEth, deadlineTimestamp) {
  const contract = await getWriteContract();
  const tx = await contract.createTask(
    title,
    description,
    ethers.utils.parseEther(stakeEth),
    deadlineTimestamp,
  );
  const receipt = await tx.wait();
  const createdEvent = receipt.events?.find((event) => event.event === 'TaskCreated');

  return {
    receipt,
    taskId: createdEvent?.args?.taskId?.toNumber?.() ?? null,
  };
}

export async function stakeAndJoin(taskId, stakeWei) {
  const contract = await getWriteContract();
  const tx = await contract.stakeAndJoin(taskId, { value: stakeWei });
  return tx.wait();
}

export async function submitWork(taskId, proofLink) {
  const contract = await getWriteContract();
  const tx = await contract.submitWork(taskId, proofLink);
  return tx.wait();
}

export async function verifyAndResolve(taskId, approved) {
  const contract = await getWriteContract();
  const tx = await contract.verifyAndResolve(taskId, approved);
  return tx.wait();
}

export async function reclaimExpiredTask(taskId) {
  const contract = await getWriteContract();
  const tx = await contract.reclaimExpiredTask(taskId);
  return tx.wait();
}

export async function getAllTasks() {
  const contract = getReadContract();
  const tasks = await contract.getAllTasks();

  return tasks
    .map(normalizeTask)
    .sort((left, right) => right.id - left.id);
}

export async function getTask(taskId) {
  const contract = getReadContract();
  const task = await contract.getTask(taskId);
  return normalizeTask(task);
}

export function getTaskStatusLabel(status) {
  return TASK_STATUS_LABELS[status] ?? 'Unknown';
}

export function shortenAddress(address) {
  if (!address || address === ZERO_ADDRESS) {
    return 'Not assigned';
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function isZeroAddress(address) {
  return !address || address.toLowerCase() === ZERO_ADDRESS;
}

export function formatTaskStake(stakeWei) {
  const formatted = Number.parseFloat(ethers.utils.formatEther(stakeWei || '0'));

  if (!Number.isFinite(formatted)) {
    return '0 ETH';
  }

  if (formatted === 0) {
    return '0 ETH';
  }

  if (formatted < 0.001) {
    return `${formatted.toFixed(6).replace(/0+$/, '').replace(/\.$/, '')} ETH`;
  }

  return `${formatted.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')} ETH`;
}

export function formatTaskDeadline(deadlineSeconds) {
  if (!deadlineSeconds) {
    return 'No deadline';
  }

  return new Date(deadlineSeconds * 1000).toLocaleString();
}

export function toUnixTimestamp(datetimeValue) {
  return Math.floor(new Date(datetimeValue).getTime() / 1000);
}

export function parseContractError(error) {
  const rawMessage =
    error?.reason
    || error?.data?.message
    || error?.error?.message
    || error?.message
    || 'Transaction failed';

  return rawMessage
    .replace('execution reverted: ', '')
    .replace('Internal JSON-RPC error. ', '');
}
