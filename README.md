# CNS-Kube

## Table of Contents

- [About](#about)
- [Installing](#installing)
- [Usage](#usage)
- [Maintainers](#maintainers)
- [License](#license)
- [Copyright Notice](#copyright-notice)

## About

This repository contains an application that talks to the CNS Dapr Sidecar, written in [Node.js](https://nodejs.org/en/about) and using the [Dapr SDK](https://docs.dapr.io/developing-applications/sdks/js/). The application is used in conjunction with CNS Dapr and it is assumed this is already installed and running (See the [CNS Dapr](https://github.com/CNSCP/cns-dapr) repository for details).

When running, the application monitors `cp:kubecns.control.v1:provider` connections and installs or uninstalls applications based upon the properties of those connections.

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

Once installed, run the application locally with:

```sh
npm run start:dapr
```

* NOTE: `dapr` must be installed and running on your local machine for this command to work. If you want just the node server, use `npm run start`

To shut down the application, hit `ctrl-c`.

### Environment Variables

The CNS Kube uses the following environment variables to configure itself:

| Name             | Description                         | Default                |
|------------------|-------------------------------------|------------------------|
| CNS_CONTEXT      | CNS Broker context                  | Must be set            |
| CNS_DAPR_APP_ID  | The Dapr Application ID for CNS-Dapr| 'cns-dapr'             |
| CNS_DAPR_HOST    | CNS Dapr host                       | 'localhost'            |
| CNS_DAPR_PORT    | CNS Dapr port                       | '3500'                 |
| CNS_PUBSUB       | CNS Dapr PUBSUB component           | 'cns-pubsub'           |
| CNS_SERVER_HOST  | CNS Kube server host                | 'localhost'            |
| CNS_SERVER_PORT  | CNS Kube server port                | '3001'                 |

Alternatively, variables can be stored in a `.env` file in the project directory.

### cp:kubecns.control.v1 Capability

| Property         | Role     | Description                                    |
|------------------|----------|------------------------------------------------|
| action           | Client   | Action to perform                              |
| installer        | Client   | Installer you wish to use                      |
| namespace        | Client   | Namespace to install the application           |
| releaseName      | Client   | Name of the Helm release                       |
| chartName        | Client   | Name of the Helm chart                         |
| helmValuesJSON   | Client   | Values for Helm as JSON string                 |
| repoUrl          | Client   | URL of the application repository              |
| contextID        | Client   | CNS Broker context                             |
| contextToken     | Client   | CNS Broker token                               |
| interfaceUrl     | Server   | User Interface URL or blank for none           |
| interfaceMode    | Server   | Rendering mode of UI, either 'embed' or 'tab'  |
| status           | Server   | Status of the last action performed            |

#### Actions

| Action           | Description                                               |
|------------------|-----------------------------------------------------------|
| apply            | Tell the installer to add the application                 |
| applied          | Set when application successfully installed               |
| remove           | Tell the installer to remove the application              |
| removed          | Set when application successfully removed                 |
| error            | Action caused an error                                    |

#### Installers

| Installer        | Description                                               |
|------------------|-----------------------------------------------------------|
| helm             | Use Helm as application installer                         |
| kubectl          | NYI                                                       |

##### Helm Installer

| Name                | Description                                          | Default                |
|---------------------|------------------------------------------------------|------------------------|
| HELM_BINARY_PATH    | Path to Helm binary                                  | Must be set            |
| TUNNEL_ENABLED_KEY  | The helm values.yaml key to enable tunnel            | tunnel.enabled        |
| TUNNEL_PORT_KEY     | The helm values.yaml key to set which port to tunnel | service.port           |
| TUNNEL_ID_KEY       | The helm values.yaml file to set the tunnel ID       | tunnel.id             |
| INTERFACE_HOST      | The ingress host for the tunneled application        | ibb.staging.padi.io    |
| TUNNEL_DEFAULT_PORT | The default port to tunnel                           | 8080                   |

##### Kubectl Installer

NYI

#### Status

| Status           | Description                                               |
|------------------|-----------------------------------------------------------|
| pending          | Application awaiting deployment                           |
| deployed         | Application was successfully deployed                     |
| failed           | Application failed to deploy                              |

## Maintainers

## License

See [LICENSE.md](./LICENSE.md).

## Copyright Notice

See [COPYRIGHT.md](./COPYRIGHT.md).
