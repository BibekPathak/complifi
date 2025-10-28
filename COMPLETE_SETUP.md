# 🎯 Complete Setup Guide - Fix the Backend Error

## Current Status
✅ Dashboard: Running on http://localhost:3000  
❌ Backend: Not running (causing the error)

## Fix in 3 Steps

### Step 1: Setup MongoDB (2 minutes)

**Option A: MongoDB Atlas (Recommended) ☁️**
```bash
# Go to https://www.mongodb.com/cloud/atlas/register
# Sign up (free)
# Create cluster
# Get connection string
```

**Option B: Docker (Faster) 🐳**
```bash
docker run -d --name complifi-mongo -p 27017:27017 mongo:latest
```

---

### Step 2: Configure Backend

Create file: `backend/.env`

For Atlas:
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/complifi
PORT=3001
```

For Docker:
```env
MONGODB_URI=mongodb://localhost:27017/complifi
PORT=3001
```

---

### Step 3: Start Backend

```bash
cd /mnt/d/compliFi/backend
npm install
npm start
```

You'll see:
```
CompliFi Backend running on port 3001
MongoDB connected
```

---

### Step 4: Refresh Dashboard

Go to http://localhost:3000 and refresh the page.

The error will be gone! ✅

---

## If You See Errors

**"MongoDB connection error"**
- Check `.env` file exists in backend folder
- Verify connection string is correct
- If Atlas: whitelist your IP (use 0.0.0.0/0 for anywhere)

**"Port 3001 already in use"**
- Stop other apps using that port
- Or change PORT in .env to 3002

---

## What You'll See After Setup

Dashboard will show:
- ✅ Statistics (Total verifications, Compliance rate, etc.)
- ✅ Charts (Compliance rate over time)
- ✅ Risk score distribution
- ✅ Recent compliance logs
- ❌ No more error messages!

---

**Total setup time: 5-10 minutes**

Good luck! 🚀

