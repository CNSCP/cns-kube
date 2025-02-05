// helm.js - Helm installer
// Copyright 2023 Padi, Inc. All Rights Reserved.

'use strict';

// Imports

const cp = require('child_process');
const fs = require('fs')

// Constants
const DEBUG = process.env.DEBUG || "false"
const HELM_BINARY = process.env.HELM_BINARY_PATH || 'suppress';

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
  let releaseName = properties.releaseName.toLowerCase().replace(" ", "").replace("-","")
  releaseName = `cnskube-${releaseName}`
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
      const valuesJSON = parseHelmValues(JSON.parse(properties.helmValuesJSON))
      if (valuesJSON.tunnel && valuesJSON.tunnel.id == undefined) {
          valuesJSON['tunnel']['id'] = contextId
      }
      const valuesFile = `/tmp/${releaseName}-${contextId}.json`
      fs.writeFileSync(valuesFile, JSON.stringify(valuesJSON), function (err) {
        if (err) throw err;
        console.log(`Helm values saved to ${valuesFile}`)
      })

      install.push(`--values ${valuesFile}`)
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


  let cmd = install.join(" ")

  const output = spawn(`${cmd}`)
  const data = JSON.parse(output.toString());

  if (DEBUG == "true") {
    console.log("[*] Helm Response " + JSON.stringify(data))
  }

  resp['action'] = 'applied'
  resp['status'] = data.info.status

  // Success
  if (DEBUG) {
    console.log(resp)
  }

  return resp
}

// Remove action
function remove(properties) {
  const namespace = properties.namespace || '';
  let releaseName = properties.releaseName.toLowerCase().replace(" ", "").replace("-","")
  releaseName = `cnskube-${releaseName}`
  const output = spawn(`${HELM_BINARY} uninstall ${releaseName} --namespace ${namespace}`);
  const data = JSON.parse(output.toString());
  return {
    action: 'removed',
    status: 'removed',
    message: data
  };
}

// Spawn helper
function spawn(command) {
  console.log('Spawning:', command);

  if (HELM_BINARY === 'suppress')
    return '{"info": {"status": "suppressed"}}';

  return cp.execSync(command);
}
function parseHelmValues(obj) {
  // Function to parse dot notation into a valid object. 
  // Example: 'foo.bar: baz' --> {"foo": {"bar":"baz"}}
  let result = {};

  for (let key in obj) {
    let parts = key.split(".");
    let current = result;

    for (let i = 0; i < parts.length; i++) {
      let part = parts[i];

      if (i === parts.length - 1) {
        current[part] = obj[key]; // Assign value at the last part
      } else {
        current[part] = current[part] || {}; // Create nested object if it doesn't exist
        current = current[part]; // Move deeper
      }
    }
  }

  return result;
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
