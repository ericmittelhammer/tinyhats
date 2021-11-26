FROM node:12-slim
WORKDIR /usr/src/frontend-service
COPY package.json ./
RUN npm install
COPY . .
CMD [ "node", "--enable-source-maps", "-r", "newrelic", "fe-index.js" ]

# docker build -t manipulate .
# docker run --env-file ./.env -p 80:80 manipulate