import type { Organization, Session } from "../types";

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const WEEK_SHORT: Record<string, string> = {
  sun: "sunday",
  mon: "monday",
  tue: "tuesday",
  wed: "wednesday",
  thu: "thursday",
  fri: "friday",
  sat: "saturday",
};

function todayName() {
  return WEEKDAYS[new Date().getDay()];
}

function hoursMentionToday(hours: string) {
  if (!hours) return false;
  const h = hours.toLowerCase();
  const today = todayName();
  if (h.includes(today)) return true;
  for (const [short, full] of Object.entries(WEEK_SHORT)) {
    if (full === today && new RegExp(`\\b${short}\\b`).test(h)) return true;
  }
  if (today !== "saturday" && today !== "sunday" && /\bm-f\b/.test(h)) return true;
  return false;
}

function lightRank(org: Organization) {
  const s = org.availability.space.status;
  return s === "green" ? 0 : s === "amber" ? 1 : 2;
}

function lineFor(org: Organization, extra?: string) {
  const bits = [`${org.name}`];
  if (org.phone) bits.push(`Phone: ${org.phone}`);
  if (!org.hideAddress && org.address) bits.push(`${org.address}, ${org.city || "Lawton"}, OK`);
  if (org.hideAddress) bits.push("Confidential location — call first.");
  if (org.hours) bits.push(`Hours (from listing): ${org.hours}`);
  else bits.push("Hours are not listed in the organization documentation. Call to confirm.");
  if (org.restrictions && !org.restrictions.startsWith("Not specified")) {
    bits.push(`Restrictions: ${org.restrictions}`);
  }
  bits.push(`Space light: ${org.availability.space.status} (${org.availability.space.note})`);
  if (extra) bits.push(extra);
  return bits.join(" — ");
}

const FOOT =
  "I only answer from United Way of Southwest Oklahoma organization listings in this app and staff-updated lights. I cannot give medical advice. If this is an emergency call 911. For emotional crisis call or text 988. For other resources call Heartline 211 at 1-877-362-1606.";

export function answerQuestion(q: string, orgs: Organization[], session: Session | null): string {
  const query = q.trim();
  if (!query) return "Ask about a place, food, shelter, or a phone number from the listings.";
  const t = query.toLowerCase();

  const isSleep = /sleep|shelter|bed|tonight|homeless/.test(t) && !/domestic|violence|abuse/.test(t);
  const isWomenKids = /women/.test(t) && /child/.test(t);
  const isFood = /food|eat|meal|lunch|breakfast|hungry|pantry/.test(t);
  const isDV = /domestic|violence|abuse|dv\b|batter/.test(t);
  const isHours = /hour|open|when.*open|what time/.test(t);
  const isTransport = /transport|bus|ride|lats|sooner\s?ride|transit|get there/.test(t);
  const isTribal = /tribal|native|comanche|kiowa|wichita|apache|indian card/.test(t);
  const isVet = /veteran|ssvf|vash|hud-vash/.test(t);

  if (isDV) {
    const list = orgs.filter(
      (o) =>
        o.situations.includes("domestic-violence") ||
        /new directions/i.test(o.name) ||
        /women.?s shelter/i.test(o.name)
    );
    if (!list.length) {
      return `I do not have a matching domestic-violence listing beyond calling first. Call New Directions at 580.357.2500, Comanche Nation Women’s Shelter at 580.492.3590, or Marie Detty – New Directions at 580.250.1794. Addresses are confidential. ${FOOT}`;
    }
    const body = list
      .map((o) => {
        const phone = o.phone || "phone not listed";
        return `${o.name}: ${phone}. Confidential location — call first. Address is not shown in this app.`;
      })
      .join("\n");
    return `Domestic violence help from the listings (phone only — no addresses):\n${body}\nIf you are in immediate danger call 911. ${FOOT}`;
  }

  if (isWomenKids || (isSleep && /women/.test(t) && /child/.test(t))) {
    const list = orgs
      .filter((o) => o.categories.includes("beds"))
      .filter((o) => {
        const blob = `${o.name} ${o.eligibility} ${o.restrictions} ${o.audiences.join(" ")}`.toLowerCase();
        const women = o.audiences.includes("women") || /women/.test(blob);
        const kids = o.audiences.includes("children") || /child/.test(blob);
        const menOnly = /males only/.test(blob);
        return women && kids && !menOnly;
      })
      .sort((a, b) => lightRank(a) - lightRank(b));
    if (!list.length) {
      return `The listings include shelters; I could not confirm which currently take women with children from the documentation fields. Call Heartline 211 at 1-877-362-1606 or 988 if you are in crisis. ${FOOT}`;
    }
    return `Shelters in the listings that mention women and children (green first). Confirm by phone — this is not a reservation:\n${list.map((o) => lineFor(o)).join("\n")}\n${FOOT}`;
  }

  if (isSleep) {
    const shelters = orgs
      .filter((o) => o.categories.includes("beds") || o.situations.includes("homeless"))
      .filter((o) => o.categories.includes("beds") || /ssvf|vash|homeless veteran|mckinney|family promise|carter crane|s212|next step|embrace hope/i.test(o.name))
      .sort((a, b) => lightRank(a) - lightRank(b));
    if (!shelters.length) {
      return `I do not have shelter listings to share beyond Heartline 211 at 1-877-362-1606. If you are in danger call 911. ${FOOT}`;
    }
    return `Places listed under shelter or homeless-veteran programs, green first. Restrictions are copied from the listings. “I’m on the way” does not reserve a bed.\n${shelters.map((o) => lineFor(o)).join("\n")}\n${FOOT}`;
  }

  if (isFood) {
    const food = orgs.filter((o) => o.categories.includes("food") || o.situations.includes("feeding"));
    const today = food.filter((o) => hoursMentionToday(o.hours));
    if (today.length) {
      return `Food programs whose listed hours mention today (${todayName()}). Still call — listings may be out of date:\n${today.map((o) => lineFor(o)).join("\n")}\nOther food listings:\n${food
        .filter((o) => !today.includes(o))
        .map((o) => `${o.name} — ${o.phone || "phone not listed"} — ${o.hours || "hours not listed; call to confirm"}`)
        .join("\n")}\n${FOOT}`;
    }
    return `Food programs from the listings. Please call to confirm they are serving today (${todayName()}):\n${food.map((o) => lineFor(o)).join("\n")}\n${FOOT}`;
  }

  if (isTribal) {
    const list = orgs.filter(
      (o) =>
        o.categories.includes("tribal") ||
        /comanche|kiowa|wichita|apache|indian child|native/i.test(o.name)
    );
    return `Native American and tribal listings from the United Way guide:\n${list.map((o) => lineFor(o)).join("\n")}\n${FOOT}`;
  }

  if (isVet) {
    const list = orgs.filter(
      (o) =>
        o.categories.includes("veterans") ||
        /veteran|ssvf|vash|dav/i.test(o.name + o.description)
    );
    return `Military and veteran listings, including homeless veteran programs when documented:\n${list.map((o) => lineFor(o)).join("\n")}\n${FOOT}`;
  }

  if (isTransport) {
    const list = orgs.filter(
      (o) =>
        o.categories.includes("transport") ||
        /lats|comanche nation transit|soonerride|transit|transport/i.test(o.name)
    );
    const named = ["LATS", "Comanche Nation Transit", "SoonerRide"];
    const ordered = [...list].sort((a, b) => {
      const ai = named.findIndex((n) => a.name.toLowerCase().includes(n.toLowerCase()));
      const bi = named.findIndex((n) => b.name.toLowerCase().includes(n.toLowerCase()));
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
    return `Transportation listings, including LATS, Comanche Nation Transit, and SoonerRide:\n${ordered.map((o) => lineFor(o)).join("\n")}\n${FOOT}`;
  }

  if (isHours) {
    const match = findByName(query, orgs);
    if (match) {
      if (match.hours) {
        return `${match.name} hours from the listing: ${match.hours}. Phone: ${match.phone || "not listed"}. If this is missing a usual weekday, that was not in the documentation. ${FOOT}`;
      }
      return `${match.name}: hours are not listed in the organization documentation. Call ${match.phone || "Heartline 211 at 1-877-362-1606"} to confirm. ${FOOT}`;
    }
  }

  const named = findByName(query, orgs);
  if (named) {
    return `${lineFor(named)}\nEligibility (from listing): ${named.eligibility}\n${FOOT}`;
  }

  const terms = t.split(/\W+/).filter((w) => w.length > 3);
  const scored = orgs
    .map((o) => {
      const blob = `${o.name} ${o.shortDescription} ${o.keywords.join(" ")} ${o.categories.join(" ")}`.toLowerCase();
      const score = terms.filter((w) => blob.includes(w)).length;
      return { o, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  if (scored.length) {
    return `Here is what the organization listings match. I cannot add hours or eligibility that are not documented:\n${scored
      .map((x) => lineFor(x.o))
      .join("\n")}\n${FOOT}`;
  }

  const elevated = session && session.role !== "public";
  const more = elevated
    ? " You are signed in with an elevated demo role. If you need more than today’s 10 questions, use the request-more stub on this page."
    : "";
  return `I do not have that in the organization documentation. I will not invent hours, eligibility, or advice.${more} Call or text 988, call 911 in an emergency, or call Heartline 211 at 1-877-362-1606. ${FOOT}`;
}

function findByName(query: string, orgs: Organization[]): Organization | undefined {
  const t = query.toLowerCase();
  const cleaned = t
    .replace(/hours? of|what are the hours|when is|open|today|please|tell me/g, "")
    .trim();
  const exact = orgs.find((o) => cleaned.includes(o.name.toLowerCase()));
  if (exact) return exact;
  const parts = orgs.filter((o) => {
    const n = o.name.toLowerCase();
    const key = n.split(/[–,—]/)[0].trim();
    return key.length > 5 && cleaned.includes(key);
  });
  return parts[0];
}

export { FOOT };
