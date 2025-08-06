# Crosschain Hyperbridge

A cross-chain bridge example integrating Ethereum (Solidity), Solana (Anchor), a Hyperbridge relayer, and a React frontend, with stubs for simchain-relayer integration.

## Project Structure

```
crosschain-hyperbridge/
├── eth-contract/         # Solidity contract (Hardhat, TypeScript)
├── solana-program/       # Solana Anchor program (Rust)
├── relayer-script/       # Node.js relayer using Hyperbridge SDK
├── frontend/             # React app (TypeScript)
├── README.md             # This file
```

---

## 1. eth-contract (Ethereum Solidity, Hardhat)

- **Setup:**
  ```bash
  cd eth-contract
  npm install
  # Compile contracts
  npx hardhat compile
  # Run tests
  npx hardhat test
  ```
- **Deploy:**
  Configure your network in `hardhat.config.ts` and use `npx hardhat run scripts/deploy.ts --network <network>`

---

## 2. solana-program (Solana Anchor)

- **Setup:**
  ```bash
  cd solana-program
  yarn install  # or npm install
  anchor build
  anchor test
  ```
- **Deploy:**
  Configure your cluster in `Anchor.toml` and use `anchor deploy`

---

## 3. relayer-script (Node.js, Hyperbridge SDK)

- **Setup:**
  ```bash
  cd relayer-script
  npm install
  # Start the relayer (stub)
  node index.js
  ```
- **Integration:**
  - The relayer fetches pending cross-chain messages from simchain-relayer (see `index.js` for stub).
  - Add your Hyperbridge relay logic where indicated.

---

## 4. frontend (React, TypeScript)

- **Setup:**
  ```bash
  cd frontend
  npm install
  npm start
  ```
- **Integration:**
  - See `src/simchainRelayer.ts` for simchain-relayer API integration utilities.
  - Use these utilities in your React components to interact with simchain-relayer endpoints (e.g., check balance, create wallet).

---

## 5. simchain-relayer Integration

- The relayer-script and frontend are pre-configured to call simchain-relayer endpoints (see code stubs).
- Update the API URLs if your simchain-relayer runs on a different host/port.
- Implement additional endpoints as needed for your cross-chain logic.

---

## 6. Development Workflow

1. Start your simchain-relayer backend.
2. Deploy contracts/programs as needed.
3. Run the relayer-script to bridge messages.
4. Use the frontend to interact with the bridge and simchain-relayer.

---

## 7. Customization
- Replace stub logic in `relayer-script/index.js` with actual Hyperbridge relay code.
- Expand `frontend/src/simchainRelayer.ts` with more simchain-relayer API calls.
- Implement your own cross-chain message formats and flows.

---

## 8. Requirements
- Node.js >= 18 (for Hardhat, Hyperbridge SDK, React)
- Yarn or npm
- Anchor CLI (for Solana)
- Rust toolchain (for Solana)

---

## 9. License
MIT 