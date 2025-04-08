# Venn detector 2FA integration

This repository implements a Two-Factor Authentication (2FA) system for the Venn Framework using Time-based One-Time Passwords (TOTP). It leverages the `otpauth` library to generate and validate TOTP

**Integration with Venn Detection Service:**

The `DetectionService` (`src/modules/detection-module/service.ts`) utilizes the 2FA module to allow users to override potentially suspicious transaction detections. When a transaction is flagged as suspicious (e.g., based on value or number of internal calls), the service checks for 2FA credentials (`username` and `token`) provided in the `additionalData` field of the request.

To do so, users first need to register in the system (either through UI or using /auth/user POST request). Users `username` and `secret` are saved in a `mongodb` collection. Upon registration, users will get a uri that can be saved in an app like Google Auth to later approve flagged transactions using 6-digit code.

If credentials are present, the `AuthService` verifies the token. A valid token permits the otherwise suspicious transaction to proceed, effectively acting as a user-verified override.

In this proof-of-concept app, venn detects and flags transactions as suspicious using these criteria:
 - Transaction value is more than 1 ETH
 - Number of internal calls within this transaction is more than 5

_these rules are suggested to be modified for if intended to be used in production_

## Table of Contents

- [Local development:](#️-local-development)
- [Deploy to production](#-deploy-to-production)

## 🛠️ Local Development

**Environment Setup**

*Requirements*
 - Node.js
 - MongoDB

Create a `.env` file with:

```bash
PORT=3000
HOST=localhost
LOG_LEVEL=debug
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=venn
```

**Runing In Dev Mode**
```bash
yarn        # or npm install
yarn dev    # or npm run dev
```

## 🚀 Deploy To Production

**Manual Build**

```bash
yarn build      # or npm run build
yarn start      # or npm run start
```


**Using Docker**
```bash
docker compose up --build -d
```

