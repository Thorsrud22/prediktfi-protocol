# Migration Guide: From NextJS Boilerplate to PrediktFi Protocol

## Problem

Your files are currently in a `nextjs-boilerplate` repository, but you want to use CodeSpaces with the `prediktfi-protocol` repository for Solana/Anchor development.

## Solution Options

### Option 1: Migrate Everything to PrediktFi Protocol Repository (Recommended)

This approach keeps both your smart contract and frontend in one repository.

#### Steps:

1. **Open CodeSpaces in the correct repository:**
   - Navigate to `https://github.com/Thorsrud22/prediktfi-protocol`
   - Click the green "Code" button
   - Select "Codespaces" tab
   - Click "Create codespace on main"

2. **Move your frontend files:**
   ```bash
   # If you have access to your nextjs-boilerplate files, copy them to the app/ directory
   # You can do this by:
   # a) Cloning the nextjs-boilerplate repo and copying files
   # b) Downloading the files from GitHub and uploading to app/
   # c) Creating the frontend from scratch in the app/ directory
   ```

3. **Update project structure:**
   ```
   prediktfi-protocol/
   ├── programs/           # Solana smart contracts
   ├── tests/             # Smart contract tests
   ├── app/              # Your NextJS frontend (moved from nextjs-boilerplate)
   ├── migrations/        # Deployment scripts
   └── ...
   ```

### Option 2: Keep Repositories Separate

Keep smart contracts in `prediktfi-protocol` and frontend in `nextjs-boilerplate`.

#### Steps:

1. **Use CodeSpaces with prediktfi-protocol for smart contract development**
2. **Use CodeSpaces with nextjs-boilerplate for frontend development**
3. **Connect them by using the deployed program ID in your frontend**

### Option 3: Archive NextJS Boilerplate and Start Fresh

If the nextjs-boilerplate repository doesn't contain important code:

1. **Archive the nextjs-boilerplate repository**
2. **Build your frontend in the `app/` directory of this repository**
3. **Use the integrated development approach**

## Recommended Workflow

### For Smart Contract Development:
1. Open CodeSpaces in `prediktfi-protocol`
2. Use `anchor build` to build smart contracts
3. Use `anchor test` to run tests
4. Use `anchor deploy` to deploy to devnet

### For Frontend Development:
1. Create your NextJS app in the `app/` directory
2. Use the deployed program ID to interact with smart contracts
3. Use `npm run dev` (from app directory) for frontend development

## Setting Up CodeSpaces Correctly

### Current Issue:
Your CodeSpaces is opening in the wrong repository.

### Solution:
1. **Go to GitHub.com**
2. **Navigate to:** `https://github.com/Thorsrud22/prediktfi-protocol`
3. **NOT:** `https://github.com/Thorsrud22/nextjs-boilerplate`
4. **Click "Code" → "Codespaces" → "Create codespace on main"**

### Managing Multiple CodeSpaces:
- You can have CodeSpaces for both repositories if needed
- Delete unused CodeSpaces to avoid confusion
- Always check the repository name in the CodeSpaces URL

## Next Steps

1. **Choose your preferred option above**
2. **Set up CodeSpaces correctly on prediktfi-protocol repository**
3. **If migrating files, copy them from nextjs-boilerplate to appropriate directories**
4. **Run the development environment setup**
5. **Start building your PrediktFi application!**

## Getting Help

If you're still having issues:
1. Check which repository your CodeSpaces is connected to (look at the URL)
2. Ensure you're opening CodeSpaces from the correct GitHub repository page
3. Delete any existing CodeSpaces that are pointing to the wrong repository

## Development Commands

Once you have CodeSpaces set up correctly:

```bash
# Install dependencies
npm install

# Build smart contracts
anchor build

# Run tests
anchor test

# Start local validator (for testing)
solana-test-validator

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Start frontend (if you have one in app/)
cd app && npm run dev
```