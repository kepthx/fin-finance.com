# FROM mhart/alpine-node:latest
FROM node:6.9.1

WORKDIR /node_app/src
ADD . /node_app/src

ENV NODE_ENV=production

# VOLUME ["build-modules:/node_app/src/node_modules", "build-data:/node_app/src/build"]
# RUN apk add --no-cache make gcc g++ python && \
# 	npm i uws node-sass -g && \
# 	npm install --production=false && \
# 	npm build && \
#   	apk del make gcc g++ python

RUN npm install --production=false && \
	npm run build

EXPOSE 3031 3001 3030 5858

CMD [ "npm", "start" ]
