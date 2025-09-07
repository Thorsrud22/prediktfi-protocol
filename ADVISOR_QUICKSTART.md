# 🚀 Predikt Advisor v0.1 - Quick Start Guide

## What is Predikt Advisor?

Predikt Advisor is your personal AI-financial agent for crypto that provides:
- **Read-only wallet monitoring** (Solana first)
- **Portfolio analysis** with risk metrics
- **Smart alerts** via in-app, email, or webhook
- **Strategy Studio** for custom monitoring rules

## ⚡ Quick Start (5 minutes)

### 1. Enable Features
```bash
# Add to your .env file
echo "FEATURE_ADVISOR=true" >> .env
echo "FEATURE_ALERTS=true" >> .env
```

### 2. Install & Setup
```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name advisor_v0_1
```

### 3. Start the Server
```bash
npm run dev
```

### 4. Access Advisor
- **Main Dashboard**: http://localhost:3000/advisor
- **Alerts Management**: http://localhost:3000/advisor/alerts
- **Strategy Studio**: http://localhost:3000/advisor/strategies

## 🎯 First Steps

### Connect Your Wallet
1. Go to http://localhost:3000/advisor
2. Enter your Solana wallet address
3. Click "Connect Wallet"
4. View your portfolio snapshot and risk analysis

### Create Your First Alert
1. Go to http://localhost:3000/advisor/alerts
2. Select your connected wallet
3. Click "New Alert"
4. Choose "Portfolio Drop" alert
5. Set threshold to 10%
6. Choose "In-App" notification
7. Save and enable the rule

### Generate a Strategy
1. Go to http://localhost:3000/advisor/strategies
2. Select your connected wallet
3. Click "New Strategy"
4. Enter: "Monitor my portfolio and alert me if Bitcoin drops by more than 15%"
5. Click "Generate Strategy"
6. Review and save the generated strategy

## 🔧 Testing

### Run All Tests
```bash
./scripts/test-advisor.sh
```

### Test Individual Components
```bash
# Test alerts system
npm run advisor:test

# Test TypeScript compilation
npm run typecheck

# Test E2E
npm run test:e2e:mock
```

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:3000/api/health/alerts
```

### View Logs
```bash
# Check advisor tick logs
npm run advisor:tick

# Check server logs
npm run dev
```

## 🚨 Alerts Setup

### In-App Notifications
- Automatically enabled
- Appear in the Predikt interface
- No additional setup required

### Email Notifications
1. Set up email service in `.env`:
   ```bash
   EMAIL_SERVICE_API_KEY="your-api-key"
   EMAIL_FROM_ADDRESS="alerts@predikt.fi"
   ```
2. Create email alert rules
3. Test with a small threshold

### Webhook Notifications
1. Get webhook URL (e.g., from Slack, Discord, or custom endpoint)
2. Create webhook alert rules
3. Test connectivity: `curl "http://localhost:3000/api/webhooks/notify?url=YOUR_WEBHOOK_URL"`

## 🔄 Production Deployment

### 1. Set Up Cron Job
```bash
# Add to crontab (runs every 5 minutes)
*/5 * * * * cd /path/to/prediktfi-protocol && npm run advisor:tick
```

### 2. Configure Environment
```bash
# Production .env
DATABASE_URL="postgresql://..."
FEATURE_ADVISOR=true
FEATURE_ALERTS=true
EMAIL_SERVICE_API_KEY="your-production-key"
```

### 3. Deploy
```bash
./scripts/deploy-advisor.sh
```

## 🆘 Troubleshooting

### Common Issues

#### "Advisor Feature Not Available"
- Check if `FEATURE_ADVISOR=true` in `.env`
- Restart the server

#### "Alerts Feature Not Available"
- Check if `FEATURE_ALERTS=true` in `.env`
- Restart the server

#### "Failed to connect wallet"
- Check if wallet address is valid
- Ensure Solana RPC is accessible
- Check server logs for errors

#### "Rule not firing"
- Check if rule is enabled
- Verify threshold settings
- Check if portfolio data is current

### Debug Mode
```bash
# Enable debug logging
DEBUG=alerts:* npm run advisor:tick

# Check database
npx prisma studio

# View server logs
npm run dev
```

## 📚 Documentation

- **Complete Guide**: [docs/ADVISOR.md](docs/ADVISOR.md)
- **Alerts System**: [docs/ALERTS.md](docs/ALERTS.md)
- **API Reference**: [docs/API.md](docs/API.md)

## 🎉 What's Next?

### Immediate (v0.1)
- ✅ Read-only wallet monitoring
- ✅ Portfolio risk analysis
- ✅ Smart alerts system
- ✅ Strategy generation

### Coming Soon (v0.2)
- 🔄 Multi-chain support (Ethereum, Polygon)
- 📱 Mobile app with push notifications
- 🤖 AI-powered market insights
- 📊 Advanced portfolio optimization

### Future (v0.3)
- 🔗 DeFi protocol integration
- 👥 Social features and sharing
- 🎯 Automated rebalancing
- 📈 Advanced analytics

## 💬 Support

- **Issues**: [GitHub Issues](https://github.com/prediktfi/protocol/issues)
- **Discord**: [Predikt Community](https://discord.gg/predikt)
- **Email**: support@predikt.fi

---

**Ready to get started?** Run `./scripts/test-advisor.sh` to verify everything is working! 🚀
