const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 Generating Submission Transactions on HeLa Testnet...");

    // Load Addresses
    const addressesPath = path.join(__dirname, "..", "shared", "abi", "addresses.json");
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
    const PAYSTREAM_ADDRESS = addresses.payStream;

    if (!PAYSTREAM_ADDRESS) {
        throw new Error("❌ PayStream address not found. Deploy first.");
    }

    const [deployer] = await hre.ethers.getSigners();
    console.log(`👤 interacting with: ${deployer.address}`);

    const PayStream = await hre.ethers.getContractAt("PayStream", PAYSTREAM_ADDRESS);

    const txHashes = {};

    // ── 1. Fund Treasury (Analogue to "Post" or "Tip" - Adding value) ──
    console.log("\n1️⃣  Funding Treasury...");
    const fundAmount = hre.ethers.parseEther("0.01"); // Small amount
    const fundTx = await PayStream.fundContract({ value: fundAmount });
    console.log(`   Hash: ${fundTx.hash}`);
    await fundTx.wait();
    txHashes.fund = fundTx.hash;

    // ── 2. Create Stream (Analogue to "Post" - Creating content/stream) ──
    console.log("\n2️⃣  Creating Stream...");
    // Stream to self for simplicity in this script, or a random address
    const recipient = "0x000000000000000000000000000000000000dEaD";
    const rate = hre.ethers.parseEther("0.00001"); // per second
    const createTx = await PayStream.createStream(recipient, rate);
    console.log(`   Hash: ${createTx.hash}`);
    const receipt = await createTx.wait();
    txHashes.createStream = createTx.hash;

    // Get stream ID from event
    // The event is StreamCreated(uint256 indexed streamId, ...)
    // Simpler: just ask for count - 1
    const count = await PayStream.getStreamCount();
    const streamId = count - 1n;
    console.log(`   Created Stream ID: ${streamId}`);

    // ── 3. Withdraw (Analogue to "Like/Tip" - value transfer) ──
    // Note: We can only withdraw if WE are the employee.
    // In step 2, I made the recipient "dEaD". Using 'deployer' as recipient to allow withdraw.
    console.log("\n3️⃣  Creating Self-Stream for Withdrawal...");
    const selfStreamTx = await PayStream.createStream(deployer.address, rate);
    await selfStreamTx.wait();
    const selfStreamId = await PayStream.getStreamCount() - 1n;

    console.log("   Waiting 5 seconds for accrual...");
    await new Promise(r => setTimeout(r, 5000));

    console.log("   Withdrawing...");
    const withdrawTx = await PayStream.withdraw(selfStreamId);
    console.log(`   Hash: ${withdrawTx.hash}`);
    await withdrawTx.wait();
    txHashes.withdraw = withdrawTx.hash;

    // ── Save Results ──
    console.log("\n✅ Transactions Generated!");
    console.table(txHashes);

    fs.writeFileSync(
        path.join(__dirname, "..", "submission_txs.json"),
        JSON.stringify(txHashes, null, 2)
    );
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
