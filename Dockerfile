FROM node:18

# Install Helm Kubectl, and Dapr
WORKDIR /tmp
RUN \
  export KUBECTL_ARCH=$(uname -m) \
  && if [ "$KUBECTL_ARCH" = "x86_64" ]; then export KUBECTL_ARCH="amd64"; fi \
  && if [ "$KUBECTL_ARCH" = "aarch64" ]; then export KUBECTL_ARCH="arm64"; fi \
  && export KUBECTL_VERSION=$(curl -L -s https://dl.k8s.io/release/stable.txt) \
  && export KUBECTL_URL="https://dl.k8s.io/release/$KUBECTL_VERSION/bin/linux/$KUBECTL_ARCH/kubectl" \
  && echo "Arch => $KUBECTL_ARCH, Version => $KUBECTL_VERSION, URL => $KUBECTL_URL" \
  && curl -LO $KUBECTL_URL \
  && mv kubectl /usr/local/bin/kubectl \
  && chmod +x /usr/local/bin/kubectl \
  && kubectl version --client

RUN  curl -Lo install-helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 \
  && bash install-helm.sh \
  && helm version --short

RUN curl -Lo install-dapr-cli.sh https://raw.githubusercontent.com/dapr/cli/master/install/install.sh \
  && bash install-dapr-cli.sh \
  && dapr --version

# Install the appliation
WORKDIR /app
COPY package.json package-lock.json /app/
RUN npm install

COPY . /app/

# # Start in kubernetes mode
CMD ["npm", "run", "start"]
