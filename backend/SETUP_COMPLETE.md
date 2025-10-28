# ✅ CompliFi Backend Setup Complete!

## 📍 Where to Put Your MongoDB Connection URL

### The Answer:

**Your MongoDB connection URL goes in this file:**
```
backend/.env
```

### Current Setup:

The backend is already configured to read from environment variables. Here's how it works:

```javascript
// backend/src/index.js (line 14)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/complifi';
```

So the system looks for `MONGODB_URI` in your `.env` file first, otherwise defaults to local MongoDB.

---

## 🎯 Two Options for You

### Option 1: MongoDB Atlas (Cloud) ⭐ RECOMMENDED
**Perfect for hackathon - fastest setup!**

Connection string format:
```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/complifi?retryWrites=true&w=majority
```

**Setup time: 5 minutes**
- Sign up at mongodb.com/cloud/atlas
- Create free cluster
- Get connection string
- Paste in `backend/.env`

📖 **Full guide:** See `MONGODB_SETUP.md`

---

### Option 2: Docker MongoDB (Local) 🐳
**Good for offline development**

Connection string format:
```env
MONGODB_URI=mongodb://admin:password@localhost:27017/complifi?authSource=admin
```

**Setup time: 10 minutes**
```bash
docker run -d --name complifi-mongo -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  mongo:latest
```

📖 **Full guide:** See `MONGODB_SETUP.md`

---

## 🚀 Quick Start (Choose One)

### A. Atlas Setup (Recommended)

1. **Create Account**
   ```
   https://www.mongodb.com/cloud/atlas/register
   ```

2. **Get Connection String**
   - Build a database (free tier)
   - Connect → Connect your application
   - Copy the string

3. **Add to .env**
   ```bash
   cd backend
   # Edit .env file
   nano .env  # or use any editor
   
   # Add this line:
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/complifi
   ```

4. **Start Backend**
   ```bash
   npm start
   ```

---

### B. Docker Setup

1. **Start MongoDB**
   ```bash
   docker run -d --name complifi-mongo -p 27017:27017 mongo:latest
   ```

2. **Add to .env**
   ```bash
   cd backend
   echo "MONGODB_URI=mongodb://localhost:27017/complifi" > .env
   echo "PORT=3001" >> .env
   ```

3. **Start Backend**
   ```bash
   npm start
   ```

---

## 📁 Your .env File Should Look Like This

```env
# MongoDB Connection URL
MONGODB_URI=mongodb+srv://complifi:password123@cluster0.xxxxx.mongodb.net/complifi?retryWrites=true&w=majority

# Server Port
PORT=3001

# Optional: Solana Configuration
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
HELIUS_API_KEY=your_key_here
```

---

## ✅ Verification

After adding your connection URL, test it:

```bash
cd backend
npm start
```

You should see:
```
CompliFi Backend running on port 3001
MongoDB connected ✅
```

If you see "MongoDB connection error":
1. Check your connection string
2. Verify MongoDB is running (Atlas/Docker)
3. Check network firewall

---

## 🤔 Still Not Sure Which to Use?

**For Colosseum Hackathon: Use Atlas**

Why?
- ✅ Setup in 5 minutes
- ✅ Free tier
- ✅ Works anywhere
- ✅ Professional demo
- ✅ No Docker needed
- ✅ Automatic backups

**The connection string will look like:**
```
mongodb+srv://complifi:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/complifi
```

---

## 📚 More Information

- **Full MongoDB Setup Guide:** `backend/MONGODB_SETUP.md`
- **Atlas vs Docker Comparison:** `backend/MONGO_CHOICE.md`
- **This file:** Quick reference

---

## 🎉 You're All Set!

Once you add your MongoDB URL to `backend/.env`, you can:

1. Start the backend: `cd backend && npm start`
2. Start the dashboard: `cd dashboard && npm start`
3. See your data in the dashboard!

Happy coding! 🚀

