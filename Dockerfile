FROM node:18
ARG KUBECTL_ARCH=amd64 #--> kubectl also supports 'arm64'

# Install Helm Kubectl, and Dapr
WORKDIR /tmp
RUN curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash \
  && curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/${KUBECTL_ARCH}/kubectl" \
  && chmod +x kubectl \
  && mv kubectl /usr/local/bin/ \
  && helm version --short \
  && kubectl version --client \
  && wget -q https://raw.githubusercontent.com/dapr/cli/master/install/install.sh -O - | /bin/bash

# Install the appliation
WORKDIR /app
COPY package.json package-lock.json /app/
RUN npm install

COPY . /app/

CMD ["npm", "run", "start"]
