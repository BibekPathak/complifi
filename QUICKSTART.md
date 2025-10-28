# CompliFi Quick Start Guide

Get CompliFi up and running in minutes!

## Prerequisites

Before you begin, ensure you have:

- ✅ Node.js 18+ installed
- ✅ MongoDB installed and running locally
- ✅ Rust and Solana CLI installed (for smart contract development)
- ✅ A code editor (VS Code recommended)

## Step 1: Install Dependencies

Open a terminal and run these commands:

### Backend

```bash
cd backend
npm install
```

### Frontend

```bash
cd dashboard
npm install
```

### SDK (optional)

```bash
cd sdk
npm install
```

## Step 2: Start MongoDB

Make sure MongoDB is running on your system:

```bash
# On macOS/Linux
mongod

# On Windows
# Start MongoDB service from Services panel or
# run mongod.exe from your MongoDB installation
```

## Step 3: Start the Backend Server

```bash
cd backend
npm start
```

The backend will start on `http://localhost:3001`

You should see:
```
CompliFi Backend running on port 3001
MongoDB connected
```

## Step 4: Start the Frontend Dashboard

Open a **new terminal** and run:

```bash
cd dashboard
npm start
```

The dashboard will open at `http://localhost:3000`

You should see:
- A beautiful gradient header with "🔒 CompliFi Dashboard"
- Wallet connection button (Phantom, Solflare, etc.)
- Empty statistics (until you start making compliance checks)

## Step 5: Test the Integration

### Option A: Using the SDK

Create a test file `test-sdk.js`:

```javascript
import { CompliFiSDK } from './sdk/src/index.js';
import { Connection, PublicKey } from '@solana/web3.js';

const connection = new Connection('https://api.devnet.solana.com');
const complifi = new CompliFiSDK(connection);

async function test() {
  // Create a test user
  const user = new PublicKey('11111111111111111111111111111111');
  
  // Verify compliance
  const result = await complifi.verifyCompliance(user, 'test');
  console.log('Compliance check result:', result);
  
  // Get risk score
  const riskScore = await complifi.getRiskScore(user);
  console.log('Risk score:', riskScore);
}

test();
```

Run it:
```bash
node test-sdk.js
```

### Option B: Using the API Directly

Test the backend API:

```bash
# Health check
curl http://localhost:3001/health

# Get stats
curl http://localhost:3001/api/stats

# Get logs
curl http://localhost:3001/api/logs
```

## Step 6: Monitor Compliance

1. Open the dashboard at `http://localhost:3000`
2. Connect your wallet (Phantom, Solflare, etc.)
3. Watch the dashboard update in real-time:
   - Total verifications
   - Compliance rate
   - Risk score distribution
   - Recent compliance logs
   - Violations

## Troubleshooting

### Backend won't start

**Problem**: `MongoDB connection error`

**Solution**: 
1. Make sure MongoDB is installed and running
2. Check if MongoDB is on the default port 27017
3. Try: `mongosh` to verify MongoDB is accessible

### Frontend won't start

**Problem**: `Port 3000 already in use`

**Solution**: 
1. Stop other React apps running on port 3000
2. Or change the port in `dashboard/package.json`

### Dashboard shows "Failed to connect"

**Problem**: Backend not running

**Solution**: 
1. Make sure backend is running on port 3001
2. Check the console for errors
3. Verify MongoDB is running

## Next Steps

Now that you have CompliFi running:

1. **Read the Examples**: Check `EXAMPLES.md` for integration patterns
2. **Explore the Dashboard**: Try different compliance scenarios
3. **Review the Smart Contract**: Look at `programs/complifi/src/lib.rs`
4. **Customize**: Modify compliance rules for your use case

## Development Workflow

### Making Changes

**Backend changes**:
```bash
cd backend
# Changes will auto-reload with nodemon
npm start
```

**Frontend changes**:
```bash
cd dashboard
# React will auto-reload
npm start
```

### Building the Smart Contract

```bash
# Install Anchor if not already installed
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest

# Build the program
anchor build

# Run tests
anchor test
```

## Key Features to Explore

1. **Compliance Verification**: See how users are checked against policies
2. **Risk Scoring**: Monitor wallet risk scores
3. **Violation Tracking**: View blocked transactions
4. **Real-time Updates**: Dashboard refreshes every 5 seconds
5. **Statistical Analysis**: View compliance trends

## API Endpoints

### Health Check
- `GET /health` - Check if server is running

### Statistics
- `GET /api/stats` - Get overall compliance statistics

### Logs
- `GET /api/logs` - Get all compliance logs
- `POST /api/logs` - Create a new log entry

### Violations
- `GET /api/violations` - Get all violations
- `POST /api/violations` - Log a violation

## Additional Resources

- [Solana Documentation](https://docs.solana.com/)
- [Anchor Documentation](https://www.anchor-lang.com/)
- [React Documentation](https://react.dev/)
- [MongoDB Documentation](https://www.mongodb.com/docs/)

## Getting Help

- Check the main `README.md` for architecture details
- Review `EXAMPLES.md` for code samples
- Open an issue on GitHub

---

**Happy Compliance Checking! 🔒**

