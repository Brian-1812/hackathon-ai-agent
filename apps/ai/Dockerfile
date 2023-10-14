FROM node:alpine As development

WORKDIR /Users/brian/Documents/programming/hackathon/med/api-server

COPY package.json ./
COPY yarn.lock ./
COPY tsconfig.json tsconfig.json
COPY nest-cli.json nest-cli.json

RUN npm i -g yarn
RUN npm install -g @nestjs/cli
RUN yarn

COPY apps/ai apps/ai
COPY libs libs

RUN cd apps/ai && yarn

RUN yarn build ai

FROM node:alpine As production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /Users/brian/Documents/programming/hackathon/med/api-server

COPY package.json ./
COPY yarn.lock ./

# RUN npm i -g yarn
RUN yarn --prod

COPY --from=development /Users/brian/Documents/programming/hackathon/med/api-server/dist ./dist

CMD [ "node", "dist/apps/ai/main" ]