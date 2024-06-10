// index.js - Dapr CNS client
// Copyright 2023 Padi, Inc. All Rights Reserved.

'use strict';

// Imports

const dapr = require('@dapr/dapr');

const env = require('dotenv').config();
const merge = require('object-merge');

const pack = require('./package.json');

// Errors

const E_CONTEXT = 'no context';

// Defaults

const defaults = {
  CNS_CONTEXT: '',
  CNS_DAPR: 'cns-dapr',
  CNS_DAPR_HOST: 'localhost',
  CNS_DAPR_PORT: '3500',
  CNS_PUBSUB: 'cns-pubsub',
  CNS_SERVER_HOST: 'localhost',
  CNS_SERVER_PORT: '3001'
};

// Config

const config = {
  CNS_CONTEXT: process.env.CNS_CONTEXT || defaults.CNS_CONTEXT,
  CNS_DAPR: process.env.CNS_DAPR || defaults.CNS_DAPR,
  CNS_DAPR_HOST: process.env.CNS_DAPR_HOST || defaults.CNS_DAPR_HOST,
  CNS_DAPR_PORT: process.env.CNS_DAPR_PORT || defaults.CNS_DAPR_PORT,
  CNS_PUBSUB: process.env.CNS_PUBSUB || defaults.CNS_PUBSUB,
  CNS_SERVER_HOST: process.env.CNS_SERVER_HOST || defaults.CNS_SERVER_HOST,
  CNS_SERVER_PORT: process.env.CNS_SERVER_PORT || defaults.CNS_SERVER_PORT
};

// Dapr client

const client = new dapr.DaprClient({
  daprHost: config.CNS_DAPR_HOST,
  daprPort: config.CNS_DAPR_PORT,
  logger: {
    level: dapr.LogLevel.Error
  }
});

// Dapr server

const server = new dapr.DaprServer({
  serverHost: config.CNS_SERVER_HOST,
  serverPort: config.CNS_SERVER_PORT,
  clientOptions: {
    daprHost: config.CNS_DAPR_HOST,
    daprPort: config.CNS_DAPR_PORT
  },
  logger: {
    level: dapr.LogLevel.Error
  }
});

// Installers

const KUBE_INSTALLERS = [
  'helm',
  'kubectl'
];

// Control profile

const KUBE_PROFILE_V1 = 'cp:kubecns.control.v1:provider';
const KUBE_SYNCTIME = 2000;

// Local data

var installers = {};

var connsV1 = {};
var changes = {};

var sync;

// Bind installers
function bindInstallers() {
  // Bind each installer
  for (const installer of KUBE_INSTALLERS) {
    try {
      // Bind module
      installers[installer] = require('./src/installers/' + installer + '.js');
      console.log('CNS Kube supports', installer);
    } catch (e) {
      // Failure
      console.error('Error:', 'failed to bind installer', installer);
      console.error(e);
    }
  }
}

// Add connection
async function connectV1(id) {
  // Get connection
  const conn = connsV1[id];

  if (conn === undefined) {
    console.log('Unknown:', id);
    return;
  }

  // Get properties
  const properties = conn.properties;

  const action = properties.action;
  const installer = installers[properties.installer];

  console.log('Processing:', id, action);

  // Valid installer?
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
  if (result === undefined) return;

  try {
    // Post action result
    const res = await client.invoker.invoke(
      config.CNS_DAPR,
      'node/contexts/' + config.CNS_CONTEXT + '/capabilities/' + KUBE_PROFILE_V1 + '/connections/' + id + '/properties',
      dapr.HttpMethod.POST,
      result);

    // CNS Dapr error?
    if (res.error !== undefined)
      throw new Error(res.error);
  } catch(e) {
    // Failure
    console.error('Error:', e.message);
  }
}

// Remove connection
async function removeV1(id) {
  // Get connection
  const conn = connsV1[id];

  if (conn === undefined) {
    console.log('Unknown:', id);
    return;
  }

  // Remove connection
  delete connsV1[id];

  // Get properties
  const properties = conn.properties;

  const action = properties.action;
  const installer = installers[properties.installer];

  // Not in applied state?
  if (action !== 'applied') {
    console.log('Skipping:', id, action);
    return;
  }

  console.log('Processing:', id, 'remove');

  // Valid installer?
  if (installer === undefined) {
    console.error('Error:', 'installer not valid');
    return;
  }

  try {
    // Try to remove
    const result = installer.remove(properties);
    console.log('Removed:', result.status);
  } catch (e) {
    // Failure
    console.error('Error:', 'failed to remove');
    console.error(e);
  }
}

// Update capability
async function updateV1(data) {
  // Capability removed?
  if (data === null) {
    // Remove all connections
    for (const id of connsV1)
      await removeV1(id);

    connsV1 = {};
    return;
  }

  // Process connections
  const conns = data.connections;

  for (const id in conns) {
    // Connection removed?
    if (conns[id] === null) {
      await removeV1(id);
      delete conns[id];
    }
  }

  // Merge changes
  connsV1 = merge(connsV1, conns);

  // Process updates
  for (const id in conns)
    await connectV1(id);
}

// Update context changes
async function updateContext(data) {
  // Has any data?
  if (data === undefined) return;

  // Get capability changes
  const caps = data.capabilities;

  for (const profile in caps) {
    // What profile?
    switch (profile) {
      case KUBE_PROFILE_V1:
        // Version 1
        await updateV1(caps[profile]);
        break;
    }
  }
}

// Sync context changes
function syncContext(data) {
  // Keep changes
  changes = merge(changes, data);

  // Reset sync timer
  if (sync !== undefined)
    clearTimeout(sync);

  // Defer for later
  sync = setTimeout(() => {
    sync = undefined;

    // Update all changes
    updateContext(changes);
    changes = {};
  }, KUBE_SYNCTIME);
}

// Client application
async function start() {
  // Output welcome
  console.log('CNS Kube', pack.version);

  console.log('CNS Kube on', config.CNS_SERVER_HOST, 'port', config.CNS_SERVER_PORT);
  console.log('CNS Dapr on', config.CNS_DAPR_HOST, 'port', config.CNS_DAPR_PORT);

  // Bind installer modules
  bindInstallers();

  // No context?
  if (config.CNS_CONTEXT === '')
    throw new Error(E_CONTEXT);

  console.log('CNS context:', config.CNS_CONTEXT);

  // Start client
  await client.start();

  // Fetch context state
  const res = await client.invoker.invoke(
    config.CNS_DAPR,
    'node/contexts/' + config.CNS_CONTEXT,
    dapr.HttpMethod.GET);

  // CNS Dapr error?
  if (res.error !== undefined)
    throw new Error(res.error);

  // Initial update
  await updateContext(res.data);

  // Subscribe to context
  server.pubsub.subscribe(
    config.CNS_PUBSUB,
    'node/contexts/' + config.CNS_CONTEXT,
    (KUBE_SYNCTIME > 0)?syncContext:updateContext);

  // Start server
  await server.start();
}

// Start application
start().catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});
