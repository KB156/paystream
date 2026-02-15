# PayStream — Decentralized Payroll Streaming

> Stream ERC-20 salaries per-second. Employees withdraw anytime. Automatic tax deductions.

## Overview

PayStream enables employers to create per-second salary streams for employees. A configurable tax percentage (default 10%) is automatically deducted to a vault on every withdrawal. Built on Solidity ^0.8.20 with OpenZeppelin contracts.

## Quick Start

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9
- MetaMask browser extension (for frontend)

### 1. Install & Compile

```bash
cd paystream
npm install
npx hardhat compile
```

### 2. Run Tests

```bash
npx hardhat test
```

### 3. Local Deployment

```bash
# Terminal 1: Start local node
npx hardhat node

# Terminal 2: Deploy contracts
npx hardhat run scripts/deploy.js --network localhost
```

Deployed addresses and ABIs will be saved to `shared/abi/`.

### 4. Start HR Dashboard

```bash
cd frontend/hr-dashboard
npm install
npm run dev
# → http://localhost:3000
```

### 5. Start Employee Portal

```bash
cd frontend/employee-portal
npm install
npm run dev
# → http://localhost:3001
```

## Environment Variables

Copy `.env.example` to `.env` for HeLa testnet deployment:

| Variable | Description |
|----------|-------------|
| `PRIVATE_KEY` | Deployer private key (without 0x) |
| `HELA_RPC_URL` | HeLa testnet RPC endpoint |

## Project Structure

```
paystream/
├── contracts/
│   ├── PayStream.sol          # Main streaming contract
│   ├── TaxVault.sol           # Tax collection vault
│   ├── MockToken.sol          # Test ERC-20 token
│   ├── interfaces/
│   │   └── IPayStream.sol     # Contract interface
│   └── libraries/
│       └── StreamMath.sol     # Math library
├── scripts/
│   └── deploy.js              # Deployment + ABI export
├── test/
│   └── PayStream.test.js      # Comprehensive test suite
├── frontend/
│   ├── hr-dashboard/          # Vite+React HR management app
│   └── employee-portal/       # Vite+React employee app
├── shared/
│   └── abi/                   # Exported ABIs + addresses
├── docs/
│   └── architecture.md        # System architecture docs
├── hardhat.config.js
└── package.json
```

## Smart Contract Functions

### PayStream (HR)
- `createStream(employee, ratePerSecond)` — Create salary stream
- `pauseStream(streamId)` — Pause (auto-claims pending)
- `resumeStream(streamId)` — Resume paused stream
- `cancelStream(streamId)` — Cancel (auto-claims remaining)
- `fundContract(amount)` — Deposit tokens to treasury
- `setTaxRate(basisPoints)` — Admin: update tax rate

### PayStream (Employee)
- `withdraw(streamId)` — Withdraw accrued salary
- `calculateAccrued(streamId)` — View pending earnings

### TaxVault (Admin)
- `withdraw(to, amount)` — Admin withdraws collected tax
- `getBalance()` — View vault balance

## Deploy to HeLa Testnet

```bash
npx hardhat run scripts/deploy.js --network hela
```

## License

MIT
