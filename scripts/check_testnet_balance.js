const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
    const rpcUrl = process.env.HELA_RPC_URL || "https://testnet-rpc.helachain.com";
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
        console.error("❌ No PRIVATE_KEY found in .env");
        process.exit(1);
    }

    const wallet = new ethers.Wallet(privateKey, provider);
    console.log(`Checking balance for: ${wallet.address}`);
    console.log(`Network: HeLa Testnet (${rpcUrl})`);

    try {
        const balance = await provider.getBalance(wallet.address);
        console.log(`\n💰 Balance: ${ethers.formatEther(balance)} HLUSD`);

        if (balance === 0n) {
            console.log("❌ You have 0 HLUSD on Testnet. Please fund your wallet via the Faucet.");
        } else {
            console.log("✅ You have funds! Ready to deploy.");
        }
    } catch (error) {
        console.error("Error connecting to Testnet:", error.message);
    }
}

main();
