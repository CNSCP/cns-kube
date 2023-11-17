// kubectl.js - Kubectl installer
// Copyright 2023 Padi, Inc. All Rights Reserved.

'use strict';

// Imports

const k8sClientNode = require('@kubernetes/client-node');

// Apply action
function apply(properties) {
  // Success
  return {
    action: 'applied',
    status: 'not yet implemented'
  };

/*/
  const namespace = properties.namespace || '';
  const manifest = properties.manifest || '';

  if (namespace === '') throw new Error('namespace is required');
  if (manifest === '') throw new Error('manifest is required');

  const data = JSON.parse(manifest);

  const kubeConfig = new k8sClientNode.KubeConfig().loadFromDefault();
  const k8s = kubeConfig.makeApiClient(k8sClientNode.CoreV1Api);

  // ....

  // Success
  return {
    action: 'applied',
    status: <status here>
  };
*/
}

// Remove action
function remove(properties) {
  // Success
  return {
    action: 'removed',
    status: 'not yet implemented'
  };
}

// Exports

exports.apply = apply;
exports.remove = remove;
