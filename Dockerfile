FROM node:21-bookworm-slim

WORKDIR /app

# Install npm dependencies (includes @playwright/test)
COPY package.json package-lock.json ./
RUN npm ci

# Install Chromium and its OS-level dependencies.
# Uses the exact browser version pinned by @playwright/test in the lockfile.
RUN npx playwright install --with-deps chromium

# Copy only what the test runner needs
COPY playwright.config.ts ./
COPY tests/ ./tests/

CMD ["npm", "run", "test"]
