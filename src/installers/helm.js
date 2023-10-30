// helm.js - Helm installer
// Copyright 2023 Padi, Inc. All Rights Reserved.

'use strict';

// Imports

const cp = require('child_process');

// Constants

const HELM_BINARY = process.env.HELM_BINARY_PATH || 'suppress';

// Apply action
function apply(properties) {
  const namespace = properties.namespace || '';
  const chartName = properties.chartName || '';
  let releaseName = properties.releaseName || '';
  const repoUrl = properties.repoUrl || '';

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

  const output = spawn(`${HELM_BINARY} upgrade --install ${releaseName} ${repoName}${chartName} --namespace ${namespace} --output json`);
  const data = JSON.parse(output.toString());

  // Success
  return {
    action: 'applied',
    status: data.info.status
  };
}

// Remove action
function remove(properties) {
  throw new Error('not yet implemented');
/*
  // Success
  return {
    action: 'removed',
    status: <status here>
  };
*/
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
