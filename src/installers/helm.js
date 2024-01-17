// helm.js - Helm installer
// Copyright 2023 Padi, Inc. All Rights Reserved.

'use strict';

// Imports

const cp = require('child_process');

// Constants
const DEBUG = Boolean(process.env.DEBUG) || false
const HELM_BINARY = process.env.HELM_BINARY_PATH || 'suppress';
const KTUNNEL_ENABLED_KEY = process.env.KTUNNEL_ENABLE_VALUE || "ktunnel.enabled"
const KTUNNEL_PORT_KEY = process.env.KTUNNEL_PORT_KEY || 'ktunnel.port'
const KTUNNEL_ID_KEY = process.env.KTUNNEL_ID_KEY || "ktunnel.id"
const INTERFACE_HOST = process.env.INTERFACE_HOST || "ibb.staging.padi.io"
const KTUNNEL_DEFAULT_PORT = process.env.KTUNNEL_DEFAULT_PORT || "8080"

// Apply action
function apply(properties) {
  const namespace = properties.namespace || '';
  const chartName = properties.chartName || '';
  let releaseName = properties.releaseName || '';
  const repoUrl = properties.repoUrl || '';
  var values
  var port
  var contextId
  var interfaceUrl

  releaseName = releaseName.toLowerCase()

  if (namespace === '') throw new Error('namespace is required');
  if (chartName === '') throw new Error('chartName is required');
  if (releaseName === '') throw new Error('releaseName is required');

  var repoName = '';

  if (repoUrl !== '') {
    // Install the helm chart
    spawn(`${HELM_BINARY} repo add ${chartName} ${repoUrl}`);
    repoName = `${chartName}/`;
  }

  // Upgrade the charts
  spawn(`${HELM_BINARY} repo update`);

  // Install is a list which is turned into the helm command used to install the chart
  let install = []

  install.push(HELM_BINARY)
  install.push("upgrade --install")
  install.push(releaseName)
  install.push(`${repoName}${chartName}`)
  install.push(`--namespace ${namespace}`)
  install.push("--output json")

  if (DEBUG) {
    console.log("[*] Properties are")
    console.log(properties)
  }

  try {
    values = JSON.parse(properties.helmValuesJSON)
  } catch (error) {
    // Return error if JSON parsing fails
    return {
      action: 'errored',
      status: "unable to parse helm values as JSON",
      interfaceMode: null,
      interfaceUrl: null,
    }
  }

  for (var key in values) {
    // If KTunnel is enabled, set the ID to the ContextID. Ktunnel requires
    // it to be lowercase, otherwise the tunnel does not start.
    if (key == KTUNNEL_ENABLED_KEY && values[key] == "true") {
      contextId = properties.contextID.toLowerCase()
      if (contextId == undefined) {
        // Generate random alphanumeric string
        console.log("[!] Context ID Was not set. Setting to random string...")
        contextId = Math.random().toString(36).substring(3,13)
      }
      install.push(`--set ${KTUNNEL_ID_KEY}=kt-${contextId}`)
    }

    // If the property is ktunnel.port, save that information for later
    if (key == KTUNNEL_PORT_KEY) {
      port = values[key]
    }
    install.push(`--set ${key}=${values[key]}`)
  }
  

  let cmd = install.join(" ")
  const output = spawn(`${cmd}`)
  const data = JSON.parse(output.toString());

  port = port || KTUNNEL_DEFAULT_PORT
  let interfaceMode = properties.interfaceMode || null
  if (contextId && port ) {
    interfaceUrl = `https://kt-${contextId}_${port}.${INTERFACE_HOST}`
  } else {
    interfaceUrl = null
  }

  // Success
  let response = {
    action: 'applied',
    status: data.info.status,
    interfaceMode: interfaceMode,
    interfaceUrl: interfaceUrl,
  };
  if (DEBUG) {
    console.log(response)
  }
  return response
}

// Remove action
function remove(properties) {
  const namespace = properties.namespace || '';
  let releaseName = properties.releaseName || '';
  releaseName = releaseName.toLowerCase()
  const output = spawn(`${HELM_BINARY} uninstall ${releaseName} --namespace ${namespace}`);
  return {
    action: 'removed',
    status: output.toString()
  };
}

// Spawn helper
function spawn(command) {
  console.log('Spawning:', command);

  if (HELM_BINARY === 'suppress')
    return '{"info": {"status": "suppressed"}}';

  return cp.execSync(command);
}

// Exports

exports.apply = apply;
exports.remove = remove;
