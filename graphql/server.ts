/**
 * GraphQL Server Setup
 * Express server with Apollo GraphQL
 */

import express from "express";
import { createServer } from "http";
import { SubscriptionServer } from "subscriptions-transport-ws";
import { execute, subscribe } from "graphql";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { typeDefs, resolvers, createContext } from "./index";

const PORT = process.env.GRAPHQL_PORT || 4000;

async function startServer() {
  const app = express();
  const httpServer = createServer(app);

  // Create executable schema
  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  // Set up WebSocket server for subscriptions
  const subscriptionServer = SubscriptionServer.create(
    {
      schema,
      execute,
      subscribe,
      onConnect: () => {
        console.log("Client connected for subscriptions");
        return createContext();
      },
    },
    {
      server: httpServer,
      path: "/subscriptions",
    }
  );

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "sorosave-graphql",
    });
  });

  // GraphQL endpoint info
  app.get("/", (req, res) => {
    res.json({
      message: "Sorosave GraphQL API",
      endpoints: {
        graphql: "/graphql",
        subscriptions: "/subscriptions",
        playground: "/playground",
      },
      documentation: "https://github.com/sorosave-protocol/sdk/tree/main/graphql",
    });
  });

  httpServer.listen(PORT, () => {
    console.log(`🚀 GraphQL Server ready at http://localhost:${PORT}/`);
    console.log(`📊 GraphQL endpoint: http://localhost:${PORT}/graphql`);
    console.log(`🔌 Subscriptions: ws://localhost:${PORT}/subscriptions`);
  });

  // Graceful shutdown
  process.on("SIGTERM", () => {
    console.log("SIGTERM received, shutting down gracefully");
    subscriptionServer.close();
    httpServer.close(() => {
      console.log("Server closed");
      process.exit(0);
    });
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
