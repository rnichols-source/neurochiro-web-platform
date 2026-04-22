"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Target,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
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
} from "lucide-react";
import { createClient } from "@/lib/supabase";

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

type TabKey = "events" | "network" | "vendors" | "outreach";

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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CommandCenterPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("events");
  const [data, setData] = useState<CommandCenterData>(EMPTY_DATA);
  const [loaded, setLoaded] = useState(false);

  // Form visibility
  const [showEventForm, setShowEventForm] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [showOutreachForm, setShowOutreachForm] = useState(false);

  // Outreach filter
  const [outreachFilter, setOutreachFilter] = useState("All");

  // Expanded notes
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  // Debounced save ref
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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
  // Load / save localStorage
  // -------------------------------------------------------------------------

  useEffect(() => {
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
    setLoaded(true);
  }, []);

  const scheduleSave = useCallback((newData: CommandCenterData) => {
    setData(newData);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(newData));
      } catch { /* empty */ }
    }, 500);
  }, []);

  // -------------------------------------------------------------------------
  // Data updaters
  // -------------------------------------------------------------------------

  const updateEvent = useCallback((id: string, patch: Partial<EventItem>) => {
    scheduleSave({
      ...dataRef.current,
      events: dataRef.current.events.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    });
  }, [scheduleSave]);

  const deleteEvent = useCallback((id: string) => {
    if (!confirm("Delete this event?")) return;
    scheduleSave({ ...dataRef.current, events: dataRef.current.events.filter((e) => e.id !== id) });
  }, [scheduleSave]);

  const updateContact = useCallback((id: string, patch: Partial<ContactItem>) => {
    scheduleSave({
      ...dataRef.current,
      contacts: dataRef.current.contacts.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    });
  }, [scheduleSave]);

  const deleteContact = useCallback((id: string) => {
    if (!confirm("Delete this contact?")) return;
    scheduleSave({ ...dataRef.current, contacts: dataRef.current.contacts.filter((c) => c.id !== id) });
  }, [scheduleSave]);

  const updateVendor = useCallback((id: string, patch: Partial<VendorItem>) => {
    scheduleSave({
      ...dataRef.current,
      vendors: dataRef.current.vendors.map((v) => (v.id === id ? { ...v, ...patch } : v)),
    });
  }, [scheduleSave]);

  const deleteVendor = useCallback((id: string) => {
    if (!confirm("Delete this vendor?")) return;
    scheduleSave({ ...dataRef.current, vendors: dataRef.current.vendors.filter((v) => v.id !== id) });
  }, [scheduleSave]);

  const updateOutreach = useCallback((id: string, patch: Partial<OutreachItem>) => {
    scheduleSave({
      ...dataRef.current,
      outreach: dataRef.current.outreach.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    });
  }, [scheduleSave]);

  const deleteOutreach = useCallback((id: string) => {
    if (!confirm("Delete this opportunity?")) return;
    scheduleSave({ ...dataRef.current, outreach: dataRef.current.outreach.filter((o) => o.id !== id) });
  }, [scheduleSave]);

  const toggleNotes = useCallback((id: string) => {
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // -------------------------------------------------------------------------
  // Loading
  // -------------------------------------------------------------------------

  if (authorized === null || !loaded) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-neuro-orange border-t-transparent rounded-full animate-spin" />
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
  // Stat Card helper
  // -------------------------------------------------------------------------

  const StatCard = ({ label, value, color = "text-[#1a2744]" }: { label: string; value: string | number; color?: string }) => (
    <div className="bg-gray-50 rounded-xl p-4 text-center">
      <div className={`text-xl md:text-2xl font-black ${color}`}>{value}</div>
      <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mt-1">{label}</div>
    </div>
  );

  // -------------------------------------------------------------------------
  // Input helper
  // -------------------------------------------------------------------------

  const inputCls = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e97325]/30 focus:border-[#e97325] transition-all";
  const selectCls = inputCls + " appearance-none";
  const btnPrimary = "px-5 py-3 bg-[#e97325] text-white font-bold text-sm rounded-xl hover:bg-[#e97325]/90 transition-all active:scale-[0.98]";
  const btnSecondary = "px-4 py-2 bg-gray-100 text-gray-600 font-bold text-sm rounded-xl hover:bg-gray-200 transition-all";

  // =========================================================================
  // TAB 1: EVENTS
  // =========================================================================

  const EventsTab = () => {
    const events = [...data.events].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    const totalEvents = events.length;
    const patientsBooked = events.reduce((s, e) => s + e.showed, 0);
    const totalRevenue = events.reduce((s, e) => s + e.revenue, 0);
    const completedEvents = events.filter((e) => e.status === "completed" || e.status === "followed-up");
    const avgRoi = completedEvents.length > 0
      ? Math.round(totalRevenue / (completedEvents.length * 250))
      : 0;

    const addEvent = (fd: FormData) => {
      const name = (fd.get("name") as string) || "";
      const date = (fd.get("date") as string) || "";
      const venue = (fd.get("venue") as string) || "";
      const type = (fd.get("type") as string) || "Other";
      if (!name.trim()) return;
      const newEvent: EventItem = {
        id: genId(), name: name.trim(), date, venue: venue.trim(), type,
        status: "planned", screened: 0, signedUp: 0, showed: 0, revenue: 0, notes: "",
      };
      scheduleSave({ ...dataRef.current, events: [...dataRef.current.events, newEvent] });
      setShowEventForm(false);
    };

    return (
      <div>
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total Events" value={totalEvents} />
          <StatCard label="Patients Booked" value={patientsBooked} color="text-green-600" />
          <StatCard label="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} color="text-[#e97325]" />
          <StatCard label="Avg ROI" value={avgRoi > 0 ? `${avgRoi}x` : "--"} color="text-blue-600" />
        </div>

        {/* Add button */}
        <button onClick={() => setShowEventForm(!showEventForm)} className={`${btnPrimary} mb-4 inline-flex items-center gap-2`}>
          <Plus className="w-4 h-4" /> New Event
        </button>

        {/* Inline form */}
        {showEventForm && (
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
            </div>
            <div className="flex gap-2">
              <button type="submit" className={btnPrimary}>Save Event</button>
              <button type="button" onClick={() => setShowEventForm(false)} className={btnSecondary}>Cancel</button>
            </div>
          </form>
        )}

        {/* Empty state */}
        {events.length === 0 && (
          <div className="text-center py-16">
            <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-400">No events yet</p>
            <p className="text-xs text-gray-300 mt-1">Add your first screening event to get started!</p>
          </div>
        )}

        {/* Event cards */}
        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event.id}
              className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 border-l-4 ${statusBorder(event.status)}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-[#1a2744] truncate">{event.name}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {event.date && <span className="text-xs text-gray-500">{event.date}</span>}
                    {event.venue && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />{event.venue}
                      </span>
                    )}
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-bold uppercase">{event.type}</span>
                  </div>
                </div>
                <button
                  onClick={() => updateEvent(event.id, { status: nextStatus(event.status, EVENT_STATUSES) })}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold text-white ${statusColor(event.status)} hover:opacity-80 transition-opacity cursor-pointer shrink-0`}
                  title="Click to advance status"
                >
                  {statusLabel(event.status)}
                </button>
              </div>

              {/* Metrics — shown when completed or followed up */}
              {(event.status === "completed" || event.status === "followed-up") && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Screened</label>
                    <input
                      type="number" min={0} value={event.screened}
                      onChange={(e) => updateEvent(event.id, { screened: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold focus:outline-none focus:border-[#e97325]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Signed Up</label>
                    <input
                      type="number" min={0} value={event.signedUp}
                      onChange={(e) => updateEvent(event.id, { signedUp: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold focus:outline-none focus:border-[#e97325]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Showed</label>
                    <input
                      type="number" min={0} value={event.showed}
                      onChange={(e) => updateEvent(event.id, { showed: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold focus:outline-none focus:border-[#e97325]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Revenue ($)</label>
                    <input
                      type="number" min={0} value={event.revenue}
                      onChange={(e) => updateEvent(event.id, { revenue: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold focus:outline-none focus:border-[#e97325]"
                    />
                  </div>
                </div>
              )}

              {/* Notes + delete */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleNotes(event.id)}
                  className="text-xs text-gray-400 hover:text-gray-600 font-bold flex items-center gap-1"
                >
                  {expandedNotes.has(event.id) ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  Notes
                </button>
                <button onClick={() => deleteEvent(event.id)} className="ml-auto text-gray-300 hover:text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {expandedNotes.has(event.id) && (
                <textarea
                  value={event.notes}
                  onChange={(e) => updateEvent(event.id, { notes: e.target.value })}
                  placeholder="Add notes..."
                  className="mt-2 w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#e97325] resize-y min-h-[60px]"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // =========================================================================
  // TAB 2: NETWORK
  // =========================================================================

  const NetworkTab = () => {
    const contacts = data.contacts;
    const totalContacts = contacts.length;
    const bookedEvents = contacts.filter((c) => c.status === "booked").length;
    const pendingFollowUp = contacts.filter((c) => c.followUpDate && c.status !== "recurring").length;
    const recurringPartners = contacts.filter((c) => c.status === "recurring").length;

    const addContact = (fd: FormData) => {
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
      setShowContactForm(false);
    };

    return (
      <div>
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total Contacts" value={totalContacts} />
          <StatCard label="Booked Events" value={bookedEvents} color="text-green-600" />
          <StatCard label="Pending Follow-Up" value={pendingFollowUp} color="text-yellow-600" />
          <StatCard label="Recurring Partners" value={recurringPartners} color="text-blue-600" />
        </div>

        {/* Add button */}
        <button onClick={() => setShowContactForm(!showContactForm)} className={`${btnPrimary} mb-4 inline-flex items-center gap-2`}>
          <Plus className="w-4 h-4" /> New Contact
        </button>

        {/* Inline form */}
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
            const initials = contact.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            return (
              <div key={contact.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
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

                  {/* Status badge */}
                  <button
                    onClick={() => updateContact(contact.id, { status: nextStatus(contact.status, CONTACT_STATUSES) })}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold text-white ${statusColor(contact.status)} hover:opacity-80 transition-opacity cursor-pointer shrink-0`}
                    title="Click to advance status"
                  >
                    {statusLabel(contact.status)}
                  </button>
                </div>

                {/* Contact details row */}
                <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-500">
                  {contact.phone && (
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{contact.phone}</span>
                  )}
                  {contact.email && (
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{contact.email}</span>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span className="text-[10px] font-bold text-gray-400 mr-1">Follow-up:</span>
                    <input
                      type="date"
                      value={contact.followUpDate}
                      onChange={(e) => updateContact(contact.id, { followUpDate: e.target.value })}
                      className="text-xs bg-transparent border-b border-gray-200 focus:border-[#e97325] focus:outline-none py-0.5"
                    />
                  </div>
                </div>

                {/* Notes + actions */}
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => toggleNotes(contact.id)}
                    className="text-xs text-gray-400 hover:text-gray-600 font-bold flex items-center gap-1"
                  >
                    {expandedNotes.has(contact.id) ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    Notes
                  </button>
                  <button onClick={() => deleteContact(contact.id)} className="ml-auto text-gray-300 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {expandedNotes.has(contact.id) && (
                  <textarea
                    value={contact.notes}
                    onChange={(e) => updateContact(contact.id, { notes: e.target.value })}
                    placeholder="Add notes..."
                    className="mt-2 w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#e97325] resize-y min-h-[60px]"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // =========================================================================
  // TAB 3: VENDORS
  // =========================================================================

  const VendorsTab = () => {
    const vendors = data.vendors;
    const totalVendors = vendors.length;
    const referralsSent = vendors.reduce((s, v) => s + v.referralsSent, 0);
    const referralsReceived = vendors.reduce((s, v) => s + v.referralsReceived, 0);
    const activePartners = vendors.filter((v) => v.status === "active").length;

    const addVendor = (fd: FormData) => {
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
      setShowVendorForm(false);
    };

    return (
      <div>
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total Vendors" value={totalVendors} />
          <StatCard label="Referrals Sent" value={referralsSent} color="text-[#e97325]" />
          <StatCard label="Referrals Received" value={referralsReceived} color="text-green-600" />
          <StatCard label="Active Partners" value={activePartners} color="text-blue-600" />
        </div>

        {/* Add button */}
        <button onClick={() => setShowVendorForm(!showVendorForm)} className={`${btnPrimary} mb-4 inline-flex items-center gap-2`}>
          <Plus className="w-4 h-4" /> New Vendor
        </button>

        {/* Inline form */}
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
            const initials = vendor.company
              .split(" ")
              .slice(0, 2)
              .map((n) => n[0])
              .join("")
              .toUpperCase();

            return (
              <div key={vendor.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
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

                  {/* Status badge */}
                  <button
                    onClick={() => updateVendor(vendor.id, { status: nextStatus(vendor.status, VENDOR_STATUSES) })}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold text-white ${statusColor(vendor.status)} hover:opacity-80 transition-opacity cursor-pointer shrink-0`}
                    title="Click to advance status"
                  >
                    {statusLabel(vendor.status)}
                  </button>
                </div>

                {/* Referrals row */}
                <div className="flex flex-wrap items-center gap-4 mt-3">
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Sent</label>
                    <input
                      type="number" min={0} value={vendor.referralsSent}
                      onChange={(e) => updateVendor(vendor.id, { referralsSent: parseInt(e.target.value) || 0 })}
                      className="w-16 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-center focus:outline-none focus:border-[#e97325]"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Received</label>
                    <input
                      type="number" min={0} value={vendor.referralsReceived}
                      onChange={(e) => updateVendor(vendor.id, { referralsReceived: parseInt(e.target.value) || 0 })}
                      className="w-16 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-center focus:outline-none focus:border-[#e97325]"
                    />
                  </div>
                  {vendor.phone && (
                    <span className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" />{vendor.phone}</span>
                  )}
                  {vendor.email && (
                    <span className="text-xs text-gray-500 flex items-center gap-1"><Mail className="w-3 h-3" />{vendor.email}</span>
                  )}
                </div>

                {/* Notes + actions */}
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => toggleNotes(vendor.id)}
                    className="text-xs text-gray-400 hover:text-gray-600 font-bold flex items-center gap-1"
                  >
                    {expandedNotes.has(vendor.id) ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    Notes
                  </button>
                  <button onClick={() => deleteVendor(vendor.id)} className="ml-auto text-gray-300 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {expandedNotes.has(vendor.id) && (
                  <textarea
                    value={vendor.notes}
                    onChange={(e) => updateVendor(vendor.id, { notes: e.target.value })}
                    placeholder="Add notes..."
                    className="mt-2 w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#e97325] resize-y min-h-[60px]"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // =========================================================================
  // TAB 4: OUTREACH
  // =========================================================================

  const OutreachTab = () => {
    const allOutreach = data.outreach;
    const filtered = outreachFilter === "All"
      ? allOutreach
      : allOutreach.filter((o) => o.type.toLowerCase() === outreachFilter.toLowerCase());

    const totalOpps = allOutreach.length;
    const contacted = allOutreach.filter((o) => o.status === "contacted" || o.status === "booked" || o.status === "completed").length;
    const booked = allOutreach.filter((o) => o.status === "booked" || o.status === "completed").length;
    const convPct = contacted > 0 ? Math.round((booked / contacted) * 100) : 0;

    const addOutreach = (fd: FormData) => {
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
      setShowOutreachForm(false);
    };

    const filterOptions = ["All", "Market", "Gym", "Health Fair", "Corporate", "Other"];

    return (
      <div>
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total Opportunities" value={totalOpps} />
          <StatCard label="Contacted" value={contacted} color="text-blue-600" />
          <StatCard label="Booked" value={booked} color="text-green-600" />
          <StatCard label="Conversion %" value={totalOpps > 0 ? `${convPct}%` : "--"} color="text-[#e97325]" />
        </div>

        {/* Add button */}
        <button onClick={() => setShowOutreachForm(!showOutreachForm)} className={`${btnPrimary} mb-4 inline-flex items-center gap-2`}>
          <Plus className="w-4 h-4" /> Add Opportunity
        </button>

        {/* Inline form */}
        {showOutreachForm && (
          <form
            onSubmit={(e) => { e.preventDefault(); addOutreach(new FormData(e.currentTarget)); }}
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
                outreachFilter === f
                  ? "bg-[#e97325] text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {f === "Health Fair" ? "Health Fairs" : f === "Market" ? "Markets" : f === "Gym" ? "Gyms" : f}
            </button>
          ))}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Search className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-400">No opportunities yet</p>
            <p className="text-xs text-gray-300 mt-1">Add your first outreach opportunity to start filling your calendar!</p>
          </div>
        )}

        {/* Outreach cards */}
        <div className="space-y-3">
          {filtered.map((opp) => (
            <div key={opp.id} className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 border-l-4 ${statusBorder(opp.status)}`}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-[#1a2744] truncate">{opp.name}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-bold uppercase">{opp.type}</span>
                    {opp.date && <span className="text-xs text-gray-500">{opp.date}</span>}
                  </div>
                </div>

                <button
                  onClick={() => updateOutreach(opp.id, { status: nextStatus(opp.status, OUTREACH_STATUSES) })}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold text-white ${statusColor(opp.status)} hover:opacity-80 transition-opacity cursor-pointer shrink-0`}
                  title="Click to advance status"
                >
                  {statusLabel(opp.status)}
                </button>
              </div>

              {/* Contact info */}
              {opp.contactInfo && (
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <Phone className="w-3 h-3" />{opp.contactInfo}
                </p>
              )}

              {/* Notes + delete */}
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => toggleNotes(opp.id)}
                  className="text-xs text-gray-400 hover:text-gray-600 font-bold flex items-center gap-1"
                >
                  {expandedNotes.has(opp.id) ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  Notes
                </button>
                <button onClick={() => deleteOutreach(opp.id)} className="ml-auto text-gray-300 hover:text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {expandedNotes.has(opp.id) && (
                <textarea
                  value={opp.notes}
                  onChange={(e) => updateOutreach(opp.id, { notes: e.target.value })}
                  placeholder="Add notes..."
                  className="mt-2 w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#e97325] resize-y min-h-[60px]"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // =========================================================================
  // TABS CONFIG
  // =========================================================================

  const tabs: { key: TabKey; label: string }[] = [
    { key: "events", label: "Events" },
    { key: "network", label: "Network" },
    { key: "vendors", label: "Vendors" },
    { key: "outreach", label: "Outreach" },
  ];

  // =========================================================================
  // MAIN RENDER
  // =========================================================================

  return (
    <div className="max-w-4xl mx-auto pb-32 md:pb-8">
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
      <div className="flex border-b border-gray-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 text-center py-3 text-sm font-bold transition-all ${
              activeTab === tab.key
                ? "text-[#e97325] border-b-2 border-[#e97325]"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "events" && EventsTab()}
      {activeTab === "network" && NetworkTab()}
      {activeTab === "vendors" && VendorsTab()}
      {activeTab === "outreach" && OutreachTab()}
    </div>
  );
}
