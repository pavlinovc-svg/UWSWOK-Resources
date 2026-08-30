import type { Availability, LightStatus, OnTheWay, ApprovalItem, ReminderEvent, Session } from "../types";
import data from "../data/organizations.json";
import type { Organization } from "../types";

const KEYS = {
  session: "uwswok_v2_session",
  availability: "uwswok_v2_availability",
  onTheWay: "uwswok_v2_on_the_way",
  approvals: "uwswok_v2_approvals",
  reminders: "uwswok_v2_reminders",
  tokens: "uwswok_v2_chat_tokens",
};

const seedApprovals: ApprovalItem[] = [
  {
    id: "apr-seed-1",
    orgSlug: "lawton-food-bank",
    orgName: "Lawton Food Bank",
    field: "hours",
    summary: "Staff submitted updated Saturday hours: 9am–noon (pending review).",
    requestedBy: "staff@lawtonfoodbank.org",
    requestedAt: "2026-08-20T15:00:00.000Z",
    status: "pending",
  },
];

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getOrganizationsRaw(): Organization[] {
  return (data as { organizations: Organization[] }).organizations;
}

export function getMeta() {
  return (data as { meta: Record<string, string> }).meta;
}

export function getAvailabilityOverrides(): Record<string, Availability> {
  return read(KEYS.availability, {});
}

export function getOrganizations(): Organization[] {
  const overrides = getAvailabilityOverrides();
  return getOrganizationsRaw().map((o) =>
    overrides[o.slug] ? { ...o, availability: overrides[o.slug] } : o
  );
}

export function getOrg(slug: string): Organization | undefined {
  return getOrganizations().find((o) => o.slug === slug);
}

export function setOrgAvailability(slug: string, availability: Availability) {
  const all = getAvailabilityOverrides();
  all[slug] = availability;
  write(KEYS.availability, all);
}

export function setLight(slug: string, key: keyof Availability, status: LightStatus) {
  const org = getOrg(slug);
  if (!org) return;
  const labels: Record<LightStatus, string> = {
    green: "Open / available",
    amber: "Limited / call first",
    red: "Full / unavailable",
  };
  const next: Availability = {
    ...org.availability,
    [key]: { status, label: labels[status], note: "Updated by staff in UWSWOK Resources." },
  };
  setOrgAvailability(slug, next);
}

export function getSession(): Session | null {
  return read<Session | null>(KEYS.session, null);
}

export function setSession(s: Session | null) {
  if (!s) localStorage.removeItem(KEYS.session);
  else write(KEYS.session, s);
}

export function getOnTheWay(): OnTheWay[] {
  return read(KEYS.onTheWay, []);
}

export function addOnTheWay(item: OnTheWay) {
  const list = getOnTheWay();
  list.unshift(item);
  write(KEYS.onTheWay, list);
}

export function getApprovals(): ApprovalItem[] {
  const stored = read<ApprovalItem[] | null>(KEYS.approvals, null);
  if (!stored) {
    write(KEYS.approvals, seedApprovals);
    return seedApprovals;
  }
  return stored;
}

export function saveApprovals(items: ApprovalItem[]) {
  write(KEYS.approvals, items);
}

export function getReminders(): ReminderEvent[] {
  return read(KEYS.reminders, []);
}

export function addReminder(ev: ReminderEvent) {
  const list = getReminders();
  list.unshift(ev);
  write(KEYS.reminders, list);
}

export function tokenState(email: string) {
  const today = new Date().toISOString().slice(0, 10);
  const all = read<Record<string, { date: string; used: number }>>(KEYS.tokens, {});
  const cur = all[email];
  if (!cur || cur.date !== today) return { date: today, used: 0, remaining: 10 };
  return { date: today, used: cur.used, remaining: Math.max(0, 10 - cur.used) };
}

export function consumeToken(email: string): boolean {
  const today = new Date().toISOString().slice(0, 10);
  const all = read<Record<string, { date: string; used: number }>>(KEYS.tokens, {});
  const cur = all[email] && all[email].date === today ? all[email] : { date: today, used: 0 };
  if (cur.used >= 10) return false;
  cur.used += 1;
  all[email] = cur;
  write(KEYS.tokens, all);
  return true;
}

export function formatPhoneHref(phone: string) {
  const first = phone.split(/or|,/i)[0];
  const digits = first.replace(/[^\d]/g, "");
  return digits ? `tel:${digits}` : undefined;
}
