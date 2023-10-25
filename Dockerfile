FROM node:18

WORKDIR /app
COPY package.json package-lock.json /app/
RUN npm install

CMD ["npm", "run", "start"]
