// helm.js - Helm installer
// Copyright 2023 Padi, Inc. All Rights Reserved.

'use strict';

// Imports

const cp = require('child_process');

// Constants
const DEBUG = process.env.DEBUG || "false"
const HELM_BINARY = process.env.HELM_BINARY_PATH || 'suppress';
const KTUNNEL_ENABLED_KEY = process.env.KTUNNEL_ENABLE_VALUE || "ktunnel.enabled"
const KTUNNEL_PORT_KEY = process.env.KTUNNEL_PORT_KEY || 'service.port'
const KTUNNEL_ID_KEY = process.env.KTUNNEL_ID_KEY || "ktunnel.id"
const INTERFACE_HOST = process.env.INTERFACE_HOST || "ibb.staging.padi.io"
const KTUNNEL_DEFAULT_PORT = process.env.KTUNNEL_DEFAULT_PORT || "8080"

// Apply action
function apply(properties) {
  var values, port, interfaceUrl, repoName
  let resp = {}
  let ktunnel_enabled = false

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
  const releaseName = properties.releaseName.toLowerCase()
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
    // If KTunnel is enabled, set the ID to the ContextID. Ktunnel requires
    // it to be lowercase, otherwise the tunnel does not start.
    if (key == KTUNNEL_ENABLED_KEY && values[key].toLowerCase() == "true") {
      let cid = contextId.toLowerCase()
      install.push(`--set ${KTUNNEL_ID_KEY}=kt-${cid}`)
      ktunnel_enabled = true
    }

    // If the property is the port we need to forward, save that information for later
    if (key == KTUNNEL_PORT_KEY) {
      port = values[key]
    }
    install.push(`--set ${key}=${values[key]}`)
  }
  
  if (DEBUG == "true") {
    console.log("[*] CMD")
    console.log(install)
  }

  let cmd = install.join(" ")
  const output = spawn(`${cmd}`)
  const data = JSON.parse(output.toString());

  port = port || KTUNNEL_DEFAULT_PORT
  let interfaceMode = properties.interfaceMode || "embed"
  if (contextId && port ) {
    let cid = contextId.toLowerCase()
    interfaceUrl = `https://kt-${cid}_${port}.${INTERFACE_HOST}`
  } else {
    interfaceUrl = null
  }

  resp['action'] = 'applied'
  resp['status'] = data.info.status

  if (contextId && port && ktunnel_enabled) {
    resp['interfaceMode'] = interfaceMode
    resp['interfaceUrl'] = interfaceUrl
  }

  // Success
  let response = {
    action: 'applied',
    status: data.info.status,
    interfaceMode: interfaceMode,
    interfaceUrl: interfaceUrl,
  };
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

  // for (var p in required_properties) {
  //   console.log(p)
  //   if (!properties[p]) {
  //     console.log(`Property ${p} not found`)
  //     return false
  //   }
  // }
  // return true
}

// Exports

exports.apply = apply;
exports.remove = remove;
