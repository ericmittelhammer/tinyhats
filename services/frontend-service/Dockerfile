FROM node:12-slim
WORKDIR /usr/src/app
COPY package.json ./
RUN npm install
COPY . .
CMD [ "node", "-r", "newrelic", "index.js" ]

# docker build -t manipulate .
# docker run --env-file ./.env -p 80:80 manipulate