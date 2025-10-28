# CompliFi Deployment Guide

Complete deployment instructions for all CompliFi components.

## Prerequisites

Before deploying, ensure you have:
- ✅ Node.js 18+ installed
- ✅ MongoDB running (local or Atlas)
- ✅ Solana CLI installed
- ✅ Anchor CLI installed
- ✅ A Solana wallet with SOL for deployment
- ✅ API keys for services (Helius, etc.)

## 1. Smart Contract Deployment

### Development/Devnet

```bash
# Build the program
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Run tests
anchor test

# Generate IDL
anchor idl init --filepath target/idl/complifi.json <PROGRAM_ID>
```

### Mainnet Deployment

```bash
# 1. Switch to mainnet
solana config set --url mainnet-beta

# 2. Get your program ID
cat target/deploy/complifi-keypair.json

# 3. Build
anchor build

# 4. Deploy (make sure you have enough SOL)
anchor deploy --provider.cluster mainnet-beta

# 5. Verify deployment
solana program show <PROGRAM_ID>
```

## 2. Backend Deployment

### Option A: Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize
railway init

# Add MongoDB service
railway add

# Set environment variables
railway variables set MONGODB_URI=your_mongodb_atlas_uri
railway variables set PORT=3001
railway variables set SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
railway variables set HELIUS_API_KEY=your_key

# Deploy
railway up
```

### Option B: Render

1. Go to [render.com](https://render.com)
2. Create new Web Service
3. Connect GitHub repository
4. Set:
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Set environment variables:
   ```
   MONGODB_URI=mongodb+srv://...
   PORT=3001
   SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
   HELIUS_API_KEY=your_key
   ```
6. Deploy

### Option C: Heroku

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create complifi-backend

# Add MongoDB addon
heroku addons:create mongolab:sandbox

# Set environment variables
heroku config:set MONGODB_URI=...
heroku config:set PORT=3001
heroku config:set SOLANA_RPC_URL=...

# Deploy
git push heroku main
```

### Option D: Self-hosted (VPS)

```bash
# On your server
cd backend
npm install --production

# Set environment variables in .env file
vim .env

# Use PM2 for process management
npm install -g pm2
pm2 start src/index.js --name complifi-backend
pm2 startup
pm2 save
```

## 3. Frontend Dashboard Deployment

### Option A: Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd dashboard
vercel

# Set environment variables
vercel env add REACT_APP_API_URL
# Enter: https://your-backend-url.com

# Redeploy
vercel --prod
```

### Option B: Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Build
cd dashboard
npm run build

# Deploy
netlify deploy --prod

# Or configure for continuous deployment
netlify init
```

### Option C: GitHub Pages

```bash
cd dashboard

# Install gh-pages
npm install --save-dev gh-pages

# Add to package.json scripts
"homepage": "https://yourusername.github.io/complifi",
"predeploy": "npm run build",
"deploy": "gh-pages -d build"

# Deploy
npm run deploy
```

### Option D: Cloudflare Pages

1. Go to [Cloudflare Pages](https://pages.cloudflare.com)
2. Connect repository
3. Set build command: `npm run build`
4. Set build output: `build`
5. Set environment variables
6. Deploy

## 4. MongoDB Setup

### Option A: MongoDB Atlas (Recommended)

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster
3. Create database user
4. Whitelist IP address (0.0.0.0/0 for anywhere)
5. Get connection string
6. Update `MONGODB_URI` in backend environment

### Option B: Self-hosted MongoDB

```bash
# Install MongoDB
# Ubuntu/Debian
sudo apt-get install mongodb

# macOS
brew install mongodb-community

# Start MongoDB
sudo systemctl start mongod

# Create database
mongosh
use complifi
```

## 5. Environment Variables

### Backend (.env)

```env
PORT=3001
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/complifi
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
HELIUS_API_KEY=your_helius_api_key
```

### Frontend (.env)

```env
REACT_APP_API_URL=https://your-backend-url.com
REACT_APP_RPC_URL=https://api.mainnet-beta.solana.com
```

## 6. Domain Setup (Optional)

### Backend

1. Add custom domain in your hosting provider
2. Configure DNS:
   ```
   A record: your-domain.com -> server IP
   ```
3. Update frontend `API_URL` to your custom domain

### Frontend

1. Add custom domain in Vercel/Netlify
2. Configure DNS:
   ```
   CNAME: www.your-domain.com -> cname.provider
   ```
3. SSL will be automatically configured

## 7. Monitoring Setup

### Health Checks

Add monitoring to verify services are up:

```bash
# Backend health check
curl https://your-backend.com/health

# Expected response:
# {"status":"ok","timestamp":"2024-..."}
```

### Logging

#### Backend (PM2)

```bash
# View logs
pm2 logs complifi-backend

# Log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
```

#### Frontend (Vercel/Netlify)

- Logs available in dashboard
- Or use service logs panel

## 8. Security Checklist

- [ ] Use HTTPS for all services
- [ ] Set secure environment variables
- [ ] Enable CORS properly in backend
- [ ] Use API keys securely
- [ ] Enable MongoDB authentication
- [ ] Restrict IP access to MongoDB
- [ ] Use secure Solana wallet
- [ ] Regularly update dependencies
- [ ] Monitor for security vulnerabilities

## 9. Testing Deployment

### Test Backend

```bash
# Health check
curl https://your-backend.com/health

# Get stats
curl https://your-backend.com/api/stats

# Create test log
curl -X POST https://your-backend.com/api/logs \
  -H "Content-Type: application/json" \
  -d '{"user":"test","action":"swap","verified":true,"risk_score":2}'
```

### Test Frontend

1. Open https://your-frontend.com
2. Connect wallet
3. Verify dashboard loads
4. Check data refreshes
5. Test all UI components

### Test SDK

```javascript
import { CompliFiSDK } from '@complifi/sdk';
const complifi = new CompliFiSDK(connection, YOUR_PROGRAM_ID);
const result = await complifi.verifyCompliance(user, 'test');
console.log('Compliance result:', result);
```

## 10. Post-Deployment

### Update Program ID

After deploying the smart contract:

1. Update `programs/complifi/src/lib.rs`:
   ```rust
   declare_id!("YOUR_NEW_PROGRAM_ID");
   ```

2. Update `sdk/src/index.js`:
   ```javascript
   const COMPLIFI_PROGRAM_ID = new PublicKey('YOUR_NEW_PROGRAM_ID');
   ```

3. Rebuild and redeploy

### Update Documentation

Update all documentation with:
- Real deployment URLs
- Actual program IDs
- Updated API endpoints

## Troubleshooting

### Backend won't start

```bash
# Check logs
pm2 logs complifi-backend

# Check environment
cat backend/.env

# Test MongoDB connection
mongosh "$MONGODB_URI"
```

### Frontend shows 404

```bash
# Rebuild
cd dashboard
npm run build

# Check build output
ls -la build/

# Check API URL
echo $REACT_APP_API_URL
```

### Smart contract errors

```bash
# Check program logs
solana logs YOUR_PROGRAM_ID

# Verify deployment
anchor verify YOUR_PROGRAM_ID

# Rebuild
anchor clean
anchor build
anchor deploy
```

## Quick Deploy Commands

### All at Once

```bash
# 1. Deploy contract
anchor deploy --provider.cluster mainnet-beta

# 2. Deploy backend
cd backend
vercel --prod

# 3. Deploy frontend
cd dashboard
npm run build && netlify deploy --prod
```

## Cost Estimates

### Smart Contract Deployment
- Initial deployment: ~2-5 SOL
- Upgrade authority: Required

### Backend Hosting
- Render: Free tier available
- Railway: $5/month
- Heroku: $7/month
- VPS: $10-20/month

### Frontend Hosting
- Vercel: Free
- Netlify: Free
- Cloudflare: Free

### Database
- MongoDB Atlas: Free (512MB)
- Self-hosted: Included with VPS

**Total estimated cost: $0-25/month**

## Support

For deployment help:
- Check logs for errors
- Review environment variables
- Verify network connectivity
- Contact support channels

