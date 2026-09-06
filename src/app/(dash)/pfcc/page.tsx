"use client";

import { useState, useEffect } from "react";
import { Logo } from "@/components/Logo";
import { MemberList } from "@/components/MemberList";
import { ProgramList } from "@/components/ProgramList";
import { AddMemberModal } from "@/components/AddMemberModal";
import { useMembers } from "@/hooks/use-members";
import { useProgramRoster } from "@/hooks/use-program-roster";
import { MagnifyingGlass, Pulse, CalendarBlank, Plus, X } from "@phosphor-icons/react";
import { format } from "date-fns";
import { MarkerBar } from "@/components/MarkerBar";
import { SyncPill } from "@/components/SyncPill";
import { serviceMatchesDate, serviceDayName, type SundaySession } from "@/lib/service-schedule";
import { ServiceInitModal, ServiceSummaryStrip } from "@/components/ServiceInitModal";

type ProgramTab = { id: string; name: string; serviceLabel: string };

// The program tabs are the only door to the cached program roster: with no
// tabs there is no program to select, so an offline cold boot would strand a
// perfectly good IndexedDB roster behind an empty tab bar. /api/* is never
// service-worker cached, so the list is mirrored here instead. Small and
// non-sensitive (id + label), so localStorage is enough.
const PROGRAMS_KEY = "eregister-programs";

function loadCachedPrograms(): ProgramTab[] {
  try {
    const raw = localStorage.getItem(PROGRAMS_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCachedPrograms(programs: ProgramTab[]): void {
  try {
    localStorage.setItem(PROGRAMS_KEY, JSON.stringify(programs));
  } catch {
    // storage unavailable — non-fatal
  }
}

export default function PFCCDashboard() {
  const [service, setService] = useState("Sunday");
  const [activeProgram, setActiveProgram] = useState<ProgramTab | null>(null);
  const [programs, setPrograms] = useState<ProgramTab[]>([]);
  const [date, setDate] = useState<Date>(new Date());
  const [canMark, setCanMark] = useState(false);

  const [filterType, setFilterType] = useState<"all" | "team" | "seniorCell" | "cell">("all");
  const [filterValue, setFilterValue] = useState<string>("");

  const [editingMember, setEditingMember] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Name seeded from a search that returned nobody; cleared on every other open.
  const [prefillName, setPrefillName] = useState("");

  // Program tabs render beside Sunday/Mid-Week; each active program is a button.
  // Cached list first so the tabs (and the roster behind them) survive an
  // offline boot; the network answer then replaces it.
  useEffect(() => {
    // Must be an effect, not a lazy initialiser: localStorage doesn't exist
    // during SSR, and seeding state from it on the client alone would
    // hydration-mismatch the empty server render.
    const cached = loadCachedPrograms();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (cached.length) setPrograms(cached);

    fetch("/api/programs")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!Array.isArray(data)) return;
        setPrograms(data);
        saveCachedPrograms(data);
      })
      .catch(() => {
        // Offline — keep whatever was cached.
      });
  }, []);

  const inProgram = !!activeProgram;

  const {
    signedInIds,
    searchQuery,
    setSearchQuery,
    addMember,
    updateMember,
    deleteMember,
    markPresent,
    getUniqueLevels,
    filterByHierarchy,
    online,
    pending,
    syncing,
    authExpired,
    syncNow,
    memberNames
  } = useMembers(service, date);

  const program = useProgramRoster(activeProgram?.id ?? null, date);

  const displayMembers = filterByHierarchy(filterType, filterValue);

  const handleEditInitiated = (member: any) => {
    setEditingMember(member);
    setPrefillName("");
    setIsModalOpen(true);
  };

  const handleAddNew = (name = "") => {
    setEditingMember(null);
    setPrefillName(name);
    setIsModalOpen(true);
  };

  const handlePromote = (member: any) => {
    setEditingMember({ ...member, status: "Member" });
    setPrefillName("");
    setIsModalOpen(true);
  };

  const filterOptions = {
    team: getUniqueLevels("team"),
    seniorCell: getUniqueLevels("seniorCell"),
    cell: getUniqueLevels("cell"),
  };

  const liveCount = inProgram ? program.presentCount : signedInIds.length;
  const wrongDay = !inProgram && !serviceMatchesDate(service, date);

  const isSunday = !inProgram && service === "Sunday" && !wrongDay;
  const isoDate = format(date, "yyyy-MM-dd");
  const [sundaySession, setSundaySession] = useState<SundaySession | null>(null);
  const [sundayLoaded, setSundayLoaded] = useState(false);
  const [editingSession, setEditingSession] = useState(false);
  const [initDismissed, setInitDismissed] = useState(false);

  useEffect(() => {
    if (!isSunday) return;
    setSundayLoaded(false);
    setInitDismissed(false);
    fetch(`/api/service-sessions?date=${isoDate}`)
      .then((r) => (r.ok ? r.json() : { session: null }))
      .then((data) => setSundaySession(data.session ?? null))
      .catch(() => setSundaySession(null))
      .finally(() => setSundayLoaded(true));
  }, [isSunday, isoDate]);

  // The page's bottom padding clears the floating add button so it can never
  // sit on top of the last row's mark button.
  return (
    <div className="min-h-screen bg-[#FDFBFC] p-6 pb-32 md:p-12 md:pb-40 font-unio max-w-[1600px] mx-auto relative z-0">
      <header className="flex flex-col lg:flex-row justify-between items-center gap-6 lg:gap-8 mb-10 lg:mb-12">
        <Logo />

        <div className="flex flex-wrap items-center justify-center gap-3 w-full lg:w-auto">
          <SyncPill
            online={online}
            pending={pending + program.pending}
            syncing={syncing || program.syncing}
            authExpired={authExpired || program.authExpired}
            onSync={() => {
              syncNow();
              program.syncNow();
            }}
          />
          <div className="relative group flex-1 min-w-[150px] lg:flex-none">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <CalendarBlank size={18} className="text-stone-400" />
            </div>
            <input
              type="date"
              value={format(date, "yyyy-MM-dd")}
              onChange={(e) => setDate(new Date(e.target.value))}
              className="w-full pl-12 pr-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm font-bold text-stone-700 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none shadow-sm hover:border-stone-300 transition-all uppercase tracking-wider cursor-pointer"
            />
          </div>

          <div className="bg-zinc-100 p-1.5 rounded-xl flex gap-1 flex-wrap justify-center">
            {["Sunday", "Mid-Week"].map((s) => {
              const active = !inProgram && service === s;
              return (
                <button
                  key={s}
                  onClick={() => {
                    setActiveProgram(null);
                    setService(s);
                  }}
                  className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                    active ? "bg-white text-black shadow-sm" : "text-stone-400 hover:text-stone-600"
                  }`}
                >
                  {s}
                </button>
              );
            })}
            {programs.map((p) => {
              const active = activeProgram?.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setActiveProgram(p)}
                  className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                    active
                      ? "bg-stone-900 text-white shadow-sm"
                      : "text-stone-400 hover:text-stone-600"
                  }`}
                >
                  {p.serviceLabel}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        <div className="lg:col-span-8">
          <div className="mb-8">
            <MarkerBar onIdentityChange={(mark) => setCanMark(mark)} />
          </div>
          <div className="flex flex-col gap-8 mb-10">
            <div>
              <h1 className="text-4xl sm:text-6xl font-black tracking-tighter text-stone-900">
                {inProgram ? activeProgram!.name : "Attendance"}
              </h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 opacity-40">
                <span className="text-xs font-bold uppercase tracking-[0.4em]">
                  {inProgram ? "Program" : `${service} Session`}
                </span>
                <span className="w-1 h-1 bg-black rounded-full" />
                <span className="text-xs font-bold uppercase tracking-[0.2em]">{format(date, "MMMM d, yyyy")}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="relative w-full max-w-2xl group">
                <MagnifyingGlass className="absolute left-6 top-1/2 -translate-y-1/2 opacity-20" size={24} />
                <input
                  placeholder={inProgram ? "Search invitees, members or walk-ins…" : "Search name, phone or cell..."}
                  value={inProgram ? program.searchQuery : searchQuery}
                  onChange={(e) =>
                    inProgram ? program.setSearchQuery(e.target.value) : setSearchQuery(e.target.value)
                  }
                  className="h-16 w-full pl-16 bg-white border border-zinc-100 rounded-3xl font-medium text-lg focus:border-stone-300 focus:ring-4 focus:ring-stone-100 outline-none shadow-sm transition-all text-stone-800 placeholder:text-stone-300"
                />
              </div>

              {/* Hierarchy Filters — members only */}
              {!inProgram && (
                <div className="space-y-3">
                  <div className="bg-zinc-100 p-1.5 rounded-full flex gap-1 w-fit max-w-full overflow-x-auto">
                    {([
                      ["all", "Everyone"],
                      ["team", "Team"],
                      ["seniorCell", "Senior Cell"],
                      ["cell", "Cell"],
                    ] as const).map(([type, label]) => (
                      <button
                        key={type}
                        onClick={() => {
                          setFilterType(type);
                          setFilterValue("");
                        }}
                        className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                          filterType === type
                            ? "bg-white text-black shadow-sm"
                            : "text-stone-400 hover:text-stone-600"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {filterType !== "all" && (
                    <div className="flex gap-2 overflow-x-auto pb-1 -mb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {filterOptions[filterType as keyof typeof filterOptions].map((option) => {
                        const selected = filterValue === option;
                        return (
                          <button
                            key={option}
                            onClick={() => setFilterValue(selected ? "" : option)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${
                              selected
                                ? "bg-stone-900 text-white border-stone-900 shadow-lg shadow-stone-900/10"
                                : "bg-white text-stone-500 border-zinc-200 hover:border-stone-300 hover:text-stone-800"
                            }`}
                          >
                            {option}
                            {selected && <X size={12} weight="bold" className="opacity-60" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {wrongDay && (
            <div className="mb-6 flex items-center gap-3 px-5 py-4 bg-amber-50 border border-amber-200 rounded-2xl">
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
              <p className="text-xs font-bold text-amber-800 tracking-tight">
                {service} attendance can only be marked on a {serviceDayName(service)}. Pick a {serviceDayName(service)} to mark.
              </p>
            </div>
          )}

          {isSunday && sundayLoaded && sundaySession && (
            <ServiceSummaryStrip session={sundaySession} onEdit={() => setEditingSession(true)} />
          )}

          {isSunday && sundayLoaded && sundaySession === null && canMark && initDismissed && (
            <div className="mb-6 flex items-center justify-between gap-3 px-5 py-4 bg-amber-50 border border-amber-200 rounded-2xl">
              <p className="text-xs font-bold text-amber-800 tracking-tight">
                This Sunday's service isn't set up yet.
              </p>
              <button
                onClick={() => setInitDismissed(false)}
                className="text-[10px] font-black uppercase tracking-widest text-amber-700/70 hover:text-amber-900 transition-colors shrink-0"
              >
                Set up now
              </button>
            </div>
          )}

          {isSunday &&
            sundayLoaded &&
            ((sundaySession === null && canMark && !initDismissed) || editingSession) && (
              <ServiceInitModal
                isoDate={isoDate}
                existingSession={editingSession ? sundaySession : null}
                canInitialize={canMark}
                onSaved={(session) => {
                  setSundaySession(session);
                  setEditingSession(false);
                }}
                onDismiss={() => {
                  setEditingSession(false);
                  setInitDismissed(true);
                }}
              />
            )}

          {inProgram ? (
            <ProgramList
              rows={program.rows}
              canMark={canMark}
              loading={program.loading}
              memberNames={memberNames}
              onMark={program.markPresent}
              onAddWalkin={program.addWalkin}
            />
          ) : (
            <MemberList
              members={displayMembers}
              signedInIds={signedInIds}
              onMarkPresent={markPresent}
              onEdit={handleEditInitiated}
              onPromote={handlePromote}
              canMark={canMark}
              searchQuery={searchQuery}
              onAddNew={handleAddNew}
              sundaySession={isSunday ? sundaySession : null}
            />
          )}
        </div>

        <div className="lg:col-span-4 order-first lg:order-none">
          <div className="lg:sticky lg:top-12 space-y-8 z-10">
            <div className="bg-stone-900 text-white p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[3rem] flex flex-col items-center text-center shadow-2xl border border-white/5 relative overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-stone-800 to-stone-900 -z-10" />

              <Pulse size={32} className="text-emerald-400 mb-4 animate-pulse" />
              <span className="text-[10px] font-black opacity-40 uppercase tracking-[0.5em] mb-2">
                {inProgram ? "Checked In" : "Live Count"}
              </span>
              <span className="text-7xl sm:text-9xl font-black tracking-tighter leading-none">{liveCount}</span>

              <div className="mt-8 px-4 py-2 bg-white/5 rounded-full border border-white/5">
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-60">
                  {inProgram ? `${activeProgram!.name} · ${program.total} on roster` : `${format(date, "MMM do")} Record`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 right-6 sm:bottom-12 sm:right-12 z-50">
        <AddMemberModal
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
          initialData={editingMember}
          prefillName={prefillName}
          onAdd={async (data) => {
            if (editingMember) {
              await updateMember(data);
            } else {
              await addMember(data);
            }
          }}
          onDelete={deleteMember}
        />

        {/* Hidden while a search is running: the button is anchored in the same
            bottom-right gutter as each row's mark button, and a search narrows
            the list to a handful of rows that land right under it. During a
            search the add path is the "no match" button inside the list. */}
        {!isModalOpen && canMark && !inProgram && !searchQuery.trim() && (
          <button
            onClick={() => handleAddNew()}
            className="w-20 h-20 rounded-full bg-black text-white flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:scale-110 active:scale-90 transition-all"
          >
            <Plus size={36} weight="bold" />
          </button>
        )}
      </div>
    </div>
  );
}
