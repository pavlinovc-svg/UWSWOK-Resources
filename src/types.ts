export type LightStatus = "green" | "amber" | "red";

export type AvailabilityCell = {
  status: LightStatus;
  label: string;
  note: string;
};

export type Availability = {
  space: AvailabilityCell;
  staff: AvailabilityCell;
  transport: AvailabilityCell;
  appointments: AvailabilityCell;
};

export type OrgLink = { label: string; url: string };

export type Organization = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  hideAddress: boolean;
  lat: number | null;
  lng: number | null;
  phone: string;
  hours: string;
  pointOfContact: string;
  photo: { initials: string; color: string };
  categories: string[];
  audiences: string[];
  situations: string[];
  services: string[];
  eligibility: string;
  restrictions: string;
  links: OrgLink[];
  unitedWayPartner: boolean;
  keywords: string[];
  availability: Availability;
  source: string;
};

export type Role = "public" | "staff" | "police" | "admin";

export type Session = {
  email: string;
  role: Role;
  displayName: string;
  assignedOrgSlug?: string;
};

export type OnTheWay = {
  id: string;
  orgSlug: string;
  orgName: string;
  createdAt: string;
  note: string;
  fromRole: Role;
};

export type ApprovalItem = {
  id: string;
  orgSlug: string;
  orgName: string;
  field: string;
  summary: string;
  requestedBy: string;
  requestedAt: string;
  status: "pending" | "approved" | "denied";
  decidedBy?: string;
  decidedAt?: string;
};

export type ReminderEvent = {
  id: string;
  approvalId: string;
  at: string;
  by: string;
};

export const FILTERS = [
  "food",
  "beds",
  "clothing",
  "health",
  "housing",
  "transport",
  "counseling",
  "legal",
  "veterans",
  "tribal",
  "seniors",
  "kids",
  "utilities",
  "employment",
  "pets",
  "support",
  "emergency",
] as const;

export const APPROVERS = ["vocalbacco", "Approver B", "Approver C"] as const;

export const DEMO_ACCOUNTS = [
  {
    email: "staff@lawtonfoodbank.org",
    password: "staff",
    role: "staff" as Role,
    displayName: "Lawton Food Bank staff",
    assignedOrgSlug: "lawton-food-bank",
  },
  {
    email: "police@lawtonok.gov",
    password: "police",
    role: "police" as Role,
    displayName: "Lawton Police (demo)",
  },
  {
    email: "admin@uwswok.org",
    password: "admin",
    role: "admin" as Role,
    displayName: "Super admin (demo)",
  },
];
