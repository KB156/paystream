const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);

    try {
        console.log(
            "Account balance:",
            (await hre.ethers.provider.getBalance(deployer.address)).toString()
        );
    } catch (e) {
        console.log("Could not fetch balance (might be restricted RPC).");
    }

    // ── 1. Determine Token Address (Mock vs Real vs Custom Wrapped) ──
    if (hre.network.name === "hela") {
        console.log("🚀 Deploying to HeLa Testnet (Native Mode)...");
    } else {
        console.log("🛠  Deploying to Local/Dev Network (Native Mode)...");
    }

    // ── 2. Deploy TaxVault ──
    const TaxVault = await hre.ethers.getContractFactory("TaxVault");
    const taxVault = await TaxVault.deploy(deployer.address); // No token arg
    await taxVault.waitForDeployment();
    const taxVaultAddress = await taxVault.getAddress();
    console.log("TaxVault  deployed to:", taxVaultAddress);

    // ── 3. Deploy PayStream (10% tax = 1000 basis points) ──
    const PayStream = await hre.ethers.getContractFactory("PayStream");
    const taxBasisPoints = 1000; // 10%
    const payStream = await PayStream.deploy(
        taxVaultAddress,
        taxBasisPoints
    ); // No token arg
    await payStream.waitForDeployment();
    const payStreamAddress = await payStream.getAddress();
    console.log("PayStream deployed to:", payStreamAddress);

    // ── 4. Export ABIs to shared/abi/ ──
    const abiDir = path.join(__dirname, "..", "shared", "abi");
    if (!fs.existsSync(abiDir)) {
        fs.mkdirSync(abiDir, { recursive: true });
    }

    const contracts = ["PayStream", "TaxVault"];
    for (const name of contracts) {
        try {
            const artifact = await hre.artifacts.readArtifact(name);
            const abiPath = path.join(abiDir, `${name}.json`);
            fs.writeFileSync(
                abiPath,
                JSON.stringify({ abi: artifact.abi, contractName: name }, null, 2)
            );
            console.log(`ABI exported: ${abiPath}`);
        } catch (e) {
            console.log(`Note: ABI export for ${name} skipped or failed (if it was intended).`);
        }
    }

    // ── 5. Write deployment addresses ──
    const addressesPath = path.join(abiDir, "addresses.json");
    let existingAddresses = {};

    // Read existing file if it exists
    if (fs.existsSync(addressesPath)) {
        try {
            existingAddresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
        } catch (e) {
            console.warn("Could not parse existing addresses.json, starting fresh.");
        }
    }

    // Get Chain ID
    const network = await hre.ethers.provider.getNetwork();
    const chainId = network.chainId.toString();

    // Prepare new data
    const newDeployment = {
        token: "", // Native Mode
        taxVault: taxVaultAddress,
        payStream: payStreamAddress,
        network: hre.network.name,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
    };

    // Update specific chain ID
    existingAddresses[chainId] = newDeployment;

    fs.writeFileSync(addressesPath, JSON.stringify(existingAddresses, null, 2));
    console.log(`Deployment addresses for Chain ID ${chainId} saved to:`, addressesPath);

    console.log("\n✅ Deployment complete! (Native Currency Mode)\n");
    console.log("Contract Addresses:");
    console.log("─────────────────────────────────");
    console.log(`  TaxVault  : ${taxVaultAddress}`);
    console.log(`  PayStream : ${payStreamAddress}`);
    console.log("─────────────────────────────────");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
