FROM node:lts

RUN mkdir -p /usr/src/app && \
    chown -R node:node /usr/src/app
WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y jq

ARG NODE_ENV
ENV NODE_ENV $NODE_ENV

COPY --chown=node:node install/package.json /usr/src/app/package.json

USER node

RUN npm install && \
    npm cache clean --force

WORKDIR ./plugins/nodebb-plugin-composer-classroom
RUN npm link

WORKDIR /usr/src/app
RUN npm link nodebb-plugin-composer-classroom

COPY --chown=node:node . /usr/src/app

ENV NODE_ENV=production \
    daemon=false \
    silent=false

EXPOSE 4567

RUN chmod +x create_config.sh

CMD  ./create_config.sh -n "${SETUP}" && ./nodebb setup || ./nodebb build; ./nodebb reset -p nodebb-plugin-composer-default; ./nodebb start
