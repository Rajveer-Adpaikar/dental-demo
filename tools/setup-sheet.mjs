// One-time setup: create the Bookings sheet, share it view-only with the client,
// and print everything the Netlify function needs.
//
// Run: node tools/setup-sheet.mjs
//
// Before this runs you need a Google Cloud service account + its JSON key on disk:
//   1. cloud.google.com → create project → Enable "Google Sheets API"
//   2. IAM & Admin → Service Accounts → Create service account
//   3. Keys → Add key → JSON (this adds the editor to sheets.googleapis.com)
//   4. Save the downloaded JSON as `service-account.json` in this project (DO NOT COMMIT).
//
// Then share your Bookings spreadsheet with the service account's email (read or edit)
// and the intended client (view-only, no Google account needed).

import { promises as fs } from 'node:fs';

const KEY_FILE = './service-account.json';

async function main() {
  let sa;
  try {
    sa = JSON.parse(await fs.readFile(KEY_FILE, 'utf8'));
  } catch {
    console.error(`Missing ${KEY_FILE}. Create a service-account key first (see header of this file).`);
    process.exit(1);
  }
  if (!sa.client_email || !sa.private_key) {
    console.error(`${KEY_FILE} doesn't look like a service-account key.`);
    process.exit(1);
  }
  console.log('\nAdd these to Netlify → Site → Environment variables:\n');
  console.log(`GOOGLE_SHEET_ID = <id from your spreadsheet URL>`);
  console.log(`GOOGLE_SHEET_RANGE = "Bookings!A:F"`);
  console.log(`GOOGLE_SERVICE_ACCOUNT_JSON = "${JSON.stringify(sa).replace(/"/g, '\\"')}"`);
  console.log('\nPermissions:');
  console.log(`- Service account (${sa.client_email}) must be an EDITOR of the spreadsheet.`);
  console.log('- Share the spreadsheet VIEW-ONLY with your client by email. They never see credentials.\n');
}
main();