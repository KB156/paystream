import { ethers } from 'ethers';
import PayStreamABI from '../../../../shared/abi/PayStream.json';
import TaxVaultABI from '../../../../shared/abi/TaxVault.json';

// Default addresses for local hardhat deployment — overwritten dynamically
let PAYSTREAM_ADDRESS = '';
let TAX_VAULT_ADDRESS = '';

// Try to load addresses from deployment
try {
    const addresses = await import('../../../../shared/abi/addresses.json');
    PAYSTREAM_ADDRESS = addresses.payStream || '';
    TAX_VAULT_ADDRESS = addresses.taxVault || '';
} catch (e) {
    console.warn('No deployment addresses found. Please deploy contracts first.');
}

export function getProvider() {
    if (window.ethereum) {
        return new ethers.BrowserProvider(window.ethereum);
    }
    // Fallback to HeLa Testnet Public RPC
    return new ethers.JsonRpcProvider('https://testnet-rpc.helachain.com');
}

export async function getSigner() {
    const provider = getProvider();
    return provider.getSigner();
}

export async function switchToHeLaNetwork() {
    if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask is not installed');
    }

    const chainId = '0xA2D08'; // 666888 in hex (HeLa Testnet)

    try {
        // Try to switch to the network
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId }],
        });
    } catch (switchError) {
        // If the network doesn't exist, add it
        if (switchError.code === 4902) {
            try {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId,
                        chainName: 'HeLa Testnet',
                        nativeCurrency: {
                            name: 'HLUSD',
                            symbol: 'HLUSD',
                            decimals: 18
                        },
                        rpcUrls: ['https://testnet-rpc.helachain.com'],
                        blockExplorerUrls: ['https://testnet-blockexplorer.helachain.com']
                    }],
                });
            } catch (addError) {
                console.error('Add chain error:', addError);
                throw new Error('Failed to add HeLa Testnet to MetaMask');
            }
        } else {
            throw switchError;
        }
    }
}

export async function connectWallet() {
    console.log('Attempting to connect wallet...');

    if (typeof window.ethereum === 'undefined') {
        console.error('MetaMask not detected!');
        throw new Error('MetaMask is not installed. Please install the browser extension from metamask.io');
    }

    // First, try to switch to HeLa network
    try {
        await switchToHeLaNetwork();
        console.log('✅ Switched to HeLa Testnet');
    } catch (err) {
        console.warn('Could not switch network:', err);
        throw new Error('Please manually switch MetaMask to HeLa Testnet (Chain ID: 666888)');
    }

    const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
    });
    console.log('Connected account:', accounts[0]);
    return accounts[0];
}

export async function getPayStreamContract(signerOrProvider) {
    return new ethers.Contract(PAYSTREAM_ADDRESS, PayStreamABI.abi, signerOrProvider);
}

export async function getTaxVaultContract(signerOrProvider) {
    return new ethers.Contract(TAX_VAULT_ADDRESS, TaxVaultABI.abi, signerOrProvider);
}

// ── Write Functions ──

export async function createStream(employeeAddress, ratePerSecond) {
    const signer = await getSigner();
    const contract = await getPayStreamContract(signer);
    const rateWei = ethers.parseEther(ratePerSecond.toString());
    const tx = await contract.createStream(employeeAddress, rateWei);
    await tx.wait();
    return tx;
}

export async function pauseStream(streamId) {
    const signer = await getSigner();
    const contract = await getPayStreamContract(signer);
    const tx = await contract.pauseStream(streamId);
    await tx.wait();
    return tx;
}

export async function resumeStream(streamId) {
    const signer = await getSigner();
    const contract = await getPayStreamContract(signer);
    const tx = await contract.resumeStream(streamId);
    await tx.wait();
    return tx;
}

export async function cancelStream(streamId) {
    const signer = await getSigner();
    const contract = await getPayStreamContract(signer);
    const tx = await contract.cancelStream(streamId);
    await tx.wait();
    return tx;
}

export async function fundContract(amount) {
    const signer = await getSigner();
    const contract = await getPayStreamContract(signer);
    const amountWei = ethers.parseEther(amount.toString());

    // 1. Check Native Balance
    // We use signer.provider (or getProvider) to check native balance
    const provider = signer.provider || getProvider();
    // Wait, signer.provider is reliably available if connected

    // Explicitly get address to check balance
    const userAddress = await signer.getAddress();
    const balance = await provider.getBalance(userAddress);
    console.log(`Current Native Balance: ${ethers.formatEther(balance)} HLUSD`);

    if (balance < amountWei) {
        alert(`❌ Insufficient Funds! You have ${ethers.formatEther(balance)} HLUSD but need ${amount}.`);
        throw new Error('Insufficient funds');
    }

    // 2. Fund Contract (Native Transfer)
    console.log(`Funding contract with ${amount} HLUSD...`);

    // In Native Mode, fundContract is payable. We send value directly.
    const fundTx = await contract.fundContract({ value: amountWei, gasLimit: 500000 });
    await fundTx.wait();
    return fundTx;
}

export async function setTaxRate(basisPoints) {
    const signer = await getSigner();
    const contract = await getPayStreamContract(signer);
    const tx = await contract.setTaxRate(basisPoints);
    await tx.wait();
    return tx;
}

export async function approveStreamRequest(requestId) {
    const signer = await getSigner();
    const contract = await getPayStreamContract(signer);
    const tx = await contract.approveStreamRequest(requestId);
    await tx.wait();
    return tx;
}

export async function rejectStreamRequest(requestId) {
    const signer = await getSigner();
    const contract = await getPayStreamContract(signer);
    const tx = await contract.rejectStreamRequest(requestId);
    await tx.wait();
    return tx;
}

export async function awardBonus(employeeAddress, amount) {
    const signer = await getSigner();
    const contract = await getPayStreamContract(signer);
    const amountWei = ethers.parseEther(amount.toString());
    const tx = await contract.awardBonus(employeeAddress, amountWei);
    await tx.wait();
    return tx;
}

// ── Read Functions ──

export async function getStreamCount() {
    const provider = getProvider();
    const contract = await getPayStreamContract(provider);
    const count = await contract.getStreamCount();
    return Number(count);
}

export async function getStream(streamId) {
    const provider = getProvider();
    const contract = await getPayStreamContract(provider);
    return contract.getStream(streamId);
}

export async function getAllStreams() {
    const count = await getStreamCount();
    const streams = [];
    for (let i = 0; i < count; i++) {
        const s = await getStream(i);
        streams.push({
            id: i,
            employer: s.employer,
            employee: s.employee,
            ratePerSecond: s.ratePerSecond,
            lastClaimTime: Number(s.lastClaimTime),
            active: s.active,
        });
    }
    return streams;
}

export async function calculateAccrued(streamId) {
    const provider = getProvider();
    const contract = await getPayStreamContract(provider);
    return contract.calculateAccrued(streamId);
}

export async function getEmployeeStreams(employeeAddress) {
    const count = await getStreamCount();
    const streams = [];
    for (let i = 0; i < count; i++) {
        const s = await getStream(i);
        if (s.employee.toLowerCase() === employeeAddress.toLowerCase()) {
            streams.push({
                id: i,
                employer: s.employer,
                employee: s.employee,
                ratePerSecond: s.ratePerSecond,
                lastClaimTime: Number(s.lastClaimTime),
                active: s.active,
            });
        }
    }
    return streams;
}

export async function withdraw(streamId) {
    const signer = await getSigner();
    const contract = await getPayStreamContract(signer);
    // Explicit gas limit to prevent RPC estimation errors on HeLa
    const tx = await contract.withdraw(streamId, { gasLimit: 500000 });
    await tx.wait();
    return tx;
}

export async function requestStreamStart(ratePerSecond) {
    const signer = await getSigner();
    const contract = await getPayStreamContract(signer);
    const rateWei = ethers.parseEther(ratePerSecond.toString());
    const tx = await contract.requestStreamStart(rateWei);
    await tx.wait();
    return tx;
}

export async function getMyPendingRequests(employeeAddress) {
    const provider = getProvider();
    const contract = await getPayStreamContract(provider);
    const { requestIds, requests } = await contract.getPendingRequests();

    // Filter for this employee's requests
    const myRequests = [];
    for (let i = 0; i < requests.length; i++) {
        if (requests[i].employee.toLowerCase() === employeeAddress.toLowerCase()) {
            myRequests.push({
                id: Number(requestIds[i]),
                employee: requests[i].employee,
                ratePerSecond: requests[i].ratePerSecond,
                timestamp: Number(requests[i].timestamp),
                processed: requests[i].processed,
            });
        }
    }
    return myRequests;
}

/**
 * @notice Returns the Native HLUSD balance of the address.
 * Replaces old ERC20 logic.
 */
export async function getTokenBalance(address) {
    const provider = getProvider();
    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance);
}

export async function getTreasuryBalance() {
    const provider = getProvider();
    const contract = await getPayStreamContract(provider);
    // Returns address(this).balance
    const balance = await contract.getTreasuryBalance();
    return ethers.formatEther(balance);
}

export async function getTaxRate() {
    const provider = getProvider();
    const contract = await getPayStreamContract(provider);
    const rate = await contract.taxBasisPoints();
    return Number(rate);
}

export async function getTaxVaultBalance() {
    const provider = getProvider();
    const vault = await getTaxVaultContract(provider);
    const balance = await vault.getBalance();
    return ethers.formatEther(balance);
}

export async function getPendingRequests() {
    const provider = getProvider();
    const contract = await getPayStreamContract(provider);
    const { requestIds, requests } = await contract.getPendingRequests();

    const pendingRequests = [];
    for (let i = 0; i < requests.length; i++) {
        pendingRequests.push({
            id: Number(requestIds[i]),
            employee: requests[i].employee,
            ratePerSecond: requests[i].ratePerSecond,
            timestamp: Number(requests[i].timestamp),
            processed: requests[i].processed,
        });
    }
    return pendingRequests;
}

export function formatAddress(address) {
    if (!address) return '';
    return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function formatRate(rateWei) {
    return ethers.formatEther(rateWei);
}

export { ethers };
