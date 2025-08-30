# PrediktFi Protocol

Solana/Anchor program for PrediktFi (devnet) - A decentralized prediction market platform.

## 🚀 Quick Start

Follow these steps to get the project running on your local machine:

### Prerequisites

Make sure you have the following installed:
- [Node.js](https://nodejs.org/) (v16 or higher)
- [Rust](https://rustup.rs/)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)
- [Anchor CLI](https://www.anchor-lang.com/docs/installation)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Thorsrud22/prediktfi-protocol.git
   cd prediktfi-protocol
   ```

2. **Install dependencies:**
   ```bash
   yarn install
   # or
   npm install
   ```

3. **Setup project:**
   ```bash
   yarn setup
   ```

### 🏃‍♂️ Starting the Project

You can start the project in multiple ways:

#### Option 1: One-Click Setup (Recommended)
```bash
./start.sh
```

#### Option 2: Using Yarn/NPM Scripts
```bash
yarn start
# or npm start
```

#### Option 3: Using Make Commands
```bash
make help     # See all available commands
make setup    # Complete setup
make start    # Start development
```

#### Option 4: Using Anchor Directly
```bash
anchor build
anchor localnet
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `./start.sh` | **🚀 One-click setup** - Complete project initialization |
| `yarn start` | Start Anchor localnet for development |
| `yarn dev` | Run tests in development mode |
| `yarn build` | Build the Anchor program |
| `yarn deploy` | Deploy program to configured network |
| `yarn test` | Run all tests |
| `yarn clean` | Clean build artifacts |
| `yarn setup` | Install dependencies and build project |
| `yarn localnet` | Start Solana test validator |
| `yarn lint` | Check code formatting |
| `yarn lint:fix` | Fix code formatting issues |

### Make Commands (Alternative)

| Command | Description |
|---------|-------------|
| `make help` | Show all available commands |
| `make setup` | Complete project setup |
| `make start` | Start development environment |
| `make build` | Build the program |
| `make test` | Run tests |
| `make deploy` | Deploy to network |

### Development Workflow

1. **Start the local validator:**
   ```bash
   yarn localnet
   ```

2. **In another terminal, deploy the program:**
   ```bash
   yarn deploy
   ```

3. **Run tests to verify everything works:**
   ```bash
   yarn test
   ```

### Project Structure

```
├── programs/           # Anchor programs
│   └── prediktfi-protocol/
├── tests/             # TypeScript/JavaScript tests
├── migrations/        # Deploy scripts
├── app/              # Frontend application (if applicable)
├── Anchor.toml       # Anchor configuration
├── Cargo.toml        # Rust workspace configuration
└── package.json      # Node.js dependencies and scripts
```

### Configuration

The project is configured to work with:
- **Localnet** by default (for development)
- **Devnet** for testing
- **Mainnet** for production

Edit `Anchor.toml` to change network configurations.

### Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### Support

If you encounter any issues or have questions, please open an issue on GitHub.
