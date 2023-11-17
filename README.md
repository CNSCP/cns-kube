# CNS-Kube

## Table of Contents

- [About](#about)
- [Installing](#installing)
- [Usage](#usage)
- [Maintainers](#maintainers)
- [License](#license)
- [Copyright Notice](#copyright-notice)

## About

## Installing

To **install** or **update** the application, you should fetch the latest version from this Git repository. To do that, you may either download and unpack the repo zip file, or clone the repo using:

```sh
git clone https://github.com/cnscp/cns-kube.git
```

Either method should get you a copy of the latest version. It is recommended (but not compulsory) to place the repo in the `~/cns-kube` project directory. Go to the project directory and install Node.js dependancies with:

```sh
npm install
```

Your application should now be ready to rock.

## Usage

Once installed, run the application with:

```sh
npm run start:dapr
```

To shut down the application, hit `ctrl-c`.

### Environment Variables

The application uses the following environment variables to configure itself:

#### CNS Kube

<table>
  <tr><th>Name</th><th>Description</th><th>Default</th></tr>
  <tr><td>CNS_SERVER_HOST</td><td>CNS Kube server host</td><td>'localhost'</td></tr>
  <tr><td>CNS_SERVER_PORT</td><td>CNS Kube server port</td><td>'3001'</td></tr>
  <tr><td>CNS_DAPR_HOST</td><td>Dapr host</td><td>'localhost'</td></tr>
  <tr><td>CNS_DAPR_PORT</td><td>Dapr port</td><td>'3500'</td></tr>
  <tr><td>CNS_APP_ID</td><td>CNS Dapr application ID</td><td>'cns-dapr'</td></tr>
  <tr><td>CNS_PUBSUB</td><td>CNS Dapr PUBSUB component ID</td><td>'cns-pubsub'</td></tr>
</table>

#### Helm Installer

<table>
  <tr><th>Name</th><th>Description</th><th>Default</th></tr>
  <tr><td>HELM_BINARY_PATH</td><td>Path to Helm binary</td><td>Must be set</td></tr>
</table>

#### KubeCtl Installer

<table>
  <tr><th>Name</th><th>Description</th><th>Default</th></tr>
  <tr><td colspan="3">NYI</td></tr>
</table>

### kubecns.control Profile

<table>
  <tr><th>Property</th><th>Role</th><th>Description</th></tr>
  <tr><td>installer</td><td>Client</td><td>The installer you wish to use</td></tr>
  <tr><td>action</td><td>Client</td><td>The action to perform</td></tr>
  <tr><td>namespace</td><td>Client</td><td>The namespace to install the application</td></tr>
  <tr><td>releaseName</td><td>Client</td><td>The name of the Helm release</td></tr>
  <tr><td>chartName</td><td>Client</td><td>The name of the Helm chart</td></tr>
  <tr><td>repoUrl</td><td>Client</td><td>The URL of the Helm repository</td></tr>
  <tr><td>status</td><td>Server</td><td>The status of the last action</td></tr>
</table>

<table>
  <tr><th>Installer</th><th>Description</th></tr>
  <tr><td>helm</td><td>Use Helm as application installer</td></tr>
  <tr><td>kubectl</td><td>NYI</td></tr>
</table>

<table>
  <tr><th>Action</th><th>Description</th></tr>
  <tr><td>apply</td><td>Tells the installer to add the application</td></tr>
  <tr><td>applied</td><td>When application successfully installed</td></tr>
  <tr><td>remove</td><td>Tells the installer to remove the application</td></tr>
  <tr><td>removed</td><td>When application successfully removed</td></tr>
  <tr><td>error</td><td>Previous action caused an error (see status property)</td></tr>
</table>

#### Example



## Maintainers

## License

See [LICENSE.md](./LICENSE.md).

## Copyright Notice

See [COPYRIGHT.md](./COPYRIGHT.md).
