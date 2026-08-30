#!/usr/bin/env python3
"""Build organizations.json from the live UWSWOK resources page (primary)
and merge names/phones from Resource Guide 2027 (print). Prefer website text.
"""
from __future__ import annotations

import html as htmlmod
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML_PATH = Path("/tmp/uwswok-src/resources.html")
DOCX_TXT = Path("/tmp/uwswok-src/guide-2027.txt")
OUT = ROOT / "src" / "data" / "organizations.json"

CAT_MAP = {
    "Child and Parenting Services": ("kids", ["kids"], ["family-advocacy"]),
    "Clothing Assistance": ("clothing", ["clothing"], []),
    "Counseling and Rehabilitation Services": ("counseling", ["counseling", "health"], []),
    "Emergency Response Services": ("emergency", ["emergency"], []),
    "Employment and Education Assistance": ("employment", ["employment"], []),
    "Food Assistance": ("food", ["food"], ["feeding"]),
    "Health Services": ("health", ["health"], []),
    "Housing/Rental Assistance": ("housing", ["housing"], []),
    "Legal Services": ("legal", ["legal"], []),
    "Native American Specific Resources": ("tribal", ["tribal"], []),
    "Military and Veteran Services": ("veterans", ["veterans"], []),
    "Senior Citizen Assistance": ("seniors", ["seniors"], []),
    "Senior Citizen Services": ("seniors", ["seniors"], []),
    "Shelter Services": ("beds", ["beds"], ["homeless"]),
    "Support Groups": ("support", ["support"], []),
    "Tax Assistance": ("legal", ["legal"], []),
    "Transportation Services": ("transport", ["transport"], []),
    "Utilities and Rental Assistance": ("utilities", ["utilities", "housing"], []),
    "Utility and Rental Assistance": ("utilities", ["utilities", "housing"], []),
    "Veterinarian/Pet/Service Animals": ("pets", ["pets"], []),
}

UW_PARTNERS = [
    "scouting america last frontier",
    "boy scouts of america last frontier",
    "casa of southwest oklahoma",
    "catholic charities",
    "center for creative living",
    "christian family counseling",
    "family promise of lawton",
    "girl scouts of western oklahoma",
    "hearts that care",
    "lawton food bank",
    "legal aid services of oklahoma",
    "marie detty",
    "might",
    "oklahoma parkinson alliance",
    "the salvation army",
    "salvation army",
    "success by 6",
    "teen court",
    "united way of southwest oklahoma",
]

FORCE_GREEN_NAMES = [
    "family promise",
    "c. carter crane",
    "c carter crane",
    "new directions",
    "comanche nation woman",
    "comanche nation women",
    "s212",
    "next step tlp",
    "embrace hope",
    "lawton food bank",
    "salvation army",
    "mckinney vento",
    "homeless veteran outreach",
    "supportive service for veteran families",
    "ssvf",
    "hud vash",
    "hud-vash",
    "snap",
    "wic",
    "lawton mobile meals",
    "hungry hearts",
    "m28 ministries",
    "lovesick ministries",
    "holy family",
    "st. vincent",
    "st. john",
    "calvary baptist",
    "central baptist",
    "centenary united methodist",
    "harvest plenty",
    "hands to care",
    "goodwill industries of southwest",
    "super thrift",
    "marie detty – children",
    "marie detty - children",
    "children’s emergency",
    "liheap",
    "catholic charities",
    "might community",
    "blessed sacrament",
    "swok community action",
    "area domestic violence",
]

NEVER_GREEN_NAMES = [
    "boy scouts",
    "scouting america",
    "girl scouts",
    "lawton family ymca",
    "armed services ymca",
    "express employment",
    "numunu staffing",
    "onin staffing",
    "alcoholics anonymous",
    "narcotics anonymous",
    "lawton original aa",
    "lawton police",
    "lawton fire",
    "benjamin o. davis",
    "columbia square",
    "golden age apartment",
    "goodwill village",
    "lawton pointe",
]

HIDE_ADDRESS_NAMES = [
    "new directions",
    "comanche nation woman",
    "comanche nation women",
    "area domestic violence",
    "domestic violence shelter",
]

CITIES = [
    (r"Fort Sill", "Fort Sill"),
    (r"\bOKC\b|Oklahoma City", "Oklahoma City"),
    (r"Cushing", "Cushing"),
    (r"Duncan", "Duncan"),
    (r"Hollis", "Hollis"),
    (r"Grandfield", "Grandfield"),
    (r"Fredrick|Frederick", "Frederick"),
    (r"\bTemple", "Temple"),
    (r"Cache, OK|Cache Rd, Cache", "Cache"),
    (r"\bElgin", "Elgin"),
]

BASE = {
    "Lawton": (34.6086, -98.3903),
    "Fort Sill": (34.6500, -98.4000),
    "Cache": (34.6295, -98.6287),
    "Oklahoma City": (35.4676, -97.5164),
    "Cushing": (35.9851, -96.7670),
    "Duncan": (34.5023, -97.9578),
    "Hollis": (34.6884, -99.9120),
    "Grandfield": (34.2304, -98.6870),
    "Frederick": (34.3920, -99.0184),
    "Temple": (34.2712, -98.2359),
    "Elgin": (34.7806, -98.2923),
}

STREET_OFF = {
    "cache": (0.02, 0.01),
    "gore": (0.0, 0.0),
    "lee": (-0.015, 0.005),
    "sheridan": (-0.01, -0.02),
    "a ave": (0.005, 0.008),
    "b ave": (0.004, 0.006),
    "c ave": (0.003, 0.004),
    "d ave": (0.002, 0.002),
    "e ave": (0.001, 0.0),
    "f ave": (0.0, -0.002),
    "h ave": (-0.002, -0.004),
    "2nd": (0.006, 0.01),
    "4th": (0.005, 0.007),
    "5th": (0.004, 0.005),
    "7th": (0.003, 0.006),
    "11th": (-0.008, 0.003),
    "17th": (-0.012, 0.002),
    "25th": (0.018, 0.01),
    "38th": (-0.02, 0.015),
    "45th": (-0.022, -0.01),
    "47th": (0.028, -0.012),
    "53rd": (0.03, -0.02),
    "ferris": (0.015, 0.02),
    "bishop": (-0.018, 0.012),
    "texas": (-0.008, -0.008),
    "wisconsin": (-0.01, -0.012),
    "hoover": (0.02, 0.018),
    "arlington": (0.012, 0.015),
    "elsie": (-0.025, 0.008),
    "elmhurst": (-0.03, -0.025),
    "flower": (-0.02, -0.03),
    "bingo": (0.04, 0.05),
    "madische": (0.035, 0.04),
    "summit": (0.0, -0.015),
    "rogers": (0.025, -0.018),
    "motif": (0.032, 0.022),
    "fort sill": (0.04, 0.01),
}


def slugify(s: str) -> str:
    s = s.lower()
    s = re.sub(r"[’']", "", s)
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s[:80]


def norm_name(s: str) -> str:
    s = s.lower().replace("&", "and")
    s = re.sub(r"[’']", "", s)
    s = re.sub(r"[^a-z0-9]+", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    pairs = [
        ("boy scouts of america last frontier council", "scouting america last frontier"),
        ("scouting america last frontier council", "scouting america last frontier"),
        ("comanche nation womans shelter women and children", "comanche nation womens shelter"),
        ("comanche nation womens shelter women children", "comanche nation womens shelter"),
        ("comanche nation womens shelter", "comanche nation womens shelter"),
        ("new directions domestic violence shelter women and children", "new directions"),
        ("new directions domestic violence shelter", "new directions"),
        ("new directions marie detty youth and family service center inc", "marie detty new directions"),
        ("the next step tlp housing for young adults 18 21", "the next step tlp"),
        ("the next step tlp inc young adults 18 21", "the next step tlp"),
        ("the next step tlp inc 18 21year old females only", "the next step tlp"),
        ("c carter crane shelter men women children", "c carter crane"),
        ("c carter crane men women children", "c carter crane"),
        ("supportive service for veteran families ssvf", "ssvf"),
        ("va hud vash", "hud vash"),
        ("snap program food stamps", "snap program"),
        ("goodwill industries of southwest ok", "goodwill industries of southwest oklahoma"),
        ("goodwill industries employment program", "goodwill career development"),
        ("goodwill vita program", "goodwill vita"),
        ("new vision withdrawal management ccmh", "new vision withdrawal management"),
        ("pregnancy resource center pregnancy counseling", "pregnancy resource center"),
        ("bright course program pregnancy resource center", "pregnancy resource center"),
        ("valley hope addiction treatment and recovery", "valley hope"),
        ("work ready oklahoma", "work ready lawton"),
        ("work ready lawton", "work ready lawton"),
        ("centenary united methodist church breakfast", "centenary united methodist church"),
        ("st johns baptist feeding ministry", "st johns missionary baptist church"),
        ("st johns missionary baptist church", "st johns missionary baptist church"),
        ("the salvation army food pantry", "the salvation army"),
        ("the salvation army food bank", "the salvation army"),
        ("department of human services children and low income", "dhs children low income"),
        ("dhs children and low income", "dhs children low income"),
        ("lawton lions club eyeglasses", "lawton lions club"),
        ("lowermyrx", "lower my rx"),
        ("rain hiv aids patient svcs", "rain hiv"),
        ("rain hiv aids patient services", "rain hiv"),
        ("benjamin o davis high rise", "benjamin o davis"),
        ("family promise of lawton family expectant moms", "family promise of lawton"),
        ("family promise of lawton family and expectant mothers", "family promise of lawton"),
        ("s212 guest house 18 24 year old males only", "s212 guest house"),
        ("s212 guest house", "s212 guest house"),
        ("alcoholics anonymous unity group", "alcoholics anonymous"),
        ("comanche nation transit open to public", "comanche nation transit"),
        ("casa of southwest oklahoma inc", "casa of southwest oklahoma"),
        ("christian family counseling center", "christian family counseling"),
        ("legal aid services of lawton", "legal aid services of oklahoma"),
        ("catholic charities 2nd and 3rd mondays", "catholic charities"),
        ("lifeline program phone and internet service sparklight", "lifeline program"),
        ("lifeline program sparklight phone and internet service fidelity", "lifeline program"),
        ("liheap program electrical", "liheap program"),
        ("liheap program dhs", "liheap program"),
        ("comanche county pet resource foundation", "comanche county pet resource"),
        ("comanche county pet resource center", "comanche county pet resource"),
        ("comanche nation new pathways halfway house for recovering addicts with indian card", "comanche nation new pathways"),
        ("comanche nation new pathways substance abuse treatment", "comanche nation new pathways"),
        ("substance abuse comanche nation prevention and recovery sonrise adult and teen challenge", "sonrise adult and teen challenge"),
        ("sonrise adult and teen challenge", "sonrise adult and teen challenge"),
        ("center drug and alcohol addiction", "comanche nation prevention recovery"),
        ("substance abuse comanche nation prevention and recovery center drug and alcohol addiction", "comanche nation prevention recovery"),
        ("early settlement mediation of southwest oklahoma", "early settlement mediation"),
        ("fort sill morale welfare and recreation mwr", "fort sill mwr"),
        ("golden age apartments low income housing elderly disabled", "golden age apartments"),
        ("goodwill village apartments low income housing for elderly disabled", "goodwill village apartments"),
        ("lawton support services", "lawton support services"),
        ("mental health and substance abuse support group", "mental health substance abuse support"),
        ("narcotics anonymous different way group", "narcotics anonymous"),
        ("grief share", "grief share"),
        ("heartline 211", "heartline 211"),
        ("ok 211", "heartline 211"),
    ]
    for a, b in pairs:
        if s == a or s.startswith(a + " "):
            return b
    return s


def strip_html(s: str) -> str:
    s = re.sub(r"<br\s*/?>", "\n", s, flags=re.I)
    s = re.sub(r"</p>", "\n", s, flags=re.I)
    s = re.sub(r"</li>", "\n", s, flags=re.I)
    s = re.sub(r"<[^>]+>", " ", s)
    s = htmlmod.unescape(s)
    s = s.replace("\xa0", " ")
    s = re.sub(r"[ \t]+", " ", s)
    s = re.sub(r"\n{3,}", "\n\n", s)
    s = re.sub(r"\bA ddress\b", "Address", s)
    s = re.sub(r"\bP hone\b", "Phone", s)
    s = re.sub(r"\bH ours\b", "Hours", s)
    s = re.sub(r"\bW ebsite\b", "Website", s)
    return s.strip()


def parse_address(addr: str):
    addr = (addr or "").strip()
    city, state, zipc = "Lawton", "OK", ""
    if not addr:
        return "", city, state, zipc
    for pat, cname in CITIES:
        if re.search(pat, addr, re.I):
            city = cname
            break
    zm = re.search(r"\b(\d{5})\b", addr)
    if zm:
        zipc = zm.group(1)
    rest = addr
    rest = re.sub(
        r",?\s*(Lawton|Cache|Cushing|OKC|Oklahoma City|Duncan|Hollis|Grandfield|Fredrick|Frederick|Temple|Fort Sill|Elgin),?\s*OK(?:lahoma)?\s*\d{0,5}",
        "",
        rest,
        flags=re.I,
    )
    rest = re.sub(r",?\s*OK\s*\d{5}", "", rest).strip(" ,")
    return rest.strip(), city, state, zipc


def geocode(street: str, city: str):
    lat, lng = BASE.get(city, BASE["Lawton"])
    sl = street.lower()
    for k, (dlat, dlng) in STREET_OFF.items():
        if k in sl:
            lat += dlat
            lng += dlng
            break
    m = re.search(r"(\d+)", street)
    if m:
        n = int(m.group(1)) % 97
        lat += (n - 48) * 0.00012
        lng += (n - 48) * 0.00015
    return round(lat, 5), round(lng, 5)


def infer_audiences(name: str, notes: str):
    t = f"{name} {notes}".lower()
    aud = set()
    if re.search(r"women|womens|maternity|pregnancy|expectant", t):
        aud.add("women")
    if re.search(r"\bmen\b|\bmales?\b", t):
        aud.add("men")
    if re.search(r"child|children|youth|kids|teen|juvenile|baby|infant|parenting|scouts|ymca", t):
        aud.add("children")
    if re.search(r"famil", t):
        aud.add("families")
    if re.search(r"veteran|military", t):
        aud.add("veterans")
    if "males only" in t or "male only" in t:
        aud = {"men"}
    if "females only" in t or "female only" in t:
        aud = {"women"}
    if "men/women/children" in t:
        aud = {"men", "women", "children", "families"}
    return sorted(aud)


def infer_situations(name: str, notes: str, cats):
    t = f"{name} {notes}".lower()
    sit = set()
    if "beds" in cats or "shelter" in t or "homeless" in t or "mckinney" in t or "ssvf" in t or "vash" in t:
        sit.add("homeless")
    if "food" in cats or "feeding" in t or "meal" in t or "pantry" in t or "snap" in t or "wic" in t:
        sit.add("feeding")
    if "domestic" in t or "violence" in t or "new directions" in t or "womens shelter" in t or "woman's shelter" in t:
        sit.add("domestic-violence")
    if "casa" in t or "parents as teachers" in t or "marie detty" in t:
        sit.add("family-advocacy")
    if "indian card" in t or "males only" in t or "females only" in t or "income based" in t:
        sit.add("entry-barriers")
    return sorted(sit)


def infer_services(name: str, notes: str, cats):
    svcs = set(cats)
    t = f"{name} {notes}".lower()
    mapping = [
        (r"meal|lunch|breakfast|food|pantry|snap|wic", "meals / food"),
        (r"shelter|bed|housing|apartment|ssvf|vash", "shelter / housing"),
        (r"cloth|thrift|goodwill", "clothing"),
        (r"counsel|mental|behavioral|substance|addict", "counseling"),
        (r"legal|court|mediation", "legal help"),
        (r"transit|transport|ride|bus", "transportation"),
        (r"utility|liheap|electric|rent", "utility / rent help"),
        (r"veteran|military|dav|ssvf|vash", "veteran services"),
        (r"clinic|health|medical|hiv|glasses", "health care"),
        (r"job|employment|staffing|workforce", "employment"),
        (r"parent|child care|youth", "parenting / youth"),
        (r"tribal|comanche|kiowa|wichita|apache|indian", "tribal services"),
    ]
    for pat, label in mapping:
        if re.search(pat, t):
            svcs.add(label)
    return sorted(svcs)


def extract_field(text: str, labels):
    for lab in labels:
        m = re.search(rf"(?:^|\n|\b){lab}\s*:?\s*(.+?)(?:\n|$)", text, re.I)
        if m:
            val = m.group(1).strip(" -–—")
            if val:
                return val
    return ""


def extract_phone(text: str) -> str:
    phones = []
    for m in re.finditer(r"(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}(?:\s*(?:ext\.?|x)\s*\d+)?", text, re.I):
        p = m.group(0).strip()
        if p not in phones:
            phones.append(p)
    # dotted style 580.353.7994
    for m in re.finditer(r"\b\d{3}\.\d{3}\.\d{4}(?:\s*ext\.?\s*\d+)?\b", text, re.I):
        p = m.group(0)
        if p not in phones:
            phones.append(p)
    return " or ".join(phones[:4])


def extract_hours(text: str) -> str:
    m = extract_field(text, ["Hours", "Hours of operation", "Open"])
    if m and len(m) < 220:
        return m
    if re.search(r"\b(\d{1,2}([:.]?\d{2})?\s*(am|pm)|monday|tuesday|wednesday|thursday|friday|saturday|sunday|m-f|mwf)\b", text, re.I):
        # keep a compact hours-ish sentence
        for line in text.splitlines():
            if re.search(r"hour|open|am|pm|monday|tuesday|wednesday|thursday|friday|saturday|sunday|m-f", line, re.I):
                if len(line) < 240:
                    return line.strip()
    return ""


def extract_links(html_chunk: str, text: str):
    links = []
    seen = set()
    for m in re.finditer(r'href="(https?://[^"]+)"', html_chunk):
        url = m.group(1)
        if url in seen or "uwswok.org/resources" in url:
            continue
        seen.add(url)
        links.append({"label": re.sub(r"^https?://", "", url).split("/")[0], "url": url})
    for m in re.finditer(r"https?://[^\s]+|www\.[^\s]+", text or ""):
        url = m.group(0).rstrip(".,;)")
        if not url.startswith("http"):
            url = "https://" + url
        if url in seen:
            continue
        seen.add(url)
        links.append({"label": url.replace("https://", "").replace("http://", "").split("/")[0], "url": url})
    return links[:6]


def name_matches(name: str, needles) -> bool:
    n = name.lower()
    return any(x in n for x in needles)


def should_hide(name: str, text: str) -> bool:
    blob = f"{name} {text}".lower()
    if name_matches(name, HIDE_ADDRESS_NAMES):
        return True
    if "confidential" in blob and ("domestic" in blob or "violence" in blob or "shelter" in blob):
        return True
    return False


def should_green(name: str, cats, situations, text: str) -> bool:
    n = name.lower()
    blob = f"{name} {text}".lower()
    if name_matches(name, NEVER_GREEN_NAMES):
        return False
    if re.search(r"\baa\b|alcoholics anonymous|narcotics anonymous|\bna\b group", n) and "comanche" not in n:
        if "support" in cats and not any(c in cats for c in ("food", "beds", "clothing", "utilities")):
            return False
    if name_matches(name, FORCE_GREEN_NAMES):
        return True
    if any(c in cats for c in ("food", "clothing", "utilities", "beds")):
        return True
    if "homeless" in situations or "domestic-violence" in situations or "feeding" in situations:
        return True
    if re.search(r"mckinney|ssvf|hud.?vash|homeless veteran|food pantry|food bank|meal|snap|wic|rental assistance|utility", blob):
        if not re.search(r"apartment|high-rise|income based housing", n):
            return True
    return False


def cell(status: str, note: str):
    labels = {
        "green": "Open / available",
        "amber": "Limited / call first",
        "red": "Full / unavailable",
    }
    return {"status": status, "label": labels[status], "note": note}


def availability_for(name: str, cats, situations, text: str):
    green = should_green(name, cats, situations, text)
    if green:
        note = "Listed as currently offering services. Staff can update."
        space = cell("green", note)
        staff = cell("green", note)
    else:
        note = "Not auto-marked as walk-in assistance for people who are homeless or in need. Staff can update."
        space = cell("amber", note)
        staff = cell("amber", note)
    transport = cell("amber", "Confirm transportation with the organization. Staff can update.")
    if "transport" in cats:
        transport = cell("green", "Transportation program listed. Staff can update.")
    appt = cell("amber", "Call to confirm appointments or walk-in hours. Staff can update.")
    return {"space": space, "staff": staff, "transport": transport, "appointments": appt}


def parse_website(html: str):
    # Walk by h2 section, then accordion cards inside each section.
    section_pat = re.compile(
        r'<h2 class="text-center">\s*(.*?)\s*</h2>(.*?)(?=<h2 class="text-center">|<h2 id="block-)',
        re.S | re.I,
    )
    card_pat = re.compile(
        r'<a[^>]*data-toggle="collapse"[^>]*>\s*(.*?)\s*</a>(.*?)(?=<div class="card-header panel-heading"|$)',
        re.S | re.I,
    )
    entries = []
    for sm in section_pat.finditer(html):
        section = strip_html(sm.group(1))
        if section not in CAT_MAP:
            continue
        primary, cats, sits = CAT_MAP[section]
        body = sm.group(2)
        for cm in card_pat.finditer(body):
            name = strip_html(cm.group(1))
            chunk = cm.group(2)
            if not name or name.lower() in ("click here",):
                continue
            text_html = ""
            fm = re.search(r'<div class="field field--name-bp-text[^"]*"[^>]*>(.*?)</div>', chunk, re.S | re.I)
            if fm:
                text_html = fm.group(1)
            text = strip_html(text_html)
            addr = extract_field(text, ["Address", "Addresses", "Office Address", "Location 1", "Primary Address"])
            if not addr:
                m = re.search(r"(\d+\s+[A-Z0-9].{6,80}?(?:Ave|Rd|St|Blvd|Dr|Ln|Way|Circle|Ct)\.?)", text, re.I)
                if m:
                    addr = m.group(1)
            phone = extract_field(text, ["Phone", "Phone Number", "Office Phone Number", "Primary Phone Number", "NON-Emergency Phone"])
            if not phone:
                phone = extract_phone(text)
            hours = extract_hours(text)
            links = extract_links(text_html, text)
            entries.append(
                {
                    "name": name,
                    "addr": addr,
                    "phone": phone,
                    "hours": hours,
                    "notes": text,
                    "html": text_html,
                    "links": links,
                    "cats": set(cats),
                    "sits": set(sits),
                    "primary": primary,
                    "section": section,
                    "source": "uwswok.org/resources",
                }
            )
    return entries


DOCX_SECTIONS = {
    "Child and Parenting Services": "Child and Parenting Services",
    "Clothing Assistance": "Clothing Assistance",
    "Counseling/Rehabilitation Services": "Counseling and Rehabilitation Services",
    "Emergency Response Services": "Emergency Response Services",
    "Employment & Education Resources": "Employment and Education Assistance",
    "Food Assistance": "Food Assistance",
    "Health Services": "Health Services",
    "Housing/Rental Assistance": "Housing/Rental Assistance",
    "Legal Services": "Legal Services",
    "Military & Veteran Services": "Military and Veteran Services",
    "Senior Citizen Assistance": "Senior Citizen Assistance",
    "Shelter Services": "Shelter Services",
    "Support Groups": "Support Groups",
    "Tax Assistance": "Tax Assistance",
    "Transportation Services": "Transportation Services",
    "Utility & Rental Assistance": "Utilities and Rental Assistance",
    "Veterinarian/Pet/Services Animals": "Veterinarian/Pet/Service Animals",
}


def parse_docx(txt: str):
    """Print guide is names/phones only. Used to fill gaps, not overwrite website text."""
    lines = [ln.strip() for ln in txt.splitlines()]
    section = None
    entries = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if not line:
            i += 1
            continue
        if line in DOCX_SECTIONS or line.rstrip() in DOCX_SECTIONS:
            section = DOCX_SECTIONS.get(line, DOCX_SECTIONS.get(line.rstrip()))
            i += 1
            continue
        if section is None or line.startswith("Community") or line.startswith("United Way Funded") or line.startswith("OK 211"):
            i += 1
            continue
        if line.startswith("Updated") or re.fullmatch(r"[\d\s]+", line) or line.startswith("Know a resource") or line.startswith("CALL OR TEXT") or line.startswith("Service Area") or line.startswith("Online Resource"):
            i += 1
            continue
        # skip footer fragments
        if len(line) < 3:
            i += 1
            continue
        name = line
        rest_bits = []
        i += 1
        while i < len(lines) and lines[i] and lines[i] not in DOCX_SECTIONS and not looks_like_org_name(lines[i], lines[i + 1] if i + 1 < len(lines) else ""):
            # consume address/phone lines until next org-looking line
            if lines[i] in DOCX_SECTIONS:
                break
            rest_bits.append(lines[i])
            i += 1
            if len(rest_bits) >= 4:
                break
        rest = " ".join(rest_bits)
        phone = extract_phone(rest) or extract_phone(name)
        addr = extract_field(rest, ["Address"]) or ""
        if not addr:
            m = re.search(r"(\d+\s+[A-Z0-9].{6,80}?(?:Ave|Rd|St|Blvd|Dr|Ln|Way)\.?)", rest, re.I)
            if m:
                addr = m.group(1)
        primary, cats, sits = CAT_MAP.get(section, ("support", ["support"], []))
        if re.match(r"^(Phone|Address|Office|Outpatient|Contact|For |Who |What )", name, re.I):
            continue
        entries.append(
            {
                "name": name,
                "addr": addr,
                "phone": phone,
                "hours": "",
                "notes": rest,
                "html": "",
                "links": [],
                "cats": set(cats),
                "sits": set(sits),
                "primary": primary,
                "section": section,
                "source": "Resource Guide 2027 (print, names/phones only)",
            }
        )
    return entries


def is_real_print_org(name: str, phone: str) -> bool:
    if not name or len(name) < 6 or len(name) > 90:
        return False
    if not phone:
        return False
    if re.search(r"\d{8,}", name):
        return False
    junk = (
        r"community resource|guide 2026|ok 211|www\.|online resource|^resource$|"
        r"^meets |^free |^immigration |^licensed |^phone|^address|^contact |"
        r"^1\.800|^00ok|^lawton, ok|sw a ave"
    )
    if re.search(junk, name, re.I):
        return False
    if re.match(r"^\d", name):
        return False
    return True


def looks_like_org_name(line: str, nxt: str) -> bool:
    if line in DOCX_SECTIONS:
        return False
    if re.search(r"Phone:|Address:|^\d{3}[.\-\s]", line):
        return False
    if re.match(r"^\d+\s+[A-Z]", line):
        return False
    if len(line) < 4 or len(line) > 90:
        return False
    # Title-ish
    if line[0].isupper() and not line.endswith("."):
        return True
    return False


def merge_entries(web, print_entries):
    merged = {}
    order = []

    def add(e, prefer_web=True):
        key = norm_name(e["name"])
        if len(key) < 4:
            return
        if key not in merged:
            merged[key] = {
                "names": [e["name"]],
                "addrs": [e["addr"]] if e.get("addr") else [],
                "phones": [e["phone"]] if e.get("phone") else [],
                "notes": [e["notes"]] if e.get("notes") else [],
                "hours": e.get("hours") or "",
                "links": list(e.get("links") or []),
                "cats": set(e["cats"]),
                "sits": set(e["sits"]),
                "primary": e["primary"],
                "sources": [e["source"]],
                "web": prefer_web,
            }
            order.append(key)
            return
        g = merged[key]
        if e["name"] not in g["names"]:
            g["names"].append(e["name"])
        if e.get("addr") and e["addr"] not in g["addrs"]:
            g["addrs"].append(e["addr"])
        if e.get("phone") and e["phone"] not in g["phones"]:
            g["phones"].append(e["phone"])
        if prefer_web and e.get("notes") and (not g["notes"] or len(e["notes"]) > len(g["notes"][0])):
            g["notes"] = [e["notes"]] + [n for n in g["notes"] if n != e["notes"]]
        elif e.get("notes") and e["notes"] not in g["notes"] and not g["web"]:
            g["notes"].append(e["notes"])
        if prefer_web and e.get("hours"):
            g["hours"] = e["hours"]
        elif e.get("hours") and not g["hours"]:
            g["hours"] = e["hours"]
        g["cats"].update(e["cats"])
        g["sits"].update(e["sits"])
        if e["source"] not in g["sources"]:
            g["sources"].append(e["source"])
        if prefer_web:
            g["web"] = True
        for l in e.get("links") or []:
            if l not in g["links"]:
                g["links"].append(l)

    for e in web:
        add(e, prefer_web=True)
    # print extras only if not already present
    for e in print_entries:
        key = norm_name(e["name"])
        match = key if key in merged else None
        if not match:
            for existing in merged:
                if len(key) >= 12 and (key in existing or existing in key):
                    match = existing
                    break
                words = [w for w in key.split() if len(w) > 3]
                ewords = existing.split()
                if len(words) >= 2 and sum(1 for w in words if w in ewords) >= min(3, len(words)):
                    match = existing
                    break
        if match:
            g = merged[match]
            if e.get("phone") and not g["phones"]:
                g["phones"].append(e["phone"])
            if e.get("addr") and not g["addrs"]:
                g["addrs"].append(e["addr"])
            g["cats"].update(e["cats"])
            continue
        name = e["name"].strip()
        if not is_real_print_org(name, e.get("phone") or ""):
            continue
        add(e, prefer_web=False)
    return merged, order


def extras():
    return [
        {
            "name": "United Way of Southwest Oklahoma",
            "addr": "1116 SW A Ave.",
            "phone": "580.355.0218",
            "hours": "",
            "notes": "United Way of Southwest Oklahoma publishes this Community Resource Guide serving Beckham, Caddo, Childress, Collingsworth, Comanche, Cotton, Greer, Harmon, Jackson, Kiowa, and Tillman Counties. Call for referrals or visit the online guide.",
            "html": "",
            "links": [
                {"label": "uwswok.org", "url": "https://www.uwswok.org"},
                {"label": "Online Resource Guide", "url": "https://www.uwswok.org/resources"},
            ],
            "cats": {"support", "emergency"},
            "sits": {"family-advocacy"},
            "primary": "support",
            "section": "Support Groups",
            "source": "uwswok.org",
        },
        {
            "name": "Success by 6",
            "addr": "1116 SW A Ave.",
            "phone": "580.355.0218",
            "hours": "",
            "notes": "United Way of Southwest Oklahoma early childhood initiative. Call United Way for details.",
            "html": "",
            "links": [{"label": "uwswok.org", "url": "https://www.uwswok.org"}],
            "cats": {"kids", "support"},
            "sits": {"family-advocacy"},
            "primary": "kids",
            "section": "Child and Parenting Services",
            "source": "Resource Guide 2027 funded partners",
        },
        {
            "name": "Heartline 211",
            "addr": "",
            "phone": "1-877-362-1606",
            "hours": "24/7",
            "notes": "Heartline 211 (OK 211) connects people to local health and human services. Call 1-877-362-1606 or 211. Also 1-405-840-9396.",
            "html": "",
            "links": [],
            "cats": {"support", "emergency"},
            "sits": {"homeless", "feeding", "family-advocacy"},
            "primary": "emergency",
            "section": "Emergency Response Services",
            "source": "United Way / Heartline 211",
        },
    ]


def build_orgs(merged, order):
    orgs = []
    used = set()
    for i, key in enumerate(order):
        g = merged[key]
        name = g["names"][0]
        for n in g["names"]:
            if n.lower() in ("the salvation army", "catholic charities", "lawton food bank", "united way of southwest oklahoma"):
                name = n
                break
        notes_all = g["notes"][0] if g["notes"] else ""
        # prefer longest website description
        if g["notes"]:
            notes_all = max(g["notes"], key=len)
        primary_addr = g["addrs"][0] if g["addrs"] else ""
        extra_addr = ""
        if len(g["addrs"]) > 1:
            extra_addr = "Additional listed locations: " + "; ".join(g["addrs"][1:]) + "."
        phones = []
        for p in g["phones"]:
            if p and p not in phones:
                phones.append(p)
        phone = " or ".join(phones)
        hide = should_hide(name, notes_all)
        street, city, state, zipc = parse_address(primary_addr)
        hours = g["hours"]
        short = notes_all[:220].rsplit(" ", 1)[0] + ("…" if len(notes_all) > 220 else "") if notes_all else f"Community resource listed by United Way of Southwest Oklahoma. Categories: {', '.join(sorted(g['cats']))}."
        if hide:
            short = "Confidential location — call first. Domestic violence support. Address is not published."
            street = ""
            city = ""
            zipc = ""
            extra_addr = ""
        poc = ""
        m = re.search(r"Contact\s+([A-Za-z][A-Za-z .'-]+)", notes_all, re.I)
        if m:
            poc = m.group(0)[:80]
        t = f"{name} {notes_all}".lower()
        eligibility = "Not specified in the organization listing. Call the organization or Heartline 211 to confirm."
        restrictions = "Not specified in the organization listing."
        if "males only" in t or "18-24 year old males" in t:
            restrictions = "Males only (see listing). Age limits may apply. Confirm by phone."
            eligibility = "Young men ages 18–24 as listed. Call to confirm."
        if "females only" in t or ("18-21" in t and "female" in t):
            restrictions = "Females only (see listing). Age 18–21. Confirm by phone."
            eligibility = "Young women ages 18–21 as listed. Call to confirm."
        if "indian card" in t:
            restrictions = (restrictions + " Requires Indian Card as listed.").strip()
        if hide:
            eligibility = "Women and children as listed for this shelter. Call first."
            restrictions = "Confidential location — call first. Do not publish or visit without calling."
        if "family/expectant" in t or "expectant" in t and "family promise" in t:
            eligibility = "Families and expectant moms as listed."
        audiences = infer_audiences(name + " " + " ".join(g["names"]), notes_all)
        situations = sorted(set(g["sits"]) | set(infer_situations(name, notes_all, g["cats"])))
        services = infer_services(name, notes_all, g["cats"])
        links = g["links"][:6]
        uw = any(p in key or key.startswith(p) for p in UW_PARTNERS) or any(p in name.lower() for p in UW_PARTNERS)
        lat = lng = None
        if not hide and (street or city):
            lat, lng = geocode(street, city or "Lawton")
        slug = slugify(name)
        base = slug
        n = 2
        while slug in used:
            slug = f"{base}-{n}"
            n += 1
        used.add(slug)
        words = re.findall(r"[A-Za-z0-9]+", name)
        initial = "".join(w[0] for w in words[:2]).upper() or "UW"
        colors = ["#C46A4A", "#D4896A", "#C9A227", "#8B5E3C", "#B85C38", "#A67C52"]
        keywords = set()
        for w in re.findall(r"[a-z0-9]{3,}", f"{name} {notes_all} {' '.join(g['cats'])}".lower()):
            keywords.add(w)
        keywords.update(g["cats"])
        keywords.update(audiences)
        keywords.update(situations)
        desc_bits = []
        if notes_all:
            desc_bits.append(notes_all)
        if extra_addr and not hide:
            desc_bits.append(extra_addr)
        if len(g["names"]) > 1:
            desc_bits.append("Also listed as: " + "; ".join(n for n in g["names"] if n != name) + ".")
        src = "; ".join(g["sources"])
        orgs.append(
            {
                "id": slug,
                "name": name,
                "slug": slug,
                "shortDescription": short,
                "description": " ".join(desc_bits).strip() or short,
                "address": "" if hide else street,
                "city": city if not hide else "",
                "state": "OK" if not hide else "",
                "zip": "" if hide else zipc,
                "hideAddress": hide,
                "lat": lat,
                "lng": lng,
                "phone": phone,
                "hours": hours,
                "pointOfContact": poc,
                "photo": {"initials": initial, "color": colors[i % len(colors)]},
                "categories": sorted(g["cats"]),
                "audiences": audiences,
                "situations": situations,
                "services": services,
                "eligibility": eligibility,
                "restrictions": restrictions,
                "links": links,
                "unitedWayPartner": bool(uw),
                "keywords": sorted(keywords)[:80],
                "availability": availability_for(name, g["cats"], situations, notes_all),
                "source": src,
            }
        )
    return orgs


def main():
    html = HTML_PATH.read_text(errors="replace")
    web = parse_website(html)
    print_entries = parse_docx(DOCX_TXT.read_text(errors="replace")) if DOCX_TXT.exists() else []
    web = extras() + web
    merged, order = merge_entries(web, print_entries)
    orgs = build_orgs(merged, order)
    out = {
        "meta": {
            "source": "United Way of Southwest Oklahoma community resources (uwswok.org/resources primary; Resource Guide 2027 for names/phones)",
            "sourceOrg": "United Way of Southwest Oklahoma",
            "sourcePhone": "580.355.0218",
            "ok211": "1-877-362-1606",
            "heartline": "Heartline 211 / 1-877-362-1606",
            "crisis": "988",
            "emergency": "911",
            "disclaimer": "Hours, eligibility, and availability are only shown when listed in organization documentation. Green lights mean the program is listed as currently offering services; staff can update. This app does not give medical advice and does not store PHI.",
        },
        "organizations": orgs,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, indent=2, ensure_ascii=False))
    hidden = [o["name"] for o in orgs if o["hideAddress"]]
    green = [o["name"] for o in orgs if o["availability"]["space"]["status"] == "green"]
    tribal = [o["name"] for o in orgs if "tribal" in o["categories"]]
    vets_h = [o["name"] for o in orgs if re.search(r"ssvf|vash|homeless veteran", o["name"], re.I)]
    print(f"Wrote {len(orgs)} organizations to {OUT}")
    print("HIDDEN", hidden)
    print("GREEN count", len(green))
    print("TRIBAL", tribal)
    print("HOMELESS VET", vets_h)
    print("UW partners", sum(1 for o in orgs if o["unitedWayPartner"]))


if __name__ == "__main__":
    main()
