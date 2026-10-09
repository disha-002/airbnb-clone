/** Mock auth: one demo account per role, pre-filled on the login form (seeded in backend/app/seed.py). */
export const DEMO_ACCOUNTS = {
  guest: { label: "Guest", email: "isha@demo.com" },
  host: { label: "Host", email: "aarav@demo.com" },
} as const;

export type DemoRole = keyof typeof DEMO_ACCOUNTS;
