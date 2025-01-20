// helm.js - Helm installer
// Copyright 2023 Padi, Inc. All Rights Reserved.

'use strict';

// Imports

const cp = require('child_process');

// Constants
const DEBUG = process.env.DEBUG || "false"
const HELM_BINARY = process.env.HELM_BINARY_PATH || 'suppress';
const TUNNEL_ENABLED_KEY = process.env.TUNNEL_ENABLE_VALUE || "tunnel.enabled"
const TUNNEL_PORT_KEY = process.env.TUNNEL_PORT_KEY || 'service.port'
const TUNNEL_ID_KEY = process.env.TUNNEL_ID_KEY || "tunnel.id"
const TUNNEL_DEFAULT_PORT = process.env.TUNNEL_DEFAULT_PORT || "8080"

// Apply action
function apply(properties) {
  var values, port, repoName
  let resp = {}
  let tunnel_enabled = false

  if (DEBUG == "true") {
    console.log("[*] Properties are")
    console.log(properties)
  }

  let valid_properties = _checkValidProperties(properties)
  if (!valid_properties) {
    return {}
  }

  // All of these consts have been checked for truthiness
  const namespace = properties.namespace
  const chartName = properties.chartName
  const releaseName = properties.releaseName.toLowerCase().replace(" ", "")
  const repoUrl = properties.repoUrl
  const contextId = properties.contextID
  const contextToken = properties.contextToken

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


  // Try to parse incoming helm values as JSON
  // If no values provided, return empty (valid) object
  try {
    if (properties.helmValuesJSON) {
      values = JSON.parse(properties.helmValuesJSON)
    } else {
      values = {}
    }
  } catch (error) {
    // Return error if JSON parsing fails
    resp['action'] = 'errored'
    resp['status'] = 'unable to parse helm values as JSON'
    return resp
  }

  // TODO:
  // if chart is ibb-cns-application or edge-central
  // then --set cnsDapr.cnsContext=properties.context and same for Token
  const cnsApps = ["edge-central", "ibb-cns-application"]
  if (cnsApps.includes(chartName)) {
    install.push(`--set cnsDapr.cnsContext=${contextId}`)
    install.push(`--set cnsDapr.cnsToken=${contextToken}`)
  }

  for (var key in values) {
    // If a tunnel is enabled, set the ID to the ContextID.
    if (key == TUNNEL_ENABLED_KEY && values[key].toLowerCase() == "true") {
      install.push(`--set ${TUNNEL_ID_KEY}=${contextId}`)
      tunnel_enabled = true
    }

    // If the property is the port we need to forward, save that information for later
    if (key == TUNNEL_PORT_KEY) {
      port = values[key]
    }
    install.push(`--set ${key}=${values[key]}`)
  }

  let cmd = install.join(" ")

  if (DEBUG == "true") {
    console.log("[*] CMD")
    console.log(cmd)
  }

  const output = spawn(`${cmd}`)
  const data = JSON.parse(output.toString());

  port = port || TUNNEL_DEFAULT_PORT
  let interfaceMode = properties.interfaceMode || "embed"

  resp['action'] = 'applied'
  resp['status'] = data.info.status

  if (contextId && port && tunnel_enabled) {
    resp['interfaceMode'] = interfaceMode
  }

  // Success
  if (DEBUG) {
    console.log(resp)
  }
  return resp
}

// Remove action
function remove(properties) {
  const namespace = properties.namespace || '';
  let releaseName = properties.releaseName || '';
  releaseName = releaseName.toLowerCase()
  const output = spawn(`${HELM_BINARY} uninstall ${releaseName} --namespace ${namespace} --output json`);
  const data = JSON.parse(output.toString());
  return {
    action: 'removed',
    status: data.info.status
  };
}

// Spawn helper
function spawn(command) {
  console.log('Spawning:', command);

  if (HELM_BINARY === 'suppress')
    return '{"info": {"status": "suppressed"}}';

  return cp.execSync(command);
}

// Check that incoming properties are valid
function _checkValidProperties(properties) {
  let required_properties = [
    "chartName",
    "contextID",
    "contextToken",
    "installer",
    "namespace",
    "releaseName",
    "repoUrl",
  ]

  let valid = true

  required_properties.forEach(rp => {
    if (!properties[rp]) {
      valid = false
    }
  })

  return valid
}

// Exports

exports.apply = apply;
exports.remove = remove;
