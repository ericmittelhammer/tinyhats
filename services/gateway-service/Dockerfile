FROM node:12.0-slim
WORKDIR /usr/src/app
COPY . .
RUN npm install
CMD [ "node", "--enable-source-maps", "gateway.js" ]

# docker build -t gateway .
# docker run --env-file ./.env -p 80:80 gateway