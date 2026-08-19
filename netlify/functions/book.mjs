// Book a dental appointment. Appends the request to a Google Sheet the clinic
// can view (view-only link) without the site owner sharing credentials.
// Uses only Node built-ins: a service-account JWT is signed with `crypto`.
//
// Env (set in Netlify UI, not committed):
//   GOOGLE_SHEET_ID             — id from the sheet URL
//   GOOGLE_SHEET_RANGE          — e.g. "Bookings!A:F"
//   GOOGLE_SERVICE_ACCOUNT_JSON — full service-account JSON, JSON string

import { createPrivateKey, sign } from 'node:crypto';

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders(),
    });
  }

  const body = await req.json().catch(() => null);
  const { first, last, phone, service, date } = body ?? {};
  const err = validate({ first, last, phone, service, date });
  if (err) {
    return new Response(JSON.stringify({ error: err }), {
      status: 400,
      headers: corsHeaders(),
    });
  }

  try {
    const row = [new Date().toISOString(), first.trim(), last.trim(), phone.trim(), service, date];
    await appendRow(row);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: corsHeaders(),
    });
  } catch (e) {
    console.error('sheet append failed:', e);
    return new Response(JSON.stringify({ error: 'Could not save booking. Try again or call the clinic.' }), {
      status: 502,
      headers: corsHeaders(),
    });
  }
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
}

function validate(b) {
  for (const key of ['first', 'last', 'phone', 'service', 'date']) {
    if (!b[key] || !b[key].trim().length) return `Missing ${key}`;
  }
  if (!/^[+\d][\d\s().-]{6,}$/.test(b.phone)) return 'Phone number looks invalid';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.date)) return 'Date must be YYYY-MM-DD';
  return null;
}

async function appendRow(row) {
  const envelope = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON ?? '{}');
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: envelope.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const sigInput = `${b64(header)}.${b64(payload)}`;
  const assertion = `${sigInput}.${cryptoSigner(envelope.private_key, sigInput)}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'jwt-bearer', assertion }).toString(),
  });
  if (!tokenRes.ok) throw new Error(`token ${tokenRes.status}: ${await tokenRes.text()}`);
  const { access_token } = await tokenRes.json();

  const range = process.env.GOOGLE_SHEET_RANGE ?? 'Bookings!A:F';
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${process.env.GOOGLE_SHEET_ID}/values/${range}:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [row] }),
    }
  );
  if (!res.ok) throw new Error(`sheets ${res.status}: ${await res.text()}`);
}

function cryptoSigner(privateKeyPem, input) {
  return sign('RSA-SHA256', Buffer.from(input), createPrivateKey(privateKeyPem)).toString('base64url');
}