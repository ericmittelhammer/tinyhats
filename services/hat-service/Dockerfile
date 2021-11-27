FROM node:12-slim
WORKDIR /usr/src/hat-service
COPY package.json ./
RUN npm install
COPY hat-index.js ./
COPY newrelic.js ./
COPY src ./src
CMD [ "node", "--enable-source-maps", "--experimental-modules", "-r", "newrelic", "hat-index.js" ]

# docker build -t manipulate .
# docker run --env-file ./.env -p 80:80 manipulate