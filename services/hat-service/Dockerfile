FROM node:12-slim
WORKDIR /usr/src/app
COPY package.json ./
RUN sed -i '/\s*"type":\W*"module"/d' ./package.json
RUN npm install
COPY dist .
CMD [ "node", "--enable-source-maps", "--experimental-modules", "-r", "newrelic", "index.js" ]

# docker build -t manipulate .
# docker run --env-file ./.env -p 80:80 manipulate