# Quick Start Guide

## Your Issue: CodeSpaces Opens Wrong Repository

**Problem:** Your CodeSpaces is opening in `nextjs-boilerplate` instead of `prediktfi-protocol`.

**Solution:** 
1. 🌐 Go to: `https://github.com/Thorsrud22/prediktfi-protocol`
2. ✅ Click "Code" → "Codespaces" → "Create codespace on main"
3. 🚫 **NOT** from the nextjs-boilerplate repository

## What This Repository Now Contains

✅ **Complete Solana/Anchor Development Environment:**
- `programs/` - Your smart contracts
- `tests/` - Smart contract tests  
- `app/` - Place your NextJS frontend here
- `.devcontainer/` - CodeSpaces configuration
- `Anchor.toml` - Anchor configuration
- `package.json` - Node.js dependencies

## Quick Commands

```bash
# Install dependencies
npm install

# Build smart contracts
anchor build

# Run tests
anchor test

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

## Next Steps

1. **Open CodeSpaces correctly** (see solution above)
2. **If you have frontend code in nextjs-boilerplate:**
   - Copy it to the `app/` directory in this repository
   - See `MIGRATION.md` for detailed instructions
3. **Start developing your PrediktFi prediction market!**

## Files You Should Read

- 📖 `README.md` - Complete documentation
- 🔄 `MIGRATION.md` - How to move files from nextjs-boilerplate
- 💻 `programs/prediktfi-protocol/src/lib.rs` - Smart contract code

---
**Need help?** Check the README.md and MIGRATION.md files for detailed instructions!