#!/bin/sh
set -e

# Comands
npm run pull:database
npm run prisma:seed
npm run build
npm start