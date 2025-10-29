#!/bin/bash
# Instala Chromium
apt-get update && apt-get install -y chromium-browser

# Lanza el backend
node index.js
