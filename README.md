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

When running, the application monitors `kubecns.control` server connections and installs or uninstalls applications based upon the properties of those connections.

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
npm run start
```

To shut down the application, hit `ctrl-c`.

### Environment Variables

The CNS Kube uses the following environment variables to configure itself:

| Name             | Description                      | Default                |
|------------------|----------------------------------|------------------------|
| CNS_SERVER_HOST  | CNS Kube server host             | 'localhost'            |
| CNS_SERVER_PORT  | CNS Kube server port             | '3001'                 |
| CNS_DAPR_HOST    | Dapr host                        | 'localhost'            |
| CNS_DAPR_PORT    | Dapr port                        | '3500'                 |
| CNS_DAPR         | CNS Dapr application ID          | 'cns-dapr'             |
| CNS_PUBSUB       | CNS Dapr PUBSUB component ID     | 'cns-pubsub'           |
| CNS_CONTEXT      | CNS Dapr context                 | Must be set            |

### The kubecns.control Connection Profile

| Property         | Role     | Description                                    |
|------------------|----------|------------------------------------------------|
| action           | Client   | Action to perform                              |
| installer        | Client   | Installer you wish to use                      |
| namespace        | Client   | Namespace to install the application           |
| releaseName      | Client   | Name of the Helm release                       |
| chartName        | Client   | Name of the Helm chart                         |
| repoUrl          | Client   | URL of the application repository              |
| contextID        | Client   | Broker context                                 |
| contextToken     | Client   | Broker context token                           |
| status           | Server   | Status of the last action performed            |

#### Actions

| Action           | Description                                               |
|------------------|-----------------------------------------------------------|
| apply            | Tell the installer to add the application                 |
| applied          | Set when application successfully installed               |
| remove           | Tell the installer to remove the application              |
| removed          | Set when application successfully removed                 |
| error            | Action caused an error (See status property)              |

#### Installers

| Installer        | Description                                               |
|------------------|-----------------------------------------------------------|
| helm             | Use Helm as application installer                         |
| kubectl          | NYI                                                       |

##### Helm Installer

| Name             | Description                      | Default                |
|------------------|----------------------------------|------------------------|
| HELM_BINARY_PATH | Path to Helm binary              | Must be set            |

##### Kubectl Installer

#### Example

## Maintainers

## License

See [LICENSE.md](./LICENSE.md).

## Copyright Notice

See [COPYRIGHT.md](./COPYRIGHT.md).
