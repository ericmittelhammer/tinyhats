FROM node:12-slim
WORKDIR /usr/src/gateway-service
COPY . .
RUN npm install
CMD [ "node", "--enable-source-maps", "gateway.js" ]

# docker build -t gateway .
# docker run --env-file ./.env -p 80:80 gateway