# automatch-inventory-script

This script uses Node.js to scrape data from different online vehicles marketplaces. The program uses Puppeteer to navigate the websites and Cheerio to parse the HTML and extract relevant data. All data is ingested on MongoDB collection through automatized proccess, every 8 hs.

## Jobs Architecture
![jobs architecture](assets/jobs-architecture.png)

## Pre-requisites (Local)

1. Node.js v20.10.0 or or higher
1. Chromium (Google Chrome brings it)

## Installation (Local)

```bash
npm run install
```

## Running script (Local)

```bash
# generates prisma schema and generate types
$ npm run build:database

# traspile .ts to .js and minify files
$ npm run build

# run script
$ npm run start
```

## Run Jobs in Kubernetes
### Requisites:
- Option 1: [Minikube](https://minikube.sigs.k8s.io/docs/start/) 
- Option 2: [Docker Desktop](https://www.docker.com/products/docker-desktop/) with [Kubernetes flag](https://docs.docker.com/desktop/kubernetes/) on

### Build and deploy Kubernetes resources:
 - Follow the next instructions: [Setup Cronjobs](./setup-cronjobs-.md)