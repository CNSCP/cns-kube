// index.js - Dapr CNS client
// Copyright 2023 Padi, Inc. All Rights Reserved.

'use strict';

// Imports

const dapr = require('@dapr/dapr');
const merge = require('object-merge');

// Constants

const SERVER_HOST = process.env.CNS_SERVER_HOST || 'localhost';
const SERVER_PORT = process.env.CNS_SERVER_PORT || '3001';

const DAPR_HOST = process.env.CNS_DAPR_HOST || 'localhost';
const DAPR_PORT = process.env.CNS_DAPR_PORT || '3500';

const CNS_APP_ID = process.env.CNS_APP_ID || 'cns-dapr';
const CNS_PUBSUB = process.env.CNS_PUBSUB || 'cns-pubsub';

const KUBE_PROFILE = 'kubecns.control';
const KUBE_ROLE = 'server';

const KUBE_INSTALLERS = [
  'helm',
  'kubectl'
];

const KUBE_SYNCTIME = 2000;

// Dapr server

const server = new dapr.DaprServer({
  serverHost: SERVER_HOST,
  serverPort: SERVER_PORT,
  clientOptions: {
    daprHost: DAPR_HOST,
    daprPort: DAPR_PORT
  }
});

console.log(`[*] CNS Server is at ${SERVER_HOST}:${SERVER_PORT}`)
console.log(`[*] Dapr is at ${DAPR_HOST}:${DAPR_PORT}`)

// Dapr client

const client = new dapr.DaprClient({
  daprHost: DAPR_HOST,
  daprPort: DAPR_PORT
});

// Local data

var installers = {};

var node = {};
var changes = {};

var sync;

// Bind kube installers
function bindInstallers() {
  // Bind each installer
  for (const installer of KUBE_INSTALLERS) {
    try {
      installers[installer] = require('./src/installers/' + installer + '.js');
    } catch (e) {
      console.error('Error:', 'failed to bind installer', installer);
      console.error(e);
    }
  }
}

// Update connection changes
async function updateConnection(id) {
  // Get connection
  const conn = node.connections[id];

  const profile = conn.profile;
  const role = conn.role;

  // Valid kube profile?
  if (profile !== KUBE_PROFILE || role !== KUBE_ROLE) {
    console.log('Ignoring:', id, profile, role);
    return;
  }

  // Get properties
  const properties = conn.properties;

  const action = properties.action;
  const installer = installers[properties.installer];

  console.log('Processing:', id, profile, role, action);

  if (installer === undefined) {
    console.error('Error:', 'installer not valid');
    return;
  }

  // Get action result
  var result;

  try {
    // What action?
    switch (action) {
      case 'apply':
        // Apply
        result = installer.apply(properties);
        break;
      case 'applied':
        // Applied
        break;
      case 'remove':
        // Remove
        result = installer.remove(properties);
        break;
      case 'removed':
        // Removed
        break;
      case 'error':
        // Error
        break;
      default:
        // Unknown
        throw new Error('unknown action ' + action);
    }
  } catch (e) {
    // Failure
    console.error('Error:', 'failed to', action);
    console.error(e);

    result = {
      action: 'error',
      status: e.message
    };
  }

  // Has result?
  if (result !== undefined) {
    // Post action result
    const res = await client.invoker.invoke(CNS_APP_ID, 'node/connections/' + id + '/properties', dapr.HttpMethod.POST, result);

    // Server error?
    if (res.error !== undefined)
      console.error('Error:', res.error);
  }
}

// Update node changes
async function updateNode(data) {
  // Merge changes
  node = merge(node, data);

  // Process connections
  for (const id in data.connections)
    await updateConnection(id);
}

// Sync node changes
function syncNode(data) {
  // Keep changes
  changes = merge(changes, data);

  // Reset sync timer
  if (sync !== undefined)
    clearTimeout(sync);

  // Defer for later
  sync = setTimeout(() => {
    sync = undefined;

    // Update all changes
    updateNode(changes);
    changes = {};
  }, KUBE_SYNCTIME);
}

// Client application
async function start() {
  // Bind installer modules
  bindInstallers();

  // Start client
  await client.start();

  // Fetch node state
  const res = await client.invoker.invoke(CNS_APP_ID, 'node', dapr.HttpMethod.GET);

  // Server error?
  if (res.error !== undefined)
    console.error('Error:', res.error);
  else await updateNode(res.data);

  // Subscribe to changes
  server.pubsub.subscribe(CNS_PUBSUB, 'node', (KUBE_SYNCTIME > 0)?syncNode:updateNode);

  // Start server
  await server.start();
}

// Start application
start().catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});
