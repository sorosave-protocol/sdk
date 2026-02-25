/**
 * REST API Server for Group Indexer
 * Provides endpoints for querying indexed data
 */

import express from "express";
import cors from "cors";
import { GroupIndexer } from "./indexer";

const app = express();
const PORT = process.env.INDEXER_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize indexer
const indexer = new GroupIndexer({
  horizonUrl: process.env.HORIZON_URL || "https://horizon-testnet.stellar.org",
  contractId: process.env.CONTRACT_ID || "",
  pollInterval: parseInt(process.env.POLL_INTERVAL || "5000"),
  dbPath: process.env.DB_PATH || "./indexer.db",
});

// Start indexer
indexer.start();

// Health check
app.get("/health", (req, res) => {
  const stats = indexer.getStats();
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    stats,
  });
});

// Get all groups
app.get("/groups", (req, res) => {
  const { status, token, limit = "20", offset = "0" } = req.query;

  const filter: any = {};
  if (status) filter.status = status as string;
  if (token) filter.token = token as string;

  const result = indexer.getGroups(
    filter,
    parseInt(limit as string),
    parseInt(offset as string)
  );

  res.json({
    success: true,
    data: result.items,
    pagination: {
      total: result.total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      hasMore: result.total > parseInt(offset as string) + result.items.length,
    },
  });
});

// Get single group
app.get("/groups/:id", (req, res) => {
  const group = indexer.getGroup(req.params.id);

  if (!group) {
    return res.status(404).json({
      success: false,
      error: "Group not found",
    });
  }

  // Get members
  const members = indexer.getGroupMembers(req.params.id);

  res.json({
    success: true,
    data: {
      ...group,
      members,
    },
  });
});

// Get groups for a member
app.get("/members/:address/groups", (req, res) => {
  const groups = indexer.getMemberGroups(req.params.address);

  res.json({
    success: true,
    data: groups,
  });
});

// Get indexer stats
app.get("/stats", (req, res) => {
  const stats = indexer.getStats();

  res.json({
    success: true,
    data: stats,
  });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("API Error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Indexer API server running on port ${PORT}`);
  console.log(`📊 Endpoints:`);
  console.log(`   GET /health`);
  console.log(`   GET /groups`);
  console.log(`   GET /groups/:id`);
  console.log(`   GET /members/:address/groups`);
  console.log(`   GET /stats`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  indexer.close();
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  indexer.close();
  process.exit(0);
});

export default app;
