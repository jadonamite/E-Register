"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { LogoutButton } from "@/components/LogoutButton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  TreeStructure,
  IdentificationBadge,
  Plus,
  Trash,
  Key,
  ToggleLeft,
  ToggleRight,
  UsersThree,
  Users,
  User,
} from "@phosphor-icons/react";

type Group = { _id: string; name: string; level: "TEAM" | "SENIOR_CELL" | "CELL"; parentId: string | null };
type Marker = { _id: string; name: string; active: boolean };

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="text-[11px] font-black text-zinc-500 uppercase ml-1 tracking-widest">{children}</label>
);

const field =
  "h-12 px-5 rounded-2xl border border-zinc-200 bg-white text-sm font-bold text-zinc-900 outline-none focus:border-zinc-900 focus:ring-4 focus:ring-zinc-100 transition-all shadow-sm w-full";

/* ------------------------------------------------------------------ */
/* Structure tab                                                       */
/* ------------------------------------------------------------------ */

function StructureTab() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [teamName, setTeamName] = useState("");
  const [scName, setScName] = useState("");
  const [scParent, setScParent] = useState("");
  const [cellName, setCellName] = useState("");
  const [cellParent, setCellParent] = useState("");

  const load = () =>
    fetch("/api/groups").then((r) => r.json()).then(setGroups).catch(() => toast.error("Failed to load structure"));

  useEffect(() => {
    load();
  }, []);

  const teams = useMemo(() => groups.filter((g) => g.level === "TEAM"), [groups]);
  const seniorCells = useMemo(() => groups.filter((g) => g.level === "SENIOR_CELL"), [groups]);
  const cells = useMemo(() => groups.filter((g) => g.level === "CELL"), [groups]);

  const create = async (name: string, level: Group["level"], parentId: string | null, reset: () => void) => {
    if (!name.trim()) return toast.error("Enter a name");
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, level, parentId }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "" }));
        return toast.error(error || "Failed to create");
      }
      toast.success(`${name} added`);
      reset();
      load();
    } catch {
      toast.error("Network error");
    }
  };

  const remove = async (g: Group) => {
    try {
      const res = await fetch("/api/groups", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: g._id }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "" }));
        return toast.error(error || "Failed to delete");
      }
      toast.info(`${g.name} removed`);
      load();
    } catch {
      toast.error("Network error");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
      {/* Builders */}
      <div className="lg:col-span-2 space-y-5">
        {/* Team */}
        <div className="bento-card p-6 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <UsersThree size={20} weight="duotone" className="text-indigo-500" />
            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900">New Team</h3>
          </div>
          <Label>Team name</Label>
          <input className={field} value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="The Winning Team" />
          <button
            onClick={() => create(teamName, "TEAM", null, () => setTeamName(""))}
            className="w-full h-11 rounded-2xl bg-zinc-900 text-white text-xs font-black uppercase tracking-widest hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Plus size={16} weight="bold" /> Add Team
          </button>
        </div>

        {/* Senior Cell */}
        <div className="bento-card p-6 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Users size={20} weight="duotone" className="text-emerald-500" />
            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900">New Senior Cell</h3>
          </div>
          <Label>Under team</Label>
          <select className={field} value={scParent} onChange={(e) => setScParent(e.target.value)}>
            <option value="">Select team…</option>
            {teams.map((t) => (
              <option key={t._id} value={t._id}>{t.name}</option>
            ))}
          </select>
          <Label>Senior cell name</Label>
          <input className={field} value={scName} onChange={(e) => setScName(e.target.value)} placeholder="Harvesters" />
          <button
            onClick={() => {
              if (!scParent) return toast.error("Pick a team first");
              create(scName, "SENIOR_CELL", scParent, () => setScName(""));
            }}
            className="w-full h-11 rounded-2xl bg-zinc-900 text-white text-xs font-black uppercase tracking-widest hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Plus size={16} weight="bold" /> Add Senior Cell
          </button>
        </div>

        {/* Cell */}
        <div className="bento-card p-6 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <User size={20} weight="duotone" className="text-pink-500" />
            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900">New Cell</h3>
          </div>
          <Label>Under senior cell</Label>
          <select className={field} value={cellParent} onChange={(e) => setCellParent(e.target.value)}>
            <option value="">Select senior cell…</option>
            {seniorCells.map((sc) => (
              <option key={sc._id} value={sc._id}>{sc.name}</option>
            ))}
          </select>
          <Label>Cell name</Label>
          <input className={field} value={cellName} onChange={(e) => setCellName(e.target.value)} placeholder="Marvelous" />
          <button
            onClick={() => {
              if (!cellParent) return toast.error("Pick a senior cell first");
              create(cellName, "CELL", cellParent, () => setCellName(""));
            }}
            className="w-full h-11 rounded-2xl bg-zinc-900 text-white text-xs font-black uppercase tracking-widest hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Plus size={16} weight="bold" /> Add Cell
          </button>
        </div>
      </div>

      {/* Tree */}
      <div className="lg:col-span-3 bento-card p-8">
        <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-6">Structure</h3>
        {teams.length === 0 && (
          <p className="text-center py-16 text-sm font-black uppercase tracking-[0.3em] opacity-20">No teams yet</p>
        )}
        <div className="space-y-6">
          {teams.map((team) => (
            <div key={team._id}>
              <Row label={team.name} tint="indigo" onDelete={() => remove(team)} />
              <div className="ml-5 border-l-2 border-zinc-100 pl-4 mt-2 space-y-2">
                {seniorCells.filter((sc) => sc.parentId === team._id).map((sc) => (
                  <div key={sc._id}>
                    <Row label={sc.name} tint="emerald" small onDelete={() => remove(sc)} />
                    <div className="ml-5 border-l-2 border-zinc-100 pl-4 mt-1.5 space-y-1.5">
                      {cells.filter((c) => c.parentId === sc._id).map((c) => (
                        <Row key={c._id} label={c.name} tint="pink" small onDelete={() => remove(c)} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  tint,
  small,
  onDelete,
}: {
  label: string;
  tint: "indigo" | "emerald" | "pink";
  small?: boolean;
  onDelete: () => void;
}) {
  const dot = { indigo: "bg-indigo-400", emerald: "bg-emerald-400", pink: "bg-pink-400" }[tint];
  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-2.5">
        <span className={`w-2 h-2 rounded-full ${dot}`} />
        <span className={`font-black tracking-tight text-stone-900 ${small ? "text-sm" : "text-base"}`}>{label}</span>
      </div>
      <button
        onClick={onDelete}
        className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-300 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 transition-all"
      >
        <Trash size={15} weight="bold" />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Markers tab                                                         */
/* ------------------------------------------------------------------ */

function MarkersTab() {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");

  const load = () =>
    fetch("/api/markers").then((r) => r.json()).then(setMarkers).catch(() => toast.error("Failed to load markers"));

  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    if (!name.trim()) return toast.error("Enter a name");
    if (!/^\d{4,6}$/.test(pin)) return toast.error("PIN must be 4–6 digits");
    try {
      const res = await fetch("/api/markers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, pin }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "" }));
        return toast.error(error || "Failed to add marker");
      }
      toast.success(`${name} registered`);
      setName("");
      setPin("");
      load();
    } catch {
      toast.error("Network error");
    }
  };

  const patch = async (m: Marker, body: Record<string, unknown>, ok: string) => {
    try {
      const res = await fetch("/api/markers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: m._id, ...body }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "" }));
        return toast.error(error || "Failed");
      }
      toast.success(ok);
      load();
    } catch {
      toast.error("Network error");
    }
  };

  const resetPin = (m: Marker) => {
    const next = window.prompt(`New 4–6 digit PIN for ${m.name}`);
    if (next === null) return;
    if (!/^\d{4,6}$/.test(next)) return toast.error("PIN must be 4–6 digits");
    patch(m, { pin: next }, `${m.name}'s PIN reset`);
  };

  const remove = async (m: Marker) => {
    if (!window.confirm(`Remove ${m.name}?`)) return;
    try {
      const res = await fetch("/api/markers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: m._id }),
      });
      if (!res.ok) return toast.error("Failed to delete");
      toast.info(`${m.name} removed`);
      load();
    } catch {
      toast.error("Network error");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
      {/* Add */}
      <div className="lg:col-span-2 bento-card p-6 space-y-3 h-fit">
        <div className="flex items-center gap-2 mb-1">
          <IdentificationBadge size={20} weight="duotone" className="text-zinc-700" />
          <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900">New Marker</h3>
        </div>
        <Label>Full name</Label>
        <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="David Olatunji" />
        <Label>Initial PIN (4–6 digits)</Label>
        <input
          className={field}
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="••••"
        />
        <button
          onClick={add}
          className="w-full h-11 rounded-2xl bg-zinc-900 text-white text-xs font-black uppercase tracking-widest hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <Plus size={16} weight="bold" /> Register Marker
        </button>
      </div>

      {/* List */}
      <div className="lg:col-span-3 space-y-3">
        {markers.length === 0 && (
          <div className="bento-card p-8 text-center text-sm font-black uppercase tracking-[0.3em] opacity-20">
            No markers registered
          </div>
        )}
        <AnimatePresence>
          {markers.map((m) => (
            <motion.div
              key={m._id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center justify-between p-5 bg-white border border-zinc-100 rounded-[2rem] shadow-sm group"
            >
              <div className="flex items-center gap-3">
                <span className={`w-2.5 h-2.5 rounded-full ${m.active ? "bg-emerald-400" : "bg-zinc-300"}`} />
                <div className="flex flex-col">
                  <span className="font-black tracking-tight text-stone-900">{m.name}</span>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${m.active ? "text-emerald-600" : "text-zinc-400"}`}>
                    {m.active ? "Active" : "Disabled"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => patch(m, { active: !m.active }, m.active ? `${m.name} disabled` : `${m.name} enabled`)}
                  title={m.active ? "Disable" : "Enable"}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-all"
                >
                  {m.active ? <ToggleRight size={22} weight="fill" className="text-emerald-500" /> : <ToggleLeft size={22} weight="bold" />}
                </button>
                <button
                  onClick={() => resetPin(m)}
                  title="Reset PIN"
                  className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-400 hover:text-amber-600 hover:bg-amber-50 transition-all"
                >
                  <Key size={17} weight="bold" />
                </button>
                <button
                  onClick={() => remove(m)}
                  title="Remove"
                  className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-all"
                >
                  <Trash size={16} weight="bold" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-[#FDFBFC] p-6 md:p-12 font-sans max-w-[1400px] mx-auto">
      <header className="flex flex-col lg:flex-row justify-between items-center gap-6 mb-12">
        <Logo />
        <LogoutButton />
      </header>

      <div className="mb-10">
        <h1 className="text-5xl font-black tracking-tighter text-stone-900">Admin</h1>
        <p className="text-xs font-bold uppercase tracking-[0.4em] opacity-40 mt-2">Structure &amp; Protocol Staff</p>
      </div>

      <Tabs defaultValue="structure" className="w-full">
        <TabsList className="bg-zinc-100 p-1.5 rounded-2xl mb-8">
          <TabsTrigger
            value="structure"
            className="rounded-xl px-6 py-2.5 text-[11px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-black text-zinc-400 flex items-center gap-2"
          >
            <TreeStructure size={16} weight="bold" /> Structure
          </TabsTrigger>
          <TabsTrigger
            value="markers"
            className="rounded-xl px-6 py-2.5 text-[11px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-black text-zinc-400 flex items-center gap-2"
          >
            <IdentificationBadge size={16} weight="bold" /> Markers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="structure">
          <StructureTab />
        </TabsContent>
        <TabsContent value="markers">
          <MarkersTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
