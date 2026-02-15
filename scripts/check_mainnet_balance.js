const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
    const rpcUrl = "https://mainnet-rpc.helachain.com";
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
        console.error("❌ No PRIVATE_KEY found in .env");
        process.exit(1);
    }

    const wallet = new ethers.Wallet(privateKey, provider);
    console.log(`Checking balance for: ${wallet.address}`);
    console.log(`Network: HeLa Mainnet (${rpcUrl})`);

    try {
        const balance = await provider.getBalance(wallet.address);
        console.log(`\n💰 Balance: ${ethers.formatEther(balance)} HLUSD`);

        if (balance === 0n) {
            console.log("❌ You have 0 HLUSD on Mainnet.");
        } else {
            console.log("✅ You have funds!");
        }
    } catch (error) {
        console.error("Error connecting to Mainnet:", error.message);
    }
}

main();
