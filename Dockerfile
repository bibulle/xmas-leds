# -------------
FROM node:16 AS BUILD

WORKDIR /usr/src

COPY package*.json ./
# COPY decorate-angular-cli.js ./
# COPY angular.json ./
COPY nx.json ./
COPY tsconfig.base.json ./
COPY libs libs

RUN npm install

RUN mkdir apps
COPY apps/frontend apps/frontend
COPY apps/api apps/api
COPY apps/api apps/api

RUN npm run build frontend --omit=dev && npm run build api --omit=dev

# -------------
FROM node:16

# switch to europe timezone
RUN ln -fs /usr/share/zoneinfo/Europe/Paris /etc/localtime

WORKDIR /usr/src

COPY --from=BUILD /usr/src/package*.json ./
COPY --from=BUILD /usr/src/dist dist/ 

RUN npm ci --only=production --ignore-scripts --omit=dev

ENV PORT=3000

VOLUME ["/data"]
EXPOSE 3000

#CMD mv dist/apps/frontend/* dist/apps/frontend/.htaccess /frontend && node dist/apps/api/main.js
CMD mv dist/apps/frontend/* /frontend && node dist/apps/api/main.js
