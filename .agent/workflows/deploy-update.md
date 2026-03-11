---
description: How to deploy the latest changes including phone normalization
---

1. **Pull the latest code**:
   ```bash
   git pull
   ```

2. **Install new dependencies** (we added `papaparse`):
   ```bash
   npm install
   ```

3. **Build the application**:
   ```bash
   npm run build
   ```

4. **Run the phone normalization migration**:
   Since you cannot access the server terminal, you must run this script **locally** but connected to your **production database**.

   1.  **Backup your local config**:
       ```bash
       cp .env .env.local_backup
       ```
   2.  **Connect to Prod**:
       Edit your `.env` file and replace the `DATABASE_URL` with your **Production Database Connection String** (from nine.ch).
   3.  **Run the script**:
       ```bash
       node scripts/normalize-phones.js
       ```
   4.  **Restore local config**:
       ```bash
       mv .env.local_backup .env
       ```

5. **Deploy the Code**:
   Push your changes to your repository to trigger the deployment (assuming nine.ch pulls from git).
   ```bash
   git push
   ```
