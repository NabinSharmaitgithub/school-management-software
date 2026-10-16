"use client";

import { useEffect, useMemo, useState } from "react";
import {
  listRooms,
  addRoom,
  deleteRoom,
  allocateBed,
  removeOccupant,
  listHostelFees,
  addHostelFee,
  deleteHostelFee,
  collectHostelFee,
  listStudents,
} from "@/lib/data";
import type { HostelRoom, HostelFee, Student } from "@/lib/data";
import { Field, GlassButton, GlassCard, Input, Modal, Select, StatusPill } from "@/components/ui";

const BLOCKS: { id: "A" | "B" | "C"; label: string }[] = [
  { id: "A", label: "Block A (Boys)" },
  { id: "B", label: "Block B (Boys)" },
  { id: "C", label: "Block C (Girls)" },
];

type Tab = "rooms" | "fees";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function occupancyOf(room: HostelRoom) {
  return Math.min(room.occupants.length, room.capacity);
}

export default function HostelPage() {
  const [tab, setTab] = useState<Tab>("rooms");
  const [rooms, setRooms] = useState<HostelRoom[]>([]);
  const [fees, setFees] = useState<HostelFee[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Rooms tab
  const [blockFilter, setBlockFilter] = useState<"A" | "B" | "C">("A");
  const [floorFilter, setFloorFilter] = useState<number>(0);
  const [statusFilter, setStatusFilter] = useState<"all" | "empty" | "partial" | "full">("all");
  const [selectedId, setSelectedId] = useState<string>("");
  const [addRoomOpen, setAddRoomOpen] = useState(false);
  const [allocOpen, setAllocOpen] = useState(false);
  const [allocStudent, setAllocStudent] = useState("");
  const [removeTarget, setRemoveTarget] = useState<string>("");
  const [removeRoom, setRemoveRoom] = useState("");
  const [confirmDeleteRoom, setConfirmDeleteRoom] = useState(false);
  const [roomForm, setRoomForm] = useState({ block: "A", floor: "1", room_number: "", capacity: "4" });

  // Fees tab
  const [blockFeeFilter, setBlockFeeFilter] = useState("All Blocks");
  const [statusFilter2, setStatusFilter2] = useState("All Statuses");
  const [collectId, setCollectId] = useState("");
  const [method, setMethod] = useState("Card");
  const [payMethod, setPayMethod] = useState("");
  const [recordOpen, setRecordOpen] = useState(false);
  const [feeForm, setFeeForm] = useState({
    student_id: "", room_id: "", fee_plan: "Term", rent: "800", mess: "150", laundry: "50", due_date: today(),
  });

  const load = async () => {
    try {
      const [r, f, s] = await Promise.all([listRooms(), listHostelFees(), listStudents()]);
      setRooms(r);
      setFees(f);
      setStudents(s);
      const m: Record<string, string> = {};
      for (const st of s) m[st.id] = st.name;
      setNames(m);
      setSelectedId((cur) => (cur && r.some((rm) => rm.id === cur) ? cur : (r[0]?.id ?? "")));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const roomOf = (roomId: string) => rooms.find((r) => r.id === roomId);

  const selected = rooms.find((r) => r.id === selectedId);

  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      if (r.block !== blockFilter) return false;
      if (floorFilter !== 0 && r.floor !== floorFilter) return false;
      const occ = occupancyOf(r);
      if (statusFilter === "empty" && occ !== 0) return false;
      if (statusFilter === "partial" && (occ === 0 || occ >= r.capacity)) return false;
      if (statusFilter === "full" && occ < r.capacity) return false;
      return true;
    });
  }, [rooms, blockFilter, floorFilter, statusFilter]);

  const floors = useMemo(
    () =>
      Array.from(new Set(rooms.filter((r) => r.block === blockFilter).map((r) => r.floor))).sort(),
    [rooms, blockFilter]
  );

  const roomBlockOf = (roomId: string) => roomOf(roomId)?.block ?? "A";

  const totalOccupants = rooms.reduce((s, r) => s + occupancyOf(r), 0);
  const totalCapacity = rooms.reduce((s, r) => s + r.capacity, 0);
  const occupiedRooms = rooms.filter((r) => r.occupants.length > 0).length;

  const feeStatus = (f: HostelFee): "paid" | "due" | "overdue" => {
    if (f.paid_date) return "paid";
    return f.due_date < today() ? "overdue" : "due";
  };

  const totalOutstanding = fees
    .filter((f) => feeStatus(f) !== "paid")
    .reduce((s, f) => s + f.rent + f.mess + f.laundry, 0);
  const totalCollected = fees
    .filter((f) => f.paid_date)
    .reduce((s, f) => s + f.rent + f.mess + f.laundry, 0);
  const totalFeesSum = fees.reduce((s, f) => s + f.rent + f.mess + f.laundry, 0);
  const collectionRate = totalFeesSum > 0 ? Math.round((totalCollected / totalFeesSum) * 100) : 0;

  const visibleFees = useMemo(() => {
    return fees.filter((f) => {
      if (blockFeeFilter !== "All Blocks" && roomBlockOf(f.room_id) !== blockFeeFilter) return false;
      const st = feeStatus(f);
      if (statusFilter2 === "Due" && st !== "due") return false;
      if (statusFilter2 === "Overdue" && st !== "overdue") return false;
      if (statusFilter2 === "Paid" && st !== "paid") return false;
      return true;
    });
  }, [fees, blockFeeFilter, statusFilter2]);

  const collectsFor = (id: string) => {
    const f = fees.find((x) => x.id === id);
    if (!f) return { resident: "", room: "", rent: 0, mess: 0, laundry: 0, total: 0 };
    const room = roomOf(f.room_id);
    const rentAmount = f.rent;
    return {
      resident: names[f.student_id] ?? f.student_id,
      room: room ? `${room.room_number}, Block ${room.block}` : "—",
      rent: rentAmount,
      mess: f.mess,
      laundry: f.laundry,
      total: rentAmount + f.mess + f.laundry,
    };
  };

  const allocatedStudents = new Set(rooms.flatMap((r) => r.occupants));

  async function onAddRoom(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!roomForm.room_number.trim()) {
      setError("Room number is required.");
      return;
    }
    const capacity = Number(roomForm.capacity);
    if (!isFinite(capacity) || capacity < 1) {
      setError("Capacity must be at least 1 bed.");
      return;
    }
    setSaving(true);
    try {
      await addRoom({
        block: roomForm.block as "A" | "B" | "C",
        floor: Number(roomForm.floor) || 1,
        room_number: roomForm.room_number.trim(),
        capacity,
      });
      setAddRoomOpen(false);
      setRoomForm({ block: "A", floor: "1", room_number: "", capacity: "4" });
      await load();
      setSelectedId((cur) => cur || rooms[rooms.length - 1]?.id || "");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function onAllocate() {
    setError("");
    if (!allocStudent) {
      setError("Pick a student to allocate.");
      return;
    }
    try {
      await allocateBed(allocOpenRoom, allocStudent);
      setAllocOpen(false);
      setAllocStudent("");
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const [allocOpenRoom, setAllocOpenRoom] = useState("");

  async function onRemoveOccupant() {
    if (!removeRoom) return;
    await removeOccupant(removeRoom, removeTarget);
    setRemoveTarget("");
    setRemoveRoom("");
    load();
  }

  async function onDeleteRoom() {
    if (!selected) return;
    await deleteRoom(selected.id);
    setConfirmDeleteRoom(false);
    load();
  }

  async function onCollect() {
    setError("");
    if (!collectId) return;
    try {
      await collectHostelFee(collectId, method);
      setCollectId("");
      setMethod("Card");
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const [saving, setSaving] = useState(false);

  async function onRecordFee(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!feeForm.student_id || !feeForm.room_id) {
      setError("Pick a resident and their room.");
      return;
    }
    setSaving(true);
    try {
      await addHostelFee({
        student_id: feeForm.student_id,
        room_id: feeForm.room_id,
        fee_plan: `${feeForm.fee_plan} (${new Date(feeForm.due_date).toLocaleString([], { month: "short" })})`,
        rent: Number(feeForm.rent) || 0,
        mess: Number(feeForm.mess) || 0,
        laundry: Number(feeForm.laundry) || 0,
        due_date: feeForm.due_date,
      });
      setRecordOpen(false);
      setFeeForm({
        student_id: "", room_id: "", fee_plan: "Term", rent: "800", mess: "150", laundry: "50",
        due_date: today(),
      });
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const unusedStudentOptions = students
    .filter((s) => !allocatedStudents.has(s.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  const feeStudentOptions = students
    .sort((a, b) => a.name.localeCompare(b.name))
    .filter((s) => rooms.some((r) => r.occupants.includes(s.id)));

  const blockLabel = (b: "A" | "B" | "C") => BLOCKS.find((x) => x.id === b)?.label ?? b;

  return (
    <div className="space-y-6">
      <header className="glass-panel p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Hostel</h1>
          <p className="text-sm text-on-surface/60">
            {totalOccupants} of {totalCapacity} beds occupied · {occupiedRooms} rooms in use
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <GlassButton
            variant="ghost"
            onClick={() => setTab("rooms")}
            className={tab === "rooms" ? "bg-primary/15 text-primary font-semibold" : ""}
          >
            Room Allocation
          </GlassButton>
          <GlassButton
            variant="ghost"
            onClick={() => setTab("fees")}
            className={tab === "fees" ? "bg-primary/15 text-primary font-semibold" : ""}
          >
            Fee Management
          </GlassButton>
        </div>
      </header>

      {error && (
        <p className="text-xs text-error bg-rose/10 border border-rose/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-on-surface/60 py-8 text-center">Loading…</p>
      ) : (
        <>
          {/* ── Room Allocation ────────────────────────────────── */}
          {tab === "rooms" && (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-6">
              <div className="space-y-5">
                <GlassCard className="p-4 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div>
                      <h2 className="text-base font-semibold">Room Allocation</h2>
                      <p className="text-xs text-on-surface/60">
                        Assign beds across hostel blocks and floors.
                      </p>
                    </div>
                    <GlassButton onClick={() => setAddRoomOpen(true)}>
                      <span className="material-symbols-outlined text-lg">meeting_room</span>
                      Add Room
                    </GlassButton>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {BLOCKS.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => {
                          setBlockFilter(b.id);
                          setFloorFilter(0);
                        }}
                        className={`text-sm rounded-full px-3 py-1.5 border border-white/70 transition ${
                          blockFilter === b.id
                            ? "bg-primary/15 text-primary border-primary/30"
                            : "text-on-surface/70 hover:bg-white/50"
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mb-5">
                    <Select
                      className="!w-auto"
                      value={String(floorFilter)}
                      onChange={(e) => setFloorFilter(Number(e.target.value))}
                    >
                      <option value="0">All Floors</option>
                      {floors.map((f) => (
                        <option key={f} value={f}>
                          Floor {f}
                        </option>
                      ))}
                    </Select>
                    <Select
                      className="!w-auto"
                      value={statusFilter}
                      onChange={(e) =>
                        setStatusFilter(e.target.value as typeof statusFilter)
                      }
                    >
                      <option value="all">All Status</option>
                      <option value="empty">Empty</option>
                      <option value="partial">Partial</option>
                      <option value="full">Full</option>
                    </Select>
                  </div>

                  {filteredRooms.length === 0 ? (
                    <p className="text-sm text-on-surface/60 py-8 text-center">
                      No rooms match the current filters. Click &ldquo;Add Room&rdquo; to create one.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                      {filteredRooms.map((r) => {
                        const occ = occupancyOf(r);
                        const status =
                          occ === 0 ? "empty" : occ >= r.capacity ? "full" : "partial";
                        return (
                          <button
                            key={r.id}
                            onClick={() => setSelectedId(r.id)}
                            className={`glass-panel p-3 text-left transition ${
                              selectedId === r.id ? "ring-2 ring-primary/40" : "hover:bg-white/50"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-on-surface">{r.room_number}</span>
                              {status === "full" && <StatusPill tone="warning">Full</StatusPill>}
                              {status === "partial" && <StatusPill tone="primary">Partial</StatusPill>}
                              {status === "empty" && <StatusPill tone="success">Empty</StatusPill>}
                            </div>
                            <div className="flex gap-1">
                              {Array.from({ length: r.capacity }).map((_, i) => (
                                <span
                                  key={i}
                                  className={`material-symbols-outlined text-lg ${
                                    i < occ ? "text-primary" : "text-on-surface/20"
                                  }`}
                                >
                                  bed
                                </span>
                              ))}
                            </div>
                            <p className="text-xs text-on-surface/50 mt-1">
                              {occ}/{r.capacity} occupied
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </GlassCard>
              </div>

              {/* Room detail */}
              <GlassCard className="p-4 self-start">
                {selected ? (
                  <>
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <h3 className="font-semibold text-on-surface">
                          Room {selected.room_number}
                        </h3>
                        <p className="text-xs text-on-surface/60">
                          {blockLabel(selected.block)} · Floor {selected.floor}
                        </p>
                      </div>
                      <button
                        onClick={() => setConfirmDeleteRoom(true)}
                        className="text-on-surface/40 hover:text-error transition"
                        aria-label="Delete room"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 my-4">
                      <div className="rounded-lg bg-white/50 border border-white/70 p-2 text-center">
                        <span className="material-symbols-outlined text-lg text-primary/50">
                          meeting_room
                        </span>
                        <p className="text-sm font-semibold text-on-surface">
                          {selected.capacity} Beds
                        </p>
                        <p className="text-[10px] text-on-surface/50">Capacity</p>
                      </div>
                      <div className="rounded-lg bg-white/50 border border-white/70 p-2 text-center">
                        <span className="material-symbols-outlined text-lg text-primary/50">
                          group
                        </span>
                        <p className="text-sm font-semibold text-on-surface">
                          {selected.occupants.length}/{selected.capacity}
                        </p>
                        <p className="text-[10px] text-on-surface/50">Occupancy</p>
                      </div>
                    </div>

                    <p className="text-xs font-medium text-on-surface/70 mb-2">
                      Current Occupants
                    </p>
                    <div className="space-y-2 mb-4">
                      {selected.occupants.length === 0 && (
                        <p className="text-xs text-on-surface/40">No beds occupied yet.</p>
                      )}
                      {selected.occupants.map((sid) => (
                        <div
                          key={sid}
                          className="flex items-center justify-between rounded-lg bg-white/50 border border-white/70 px-3 py-2"
                        >
                          <span className="flex items-center gap-2 text-sm text-on-surface/80">
                            <span className="material-symbols-outlined text-base text-primary/50">
                              account_circle
                            </span>
                            {names[sid] ?? sid}
                          </span>
                          <button
                            onClick={() => {
                              setRemoveTarget(sid);
                              setRemoveRoom(selected.id);
                            }}
                            className="text-on-surface/40 hover:text-error transition"
                            aria-label="Remove occupant"
                          >
                            <span className="material-symbols-outlined text-base">close</span>
                          </button>
                        </div>
                      ))}
                    </div>

                    <GlassButton
                      className="w-full"
                      disabled={selected.occupants.length >= selected.capacity}
                      onClick={() => {
                        setAllocOpenRoom(selected.id);
                        setAllocStudent("");
                        setAllocOpen(true);
                      }}
                    >
                      <span className="material-symbols-outlined text-lg">person_add</span>
                      Allocate Student
                    </GlassButton>
                  </>
                ) : (
                  <p className="text-sm text-on-surface/60 text-center py-8">
                    Select a room to view details.
                  </p>
                )}
              </GlassCard>
            </div>
          )}

          {/* ── Fee Management ─────────────────────────────────── */}
          {tab === "fees" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <GlassCard className="p-4">
                  <p className="text-xs text-on-surface/60 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-primary">
                      account_balance_wallet
                    </span>
                    Total Outstanding
                  </p>
                  <p className="text-2xl font-bold text-on-surface mt-1">
                    रु{totalOutstanding.toLocaleString("en-IN")}
                  </p>
                </GlassCard>
                <GlassCard className="p-4">
                  <p className="text-xs text-on-surface/60 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-success">
                      trending_up
                    </span>
                    Collection Rate
                  </p>
                  <p className="text-2xl font-bold text-on-surface mt-1">{collectionRate}%</p>
                  <p className="text-[11px] text-on-surface/50">Target: 95% by month end</p>
                </GlassCard>
                <GlassCard className="p-4">
                  <p className="text-xs text-on-surface/60 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-secondary">
                      bedroom_parent
                    </span>
                    Hostel Occupancy
                  </p>
                  <p className="text-2xl font-bold text-on-surface mt-1">
                    {totalOccupants} / {totalCapacity}
                  </p>
                  <p className="text-[11px] text-on-surface/50">
                    {totalCapacity - totalOccupants} beds available
                  </p>
                </GlassCard>
              </div>

              <GlassCard className="p-4 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-base font-semibold">Resident Roster &amp; Dues</h2>
                    <p className="text-xs text-on-surface/60">
                      Review hostel charges and collect outstanding payments.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <GlassButton variant="ghost" onClick={() => setRecordOpen(true)}>
                      <span className="material-symbols-outlined text-lg">add_card</span>
                      Record Payment
                    </GlassButton>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-5">
                  <Select
                    className="!w-auto"
                    value={blockFeeFilter}
                    onChange={(e) => setBlockFeeFilter(e.target.value)}
                  >
                    <option>All Blocks</option>
                    {BLOCKS.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.label}
                      </option>
                    ))}
                  </Select>
                  <Select
                    className="!w-auto"
                    value={statusFilter2}
                    onChange={(e) => setStatusFilter2(e.target.value)}
                  >
                    <option>All Statuses</option>
                    <option>Due</option>
                    <option>Overdue</option>
                    <option>Paid</option>
                  </Select>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wide text-on-surface/50">
                        <th className="pb-3 pr-4">Resident</th>
                        <th className="pb-3 pr-4 hidden sm:table-cell">Room No</th>
                        <th className="pb-3 pr-4 hidden md:table-cell">Fee Plan</th>
                        <th className="pb-3 pr-4 text-right">Amount Due</th>
                        <th className="pb-3 pr-4">Status</th>
                        <th className="pb-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleFees.length === 0 && (
                        <tr>
                          <td className="py-3 text-on-surface/60" colSpan={6}>
                            No hostel fee entries. Add a resident&apos;s charges with
                            &ldquo;Record Payment&rdquo;.
                          </td>
                        </tr>
                      )}
                      {visibleFees.map((f) => {
                        const st = feeStatus(f);
                        const total = f.rent + f.mess + f.laundry;
                        const room = roomOf(f.room_id);
                        return (
                          <tr key={f.id} className="border-t border-on-surface/10 hover:bg-white/40">
                            <td className="py-3 pr-4">
                              <p className="font-medium text-on-surface">
                                {names[f.student_id] ?? f.student_id}
                              </p>
                              <p className="text-[11px] text-on-surface/50">
                                {room ? `${room.room_number} · Block ${room.block}` : "—"}
                              </p>
                            </td>
                            <td className="py-3 pr-4 hidden sm:table-cell text-on-surface/70">
                              {room?.room_number ?? "—"}
                            </td>
                            <td className="py-3 pr-4 hidden md:table-cell text-on-surface/70">
                              {f.fee_plan}
                            </td>
                            <td className="py-3 pr-4 text-right font-semibold text-on-surface">
                              रु{total.toLocaleString("en-IN")}
                            </td>
                            <td className="py-3 pr-4">
                              {st === "paid" && <StatusPill tone="success">Paid</StatusPill>}
                              {st === "due" && <StatusPill tone="warning">Due</StatusPill>}
                              {st === "overdue" && <StatusPill tone="error">Overdue</StatusPill>}
                            </td>
                            <td className="py-3 text-right">
                              {st === "paid" ? (
                                <span className="text-xs text-on-surface/40">Settled</span>
                              ) : (
                                <GlassButton
                                  variant="ghost"
                                  onClick={() => {
                                    setCollectId(f.id);
                                    setMethod("Card");
                                  }}
                                >
                                  Collect
                                </GlassButton>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            </>
          )}
        </>
      )}

      {/* ── Add room modal ────────────────────────────────────── */}
      <Modal open={addRoomOpen} onClose={() => setAddRoomOpen(false)} title="Add Room">
        <form className="space-y-4" onSubmit={onAddRoom}>
          <Field label="Block">
            <Select value={roomForm.block} onChange={(e) => setRoomForm((f) => ({ ...f, block: e.target.value }))}>
              {BLOCKS.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Floor">
              <Input
                type="number"
                min="1"
                value={roomForm.floor}
                onChange={(e) => setRoomForm((f) => ({ ...f, floor: e.target.value }))}
              />
            </Field>
            <Field label="Room Number *">
              <Input
                placeholder="e.g. 101"
                value={roomForm.room_number}
                onChange={(e) => setRoomForm((f) => ({ ...f, room_number: e.target.value }))}
                required
              />
            </Field>
          </div>
          <Field label="Beds">
            <Select value={roomForm.capacity} onChange={(e) => setRoomForm((f) => ({ ...f, capacity: e.target.value }))}>
              {["2", "3", "4", "6"].map((c) => (
                <option key={c} value={c}>
                  {c} beds
                </option>
              ))}
            </Select>
          </Field>

          {error && (
            <p className="text-xs text-error bg-rose/10 border border-rose/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <GlassButton type="button" variant="ghost" onClick={() => setAddRoomOpen(false)}>
              Cancel
            </GlassButton>
            <GlassButton type="submit" disabled={saving}>
              {saving ? "Saving…" : "Add Room"}
            </GlassButton>
          </div>
        </form>
      </Modal>

      {/* ── Allocate student modal ────────────────────────────── */}
      <Modal open={allocOpen} onClose={() => setAllocOpen(false)} title="Allocate Student">
        <div className="space-y-4">
          <p className="text-sm text-on-surface/70">
            Assign a bed in Room{" "}
            <span className="font-medium text-on-surface">{roomOf(allocOpenRoom)?.room_number}</span>{" "}
            ({blockLabel(roomOf(allocOpenRoom)?.block ?? "A")}).
          </p>
          <Field label="Student *">
            <Select value={allocStudent} onChange={(e) => setAllocStudent(e.target.value)}>
              <option value="">Select a student…</option>
              {unusedStudentOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          {unusedStudentOptions.length === 0 && (
            <p className="text-xs text-on-surface/40">
              All students are already allocated to a bed.
            </p>
          )}

          {error && (
            <p className="text-xs text-error bg-rose/10 border border-rose/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <GlassButton variant="ghost" onClick={() => setAllocOpen(false)}>
              Cancel
            </GlassButton>
            <GlassButton onClick={onAllocate}>Allocate</GlassButton>
          </div>
        </div>
      </Modal>

      {/* ── Remove occupant ───────────────────────────────────── */}
      <Modal open={!!removeRoom} onClose={() => setRemoveRoom("")} title="Remove occupant?">
        <p className="text-sm text-on-surface/70 mb-6">
          This frees the bed for{" "}
          <span className="font-medium text-on-surface">{names[removeTarget] ?? removeTarget}</span>.{" "}
          Any linked hostel fee stays on record.
        </p>
        <div className="flex justify-end gap-3">
          <GlassButton variant="ghost" onClick={() => setRemoveRoom("")}>
            Cancel
          </GlassButton>
          <GlassButton variant="danger" onClick={onRemoveOccupant}>
            Remove
          </GlassButton>
        </div>
      </Modal>

      {/* ── Delete room ───────────────────────────────────────── */}
      <Modal open={confirmDeleteRoom} onClose={() => setConfirmDeleteRoom(false)} title="Delete room?">
        <p className="text-sm text-on-surface/70 mb-6">
          This permanently removes Room {selected?.room_number} from the block.
        </p>
        <div className="flex justify-end gap-3">
          <GlassButton variant="ghost" onClick={() => setConfirmDeleteRoom(false)}>
            Cancel
          </GlassButton>
          <GlassButton variant="danger" onClick={onDeleteRoom}>
            Delete
          </GlassButton>
        </div>
      </Modal>

      {/* ── Collect hostel payment modal ──────────────────────── */}
      <Modal open={!!collectId} onClose={() => setCollectId("")} title="Collect Hostel Payment">
        {(() => {
          const c = collectsFor(collectId);
          return (
            <div className="space-y-4">
              <div className="rounded-lg bg-white/50 border border-white/70 p-3">
                <p className="font-medium text-on-surface">{c.resident}</p>
                <p className="text-xs text-on-surface/50">
                  Room {c.room} · {fees.find((f) => f.id === collectId)?.fee_plan}
                </p>
              </div>

              <div className="space-y-2">
                {[
                  ["Room Rent", c.rent],
                  ["Mess Fee", c.mess],
                  ["Laundry / Other", c.laundry],
                ].map(([label, amount]) => (
                  <div key={label} className="flex justify-between text-sm text-on-surface/80">
                    <span>{label}</span>
                    <span>रु{amount.toLocaleString("en-IN")}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 border-t border-on-surface/10 font-semibold text-on-surface">
                  <span>Total Due</span>
                  <span>रु{c.total.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <Field label="Payment Method">
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      ["Card", "credit_card"],
                      ["Cash", "payments"],
                      ["Online", "language"],
                    ] as const
                  ).map(([label, icon]) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setMethod(label)}
                      className={`rounded-xl border px-3 py-2.5 flex flex-col items-center gap-1 text-sm transition ${
                        method === label
                          ? "border-primary text-primary bg-primary/10 font-medium"
                          : "border-white/70 text-on-surface/70 hover:bg-white/50"
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">{icon}</span>
                      {label}
                    </button>
                  ))}
                </div>
              </Field>

              {error && (
                <p className="text-xs text-error bg-rose/10 border border-rose/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <GlassButton variant="ghost" onClick={() => setCollectId("")}>
                  Cancel
                </GlassButton>
                <GlassButton onClick={onCollect}>Collect Payment</GlassButton>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* ── Record payment modal ──────────────────────────────── */}
      <Modal open={recordOpen} onClose={() => setRecordOpen(false)} title="Record Hostel Payment">
        <form className="space-y-4" onSubmit={onRecordFee}>
          <Field label="Resident (hostel student) *">
            <Select
              value={feeForm.student_id}
              onChange={(e) => {
                const sid = e.target.value;
                const room = rooms.find((r) => r.occupants.includes(sid));
                setFeeForm((f) => ({ ...f, student_id: sid, room_id: room?.id ?? "" }));
              }}
            >
              <option value="">Select student…</option>
              {feeStudentOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Room">
            <Select
              value={feeForm.room_id}
              onChange={(e) => setFeeForm((f) => ({ ...f, room_id: e.target.value }))}
            >
              <option value="">Select room…</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.room_number} · {blockLabel(r.block)}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Charge Type">
              <Select
                value={feeForm.fee_plan}
                onChange={(e) => setFeeForm((f) => ({ ...f, fee_plan: e.target.value }))}
              >
                <option>Term</option>
                <option>Monthly</option>
                <option>Annual</option>
              </Select>
            </Field>
            <Field label="Due Date">
              <Input
                type="date"
                value={feeForm.due_date}
                onChange={(e) => setFeeForm((f) => ({ ...f, due_date: e.target.value }))}
              />
            </Field>
            <Field label="Room Rent (रु)">
              <Input
                type="number"
                min="0"
                value={feeForm.rent}
                onChange={(e) => setFeeForm((f) => ({ ...f, rent: e.target.value }))}
              />
            </Field>
            <Field label="Mess Fee (रु)">
              <Input
                type="number"
                min="0"
                value={feeForm.mess}
                onChange={(e) => setFeeForm((f) => ({ ...f, mess: e.target.value }))}
              />
            </Field>
            <Field label="Laundry / Other (रु)">
              <Input
                type="number"
                min="0"
                value={feeForm.laundry}
                onChange={(e) => setFeeForm((f) => ({ ...f, laundry: e.target.value }))}
              />
            </Field>
          </div>

          {error && (
            <p className="text-xs text-error bg-rose/10 border border-rose/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <GlassButton type="button" variant="ghost" onClick={() => setRecordOpen(false)}>
              Cancel
            </GlassButton>
            <GlassButton type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save Payment Record"}
            </GlassButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}