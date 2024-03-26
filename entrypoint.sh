#!/bin/sh
set -e

# Comands
npm run build:database
npm run prisma:seed
npm run build
npm start