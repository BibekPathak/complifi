const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { Connection, PublicKey } = require('@solana/web3.js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/complifi';
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Compliance Log Schema
const complianceLogSchema = new mongoose.Schema({
  user: String,
  action: String,
  verified: Boolean,
  risk_score: Number,
  timestamp: { type: Date, default: Date.now },
  tx_signature: String,
  details: Object,
});

const ComplianceLog = mongoose.model('ComplianceLog', complianceLogSchema);

// Violation Log Schema
const violationLogSchema = new mongoose.Schema({
  user: String,
  reason: String,
  timestamp: { type: Date, default: Date.now },
  tx_signature: String,
});

const ViolationLog = mongoose.model('ViolationLog', violationLogSchema);

// Middleware
app.use(express.json());

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get all compliance logs
app.get('/api/logs', async (req, res) => {
  try {
    const logs = await ComplianceLog.find().sort({ timestamp: -1 }).limit(100);
    res.json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(200).json([]); // Return empty array instead of error
  }
});

// Log a compliance verification
app.post('/api/logs', async (req, res) => {
  try {
    const { user, action, verified, risk_score, tx_signature, details } = req.body;
    const log = new ComplianceLog({
      user,
      action,
      verified,
      risk_score,
      tx_signature,
      details,
    });
    await log.save();
    res.json(log);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all violations
app.get('/api/violations', async (req, res) => {
  try {
    const violations = await ViolationLog.find().sort({ timestamp: -1 }).limit(100);
    res.json(violations);
  } catch (error) {
    console.error('Error fetching violations:', error);
    res.status(200).json([]); // Return empty array instead of error
  }
});

// Log a violation
app.post('/api/violations', async (req, res) => {
  try {
    const { user, reason, tx_signature } = req.body;
    const violation = new ViolationLog({
      user,
      reason,
      tx_signature,
    });
    await violation.save();
    res.json(violation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get statistics
app.get('/api/stats', async (req, res) => {
  try {
    const totalVerifications = await ComplianceLog.countDocuments();
    const totalViolations = await ViolationLog.countDocuments();
    const successfulVerifications = await ComplianceLog.countDocuments({ verified: true });
    const complianceRate = totalVerifications > 0 
      ? (successfulVerifications / totalVerifications * 100).toFixed(2)
      : 0;

    res.json({
      totalVerifications,
      totalViolations,
      successfulVerifications,
      complianceRate: parseFloat(complianceRate),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    // Return default stats if error
    res.json({
      totalVerifications: 0,
      totalViolations: 0,
      successfulVerifications: 0,
      complianceRate: 0,
      timestamp: new Date().toISOString(),
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`CompliFi Backend running on port ${PORT}`);
});

