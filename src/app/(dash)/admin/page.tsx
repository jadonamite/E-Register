"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { LogoutButton } from "@/components/LogoutButton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useConfirm } from "@/components/ui/confirm";
import { cn } from "@/lib/utils";
import { AttendanceSettings } from "@/components/exec/AttendanceSettings";
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
  CaretDown,
  Check,
  PencilSimple,
  ArrowFatUp,
  X,
  Clock,
  DownloadSimple,
} from "@phosphor-icons/react";

type HierarchyLevel = "ZONE" | "GROUP" | "CHAPTER" | "PCF" | "TEAM" | "SENIOR_CELL" | "CELL";
type HierarchyNode = { _id: string; name: string; level: HierarchyLevel; parentId: string | null; code?: string | null };
type Marker = { _id: string; name: string; active: boolean };

// Top-to-bottom order of the chain, with the display label + accent color for
// each tier's rows and create-form.
const LEVEL_CONFIG: { level: HierarchyLevel; label: string; parentLevel: HierarchyLevel | null; dot: string }[] = [
  { level: "ZONE", label: "Zone", parentLevel: null, dot: "bg-violet-400" },
  { level: "GROUP", label: "Group", parentLevel: "ZONE", dot: "bg-blue-400" },
  { level: "CHAPTER", label: "Chapter", parentLevel: "GROUP", dot: "bg-cyan-400" },
  { level: "PCF", label: "PCF", parentLevel: "CHAPTER", dot: "bg-teal-400" },
  { level: "TEAM", label: "Team", parentLevel: "PCF", dot: "bg-indigo-400" },
  { level: "SENIOR_CELL", label: "Senior Cell", parentLevel: "TEAM", dot: "bg-emerald-400" },
  { level: "CELL", label: "Cell", parentLevel: "SENIOR_CELL", dot: "bg-pink-400" },
];

/* ---- shared premium primitives (match pfcc / exec aesthetic) ---- */

const inputCls =
  "h-12 rounded-2xl border-zinc-200 bg-white text-sm font-semibold text-zinc-900 shadow-sm focus-visible:border-zinc-900 focus-visible:ring-4 focus-visible:ring-zinc-100 placeholder:text-zinc-300 px-4";

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="text-[11px] font-black text-zinc-500 uppercase ml-1 tracking-widest">{children}</label>
);

const AddButton = ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => (
  <Button
    onClick={onClick}
    className="w-full h-12 rounded-2xl bg-zinc-950 text-white text-[11px] font-black uppercase tracking-widest hover:bg-black active:scale-[0.98] transition-all shadow-lg"
  >
    <Plus size={16} weight="bold" /> {children}
  </Button>
);

/** Motion combobox — replaces native <select> to match the app's dropdowns. */
function Picker({
  value,
  options,
  placeholder,
  onSelect,
}: {
  value: string;
  options: { id: string; name: string }[];
  placeholder: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.id === value);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="w-full h-12 px-4 rounded-2xl border border-zinc-200 bg-white text-left text-sm font-semibold text-zinc-900 shadow-sm flex items-center justify-between hover:border-zinc-300 focus:border-zinc-900 focus:ring-4 focus:ring-zinc-100 outline-none transition-all"
      >
        {selected ? selected.name : <span className="text-zinc-300 font-medium">{placeholder}</span>}
        <CaretDown size={16} className={cn("text-zinc-400 transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute top-[calc(100%+6px)] left-0 w-full bg-white rounded-2xl shadow-2xl z-[100] border border-zinc-100 py-2 max-h-[220px] overflow-y-auto"
          >
            {options.length === 0 && (
              <p className="px-4 py-3 text-xs font-bold text-zinc-400">Nothing to choose yet</p>
            )}
            {options.map((o) => (
              <button
                key={o.id}
                onClick={() => {
                  onSelect(o.id);
                  setOpen(false);
                }}
                className="w-full px-4 py-2.5 text-left text-sm font-bold text-zinc-700 hover:bg-zinc-50 flex items-center justify-between"
              >
                {o.name}
                {value === o.id && <Check weight="bold" className="text-emerald-500" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Structure tab                                                       */
/* ------------------------------------------------------------------ */

function StructureTab() {
  const confirm = useConfirm();
  const [nodes, setNodes] = useState<HierarchyNode[]>([]);
  // One name + parent draft per level, keyed by level.
  const [drafts, setDrafts] = useState<Record<HierarchyLevel, { name: string; parentId: string; code: string }>>(
    () =>
      Object.fromEntries(
        LEVEL_CONFIG.map((c) => [c.level, { name: "", parentId: "", code: "" }])
      ) as Record<HierarchyLevel, { name: string; parentId: string; code: string }>
  );
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [reparenting, setReparenting] = useState<HierarchyNode | null>(null);

  const load = () =>
    fetch("/api/hierarchy").then((r) => r.json()).then(setNodes).catch(() => toast.error("Failed to load structure"));

  useEffect(() => {
    load();
  }, []);

  const byLevel = useMemo(() => {
    const map = new Map<HierarchyLevel, HierarchyNode[]>();
    for (const c of LEVEL_CONFIG) map.set(c.level, nodes.filter((n) => n.level === c.level));
    return map;
  }, [nodes]);

  const setDraft = (level: HierarchyLevel, patch: Partial<{ name: string; parentId: string; code: string }>) =>
    setDrafts((prev) => ({ ...prev, [level]: { ...prev[level], ...patch } }));

  const create = async (level: HierarchyLevel) => {
    const draft = drafts[level];
    const config = LEVEL_CONFIG.find((c) => c.level === level)!;
    if (!draft.name.trim()) return toast.error("Enter a name");
    if (config.parentLevel && !draft.parentId) return toast.error(`Pick a ${config.parentLevel.replace("_", " ").toLowerCase()} first`);
    try {
      const res = await fetch("/api/hierarchy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name,
          level,
          parentId: config.parentLevel ? draft.parentId : null,
          code: level === "TEAM" ? draft.code : undefined,
        }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "" }));
        return toast.error(error || "Failed to create");
      }
      toast.success(`${draft.name} added`);
      setDraft(level, { name: "", code: "" });
      load();
    } catch {
      toast.error("Network error");
    }
  };

  const rename = async (n: HierarchyNode, name: string) => {
    try {
      const res = await fetch("/api/hierarchy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: n._id, name }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "" }));
        return toast.error(error || "Failed to rename");
      }
      toast.success(`Renamed to ${name}`);
      load();
    } catch {
      toast.error("Network error");
    }
  };

  const promote = async (n: HierarchyNode) => {
    const idx = LEVEL_ORDER_LOCAL.indexOf(n.level);
    const target = idx > 0 ? LEVEL_CONFIG.find((c) => c.level === LEVEL_ORDER_LOCAL[idx - 1])?.label : null;
    if (!target) return toast.error("Already at the top level");
    const ok = await confirm({
      title: `Promote ${n.name}?`,
      message: `This lifts it up to a ${target}.`,
      confirmText: "Promote",
    });
    if (!ok) return;
    try {
      const res = await fetch("/api/hierarchy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: n._id, promote: true }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "" }));
        return toast.error(error || "Failed to promote");
      }
      toast.success(`${n.name} promoted to ${target}`);
      load();
    } catch {
      toast.error("Network error");
    }
  };

  const reparent = async (n: HierarchyNode, newParentId: string) => {
    try {
      const res = await fetch("/api/hierarchy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: n._id, newParentId }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "" }));
        return toast.error(error || "Failed to move");
      }
      toast.success(`${n.name} moved`);
      setReparenting(null);
      load();
    } catch {
      toast.error("Network error");
    }
  };

  const remove = async (n: HierarchyNode) => {
    const ok = await confirm({
      title: `Delete ${n.name}?`,
      message: "This removes it from the structure. This cannot be undone.",
      tone: "danger",
      confirmText: "Delete",
    });
    if (!ok) return;
    try {
      const res = await fetch("/api/hierarchy", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: n._id }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "" }));
        return toast.error(error || "Failed to delete");
      }
      toast.info(`${n.name} removed`);
      load();
    } catch {
      toast.error("Network error");
    }
  };

  const toggleExpanded = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const zones = byLevel.get("ZONE") ?? [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
      {/* Builders — one card per tier, top to bottom */}
      <div className="lg:col-span-2 space-y-5">
        {LEVEL_CONFIG.map((config, i) => {
          const draft = drafts[config.level];
          const parentOptions = config.parentLevel ? byLevel.get(config.parentLevel) ?? [] : [];
          return (
            <motion.div
              key={config.level}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bento-card p-6 flex flex-col gap-3"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-2.5 h-2.5 rounded-full ${config.dot}`} />
                <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900">New {config.label}</h3>
              </div>
              {config.parentLevel && (
                <>
                  <Label>Under {config.parentLevel.replace("_", " ").toLowerCase()}</Label>
                  <Picker
                    value={draft.parentId}
                    placeholder={`Select ${config.parentLevel.replace("_", " ").toLowerCase()}…`}
                    onSelect={(id) => setDraft(config.level, { parentId: id })}
                    options={parentOptions.map((p) => ({ id: p._id, name: p.name }))}
                  />
                </>
              )}
              <Label>{config.label} name</Label>
              <Input
                className={inputCls}
                value={draft.name}
                onChange={(e) => setDraft(config.level, { name: e.target.value })}
                placeholder={`e.g. ${config.label}`}
              />
              {config.level === "TEAM" && (
                <>
                  <Label>Code (optional — for service scheduling, e.g. PS, BG)</Label>
                  <Input
                    className={inputCls}
                    value={draft.code}
                    onChange={(e) => setDraft(config.level, { code: e.target.value.toUpperCase() })}
                    placeholder="PS"
                  />
                </>
              )}
              <AddButton onClick={() => create(config.level)}>Add {config.label}</AddButton>
            </motion.div>
          );
        })}
      </div>

      {/* Tree — collapsible, one level at a time */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="lg:col-span-3 bento-card p-8"
      >
        <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-6">Structure</h3>
        {zones.length === 0 && (
          <p className="text-center py-20 text-sm font-black uppercase tracking-[0.3em] opacity-20">No zones yet</p>
        )}
        <div className="space-y-4">
          <AnimatePresence>
            {zones.map((zone) => (
              <NodeBranch
                key={zone._id}
                node={zone}
                byLevel={byLevel}
                expanded={expanded}
                onToggle={toggleExpanded}
                onRename={rename}
                onPromote={promote}
                onDelete={remove}
                onReparent={(n) => setReparenting(n)}
              />
            ))}
          </AnimatePresence>
        </div>
      </motion.div>

      {reparenting && (
        <ReparentDialog
          node={reparenting}
          options={(byLevel.get(LEVEL_CONFIG.find((c) => c.level === reparenting.level)!.parentLevel!) ?? []).filter(
            (p) => p._id !== reparenting.parentId
          )}
          onCancel={() => setReparenting(null)}
          onConfirm={(parentId) => reparent(reparenting, parentId)}
        />
      )}
    </div>
  );
}

const LEVEL_ORDER_LOCAL: HierarchyLevel[] = LEVEL_CONFIG.map((c) => c.level);

/** One node in the accordion tree, recursing into its children when expanded. */
function NodeBranch({
  node,
  byLevel,
  expanded,
  onToggle,
  onRename,
  onPromote,
  onDelete,
  onReparent,
  depth = 0,
}: {
  node: HierarchyNode;
  byLevel: Map<HierarchyLevel, HierarchyNode[]>;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onRename: (n: HierarchyNode, name: string) => void;
  onPromote: (n: HierarchyNode) => void;
  onDelete: (n: HierarchyNode) => void;
  onReparent: (n: HierarchyNode) => void;
  depth?: number;
}) {
  const idx = LEVEL_ORDER_LOCAL.indexOf(node.level);
  const childLevel = LEVEL_ORDER_LOCAL[idx + 1];
  const children = childLevel ? (byLevel.get(childLevel) ?? []).filter((c) => c.parentId === node._id) : [];
  const config = LEVEL_CONFIG.find((c) => c.level === node.level)!;
  const isOpen = expanded.has(node._id);

  return (
    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="flex items-center gap-1">
        {children.length > 0 || childLevel ? (
          <button
            onClick={() => onToggle(node._id)}
            className="w-6 h-6 shrink-0 flex items-center justify-center text-zinc-400 hover:text-zinc-900"
          >
            <CaretDown size={13} weight="bold" className={cn("transition-transform", isOpen && "rotate-180")} />
          </button>
        ) : (
          <span className="w-6 shrink-0" />
        )}
        <div className="flex-1">
          <Row
            label={node.code ? `${node.name} (${node.code})` : node.name}
            tint={config.dot}
            small={depth > 0}
            onRename={(n) => onRename(node, n)}
            onPromote={depth > 0 ? () => onPromote(node) : undefined}
            onDelete={() => onDelete(node)}
            onReparent={depth > 0 ? () => onReparent(node) : undefined}
          />
        </div>
      </div>
      {isOpen && children.length > 0 && (
        <div className="ml-8 border-l-2 border-zinc-100 pl-4 mt-1.5 space-y-1.5">
          {children.map((child) => (
            <NodeBranch
              key={child._id}
              node={child}
              byLevel={byLevel}
              expanded={expanded}
              onToggle={onToggle}
              onRename={onRename}
              onPromote={onPromote}
              onDelete={onDelete}
              onReparent={onReparent}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
      {isOpen && children.length === 0 && childLevel && (
        <p className="ml-8 pl-4 py-1 text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Empty</p>
      )}
    </motion.div>
  );
}

/** Pick a new parent for a node whose current one is wrong (e.g. an existing
 *  Team that needs moving under a newly-created PCF). */
function ReparentDialog({
  node,
  options,
  onCancel,
  onConfirm,
}: {
  node: HierarchyNode;
  options: HierarchyNode[];
  onCancel: () => void;
  onConfirm: (parentId: string) => void;
}) {
  const [value, setValue] = useState("");
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-6" onClick={onCancel}>
      <div
        className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-black text-zinc-900">Move {node.name}</h3>
        <Picker value={value} placeholder="Select new parent…" onSelect={setValue} options={options.map((o) => ({ id: o._id, name: o.name }))} />
        <div className="flex gap-2 pt-2">
          <Button onClick={onCancel} className="flex-1 h-11 rounded-2xl bg-zinc-100 text-zinc-700 hover:bg-zinc-200">
            Cancel
          </Button>
          <Button
            onClick={() => value && onConfirm(value)}
            disabled={!value}
            className="flex-1 h-11 rounded-2xl bg-zinc-950 text-white hover:bg-black"
          >
            Move
          </Button>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  tint,
  small,
  onRename,
  onPromote,
  onDelete,
  onReparent,
}: {
  label: string;
  tint: string;
  small?: boolean;
  onRename: (name: string) => void;
  onPromote?: () => void;
  onDelete: () => void;
  onReparent?: () => void;
}) {
  const dot = tint;
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(label);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => setVal(label), [label]);
  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);

  const commit = () => {
    const t = val.trim();
    setEditing(false);
    if (t && t !== label) onRename(t);
    else setVal(label);
  };
  const cancel = () => {
    setVal(label);
    setEditing(false);
  };

  return (
    <div className="flex items-center justify-between group min-h-[36px]">
      <div className="flex items-center gap-2.5 flex-1">
        <span className={`w-2 h-2 rounded-full ${dot} shrink-0`} />
        {editing ? (
          <input
            ref={ref}
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") cancel();
            }}
            className={`bg-white border border-zinc-300 rounded-lg px-2 py-1 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-100 text-stone-900 font-bold tracking-tight ${small ? "text-sm" : "text-base"}`}
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            title="Rename"
            className={`text-left font-black tracking-tight text-stone-900 hover:text-zinc-500 transition-colors ${small ? "text-sm" : "text-base"}`}
          >
            {label}
          </button>
        )}
      </div>

      {editing ? (
        <div className="flex items-center gap-1">
          <button onMouseDown={(e) => e.preventDefault()} onClick={commit} className="w-8 h-8 rounded-full flex items-center justify-center text-emerald-500 hover:bg-emerald-50 transition-all">
            <Check size={16} weight="bold" />
          </button>
          <button onMouseDown={(e) => e.preventDefault()} onClick={cancel} className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-300 hover:text-zinc-600 hover:bg-zinc-100 transition-all">
            <X size={15} weight="bold" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {onPromote && (
            <button onClick={onPromote} title="Promote up one level" className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all">
              <ArrowFatUp size={15} weight="bold" />
            </button>
          )}
          {onReparent && (
            <button onClick={onReparent} title="Move to a different parent" className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-300 hover:text-teal-600 hover:bg-teal-50 transition-all">
              <TreeStructure size={15} weight="bold" />
            </button>
          )}
          <button onClick={() => setEditing(true)} title="Rename" className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-300 hover:text-zinc-900 hover:bg-zinc-100 transition-all">
            <PencilSimple size={14} weight="bold" />
          </button>
          <button onClick={onDelete} title="Delete" className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-all">
            <Trash size={15} weight="bold" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Markers tab                                                         */
/* ------------------------------------------------------------------ */

function MarkersTab() {
  const confirm = useConfirm();
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

  const resetPin = async (m: Marker) => {
    const next = await confirm({
      title: `Reset PIN`,
      message: `Set a new sign-in PIN for ${m.name}.`,
      confirmText: "Reset PIN",
      input: {
        label: "New PIN",
        placeholder: "4–6 digits",
        type: "password",
        inputMode: "numeric",
        validate: (v) => (/^\d{4,6}$/.test(v) ? null : "PIN must be 4–6 digits"),
      },
    });
    if (typeof next !== "string") return;
    patch(m, { pin: next }, `${m.name}'s PIN reset`);
  };

  const remove = async (m: Marker) => {
    const ok = await confirm({
      title: `Remove ${m.name}?`,
      message: "They will no longer be able to sign in and mark attendance.",
      tone: "danger",
      confirmText: "Remove",
    });
    if (!ok) return;
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
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="lg:col-span-2 bento-card p-6 flex flex-col gap-3 h-fit"
      >
        <div className="flex items-center gap-2 mb-1">
          <IdentificationBadge size={20} weight="duotone" className="text-zinc-700" />
          <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900">New Marker</h3>
        </div>
        <Label>Full name</Label>
        <Input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="David Olatunji" />
        <Label>Initial PIN (4–6 digits)</Label>
        <Input
          className={inputCls}
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="••••"
        />
        <AddButton onClick={add}>Register Marker</AddButton>
      </motion.div>

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
/* Export tab                                                          */
/* ------------------------------------------------------------------ */

type ExportScope = "all" | "seniorCell" | "cell";

const SCOPES: { id: ExportScope; label: string; icon: React.ReactNode }[] = [
  { id: "all", label: "Everyone", icon: <UsersThree size={16} weight="bold" /> },
  { id: "seniorCell", label: "Senior Cell", icon: <Users size={16} weight="bold" /> },
  { id: "cell", label: "Cell", icon: <User size={16} weight="bold" /> },
];

/** Downloads the register as CSV — name, cell and phone number, optionally
 *  narrowed to a single cell or senior cell. */
function ExportTab() {
  const [groups, setGroups] = useState<HierarchyNode[]>([]);
  const [members, setMembers] = useState<{ cell?: string; seniorCell?: string }[]>([]);
  const [scope, setScope] = useState<ExportScope>("all");
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/hierarchy")
      .then((r) => r.json())
      .then(setGroups)
      .catch(() => toast.error("Failed to load structure"));
    // Only used for the row-count preview; the download itself is server-side.
    fetch("/api/members")
      .then((r) => r.json())
      .then((m) => setMembers(Array.isArray(m) ? m : []))
      .catch(() => {});
  }, []);

  // Options are the group names, since that's what a member row stores.
  const options = useMemo(() => {
    const level = scope === "cell" ? "CELL" : "SENIOR_CELL";
    return groups
      .filter((g) => g.level === level)
      .map((g) => ({ id: g.name, name: g.name }));
  }, [groups, scope]);

  const count = useMemo(() => {
    if (scope === "all") return members.length;
    if (!value) return 0;
    return members.filter((m) => (m[scope] || "").toLowerCase() === value.toLowerCase()).length;
  }, [members, scope, value]);

  const ready = scope === "all" || !!value;

  const download = async () => {
    if (!ready) return toast.error(`Pick a ${scope === "cell" ? "cell" : "senior cell"} first`);
    setBusy(true);
    try {
      const qs = scope === "all" ? "" : `?scope=${scope}&value=${encodeURIComponent(value)}`;
      const res = await fetch(`/api/members/export${qs}`);
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "" }));
        return toast.error(error || "Export failed");
      }
      // Filename comes from the server's Content-Disposition.
      const disposition = res.headers.get("Content-Disposition") || "";
      const filename = /filename="(.+?)"/.exec(disposition)?.[1] || "e-register.csv";

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${filename}`);
    } catch {
      toast.error("Network error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-zinc-100 rounded-[2rem] p-8 shadow-sm space-y-6"
      >
        <div>
          <h2 className="text-2xl font-black tracking-tight text-zinc-900">Export register</h2>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-400 mt-1.5">
            Name · Cell · Phone number
          </p>
        </div>

        <div className="space-y-2">
          <Label>Who to export</Label>
          <div className="bg-zinc-100 p-1.5 rounded-2xl flex gap-1 w-fit max-w-full overflow-x-auto">
            {SCOPES.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setScope(s.id);
                  setValue("");
                }}
                className={cn(
                  "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all flex items-center gap-2",
                  scope === s.id ? "bg-white text-black shadow-sm" : "text-zinc-400 hover:text-zinc-600"
                )}
              >
                {s.icon}
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {scope !== "all" && (
          <div className="space-y-2">
            <Label>{scope === "cell" ? "Cell" : "Senior cell"}</Label>
            <Picker
              value={value}
              options={options}
              placeholder={scope === "cell" ? "Choose a cell" : "Choose a senior cell"}
              onSelect={setValue}
            />
          </div>
        )}

        <div className="flex items-center gap-3 px-5 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl">
          <span
            className={cn("w-2 h-2 rounded-full shrink-0", count > 0 ? "bg-emerald-400" : "bg-zinc-300")}
          />
          <p className="text-xs font-bold text-zinc-500 tracking-tight">
            {!ready
              ? `Pick a ${scope === "cell" ? "cell" : "senior cell"} to export`
              : count === 0
                ? "Nobody matches this filter yet"
                : `${count} ${count === 1 ? "person" : "people"} will be exported`}
          </p>
        </div>

        <Button
          onClick={download}
          disabled={busy || !ready || count === 0}
          className="w-full h-12 rounded-2xl bg-zinc-950 text-white text-[11px] font-black uppercase tracking-widest hover:bg-black active:scale-[0.98] transition-all shadow-lg disabled:opacity-40 disabled:pointer-events-none"
        >
          <DownloadSimple size={16} weight="bold" /> {busy ? "Preparing…" : "Download CSV"}
        </Button>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-[#FDFBFC] p-6 md:p-12 max-w-[1400px] mx-auto">
      <header className="flex flex-col lg:flex-row justify-between items-center gap-6 mb-12">
        <Logo />
        <LogoutButton />
      </header>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <h1 className="text-5xl font-black tracking-tighter text-stone-900">Admin</h1>
        <p className="text-xs font-bold uppercase tracking-[0.4em] opacity-40 mt-2">Structure &amp; Protocol Staff</p>
      </motion.div>

      <Tabs defaultValue="structure" className="w-full">
        <TabsList className="bg-zinc-100 p-1.5 rounded-2xl mb-8 h-auto">
          <TabsTrigger
            value="structure"
            className="rounded-xl px-6 py-2.5 text-[11px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm text-zinc-400 flex items-center gap-2"
          >
            <TreeStructure size={16} weight="bold" /> Structure
          </TabsTrigger>
          <TabsTrigger
            value="markers"
            className="rounded-xl px-6 py-2.5 text-[11px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm text-zinc-400 flex items-center gap-2"
          >
            <IdentificationBadge size={16} weight="bold" /> Markers
          </TabsTrigger>
          <TabsTrigger
            value="attendance"
            className="rounded-xl px-6 py-2.5 text-[11px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm text-zinc-400 flex items-center gap-2"
          >
            <Clock size={16} weight="bold" /> Attendance
          </TabsTrigger>
          <TabsTrigger
            value="export"
            className="rounded-xl px-6 py-2.5 text-[11px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm text-zinc-400 flex items-center gap-2"
          >
            <DownloadSimple size={16} weight="bold" /> Export
          </TabsTrigger>
        </TabsList>

        <TabsContent value="structure">
          <StructureTab />
        </TabsContent>
        <TabsContent value="markers">
          <MarkersTab />
        </TabsContent>
        <TabsContent value="attendance">
          <div className="max-w-2xl">
            <AttendanceSettings />
          </div>
        </TabsContent>
        <TabsContent value="export">
          <ExportTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
