"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Target,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Lock,
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Phone,
  Mail,
  Building2,
  Search,
  Edit3,
  MapPin,
  Copy,
  Check,
  Clock,
  AlertTriangle,
  BarChart3,
  Star,
  Filter,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import {
  getEvents, upsertEvent, deleteEvent as deleteEventAction,
  getContacts, upsertContact, deleteContact as deleteContactAction,
  getVendors as getVendorsList, upsertVendor, deleteVendor as deleteVendorAction,
  getOutreach, upsertOutreach, deleteOutreach as deleteOutreachAction,
} from "./actions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EventItem {
  id: string;
  name: string;
  date: string;
  venue: string;
  type: string;
  status: string;
  screened: number;
  signedUp: number;
  showed: number;
  revenue: number;
  notes: string;
}

interface ContactItem {
  id: string;
  name: string;
  business: string;
  phone: string;
  email: string;
  type: string;
  status: string;
  followUpDate: string;
  notes: string;
}

interface VendorItem {
  id: string;
  company: string;
  contact: string;
  phone: string;
  email: string;
  service: string;
  referralsSent: number;
  referralsReceived: number;
  status: string;
  notes: string;
}

interface OutreachItem {
  id: string;
  name: string;
  type: string;
  date: string;
  status: string;
  contactInfo: string;
  notes: string;
}

interface CommandCenterData {
  events: EventItem[];
  contacts: ContactItem[];
  vendors: VendorItem[];
  outreach: OutreachItem[];
}

type TabKey = "dashboard" | "pipeline" | "calendar" | "network" | "roi" | "outreach";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LS_KEY = "neurochiro-command-center";

const EMPTY_DATA: CommandCenterData = {
  events: [],
  contacts: [],
  vendors: [],
  outreach: [],
};

const EVENT_TYPES = ["Market", "Gym", "Health Fair", "Corporate", "Church", "Festival", "Other"];
const CONTACT_TYPES = ["Venue Owner", "Event Organizer", "Business Owner", "Referral Partner", "Other"];
const OUTREACH_TYPES = ["Market", "Gym", "Health Fair", "Corporate", "Church", "Festival", "Other"];

const EVENT_STATUSES = ["planned", "confirmed", "completed", "followed-up"];
const CONTACT_STATUSES = ["new", "contacted", "booked", "recurring"];
const VENDOR_STATUSES = ["new", "connected", "active"];
const OUTREACH_STATUSES = ["to-contact", "contacted", "booked", "completed"];

function genId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    planned: "Planned",
    confirmed: "Confirmed",
    completed: "Completed",
    "followed-up": "Followed Up",
    new: "New",
    contacted: "Contacted",
    booked: "Booked",
    recurring: "Recurring Partner",
    connected: "Connected",
    active: "Active",
    "to-contact": "To Contact",
  };
  return map[status] || status;
}

function statusColor(status: string): string {
  const map: Record<string, string> = {
    planned: "bg-yellow-500",
    confirmed: "bg-blue-500",
    completed: "bg-green-500",
    "followed-up": "bg-green-700",
    new: "bg-gray-500",
    contacted: "bg-yellow-500",
    booked: "bg-blue-500",
    recurring: "bg-green-500",
    connected: "bg-blue-500",
    active: "bg-green-500",
    "to-contact": "bg-yellow-500",
  };
  return map[status] || "bg-gray-500";
}

function statusBorder(status: string): string {
  const map: Record<string, string> = {
    planned: "border-l-yellow-500",
    confirmed: "border-l-blue-500",
    completed: "border-l-green-500",
    "followed-up": "border-l-green-700",
    new: "border-l-gray-400",
    contacted: "border-l-yellow-500",
    booked: "border-l-blue-500",
    recurring: "border-l-green-500",
    connected: "border-l-blue-500",
    active: "border-l-green-500",
    "to-contact": "border-l-yellow-500",
  };
  return map[status] || "border-l-gray-400";
}

function nextStatus(current: string, statusList: string[]): string {
  const idx = statusList.indexOf(current);
  if (idx === -1 || idx >= statusList.length - 1) return current;
  return statusList[idx + 1];
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "TBD";
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function daysBetween(dateStr: string, refStr: string): number {
  const d1 = new Date(dateStr + "T00:00:00");
  const d2 = new Date(refStr + "T00:00:00");
  return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

// ---------------------------------------------------------------------------
// Outreach templates
// ---------------------------------------------------------------------------

const OUTREACH_TEMPLATES = [
  {
    title: "Email to Venue Owner — Request a Booth",
    body: `Subject: Free Spinal Screenings for [EVENT NAME] Attendees

Hi [VENUE OWNER NAME],

My name is [YOUR NAME], and I own [PRACTICE NAME]. I came across [EVENT NAME] and would love to be a part of it.

We offer complimentary spinal screenings that are quick, interactive, and always one of the most visited booths at community events. Attendees get a free posture and spinal check in under 5 minutes — it's educational, hands-on, and gives them something valuable to walk away with.

We bring our own equipment, signage, and staff — we just need a standard vendor space.

Could you send me information on vendor availability, booth fees, and the application process?

Thank you for putting this together for our community.

Best,
[YOUR NAME]
[PRACTICE NAME]
[PHONE]`,
  },
  {
    title: "Email to Event Organizer — Participation Request",
    body: `Subject: Vendor Application — [EVENT NAME]

Hi [ORGANIZER NAME],

I'm [YOUR NAME] with [PRACTICE NAME]. I'd like to apply as a health & wellness vendor for [EVENT NAME] on [DATE].

We provide free 5-minute spinal screenings — it's always a hit at events and draws consistent foot traffic. We're fully self-contained with our own table, signage, and staff.

Could you share vendor application details and booth availability?

Looking forward to hearing from you.

Best,
[YOUR NAME]
[PRACTICE NAME]
[PHONE]`,
  },
  {
    title: "Follow-Up Email — After Initial Outreach",
    body: `Subject: Re: Vendor Inquiry — [EVENT NAME]

Hi [CONTACT NAME],

Just following up on my email from last week about [EVENT NAME]. I know event planning keeps you busy — just wanted to make sure my note didn't get buried.

We'd love to provide free spinal screenings for your attendees. Happy to answer any questions or jump on a quick call if that's easier.

Best,
[YOUR NAME]
[PHONE]`,
  },
  {
    title: "Thank-You Email — After Completed Event",
    body: `Subject: Thank You — [EVENT NAME] Was Amazing

Hi [CONTACT NAME],

Just wanted to send a quick thank-you for letting us be part of [EVENT NAME] on [DATE]. We had an incredible time — we screened over [NUMBER] people and the feedback was overwhelmingly positive.

We'd love to come back for your next event. Please keep us in mind for future opportunities, and don't hesitate to reach out if there's anything we can do to support your upcoming events.

Thanks again for a great experience!

Best,
[YOUR NAME]
[PRACTICE NAME]
[PHONE]`,
  },
  {
    title: "Email to Nearby Business — Lunch & Learn Pitch",
    body: `Subject: Free Lunch & Learn for Your Team

Hi [CONTACT NAME],

I'm [YOUR NAME] with [PRACTICE NAME], located right here in your area. I'm reaching out because we offer free 30-minute Lunch & Learn sessions for local businesses.

Topics include desk posture and ergonomics, stress management through the nervous system, and simple stretches to prevent workplace injuries.

We bring everything — no cost or obligation to your team. It's a great way to show your employees you care about their health, and it only takes a lunch break.

Would you be open to scheduling one in the next few weeks?

Best,
[YOUR NAME]
[PRACTICE NAME]
[PHONE]`,
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CommandCenterPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [data, setData] = useState<CommandCenterData>(EMPTY_DATA);
  const [loaded, setLoaded] = useState(false);

  // Form visibility
  const [showEventForm, setShowEventForm] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [showOutreachForm, setShowOutreachForm] = useState(false);

  // Filters
  const [pipelineFilter, setPipelineFilter] = useState("All");
  const [outreachFilter, setOutreachFilter] = useState("All");
  const [networkSubTab, setNetworkSubTab] = useState<"contacts" | "vendors">("contacts");

  // Calendar state
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [selectedCalDate, setSelectedCalDate] = useState<string | null>(null);

  // Editing
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  // Expanded notes
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  // Template copy state
  const [copiedTemplate, setCopiedTemplate] = useState<number | null>(null);
  const [expandedTemplates, setExpandedTemplates] = useState<Set<number>>(new Set());

  // Refs
  const dataRef = useRef(data);
  dataRef.current = data;

  // -------------------------------------------------------------------------
  // Purchase gate check
  // -------------------------------------------------------------------------

  useEffect(() => {
    async function checkAccess() {
      try {
        const supabase = createClient();
        const { data: userData } = await (supabase as any).auth.getUser();
        if (!userData?.user) {
          setAuthorized(false);
          return;
        }
        const { data: purchases } = await (supabase as any)
          .from("course_purchases")
          .select("course_id")
          .eq("user_id", userData.user.id)
          .in("course_id", ["weekend-vip", "screening-mastery"]);

        setAuthorized(!!(purchases && purchases.length > 0));
      } catch {
        setAuthorized(false);
      }
    }
    checkAccess();
  }, []);

  // -------------------------------------------------------------------------
  // Load from Supabase (with localStorage cache for speed)
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (authorized !== true) return;

    // Load from localStorage cache first (instant)
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setData({
          events: parsed.events || [],
          contacts: parsed.contacts || [],
          vendors: parsed.vendors || [],
          outreach: parsed.outreach || [],
        });
      }
    } catch { /* empty */ }

    // Then load from Supabase (authoritative)
    Promise.all([getEvents(), getContacts(), getVendorsList(), getOutreach()])
      .then(([events, contacts, vendors, outreach]) => {
        const freshData = {
          events: (events || []).map((e: any) => ({
            id: e.id, name: e.name, date: e.date || "", venue: e.venue || "",
            type: e.type || "other", status: e.status || "planned",
            screened: e.screened || 0, signedUp: e.signed_up || 0,
            showed: e.showed || 0, revenue: e.revenue || 0, notes: e.notes || "",
          })),
          contacts: (contacts || []).map((c: any) => ({
            id: c.id, name: c.name, business: c.business || "",
            phone: c.phone || "", email: c.email || "",
            type: c.type || "other", status: c.status || "new",
            followUpDate: c.follow_up_date || "", notes: c.notes || "",
          })),
          vendors: (vendors || []).map((v: any) => ({
            id: v.id, company: v.company, contact: v.contact || "",
            phone: v.phone || "", email: v.email || "",
            service: v.service || "", referralsSent: v.referrals_sent || 0,
            referralsReceived: v.referrals_received || 0,
            status: v.status || "new", notes: v.notes || "",
          })),
          outreach: (outreach || []).map((o: any) => ({
            id: o.id, name: o.name, type: o.type || "other",
            date: o.date || "", status: o.status || "to-contact",
            contactInfo: o.contact_info || "", notes: o.notes || "",
          })),
        };
        setData(freshData);
        try { localStorage.setItem(LS_KEY, JSON.stringify(freshData)); } catch {}
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [authorized]);

  // Save to both Supabase and localStorage
  const scheduleSave = useCallback((newData: CommandCenterData) => {
    setData(newData);
    try { localStorage.setItem(LS_KEY, JSON.stringify(newData)); } catch {}
  }, []);

  // -------------------------------------------------------------------------
  // Data updaters
  // -------------------------------------------------------------------------

  const updateEvent = useCallback((id: string, patch: Partial<EventItem>) => {
    const updated = dataRef.current.events.map((e) => (e.id === id ? { ...e, ...patch } : e));
    scheduleSave({ ...dataRef.current, events: updated });
    const ev = updated.find((e) => e.id === id);
    if (ev) {
      upsertEvent({
        id: ev.id, name: ev.name, date: ev.date || null, venue: ev.venue,
        type: ev.type, status: ev.status, screened: ev.screened,
        signed_up: ev.signedUp, showed: ev.showed, revenue: ev.revenue, notes: ev.notes,
      }).catch(() => {});
    }
  }, [scheduleSave]);

  const deleteEvent = useCallback((id: string) => {
    if (!confirm("Delete this event?")) return;
    scheduleSave({ ...dataRef.current, events: dataRef.current.events.filter((e) => e.id !== id) });
    deleteEventAction(id).catch(() => {});
  }, [scheduleSave]);

  const addEvent = useCallback((fd: FormData) => {
    const name = (fd.get("name") as string) || "";
    const date = (fd.get("date") as string) || "";
    const venue = (fd.get("venue") as string) || "";
    const type = (fd.get("type") as string) || "Other";
    const notes = (fd.get("notes") as string) || "";
    if (!name.trim()) return;
    const newEvent: EventItem = {
      id: genId(), name: name.trim(), date, venue: venue.trim(), type,
      status: "planned", screened: 0, signedUp: 0, showed: 0, revenue: 0, notes: notes.trim(),
    };
    scheduleSave({ ...dataRef.current, events: [...dataRef.current.events, newEvent] });
    upsertEvent({
      id: newEvent.id, name: newEvent.name, date: newEvent.date || null,
      venue: newEvent.venue, type: newEvent.type, status: newEvent.status,
      screened: 0, signed_up: 0, showed: 0, revenue: 0, notes: newEvent.notes,
    }).catch(() => {});
    setShowEventForm(false);
  }, [scheduleSave]);

  const updateContact = useCallback((id: string, patch: Partial<ContactItem>) => {
    const updated = dataRef.current.contacts.map((c) => (c.id === id ? { ...c, ...patch } : c));
    scheduleSave({ ...dataRef.current, contacts: updated });
    const ct = updated.find((c) => c.id === id);
    if (ct) {
      upsertContact({
        id: ct.id, name: ct.name, business: ct.business, phone: ct.phone,
        email: ct.email, type: ct.type, status: ct.status,
        follow_up_date: ct.followUpDate || null, notes: ct.notes,
      }).catch(() => {});
    }
  }, [scheduleSave]);

  const deleteContact = useCallback((id: string) => {
    if (!confirm("Delete this contact?")) return;
    scheduleSave({ ...dataRef.current, contacts: dataRef.current.contacts.filter((c) => c.id !== id) });
    deleteContactAction(id).catch(() => {});
  }, [scheduleSave]);

  const addContact = useCallback((fd: FormData) => {
    const name = (fd.get("name") as string) || "";
    if (!name.trim()) return;
    const newContact: ContactItem = {
      id: genId(),
      name: name.trim(),
      business: ((fd.get("business") as string) || "").trim(),
      phone: ((fd.get("phone") as string) || "").trim(),
      email: ((fd.get("email") as string) || "").trim(),
      type: (fd.get("type") as string) || "Other",
      status: "new",
      followUpDate: "",
      notes: ((fd.get("notes") as string) || "").trim(),
    };
    scheduleSave({ ...dataRef.current, contacts: [...dataRef.current.contacts, newContact] });
    upsertContact({
      id: newContact.id, name: newContact.name, business: newContact.business,
      phone: newContact.phone, email: newContact.email, type: newContact.type,
      status: newContact.status, follow_up_date: null, notes: newContact.notes,
    }).catch(() => {});
    setShowContactForm(false);
  }, [scheduleSave]);

  const updateVendor = useCallback((id: string, patch: Partial<VendorItem>) => {
    const updated = dataRef.current.vendors.map((v) => (v.id === id ? { ...v, ...patch } : v));
    scheduleSave({ ...dataRef.current, vendors: updated });
    const vn = updated.find((v) => v.id === id);
    if (vn) {
      upsertVendor({
        id: vn.id, company: vn.company, contact: vn.contact, phone: vn.phone,
        email: vn.email, service: vn.service, referrals_sent: vn.referralsSent,
        referrals_received: vn.referralsReceived, status: vn.status, notes: vn.notes,
      }).catch(() => {});
    }
  }, [scheduleSave]);

  const deleteVendor = useCallback((id: string) => {
    if (!confirm("Delete this vendor?")) return;
    scheduleSave({ ...dataRef.current, vendors: dataRef.current.vendors.filter((v) => v.id !== id) });
    deleteVendorAction(id).catch(() => {});
  }, [scheduleSave]);

  const addVendor = useCallback((fd: FormData) => {
    const company = (fd.get("company") as string) || "";
    if (!company.trim()) return;
    const newVendor: VendorItem = {
      id: genId(),
      company: company.trim(),
      contact: ((fd.get("contact") as string) || "").trim(),
      phone: ((fd.get("phone") as string) || "").trim(),
      email: ((fd.get("email") as string) || "").trim(),
      service: ((fd.get("service") as string) || "").trim(),
      referralsSent: 0,
      referralsReceived: 0,
      status: "new",
      notes: ((fd.get("notes") as string) || "").trim(),
    };
    scheduleSave({ ...dataRef.current, vendors: [...dataRef.current.vendors, newVendor] });
    upsertVendor({
      id: newVendor.id, company: newVendor.company, contact: newVendor.contact,
      phone: newVendor.phone, email: newVendor.email, service: newVendor.service,
      referrals_sent: 0, referrals_received: 0, status: newVendor.status, notes: newVendor.notes,
    }).catch(() => {});
    setShowVendorForm(false);
  }, [scheduleSave]);

  const updateOutreach = useCallback((id: string, patch: Partial<OutreachItem>) => {
    const updated = dataRef.current.outreach.map((o) => (o.id === id ? { ...o, ...patch } : o));
    scheduleSave({ ...dataRef.current, outreach: updated });
    const ou = updated.find((o) => o.id === id);
    if (ou) {
      upsertOutreach({
        id: ou.id, name: ou.name, type: ou.type, date: ou.date || null,
        status: ou.status, contact_info: ou.contactInfo, notes: ou.notes,
      }).catch(() => {});
    }
  }, [scheduleSave]);

  const deleteOutreach = useCallback((id: string) => {
    if (!confirm("Delete this opportunity?")) return;
    scheduleSave({ ...dataRef.current, outreach: dataRef.current.outreach.filter((o) => o.id !== id) });
    deleteOutreachAction(id).catch(() => {});
  }, [scheduleSave]);

  const addOutreachItem = useCallback((fd: FormData) => {
    const name = (fd.get("name") as string) || "";
    if (!name.trim()) return;
    const newOpp: OutreachItem = {
      id: genId(),
      name: name.trim(),
      type: (fd.get("type") as string) || "other",
      date: (fd.get("date") as string) || "",
      status: "to-contact",
      contactInfo: ((fd.get("contactInfo") as string) || "").trim(),
      notes: ((fd.get("notes") as string) || "").trim(),
    };
    scheduleSave({ ...dataRef.current, outreach: [...dataRef.current.outreach, newOpp] });
    upsertOutreach({
      id: newOpp.id, name: newOpp.name, type: newOpp.type,
      date: newOpp.date || null, status: newOpp.status,
      contact_info: newOpp.contactInfo, notes: newOpp.notes,
    }).catch(() => {});
    setShowOutreachForm(false);
  }, [scheduleSave]);

  const toggleNotes = useCallback((id: string) => {
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const completeFollowUp = useCallback((id: string) => {
    const today = todayStr();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 14);
    const futureDateStr = futureDate.toISOString().split("T")[0];
    const contact = dataRef.current.contacts.find((c) => c.id === id);
    if (!contact) return;
    const newNotes = contact.notes
      ? `Followed up on ${today}\n${contact.notes}`
      : `Followed up on ${today}`;
    updateContact(id, { followUpDate: futureDateStr, notes: newNotes });
  }, [updateContact]);

  // -------------------------------------------------------------------------
  // Computed data
  // -------------------------------------------------------------------------

  const today = todayStr();
  const completedEvents = data.events.filter((e) => e.status === "completed" || e.status === "followed-up");
  const upcomingEvents = data.events
    .filter((e) => e.date && e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  const totalScreened = data.events.reduce((s, e) => s + e.screened, 0);
  const totalBooked = data.events.reduce((s, e) => s + e.showed, 0);

  const avgRevenue = completedEvents.length > 0
    ? completedEvents.reduce((s, e) => s + e.revenue, 0) / completedEvents.length
    : 0;
  const avgRoiGrade = avgRevenue >= 1500 ? "A" : avgRevenue >= 750 ? "B" : avgRevenue >= 300 ? "C" : "D";

  const overdueContacts = data.contacts.filter(
    (c) => c.followUpDate && c.followUpDate <= today && c.followUpDate !== ""
  );

  // -------------------------------------------------------------------------
  // Loading
  // -------------------------------------------------------------------------

  if (authorized === null || !loaded) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#e97325] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Locked overlay
  // -------------------------------------------------------------------------

  if (!authorized) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-gray-400" />
          </div>
          <h1 className="text-2xl font-black text-[#1a2744] mb-3">Screening Command Center</h1>
          <p className="text-gray-500 mb-6">
            This tool is available to Screening Accelerator and Screening Mastery Kit buyers.
            Unlock your complete screening operating system.
          </p>
          <Link
            href="/screening-weekend"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#e97325] text-white font-bold rounded-xl hover:bg-[#e97325]/90 transition-all"
          >
            <Target className="w-4 h-4" />
            Unlock with the Screening Accelerator
          </Link>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Shared UI helpers
  // -------------------------------------------------------------------------

  const inputCls = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e97325]/30 focus:border-[#e97325] transition-all";
  const selectCls = inputCls + " appearance-none";
  const btnPrimary = "px-5 py-3 bg-[#e97325] text-white font-bold text-sm rounded-xl hover:bg-[#e97325]/90 transition-all active:scale-[0.98]";
  const btnSecondary = "px-4 py-2 bg-gray-100 text-gray-600 font-bold text-sm rounded-xl hover:bg-gray-200 transition-all";

  const StatCard = ({ label, value, color = "text-[#1a2744]", icon }: { label: string; value: string | number; color?: string; icon?: React.ReactNode }) => (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
      {icon && <div className="flex justify-center mb-1">{icon}</div>}
      <div className={`text-xl md:text-2xl font-black ${color}`}>{value}</div>
      <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mt-1">{label}</div>
    </div>
  );

  const StatusPipeline = ({ current, statuses, onChange }: { current: string; statuses: string[]; onChange: (s: string) => void }) => (
    <div className="flex flex-wrap gap-1">
      {statuses.map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
            current === s
              ? `text-white ${statusColor(s)}`
              : "bg-gray-100 text-gray-400 hover:bg-gray-200"
          }`}
        >
          {statusLabel(s)}
        </button>
      ))}
    </div>
  );

  // Event form (reusable)
  const EventForm = ({ onClose }: { onClose: () => void }) => (
    <form
      onSubmit={(e) => { e.preventDefault(); addEvent(new FormData(e.currentTarget)); }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4 space-y-3"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input name="name" placeholder="Event name" required className={inputCls} />
        <input name="date" type="date" className={inputCls} />
        <input name="venue" placeholder="Venue / Address" className={inputCls} />
        <select name="type" className={selectCls}>
          {EVENT_TYPES.map((t) => <option key={t} value={t.toLowerCase()}>{t}</option>)}
        </select>
        <input name="notes" placeholder="Notes" className={`${inputCls} md:col-span-2`} />
      </div>
      <div className="flex gap-2">
        <button type="submit" className={btnPrimary}>Save Event</button>
        <button type="button" onClick={onClose} className={btnSecondary}>Cancel</button>
      </div>
    </form>
  );

  // =========================================================================
  // TAB 1: DASHBOARD
  // =========================================================================

  const DashboardTab = () => {
    const upcomingSlice = upcomingEvents.slice(0, 5);
    const overdueSlice = overdueContacts.slice(0, 5);

    return (
      <div>
        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <StatCard label="Total Events" value={data.events.length} icon={<Calendar className="w-4 h-4 text-[#1a2744]" />} />
          <StatCard label="Upcoming" value={upcomingEvents.length} color="text-blue-600" icon={<Clock className="w-4 h-4 text-blue-600" />} />
          <StatCard label="Total Screened" value={totalScreened} color="text-[#e97325]" icon={<Users className="w-4 h-4 text-[#e97325]" />} />
          <StatCard label="Total Booked" value={totalBooked} color="text-green-600" icon={<TrendingUp className="w-4 h-4 text-green-600" />} />
          <StatCard
            label="Avg ROI Grade"
            value={completedEvents.length > 0 ? avgRoiGrade : "--"}
            color={avgRoiGrade === "A" ? "text-green-600" : avgRoiGrade === "B" ? "text-blue-600" : avgRoiGrade === "C" ? "text-[#e97325]" : "text-red-500"}
            icon={<BarChart3 className="w-4 h-4 text-gray-400" />}
          />
        </div>

        {/* Two column layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Upcoming events */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-black text-[#1a2744] mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#e97325]" />
              Upcoming Events
            </h3>
            {upcomingSlice.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">No upcoming events</p>
            ) : (
              <div className="space-y-2">
                {upcomingSlice.map((ev) => (
                  <div key={ev.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#1a2744] truncate">{ev.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500">{formatDate(ev.date)}</span>
                        {ev.venue && <span className="text-xs text-gray-400 truncate flex items-center gap-1"><MapPin className="w-3 h-3" />{ev.venue}</span>}
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${statusColor(ev.status)} shrink-0`}>
                      {statusLabel(ev.status)}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {upcomingEvents.length > 5 && (
              <button
                onClick={() => setActiveTab("pipeline")}
                className="text-xs text-[#e97325] font-bold mt-3 hover:underline"
              >
                View all in Pipeline
              </button>
            )}
          </div>

          {/* Follow-ups due */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-black text-[#1a2744] mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              Follow-Ups Due
            </h3>
            {overdueSlice.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">No follow-ups due</p>
            ) : (
              <div className="space-y-2">
                {overdueSlice.map((ct) => {
                  const daysOverdue = daysBetween(ct.followUpDate, today);
                  return (
                    <div key={ct.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#1a2744] truncate">{ct.name}</p>
                        {ct.business && <p className="text-xs text-gray-500">{ct.business}</p>}
                      </div>
                      <span className="text-xs font-bold text-red-500 shrink-0">
                        {daysOverdue === 0 ? "Due today" : `${daysOverdue}d overdue`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            {overdueContacts.length > 5 && (
              <button
                onClick={() => setActiveTab("network")}
                className="text-xs text-[#e97325] font-bold mt-3 hover:underline"
              >
                View all
              </button>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => { setActiveTab("pipeline"); setShowEventForm(true); }}
            className={`${btnPrimary} inline-flex items-center gap-2`}
          >
            <Plus className="w-4 h-4" /> New Event
          </button>
          <button
            onClick={() => { setActiveTab("network"); setNetworkSubTab("contacts"); setShowContactForm(true); }}
            className={`${btnPrimary} inline-flex items-center gap-2`}
          >
            <Plus className="w-4 h-4" /> New Contact
          </button>
          <button
            onClick={() => setActiveTab("roi")}
            className="px-5 py-3 bg-[#1a2744] text-white font-bold text-sm rounded-xl hover:bg-[#1a2744]/90 transition-all active:scale-[0.98] inline-flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" /> View ROI
          </button>
        </div>
      </div>
    );
  };

  // =========================================================================
  // TAB 2: PIPELINE
  // =========================================================================

  const PipelineTab = () => {
    const filterOptions = ["All", "Planned", "Confirmed", "Completed", "Followed Up"];
    const filterMap: Record<string, string> = { Planned: "planned", Confirmed: "confirmed", Completed: "completed", "Followed Up": "followed-up" };

    const events = [...data.events]
      .filter((e) => pipelineFilter === "All" || e.status === filterMap[pipelineFilter])
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""));

    const isMetricsVisible = (status: string) => status === "completed" || status === "followed-up";

    return (
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <h2 className="text-lg font-black text-[#1a2744] flex items-center gap-2">
            <Target className="w-5 h-5 text-[#e97325]" />
            Event Pipeline
          </h2>
          <div className="flex items-center gap-2 sm:ml-auto">
            <select
              value={pipelineFilter}
              onChange={(e) => setPipelineFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 focus:outline-none focus:border-[#e97325]"
            >
              {filterOptions.map((f) => <option key={f}>{f}</option>)}
            </select>
            <button onClick={() => setShowEventForm(!showEventForm)} className={`${btnPrimary} inline-flex items-center gap-2`}>
              <Plus className="w-4 h-4" /> New Event
            </button>
          </div>
        </div>

        {/* Form */}
        {showEventForm && <EventForm onClose={() => setShowEventForm(false)} />}

        {/* Empty state */}
        {events.length === 0 && (
          <div className="text-center py-16">
            <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-400">No events yet</p>
            <p className="text-xs text-gray-300 mt-1">Add your first screening event to get started!</p>
          </div>
        )}

        {/* Table - desktop */}
        {events.length > 0 && (
          <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Event</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Venue</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-right px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Screened</th>
                    <th className="text-right px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Booked</th>
                    <th className="text-right px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Revenue</th>
                    <th className="text-center px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((ev) => (
                    <tr key={ev.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 font-bold text-[#1a2744] max-w-[200px] truncate">{ev.name}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{formatDate(ev.date)}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs max-w-[150px] truncate">{ev.venue || "—"}</td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-bold uppercase">{ev.type}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => updateEvent(ev.id, { status: nextStatus(ev.status, EVENT_STATUSES) })}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold text-white ${statusColor(ev.status)} hover:opacity-80 transition-opacity cursor-pointer`}
                          title="Click to advance status"
                        >
                          {statusLabel(ev.status)}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isMetricsVisible(ev.status) ? (
                          <input
                            type="number" min={0} value={ev.screened}
                            onChange={(e) => updateEvent(ev.id, { screened: parseInt(e.target.value) || 0 })}
                            className="w-16 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-center focus:outline-none focus:border-[#e97325]"
                          />
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isMetricsVisible(ev.status) ? (
                          <input
                            type="number" min={0} value={ev.showed}
                            onChange={(e) => updateEvent(ev.id, { showed: parseInt(e.target.value) || 0 })}
                            className="w-16 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-center focus:outline-none focus:border-[#e97325]"
                          />
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isMetricsVisible(ev.status) ? (
                          <input
                            type="number" min={0} value={ev.revenue}
                            onChange={(e) => updateEvent(ev.id, { revenue: parseInt(e.target.value) || 0 })}
                            className="w-20 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-center focus:outline-none focus:border-[#e97325]"
                          />
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setEditingEventId(editingEventId === ev.id ? null : ev.id)}
                            className="text-gray-400 hover:text-[#e97325] transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteEvent(ev.id)} className="text-gray-300 hover:text-red-400 transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Cards - mobile */}
        {events.length > 0 && (
          <div className="md:hidden space-y-3">
            {events.map((ev) => (
              <div key={ev.id} className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 border-l-4 ${statusBorder(ev.status)}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-[#1a2744] truncate">{ev.name}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">{formatDate(ev.date)}</span>
                      {ev.venue && <span className="text-xs text-gray-400 flex items-center gap-1"><MapPin className="w-3 h-3" />{ev.venue}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => updateEvent(ev.id, { status: nextStatus(ev.status, EVENT_STATUSES) })}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold text-white ${statusColor(ev.status)} shrink-0`}
                  >
                    {statusLabel(ev.status)}
                  </button>
                </div>
                {isMetricsVisible(ev.status) && (
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Screened</label>
                      <input type="number" min={0} value={ev.screened} onChange={(e) => updateEvent(ev.id, { screened: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-center focus:outline-none focus:border-[#e97325]" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Booked</label>
                      <input type="number" min={0} value={ev.showed} onChange={(e) => updateEvent(ev.id, { showed: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-center focus:outline-none focus:border-[#e97325]" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Revenue</label>
                      <input type="number" min={0} value={ev.revenue} onChange={(e) => updateEvent(ev.id, { revenue: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-center focus:outline-none focus:border-[#e97325]" />
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <button onClick={() => toggleNotes(ev.id)} className="text-xs text-gray-400 hover:text-gray-600 font-bold flex items-center gap-1">
                    {expandedNotes.has(ev.id) ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />} Notes
                  </button>
                  <button onClick={() => deleteEvent(ev.id)} className="ml-auto text-gray-300 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
                {expandedNotes.has(ev.id) && (
                  <textarea value={ev.notes} onChange={(e) => updateEvent(ev.id, { notes: e.target.value })} placeholder="Add notes..."
                    className="mt-2 w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#e97325] resize-y min-h-[60px]" />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Inline edit row (desktop) */}
        {editingEventId && (
          <div className="hidden md:block mt-4 bg-white rounded-2xl border border-[#e97325]/30 shadow-sm p-5">
            <h4 className="text-sm font-bold text-[#1a2744] mb-3">Edit Event</h4>
            {(() => {
              const ev = data.events.find((e) => e.id === editingEventId);
              if (!ev) return null;
              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input value={ev.name} onChange={(e) => updateEvent(ev.id, { name: e.target.value })} placeholder="Event name" className={inputCls} />
                  <input type="date" value={ev.date} onChange={(e) => updateEvent(ev.id, { date: e.target.value })} className={inputCls} />
                  <input value={ev.venue} onChange={(e) => updateEvent(ev.id, { venue: e.target.value })} placeholder="Venue" className={inputCls} />
                  <select value={ev.type} onChange={(e) => updateEvent(ev.id, { type: e.target.value })} className={selectCls}>
                    {EVENT_TYPES.map((t) => <option key={t} value={t.toLowerCase()}>{t}</option>)}
                  </select>
                  <textarea value={ev.notes} onChange={(e) => updateEvent(ev.id, { notes: e.target.value })} placeholder="Notes" className={`${inputCls} md:col-span-2`} />
                  <button onClick={() => setEditingEventId(null)} className={btnSecondary}>Done</button>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    );
  };

  // =========================================================================
  // TAB 3: CALENDAR
  // =========================================================================

  const CalendarTab = () => {
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();

    const todayDate = new Date();
    const isCurrentMonth = todayDate.getFullYear() === calendarYear && todayDate.getMonth() === calendarMonth;

    // Build event lookup by date
    const eventsByDate: Record<string, EventItem[]> = {};
    data.events.forEach((ev) => {
      if (ev.date) {
        if (!eventsByDate[ev.date]) eventsByDate[ev.date] = [];
        eventsByDate[ev.date].push(ev);
      }
    });

    const goToToday = () => {
      setCalendarMonth(todayDate.getMonth());
      setCalendarYear(todayDate.getFullYear());
    };

    const prevMonth = () => {
      if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(calendarYear - 1); }
      else setCalendarMonth(calendarMonth - 1);
    };

    const nextMonth = () => {
      if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(calendarYear + 1); }
      else setCalendarMonth(calendarMonth + 1);
    };

    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    const selectedEvents = selectedCalDate ? (eventsByDate[selectedCalDate] || []) : [];

    return (
      <div>
        {/* Month header */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-black text-[#1a2744]">
              {monthNames[calendarMonth]} {calendarYear}
            </h2>
            <button onClick={goToToday} className="px-3 py-1 text-xs font-bold bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
              Today
            </button>
          </div>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Calendar grid */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-7">
            {daysOfWeek.map((d) => (
              <div key={d} className="px-2 py-3 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 bg-gray-50">
                {d}
              </div>
            ))}
            {cells.map((day, i) => {
              if (day === null) {
                return <div key={`empty-${i}`} className="min-h-[80px] border-b border-r border-gray-50 bg-gray-50/30" />;
              }
              const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const eventsOnDay = eventsByDate[dateStr] || [];
              const isToday = isCurrentMonth && day === todayDate.getDate();
              const isSelected = selectedCalDate === dateStr;

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedCalDate(isSelected ? null : dateStr)}
                  className={`min-h-[80px] border-b border-r border-gray-50 p-2 text-left transition-colors hover:bg-gray-50 relative ${
                    isSelected ? "bg-orange-50" : ""
                  }`}
                >
                  <span className={`text-xs font-bold ${isToday ? "w-6 h-6 flex items-center justify-center rounded-full ring-2 ring-[#e97325] text-[#e97325]" : "text-gray-600"}`}>
                    {day}
                  </span>
                  {eventsOnDay.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {eventsOnDay.map((ev) => (
                        <span
                          key={ev.id}
                          className={`w-2 h-2 rounded-full ${
                            ev.status === "completed" || ev.status === "followed-up"
                              ? "bg-green-500"
                              : ev.status === "confirmed"
                                ? "bg-blue-500"
                                : "bg-yellow-500"
                          }`}
                          title={ev.name}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected date popup */}
        {selectedCalDate && (
          <div className="mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-[#1a2744] mb-3">
              Events on {formatDate(selectedCalDate)}
            </h3>
            {selectedEvents.length === 0 ? (
              <p className="text-xs text-gray-400">No events on this date</p>
            ) : (
              <div className="space-y-2">
                {selectedEvents.map((ev) => (
                  <button
                    key={ev.id}
                    onClick={() => { setActiveTab("pipeline"); }}
                    className="w-full text-left flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      ev.status === "completed" || ev.status === "followed-up" ? "bg-green-500" :
                      ev.status === "confirmed" ? "bg-blue-500" : "bg-yellow-500"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#1a2744] truncate">{ev.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-bold uppercase">{ev.type}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full text-white font-bold ${statusColor(ev.status)}`}>{statusLabel(ev.status)}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Planned</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Confirmed</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Completed</span>
        </div>
      </div>
    );
  };

  // =========================================================================
  // TAB 4: NETWORK & FOLLOW-UPS
  // =========================================================================

  const NetworkTab = () => {
    return (
      <div>
        {/* Sub-tab toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setNetworkSubTab("contacts")}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              networkSubTab === "contacts" ? "bg-[#1a2744] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            Contacts
          </button>
          <button
            onClick={() => setNetworkSubTab("vendors")}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              networkSubTab === "vendors" ? "bg-[#1a2744] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            Vendors
          </button>
        </div>

        {networkSubTab === "contacts" ? <ContactsSection /> : <VendorsSection />}
      </div>
    );
  };

  const ContactsSection = () => {
    const contacts = data.contacts;

    return (
      <div>
        {/* Follow-up queue */}
        {overdueContacts.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-4">
            <h4 className="text-sm font-bold text-orange-700 flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4" />
              You have {overdueContacts.length} follow-up{overdueContacts.length !== 1 ? "s" : ""} due
            </h4>
            <div className="space-y-2">
              {overdueContacts.map((ct) => {
                const daysOverdue = daysBetween(ct.followUpDate, today);
                return (
                  <div key={ct.id} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#1a2744] truncate">{ct.name}</p>
                      <p className="text-xs text-gray-500">{ct.business || "No business"} &middot; <span className="text-red-500 font-bold">{daysOverdue === 0 ? "Due today" : `${daysOverdue}d overdue`}</span></p>
                    </div>
                    <button
                      onClick={() => completeFollowUp(ct.id)}
                      className="px-3 py-1.5 bg-[#e97325] text-white text-xs font-bold rounded-lg hover:bg-[#e97325]/90 transition-all shrink-0"
                    >
                      Complete Follow-Up
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Add button */}
        <button onClick={() => setShowContactForm(!showContactForm)} className={`${btnPrimary} mb-4 inline-flex items-center gap-2`}>
          <Plus className="w-4 h-4" /> New Contact
        </button>

        {/* Form */}
        {showContactForm && (
          <form
            onSubmit={(e) => { e.preventDefault(); addContact(new FormData(e.currentTarget)); }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4 space-y-3"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input name="name" placeholder="Name" required className={inputCls} />
              <input name="business" placeholder="Business" className={inputCls} />
              <input name="phone" placeholder="Phone" className={inputCls} />
              <input name="email" placeholder="Email" type="email" className={inputCls} />
              <select name="type" className={selectCls}>
                {CONTACT_TYPES.map((t) => <option key={t} value={t.toLowerCase()}>{t}</option>)}
              </select>
              <input name="notes" placeholder="Notes" className={inputCls} />
            </div>
            <div className="flex gap-2">
              <button type="submit" className={btnPrimary}>Save Contact</button>
              <button type="button" onClick={() => setShowContactForm(false)} className={btnSecondary}>Cancel</button>
            </div>
          </form>
        )}

        {/* Empty state */}
        {contacts.length === 0 && (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-400">No contacts yet</p>
            <p className="text-xs text-gray-300 mt-1">Add your first contact to build your screening network!</p>
          </div>
        )}

        {/* Contact cards */}
        <div className="space-y-3">
          {contacts.map((contact) => {
            const initials = contact.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
            return (
              <div key={contact.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#1a2744] flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-[#1a2744] truncate">{contact.name}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      {contact.business && <span className="text-xs text-gray-500">{contact.business}</span>}
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-bold uppercase">{contact.type}</span>
                    </div>
                  </div>
                </div>

                {/* Status pipeline */}
                <div className="mt-3">
                  <StatusPipeline current={contact.status} statuses={CONTACT_STATUSES} onChange={(s) => updateContact(contact.id, { status: s })} />
                </div>

                {/* Details */}
                <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-500">
                  {contact.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{contact.phone}</span>}
                  {contact.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{contact.email}</span>}
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span className="text-[10px] font-bold text-gray-400 mr-1">Follow-up:</span>
                    <input
                      type="date" value={contact.followUpDate}
                      onChange={(e) => updateContact(contact.id, { followUpDate: e.target.value })}
                      className="text-xs bg-transparent border-b border-gray-200 focus:border-[#e97325] focus:outline-none py-0.5"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="flex items-center gap-2 mt-3">
                  <button onClick={() => toggleNotes(contact.id)} className="text-xs text-gray-400 hover:text-gray-600 font-bold flex items-center gap-1">
                    {expandedNotes.has(contact.id) ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />} Notes
                  </button>
                  <button onClick={() => deleteContact(contact.id)} className="ml-auto text-gray-300 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
                {expandedNotes.has(contact.id) && (
                  <textarea value={contact.notes} onChange={(e) => updateContact(contact.id, { notes: e.target.value })} placeholder="Add notes..."
                    className="mt-2 w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#e97325] resize-y min-h-[60px]" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const VendorsSection = () => {
    const vendors = data.vendors;

    return (
      <div>
        {/* Add button */}
        <button onClick={() => setShowVendorForm(!showVendorForm)} className={`${btnPrimary} mb-4 inline-flex items-center gap-2`}>
          <Plus className="w-4 h-4" /> New Vendor
        </button>

        {/* Form */}
        {showVendorForm && (
          <form
            onSubmit={(e) => { e.preventDefault(); addVendor(new FormData(e.currentTarget)); }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4 space-y-3"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input name="company" placeholder="Company name" required className={inputCls} />
              <input name="contact" placeholder="Contact name" className={inputCls} />
              <input name="phone" placeholder="Phone" className={inputCls} />
              <input name="email" placeholder="Email" type="email" className={inputCls} />
              <input name="service" placeholder="Service / Product" className={inputCls} />
              <input name="notes" placeholder="Notes" className={inputCls} />
            </div>
            <div className="flex gap-2">
              <button type="submit" className={btnPrimary}>Save Vendor</button>
              <button type="button" onClick={() => setShowVendorForm(false)} className={btnSecondary}>Cancel</button>
            </div>
          </form>
        )}

        {/* Empty state */}
        {vendors.length === 0 && (
          <div className="text-center py-16">
            <Building2 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-400">No vendors yet</p>
            <p className="text-xs text-gray-300 mt-1">Add your first vendor partner to start tracking referrals!</p>
          </div>
        )}

        {/* Vendor cards */}
        <div className="space-y-3">
          {vendors.map((vendor) => {
            const initials = vendor.company.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
            return (
              <div key={vendor.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#e97325] flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-[#1a2744] truncate">{vendor.company}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      {vendor.contact && <span className="text-xs text-gray-500">{vendor.contact}</span>}
                      {vendor.service && <span className="text-xs text-gray-400">- {vendor.service}</span>}
                    </div>
                  </div>
                </div>

                {/* Status pipeline */}
                <div className="mt-3">
                  <StatusPipeline current={vendor.status} statuses={VENDOR_STATUSES} onChange={(s) => updateVendor(vendor.id, { status: s })} />
                </div>

                {/* Referrals + contact */}
                <div className="flex flex-wrap items-center gap-4 mt-3">
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Sent</label>
                    <input type="number" min={0} value={vendor.referralsSent} onChange={(e) => updateVendor(vendor.id, { referralsSent: parseInt(e.target.value) || 0 })}
                      className="w-16 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-center focus:outline-none focus:border-[#e97325]" />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Received</label>
                    <input type="number" min={0} value={vendor.referralsReceived} onChange={(e) => updateVendor(vendor.id, { referralsReceived: parseInt(e.target.value) || 0 })}
                      className="w-16 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-center focus:outline-none focus:border-[#e97325]" />
                  </div>
                  {vendor.phone && <span className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" />{vendor.phone}</span>}
                  {vendor.email && <span className="text-xs text-gray-500 flex items-center gap-1"><Mail className="w-3 h-3" />{vendor.email}</span>}
                </div>

                {/* Notes */}
                <div className="flex items-center gap-2 mt-3">
                  <button onClick={() => toggleNotes(vendor.id)} className="text-xs text-gray-400 hover:text-gray-600 font-bold flex items-center gap-1">
                    {expandedNotes.has(vendor.id) ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />} Notes
                  </button>
                  <button onClick={() => deleteVendor(vendor.id)} className="ml-auto text-gray-300 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
                {expandedNotes.has(vendor.id) && (
                  <textarea value={vendor.notes} onChange={(e) => updateVendor(vendor.id, { notes: e.target.value })} placeholder="Add notes..."
                    className="mt-2 w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#e97325] resize-y min-h-[60px]" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // =========================================================================
  // TAB 5: ROI SCORECARD
  // =========================================================================

  const RoiTab = () => {
    const completed = completedEvents;
    const totalRevenue = completed.reduce((s, e) => s + e.revenue, 0);
    const totalPatients = completed.reduce((s, e) => s + e.showed, 0);
    const avgCostPerPatient = totalPatients > 0 ? Math.round(totalRevenue / totalPatients) : 0;

    // Grade helper
    const getGrade = (revenue: number, cost: number) => {
      if (cost === 0) return { letter: "A", color: "text-green-600 bg-green-100" };
      const roi = revenue / cost;
      if (roi >= 10) return { letter: "A", color: "text-green-600 bg-green-100" };
      if (roi >= 5) return { letter: "B", color: "text-blue-600 bg-blue-100" };
      if (roi >= 2) return { letter: "C", color: "text-[#e97325] bg-orange-100" };
      return { letter: "D", color: "text-red-600 bg-red-100" };
    };

    // Avg grade across events
    const avgGradeVal = completed.length > 0
      ? completed.reduce((s, e) => {
          const cost = 150;
          const roi = cost > 0 ? e.revenue / cost : 10;
          return s + roi;
        }, 0) / completed.length
      : 0;
    const avgGrade = avgGradeVal >= 10 ? "A" : avgGradeVal >= 5 ? "B" : avgGradeVal >= 2 ? "C" : "D";

    // Best event
    const bestEvent = completed.length > 0
      ? completed.reduce((best, e) => {
          const bestRoi = best.revenue / 150;
          const thisRoi = e.revenue / 150;
          return thisRoi > bestRoi ? e : best;
        })
      : null;

    if (completed.length === 0) {
      return (
        <div className="text-center py-16">
          <BarChart3 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-bold text-gray-400">Complete your first screening to see your ROI scorecard</p>
        </div>
      );
    }

    return (
      <div>
        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <StatCard label="Events Completed" value={completed.length} icon={<Calendar className="w-4 h-4 text-[#1a2744]" />} />
          <StatCard label="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} color="text-green-600" icon={<DollarSign className="w-4 h-4 text-green-600" />} />
          <StatCard label="Patients Booked" value={totalPatients} color="text-blue-600" icon={<Users className="w-4 h-4 text-blue-600" />} />
          <StatCard label="Avg $/Patient" value={`$${avgCostPerPatient}`} color="text-[#e97325]" icon={<TrendingUp className="w-4 h-4 text-[#e97325]" />} />
          <StatCard label="Avg ROI Grade" value={avgGrade} color={avgGrade === "A" ? "text-green-600" : avgGrade === "B" ? "text-blue-600" : avgGrade === "C" ? "text-[#e97325]" : "text-red-500"} icon={<Star className="w-4 h-4 text-yellow-500" />} />
        </div>

        {/* ROI Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Event</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Cost</th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Screened</th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Booked</th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">ROI</th>
                  <th className="text-center px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Grade</th>
                </tr>
              </thead>
              <tbody>
                {completed.map((ev) => {
                  const cost = 150;
                  const roi = cost > 0 ? ev.revenue / cost : 0;
                  const grade = getGrade(ev.revenue, cost);
                  return (
                    <tr key={ev.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-bold text-[#1a2744]">{ev.name}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{formatDate(ev.date)}</td>
                      <td className="px-4 py-3 text-right text-gray-600">${cost}</td>
                      <td className="px-4 py-3 text-right font-bold">{ev.screened}</td>
                      <td className="px-4 py-3 text-right font-bold">{ev.showed}</td>
                      <td className="px-4 py-3 text-right font-bold text-green-600">${ev.revenue.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-bold">{roi > 0 ? `${Math.round(roi)}x` : "—"}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`w-8 h-8 rounded-full inline-flex items-center justify-center text-sm font-black ${grade.color}`}>
                          {grade.letter}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Best event */}
        {bestEvent && (
          <div className="bg-gradient-to-r from-[#1a2744] to-[#2a3d5f] rounded-2xl p-6 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-5 h-5 text-yellow-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white/70">Best Event</h3>
            </div>
            <p className="text-xl font-black">{bestEvent.name}</p>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-white/80">
              <span>{formatDate(bestEvent.date)}</span>
              <span>{bestEvent.screened} screened</span>
              <span>{bestEvent.showed} booked</span>
              <span className="font-bold text-green-400">${bestEvent.revenue.toLocaleString()} revenue</span>
              <span className="font-bold text-yellow-400">{Math.round(bestEvent.revenue / 150)}x ROI</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // =========================================================================
  // TAB 6: OUTREACH
  // =========================================================================

  const OutreachTab = () => {
    const allOutreach = data.outreach;
    const filterOptions = ["All", "Market", "Gym", "Health Fair", "Corporate", "Church", "Festival", "Other"];
    const filtered = outreachFilter === "All"
      ? allOutreach
      : allOutreach.filter((o) => o.type.toLowerCase() === outreachFilter.toLowerCase());

    const copyTemplate = (idx: number, text: string) => {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedTemplate(idx);
        setTimeout(() => setCopiedTemplate(null), 2000);
      }).catch(() => {});
    };

    const toggleTemplate = (idx: number) => {
      setExpandedTemplates((prev) => {
        const next = new Set(prev);
        if (next.has(idx)) next.delete(idx);
        else next.add(idx);
        return next;
      });
    };

    // Highlight placeholders in template text
    const highlightPlaceholders = (text: string) => {
      const parts = text.split(/(\[[A-Z\s]+\])/g);
      return parts.map((part, i) =>
        /^\[.*\]$/.test(part)
          ? <span key={i} className="bg-orange-100 text-[#e97325] font-bold px-1 rounded">{part}</span>
          : part
      );
    };

    return (
      <div>
        {/* Outreach pipeline */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <h2 className="text-lg font-black text-[#1a2744] flex items-center gap-2">
            <Search className="w-5 h-5 text-[#e97325]" />
            Outreach Pipeline
          </h2>
          <div className="sm:ml-auto">
            <button onClick={() => setShowOutreachForm(!showOutreachForm)} className={`${btnPrimary} inline-flex items-center gap-2`}>
              <Plus className="w-4 h-4" /> Add Opportunity
            </button>
          </div>
        </div>

        {/* Form */}
        {showOutreachForm && (
          <form
            onSubmit={(e) => { e.preventDefault(); addOutreachItem(new FormData(e.currentTarget)); }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4 space-y-3"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input name="name" placeholder="Opportunity name" required className={inputCls} />
              <select name="type" className={selectCls}>
                {OUTREACH_TYPES.map((t) => <option key={t} value={t.toLowerCase()}>{t}</option>)}
              </select>
              <input name="date" type="date" className={inputCls} />
              <input name="contactInfo" placeholder="Contact info" className={inputCls} />
              <input name="notes" placeholder="Notes" className={`${inputCls} md:col-span-2`} />
            </div>
            <div className="flex gap-2">
              <button type="submit" className={btnPrimary}>Save Opportunity</button>
              <button type="button" onClick={() => setShowOutreachForm(false)} className={btnSecondary}>Cancel</button>
            </div>
          </form>
        )}

        {/* Filter pills */}
        <div className="flex flex-wrap gap-2 mb-4">
          {filterOptions.map((f) => (
            <button
              key={f}
              onClick={() => setOutreachFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                outreachFilter === f ? "bg-[#e97325] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="text-center py-10">
            <Search className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-400">No opportunities yet</p>
            <p className="text-xs text-gray-300 mt-1">Add your first outreach opportunity to start filling your calendar!</p>
          </div>
        )}

        {/* Outreach cards */}
        <div className="space-y-3 mb-8">
          {filtered.map((opp) => (
            <div key={opp.id} className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 border-l-4 ${statusBorder(opp.status)}`}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-[#1a2744] truncate">{opp.name}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-bold uppercase">{opp.type}</span>
                    {opp.date && <span className="text-xs text-gray-500">{formatDate(opp.date)}</span>}
                  </div>
                </div>
              </div>

              {/* Status pipeline */}
              <div className="mb-2">
                <StatusPipeline current={opp.status} statuses={OUTREACH_STATUSES} onChange={(s) => updateOutreach(opp.id, { status: s })} />
              </div>

              {opp.contactInfo && (
                <p className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" />{opp.contactInfo}</p>
              )}

              <div className="flex items-center gap-2 mt-2">
                <button onClick={() => toggleNotes(opp.id)} className="text-xs text-gray-400 hover:text-gray-600 font-bold flex items-center gap-1">
                  {expandedNotes.has(opp.id) ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />} Notes
                </button>
                <button onClick={() => deleteOutreach(opp.id)} className="ml-auto text-gray-300 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
              {expandedNotes.has(opp.id) && (
                <textarea value={opp.notes} onChange={(e) => updateOutreach(opp.id, { notes: e.target.value })} placeholder="Add notes..."
                  className="mt-2 w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#e97325] resize-y min-h-[60px]" />
              )}
            </div>
          ))}
        </div>

        {/* Outreach Templates */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-black text-[#1a2744] mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-[#e97325]" />
            Outreach Templates
          </h3>
          <div className="space-y-3">
            {OUTREACH_TEMPLATES.map((tpl, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <button
                  onClick={() => toggleTemplate(idx)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm font-bold text-[#1a2744]">{tpl.title}</span>
                  {expandedTemplates.has(idx) ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>
                {expandedTemplates.has(idx) && (
                  <div className="px-5 pb-5 border-t border-gray-100">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-4 mt-3 font-sans">
                      {highlightPlaceholders(tpl.body)}
                    </pre>
                    <button
                      onClick={() => copyTemplate(idx, tpl.body)}
                      className="mt-3 px-4 py-2 bg-[#1a2744] text-white text-xs font-bold rounded-lg hover:bg-[#1a2744]/90 transition-all inline-flex items-center gap-2"
                    >
                      {copiedTemplate === idx ? <><Check className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy</>}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // =========================================================================
  // TABS CONFIG
  // =========================================================================

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "dashboard", label: "Dashboard", icon: <BarChart3 className="w-4 h-4" /> },
    { key: "pipeline", label: "Pipeline", icon: <Target className="w-4 h-4" /> },
    { key: "calendar", label: "Calendar", icon: <Calendar className="w-4 h-4" /> },
    { key: "network", label: "Network", icon: <Users className="w-4 h-4" /> },
    { key: "roi", label: "ROI", icon: <TrendingUp className="w-4 h-4" /> },
    { key: "outreach", label: "Outreach", icon: <Search className="w-4 h-4" /> },
  ];

  // =========================================================================
  // MAIN RENDER
  // =========================================================================

  return (
    <div className="max-w-5xl mx-auto pb-32 md:pb-8">
      {/* Header */}
      <div className="py-4 mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#e97325] flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-[#1a2744]">Screening Command Center</h1>
            <p className="text-xs text-gray-500">Your screening operating system</p>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex overflow-x-auto border-b border-gray-200 mb-6 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center justify-center gap-1.5 px-4 py-3 text-sm font-bold transition-all whitespace-nowrap shrink-0 ${
              activeTab === tab.key
                ? "text-[#e97325] border-b-2 border-[#e97325]"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <span className="hidden sm:inline">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "dashboard" && DashboardTab()}
      {activeTab === "pipeline" && PipelineTab()}
      {activeTab === "calendar" && CalendarTab()}
      {activeTab === "network" && NetworkTab()}
      {activeTab === "roi" && RoiTab()}
      {activeTab === "outreach" && OutreachTab()}
    </div>
  );
}
