/**
 * Global test setup
 * Runs before all tests
 */

import { beforeAll, afterAll } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Track all spawned server processes for cleanup
const activeServers = new Set();

// Export function to register servers for cleanup
export function registerServer(serverInfo) {
  if (serverInfo && serverInfo.process) {
    activeServers.add(serverInfo);
  }
}

// Export function to unregister servers after cleanup
export function unregisterServer(serverInfo) {
  activeServers.delete(serverInfo);
}

// Set test environment variables
process.env.NODE_ENV = 'test';

// Set required secrets for tests (some modules validate these at import time)
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = '9router-test-jwt-secret-minimum-32-characters-required';
}
if (!process.env.API_KEY_SECRET) {
  process.env.API_KEY_SECRET = '9router-test-api-key-secret-minimum-32-characters';
}
if (!process.env.MACHINE_ID_SALT) {
  process.env.MACHINE_ID_SALT = '9router-test-machine-id-salt-minimum-16-chars';
}

// Set OAuth secrets for tests
if (!process.env.GEMINI_CLIENT_SECRET) {
  process.env.GEMINI_CLIENT_SECRET = 'test-gemini-secret';
}
if (!process.env.IFLOW_CLIENT_SECRET) {
  process.env.IFLOW_CLIENT_SECRET = 'test-iflow-secret';
}
if (!process.env.ANTIGRAVITY_CLIENT_SECRET) {
  process.env.ANTIGRAVITY_CLIENT_SECRET = 'test-antigravity-secret';
}
if (!process.env.CODEX_CLIENT_SECRET) {
  process.env.CODEX_CLIENT_SECRET = 'test-codex-secret';
}

// Global setup
beforeAll(() => {
  console.log('🧪 Starting test suite...');
});

// Global cleanup - ensure all servers are stopped
afterAll(async () => {
  console.log('🧹 Cleaning up test servers...');

  // Kill any remaining tracked servers
  for (const server of activeServers) {
    try {
      if (server.process && server.process.pid) {
        process.kill(-server.process.pid, 'SIGKILL');
      }
    } catch (e) {
      // Process already dead
    }
  }
  activeServers.clear();

  // Kill any stray Next.js dev processes
  try {
    await execAsync('pkill -9 -f "next.*dev" 2>/dev/null || true');
  } catch (e) {
    // Ignore errors
  }

  console.log('✅ Test suite completed');
});

// Handle process termination signals
const cleanup = async () => {
  console.log('\n🛑 Received termination signal, cleaning up...');

  for (const server of activeServers) {
    try {
      if (server.process && server.process.pid) {
        process.kill(-server.process.pid, 'SIGKILL');
      }
    } catch (e) {
      // Process already dead
    }
  }

  try {
    await execAsync('pkill -9 -f "next.*dev" 2>/dev/null || true');
  } catch (e) {
    // Ignore errors
  }

  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('uncaughtException', async (error) => {
  console.error('Uncaught exception:', error);
  await cleanup();
});
process.on('unhandledRejection', async (reason) => {
  console.error('Unhandled rejection:', reason);
  await cleanup();
});
