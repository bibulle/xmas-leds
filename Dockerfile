# -------------
FROM node:18

WORKDIR /usr/src

COPY package*.json ./
COPY dist dist/

# switch to europe timezone
RUN ln -fs /usr/share/zoneinfo/Europe/Paris /etc/localtime 

RUN npm install --production --ignore-scripts

ENV PORT=3000

VOLUME ["/data"]
EXPOSE 3000

#CMD mv dist/apps/frontend/* dist/apps/frontend/.htaccess /frontend && node dist/apps/api/main.js
CMD mv dist/apps/frontend/* /frontend && node dist/apps/api/main.js
