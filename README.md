# EarnX Protocol - Mantle Network

A decentralized trade finance platform built on Mantle Sepolia testnet, enabling global trade invoice verification, funding, and investment opportunities.

## 🌟 Features

- **Invoice Submission & Verification**: Submit trade invoices with automated verification and risk assessment
- **Investment Opportunities**: Browse and invest in verified trade finance opportunities
- **USDC Integration**: Built-in USDC faucet for testing and investments
- **Portfolio Tracking**: Monitor your investments and returns
- **Real-time Market Data**: Live pricing and market analytics
- **Mantle Network**: Optimized for low fees and fast transactions

## 🚀 Live Demo

**Frontend**: [https://frontend1-ten-umber.vercel.app/](https://frontend1-ten-umber.vercel.app/)

## 🛠 Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Blockchain**: Mantle Sepolia Testnet
- **Web3**: wagmi, viem, ethers.js
- **Smart Contracts**: EarnX Protocol Suite
- **Storage**: IPFS via Pinata
- **API**: Custom verification service

## 📋 Prerequisites

- Node.js 16+
- MetaMask or compatible Web3 wallet
- MNT tokens for gas fees (Mantle testnet)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/big14way/earnmant.git
   cd earnmant
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm start
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

## 🌐 Network Configuration

### Mantle Sepolia Testnet
- **Chain ID**: 5003
- **RPC URL**: https://rpc.sepolia.mantle.xyz
- **Block Explorer**: https://explorer.sepolia.mantle.xyz
- **Currency**: MNT

### Contract Addresses
- **EarnX Protocol**: `0x0B94780aA755533276390e6269B8a9bf17F67018`
- **USDC Token**: `0x211a38792781b2c7a584a96F0e735d56e809fe85`
- **Verification Module**: `0xDFe9b0627e0ec2b653FaDe125421cc32575631FC`

## 💡 Usage

### For Suppliers
1. Connect your Web3 wallet
2. Submit trade invoices with required documentation
3. Receive verification and credit rating
4. Get funded by investors

### For Investors
1. Browse verified investment opportunities
2. Analyze risk scores and returns
3. Invest USDC in trade finance deals
4. Track portfolio performance

### Getting Test Tokens
- **MNT**: Use Mantle testnet faucet
- **USDC**: Use built-in faucet in the app

## 🔒 Smart Contract Features

- **Access Control**: Role-based permissions
- **Gas Optimization**: Efficient contract design for Mantle network
- **Verification System**: Automated risk assessment
- **Investment Tracking**: On-chain portfolio management

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── pages/          # Page components
│   ├── ui/             # UI components
│   └── layout/         # Layout components
├── hooks/              # Custom React hooks
├── abis/               # Contract ABIs
├── config/             # Configuration files
├── types/              # TypeScript types
├── utils/              # Utility functions
└── services/           # External services
```

## 🔨 Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run tests
- `npm run lint` - Run ESLint
- `npm run eject` - Eject from Create React App

## 🌍 Environment Variables

Create a `.env` file in the root directory:

```env
REACT_APP_PINATA_API_KEY=your_pinata_api_key
REACT_APP_PINATA_SECRET_KEY=your_pinata_secret_key
REACT_APP_VERIFICATION_API_URL=https://earnx-verification-api.onrender.com
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🛟 Support

- **Documentation**: Check the code comments and inline documentation
- **Issues**: Report bugs or request features via GitHub Issues
- **Contact**: Open an issue for support

## 🔮 Roadmap

- [ ] Mainnet deployment
- [ ] Advanced analytics dashboard
- [ ] Multi-currency support
- [ ] Mobile app development
- [ ] Integration with traditional banking APIs
- [ ] Enhanced KYC/AML features

## ⚠️ Disclaimer

This is a testnet application for demonstration purposes. Do not use real funds or sensitive data. The smart contracts have not been audited for production use.

---

**Built for Mantle Network** 🚀