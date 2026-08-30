"use client";

import { useEffect, useMemo, useState } from "react";
import {
  listRoutes,
  addRoute,
  deleteRoute,
  listRouteAssignments,
  updateAssignment,
  addAssignment,
  deleteAssignment,
  listVehicles,
  addVehicle,
  logService,
  listStudents,
  listClasses,
  studentNames,
  classNames,
} from "@/lib/data";
import type { Route, RouteAssignment, Vehicle, Student } from "@/lib/data";
import { Field, GlassButton, GlassCard, Input, Modal, Select, StatusPill } from "@/components/ui";

type Tab = "routes" | "assignments" | "fleet";

const emptyRouteForm = { name: "", bus_id: "", driver_name: "", capacity: "60" };

export default function TransportPage() {
  const [tab, setTab] = useState<Tab>("routes");
  const [routes, setRoutes] = useState<Route[]>([]);
  const [assignments, setAssignments] = useState<RouteAssignment[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [cnames, setCnames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Routes tab
  const [routeModal, setRouteModal] = useState(false);
  const [routeForm, setRouteForm] = useState(emptyRouteForm);
  const [routeStops, setRouteStops] = useState<{ name: string; stop_time: string }[]>([
    { name: "", stop_time: "8:00 AM" },
  ]);
  const [stopsFor, setStopsFor] = useState<string>("");

  // Assignments tab
  const [routeFilter, setRouteFilter] = useState("All Routes");
  const [classFilter, setClassFilter] = useState("All Classes");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkRouteId, setBulkRouteId] = useState("");
  const [bulkPickup, setBulkPickup] = useState("");
  const [assignFor, setAssignFor] = useState("");
  const [assignRoute, setAssignRoute] = useState("");
  const [assignStop, setAssignStop] = useState("");
  const [feeInput, setFeeInput] = useState("50");

  // Fleet tab
  const [fleetFilter, setFleetFilter] = useState<"all" | "active" | "maintenance">("all");
  const [vehicleOpen, setVehicleOpen] = useState("");
  const [addVehicleOpen, setAddVehicleOpen] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({
    vehicle_no: "", plate: "", capacity_seats: "72", driver_name: "", driver_phone: "",
    insurance_expiry: "", permit_expiry: "",
  });
  const [serviceOpenFor, setServiceOpenFor] = useState("");
  const [serviceForm, setServiceForm] = useState({ date: new Date().toISOString().slice(0, 10), type: "", cost: "" });
  const [confirmDel, setConfirmDel] = useState("");

  const load = async () => {
    try {
      const [r, a, v, s, c] = await Promise.all([
        listRoutes(),
        listRouteAssignments(),
        listVehicles(),
        listStudents(),
        listClasses(),
      ]);
      setRoutes(r);
      setAssignments(a);
      setVehicles(v);
      setStudents(s);
      setNames(await studentNames());
      setCnames(await classNames());
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

  const routeOf = (id?: string) => routes.find((r) => r.id === id) ?? null;
  const vehicleOf = (id?: string) => vehicles.find((v) => v.id === id) ?? null;
  const studentOf = (id: string) => students.find((s) => s.id === id);
  const studentClass = (sid: string) => cnames[studentOf(sid)?.class_id ?? ""] ?? "—";

  const assignedCount = (routeId: string) =>
    assignments.filter((a) => a.route_id === routeId).length;

  const classList = useMemo(
    () => Array.from(new Set(students.map((s) => cnames[s.class_id] ?? ""))).filter(Boolean).sort(),
    [students, cnames]
  );

  const byStudent = useMemo(
    () => new Map(assignments.map((a) => [a.student_id, a])),
    [assignments]
  );

  const rows = useMemo(
    () =>
      students.map((s) => {
        const a = byStudent.get(s.id);
        return {
          id: a?.id ?? `new-${s.id}`,
          student_id: s.id,
          route_id: a?.route_id,
          pickup_stop: a?.pickup_stop,
          drop_stop: a?.drop_stop,
          monthly_fee: a?.monthly_fee,
          status: a?.status ?? "unassigned",
        };
      }),
    [students, byStudent]
  );

  const filteredRows = useMemo(() => {
    return rows.filter((a) => {
      if (routeFilter !== "All Routes" && a.route_id !== routeFilter) return false;
      if (classFilter !== "All Classes" && studentClass(a.student_id) !== classFilter) return false;
      if (search && !(names[a.student_id] ?? "").toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [rows, routeFilter, classFilter, search, names]);

  async function onAddRoute(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const stops = routeStops.filter((s) => s.name.trim());
    if (!routeForm.name.trim()) {
      setError("Route name is required.");
      return;
    }
    if (stops.length === 0) {
      setError("Add at least one stop.");
      return;
    }
    try {
      const id = await addRoute({
        name: routeForm.name.trim(),
        bus_id: routeForm.bus_id || undefined,
        driver_name: routeForm.driver_name.trim() || undefined,
        capacity: Number(routeForm.capacity) || 60,
        stops,
        status: "active",
      });
      setRouteModal(false);
      setRouteForm(emptyRouteForm);
      setRouteStops([{ name: "", stop_time: "8:00 AM" }]);
      await load();
      setConfirmDel("");
      void id;
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function onDeleteRoute() {
    if (!stopsFor) return;
    await deleteRoute(stopsFor);
    setStopsFor("");
    load();
  }

  async function onRemoveAssignment(studentId: string) {
    const existing = byStudent.get(studentId);
    if (!existing) return;
    await deleteAssignment(existing.id);
    setSelected((cur) => {
      const next = new Set(cur);
      next.delete(studentId);
      return next;
    });
    load();
  }

  const toggleSelected = (id: string) => {
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  async function onApplyToSelected() {
    setError("");
    const route = routeOf(bulkRouteId || undefined);
    if (!route) {
      setError("Choose a route first.");
      return;
    }
    const ids = selected.size > 0 ? Array.from(selected) : filteredRows.map((r) => r.student_id);
    const target = Number(route.capacity);
    let used = assignedCount(route.id);
    for (const sid of ids) {
      const existing = byStudent.get(sid);
      const fits = used < target;
      const data = {
        route_id: route.id,
        pickup_stop: bulkPickup || undefined,
        drop_stop: "School Gate",
        status: (fits ? "assigned" : "conflict") as RouteAssignment["status"],
        monthly_fee: Number(feeInput) || existing?.monthly_fee || 50,
      };
      if (existing) {
        await updateAssignment(existing.id, data);
      } else {
        await addAssignment({ student_id: sid, ...data });
      }
      if (fits) used += 1;
    }
    setBulkRouteId("");
    setBulkPickup("");
    setSelected(new Set());
    load();
  }

  async function onAssignOne() {
    setError("");
    const route = routeOf(assignRoute || undefined);
    if (!route) {
      setError("Pick a route to assign.");
      return;
    }
    if (!assignFor) {
      setError("No student selected.");
      return;
    }
    const existing = byStudent.get(assignFor);
    const fits = assignedCount(route.id) < Number(route.capacity);
    const data = {
      route_id: route.id,
      pickup_stop: assignStop || undefined,
      drop_stop: "School Gate",
      status: (fits ? "assigned" : "conflict") as RouteAssignment["status"],
      monthly_fee: Number(feeInput) || existing?.monthly_fee || 50,
    };
    if (existing) {
      await updateAssignment(existing.id, data);
    } else {
      await addAssignment({ student_id: assignFor, ...data });
    }
    setAssignFor("");
    setAssignRoute("");
    setAssignStop("");
    load();
  }

  async function onAddVehicle(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!vehicleForm.vehicle_no.trim() || !vehicleForm.plate.trim()) {
      setError("Vehicle ID and plate are required.");
      return;
    }
    try {
      await addVehicle({
        vehicle_no: vehicleForm.vehicle_no.trim(),
        plate: vehicleForm.plate.trim(),
        status: "active",
        capacity_seats: Number(vehicleForm.capacity_seats) || 72,
        driver_name: vehicleForm.driver_name.trim() || undefined,
        driver_phone: vehicleForm.driver_phone.trim() || undefined,
        insurance_expiry: vehicleForm.insurance_expiry,
        permit_expiry: vehicleForm.permit_expiry,
      });
      setAddVehicleOpen(false);
      setVehicleForm({
        vehicle_no: "", plate: "", capacity_seats: "72", driver_name: "", driver_phone: "",
        insurance_expiry: "", permit_expiry: "",
      });
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function onLogService(e: React.FormEvent) {
    e.preventDefault();
    const v = vehicleOf(serviceOpenFor);
    if (!v) return;
    if (!serviceForm.type.trim() || !serviceForm.cost) {
      setError("Service type and cost are required.");
      return;
    }
    await logService(v.id, {
      date: serviceForm.date,
      type: serviceForm.type.trim(),
      cost: Number(serviceForm.cost),
    });
    setServiceOpenFor("");
    setServiceForm({ date: new Date().toISOString().slice(0, 10), type: "", cost: "" });
    setError("");
    load();
  }

  const vehicle = vehicleOpen ? vehicles.find((v) => v.id === vehicleOpen) : null;

  const daysTo = (dateStr: string) => {
    const d = new Date(dateStr).getTime();
    const now = Date.now();
    return Math.round((d - now) / 86400000);
  };

  const serviceDays = (dateStr: string) => Math.round((Date.now() - new Date(dateStr).getTime()) / 86400000);

  const insuranceDays = vehicle ? daysTo(vehicle.insurance_expiry) : 0;
  const permitDays = vehicle ? daysTo(vehicle.permit_expiry) : 0;

  return (
    <div className="space-y-6">
      <header className="glass-panel p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Transport</h1>
          <p className="text-sm text-on-surface/60">
            {routes.length} active routes · {vehicles.length} vehicles ·{" "}
            {assignments.filter((a) => a.status === "assigned").length} riders assigned
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <GlassButton variant="ghost" onClick={() => setTab("routes")} className={tab === "routes" ? "bg-primary/15 text-primary font-semibold" : ""}>
            Routes
          </GlassButton>
          <GlassButton variant="ghost" onClick={() => setTab("assignments")} className={tab === "assignments" ? "bg-primary/15 text-primary font-semibold" : ""}>
            Assignments
          </GlassButton>
          <GlassButton variant="ghost" onClick={() => setTab("fleet")} className={tab === "fleet" ? "bg-primary/15 text-primary font-semibold" : ""}>
            Fleet
          </GlassButton>
        </div>
      </header>

      {error && (
        <p className="text-xs text-error bg-rose/10 border border-rose/20 rounded-lg px-3 py-2">{error}</p>
      )}

      {loading ? (
        <p className="text-sm text-on-surface/60 py-8 text-center">Loading…</p>
      ) : (
        <>
          {/* ── ROUTES ─────────────────────────────────────────── */}
          {tab === "routes" && (
            <GlassCard className="p-4 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-base font-semibold">Route Management</h2>
                  <p className="text-xs text-on-surface/60">
                    Overview of active school bus routes for the current term.
                  </p>
                </div>
                <GlassButton onClick={() => setRouteModal(true)}>
                  <span className="material-symbols-outlined text-lg">add_road</span>
                  Add New Route
                </GlassButton>
              </div>

              {routes.length === 0 && (
                <p className="text-sm text-on-surface/60 py-8 text-center">
                  No routes yet. Click &ldquo;Add New Route&rdquo; to create one.
                </p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {routes.map((r) => {
                  const bus = vehicleOf(r.bus_id);
                  const riders = assignedCount(r.id);
                  const capPct = Math.min(100, Math.round((riders / r.capacity) * 100));
                  return (
                    <button
                      key={r.id}
                      onClick={() => setStopsFor(r.id)}
                      className="glass-panel p-4 text-left transition hover:bg-white/50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-on-surface">{r.name}</span>
                        {r.status === "delayed" ? (
                          <StatusPill tone="warning">Delayed</StatusPill>
                        ) : (
                          <StatusPill tone="success">Active</StatusPill>
                        )}
                      </div>
                      <p className="text-xs text-on-surface/60 mb-3">
                        {bus ? `Bus #${bus.vehicle_no}` : "No vehicle assigned"} ·{" "}
                        {r.driver_name ?? "No driver"}
                      </p>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="rounded-lg bg-white/50 border border-white/70 p-2 text-center">
                          <span className="material-symbols-outlined text-base text-primary/50">pin_drop</span>
                          <p className="text-sm font-semibold text-on-surface">{r.stops.length}</p>
                          <p className="text-[10px] text-on-surface/50">Stops</p>
                        </div>
                        <div className="rounded-lg bg-white/50 border border-white/70 p-2 text-center">
                          <span className="material-symbols-outlined text-base text-primary/50">groups</span>
                          <p className="text-sm font-semibold text-on-surface">{riders}</p>
                          <p className="text-[10px] text-on-surface/50">Students</p>
                        </div>
                        <div className="rounded-lg bg-white/50 border border-white/70 p-2 text-center">
                          <span className="material-symbols-outlined text-base text-primary/50">event_seat</span>
                          <p className="text-sm font-semibold text-on-surface">{r.capacity}</p>
                          <p className="text-[10px] text-on-surface/50">Capacity</p>
                        </div>
                      </div>
                      <div className="h-1 rounded-full bg-white/70 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary/70"
                          style={{ width: `${capPct}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-on-surface/50 mt-2">
                        {riders}/{r.capacity} seats taken · tap to view stops
                      </p>
                    </button>
                  );
                })}
              </div>
            </GlassCard>
          )}

          {/* ── ASSIGNMENTS ───────────────────────────────────── */}
          {tab === "assignments" && (
            <GlassCard className="p-4 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-base font-semibold">Assign Routes</h2>
                  <p className="text-xs text-on-surface/60">
                    Manage transportation assignments for students.
                  </p>
                </div>
                <div className="flex gap-2">
                  <GlassButton variant="ghost" onClick={() => {
                    setRouteModal(true);
                    setTab("routes");
                  }}>
                    <span className="material-symbols-outlined text-lg">add_road</span>
                    New Route
                  </GlassButton>
                  <GlassButton onClick={onApplyToSelected} disabled={routes.length === 0}>
                    <span className="material-symbols-outlined text-lg">assignment_turned_in</span>
                    {selected.size > 0 ? `Apply to ${selected.size} Selected` : "Bulk Assign"}
                  </GlassButton>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Select className="!w-auto" value={routeFilter} onChange={(e) => setRouteFilter(e.target.value)}>
                  <option>All Routes</option>
                  {routes.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </Select>
                <Select className="!w-auto" value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
                  <option>All Classes</option>
                  {classList.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
                <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface/40 text-lg">search</span>
                  <Input
                    className="!pl-10"
                    placeholder="Search student…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Select className="!w-auto" value={bulkRouteId} onChange={(e) => setBulkRouteId(e.target.value)}>
                  <option value="">Select route…</option>
                  {routes.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </Select>
                <Select className="!w-auto" value={bulkPickup} onChange={(e) => setBulkPickup(e.target.value)}>
                  <option value="">Select stop…</option>
                  {routes.find((r) => r.id === bulkRouteId)?.stops.map((s) => (
                    <option key={s.name} value={s.name}>{s.name}</option>
                  ))}
                </Select>
                <Input
                  className="!w-24"
                  type="number"
                  min={0}
                  value={feeInput}
                  onChange={(e) => setFeeInput(e.target.value)}
                  placeholder="Fee ₹"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-on-surface/50">
                      <th className="pb-3 pr-3">
                        <input
                          type="checkbox"
                          checked={filteredRows.length > 0 && filteredRows.every((r) => selected.has(r.student_id))}
                          onChange={(e) =>
                            setSelected(e.target.checked ? new Set(filteredRows.map((r) => r.student_id)) : new Set())
                          }
                        />
                      </th>
                      <th className="pb-3 pr-4">Student</th>
                      <th className="pb-3 pr-4 hidden sm:table-cell">Route</th>
                      <th className="pb-3 pr-4 hidden md:table-cell">Stops (Pick / Drop)</th>
                      <th className="pb-3 pr-4 text-right">Monthly Fee</th>
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.length === 0 && (
                      <tr>
                        <td className="py-3 text-on-surface/60" colSpan={7}>
                          No students match the current filters.
                        </td>
                      </tr>
                    )}
                    {filteredRows.map((row) => {
                      const r = routeOf(row.route_id);
                      return (
                        <tr key={row.id} className="border-t border-on-surface/10 hover:bg-white/40">
                          <td className="py-3 pr-3">
                            <input
                              type="checkbox"
                              checked={selected.has(row.student_id)}
                              onChange={() => toggleSelected(row.student_id)}
                            />
                          </td>
                          <td className="py-3 pr-4">
                            <p className="font-medium text-on-surface">{names[row.student_id] ?? row.student_id}</p>
                            <p className="text-[11px] text-on-surface/50">
                              {studentClass(row.student_id)}
                            </p>
                          </td>
                          <td className="py-3 pr-4 hidden sm:table-cell text-on-surface/70">
                            {r?.name ?? "Unassigned"}
                          </td>
                          <td className="py-3 pr-4 hidden md:table-cell text-[11px] text-on-surface/60">
                            {row.pickup_stop ?? "—"} → {row.drop_stop ?? "School Gate"}
                          </td>
                          <td className="py-3 pr-4 text-right text-on-surface/80">
                            {row.monthly_fee ? `₹${row.monthly_fee.toLocaleString("en-IN")}` : "—"}
                          </td>
                          <td className="py-3 pr-4">
                            {row.status === "assigned" && <StatusPill tone="success">Assigned</StatusPill>}
                            {row.status === "draft" && <StatusPill tone="primary">Draft</StatusPill>}
                            {row.status === "pending" && <StatusPill tone="neutral">Pending</StatusPill>}
                            {row.status === "conflict" && <StatusPill tone="error">Stop Full</StatusPill>}
                            {row.status === "unassigned" && <StatusPill tone="neutral">Unassigned</StatusPill>}
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex justify-end gap-2">
                            <GlassButton
                              variant="ghost"
                              onClick={() => {
                                setAssignFor(row.student_id);
                                setAssignRoute(row.route_id ?? "");
                                setAssignStop(row.pickup_stop ?? "");
                                setFeeInput(String(row.monthly_fee ?? 50));
                              }}
                            >
                              {r ? "Edit" : "Assign"}
                            </GlassButton>
                            {r && (
                              <GlassButton variant="danger" onClick={() => onRemoveAssignment(row.student_id)}>
                                Remove
                              </GlassButton>
                            )}
                          </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 mt-4">
                <p className="text-xs text-on-surface/50">
                  Showing {filteredRows.length} of {rows.length} students
                </p>
                {selected.size > 0 && (
                  <GlassButton variant="ghost" onClick={() => setSelected(new Set())}>Clear selection</GlassButton>
                )}
              </div>
            </GlassCard>
          )}

          {/* ── FLEET ─────────────────────────────────────────── */}
          {tab === "fleet" && (
            <GlassCard className="p-4 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-base font-semibold">Vehicle Fleet</h2>
                  <p className="text-xs text-on-surface/60">
                    Monitor all school transport vehicles, drivers, and maintenance.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Select
                    className="!w-auto"
                    value={fleetFilter}
                    onChange={(e) => setFleetFilter(e.target.value as typeof fleetFilter)}
                  >
                    <option value="all">All Vehicles</option>
                    <option value="active">Active</option>
                    <option value="maintenance">Maintenance</option>
                  </Select>
                  <GlassButton onClick={() => setAddVehicleOpen(true)}>
                    <span className="material-symbols-outlined text-lg">directions_bus</span>
                    Add Vehicle
                  </GlassButton>
                </div>
              </div>

              {vehicles.filter((v) => fleetFilter === "all" || v.status === fleetFilter).length === 0 && (
                <p className="text-sm text-on-surface/60 py-8 text-center">
                  No vehicles in this view yet.
                </p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {vehicles
                  .filter((v) => fleetFilter === "all" || v.status === fleetFilter)
                  .map((v) => {
                    const r = routeOf(v.route_id);
                    return (
                      <button key={v.id} onClick={() => setVehicleOpen(v.id)} className="glass-panel p-4 text-left transition hover:bg-white/50">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-2xl text-primary/60">directions_bus</span>
                            <div>
                              <p className="font-semibold text-on-surface">{v.vehicle_no}</p>
                              <p className="text-[11px] text-on-surface/50">{v.plate}</p>
                            </div>
                          </div>
                          {v.status === "maintenance" ? (
                            <StatusPill tone="warning">Maintenance</StatusPill>
                          ) : (
                            <StatusPill tone="success">Active</StatusPill>
                          )}
                        </div>
                        <p className="text-xs text-on-surface/60 mt-3">
                          Capacity {v.capacity_seats} Seater ·{" "}
                          {r ? `Route ${r.name}` : "Route Unassigned"}
                        </p>
                        {v.driver_name ? (
                          <p className="text-xs text-on-surface/80 mt-1 flex items-center gap-1">
                            <span className="material-symbols-outlined text-base text-primary/50">person</span>
                            {v.driver_name} · {v.driver_phone}
                          </p>
                        ) : (
                          <p className="text-xs text-on-surface/40 mt-1 flex items-center gap-1">
                            <span className="material-symbols-outlined text-base text-on-surface/30">person_off</span>
                            No Driver Assigned
                          </p>
                        )}
                        <p className="text-[11px] text-primary mt-3">View Details →</p>
                      </button>
                    );
                  })}
              </div>
            </GlassCard>
          )}
        </>
      )}

      {/* ── Add route modal ──────────────────────────────────── */}
      <Modal open={routeModal} onClose={() => setRouteModal(false)} title="Add New Route">
        <form className="space-y-4" onSubmit={onAddRoute}>
          <Field label="Route Name *">
            <Input placeholder="e.g. North Campus Express" value={routeForm.name} onChange={(e) => setRouteForm((f) => ({ ...f, name: e.target.value }))} required />
          </Field>

          <div>
            <p className="text-xs font-medium text-on-surface/70 mb-2">Stop List</p>
            <div className="space-y-2">
              {routeStops.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-on-surface/30 text-base">drag_indicator</span>
                  <span className="text-sm text-on-surface/60 w-5">{i + 1}.</span>
                  <Input
                    placeholder="Stop name (e.g. Oakwood Park)"
                    value={s.name}
                    onChange={(e) =>
                      setRouteStops((cur) => cur.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))
                    }
                  />
                  <Input
                    className="!w-28"
                    placeholder="Time"
                    value={s.stop_time}
                    onChange={(e) =>
                      setRouteStops((cur) => cur.map((x, j) => (j === i ? { ...x, stop_time: e.target.value } : x)))
                    }
                  />
                  {routeStops.length > 1 && (
                    <button
                      type="button"
                      className="text-on-surface/40 hover:text-error transition"
                      onClick={() => setRouteStops((cur) => cur.filter((_, j) => j !== i))}
                      aria-label="Remove stop"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setRouteStops((cur) => [...cur, { name: "", stop_time: "8:00 AM" }])}
              className="text-xs text-primary mt-3 flex items-center gap-1 hover:underline"
            >
              <span className="material-symbols-outlined text-base">add_circle</span>
              Add Another Stop
            </button>
          </div>

          <Field label="Bus">
            <Select value={routeForm.bus_id} onChange={(e) => setRouteForm((f) => ({ ...f, bus_id: e.target.value }))}>
              <option value="">Unassigned — pick later</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.vehicle_no} · {v.plate}</option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Driver">
              <Input placeholder="Driver name" value={routeForm.driver_name} onChange={(e) => setRouteForm((f) => ({ ...f, driver_name: e.target.value }))} />
            </Field>
            <Field label="Capacity">
              <Input type="number" min="1" value={routeForm.capacity} onChange={(e) => setRouteForm((f) => ({ ...f, capacity: e.target.value }))} />
            </Field>
          </div>

          {error && (
            <p className="text-xs text-error bg-rose/10 border border-rose/20 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <GlassButton type="button" variant="ghost" onClick={() => setRouteModal(false)}>Cancel</GlassButton>
            <GlassButton type="submit">Save Route</GlassButton>
          </div>
        </form>
      </Modal>

      {/* ── Route stops modal ────────────────────────────────── */}
      <Modal open={!!stopsFor} onClose={() => setStopsFor("")} title={routeOf(stopsFor)?.name ?? "Route"}>
        <div className="space-y-3 mb-6">
          {(routeOf(stopsFor)?.stops ?? []).map((s, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg bg-white/50 border border-white/70 px-3 py-2 text-sm">
              <span className="material-symbols-outlined text-base text-primary/50">schedule</span>
              <span className="flex-1 text-on-surface/80">{s.name}</span>
              <span className="text-on-surface/60">{s.stop_time}</span>
            </div>
          ))}
          {(routeOf(stopsFor)?.stops.length ?? 0) === 0 && (
            <p className="text-sm text-on-surface/60">No stops saved for this route.</p>
          )}
        </div>
        <div className="flex justify-end gap-3">
          <GlassButton variant="danger" onClick={onDeleteRoute}>Delete Route</GlassButton>
          <GlassButton variant="ghost" onClick={() => setStopsFor("")}>Close</GlassButton>
        </div>
      </Modal>

      {/* ── Assign single student modal ──────────────────────── */}
      <Modal open={!!assignFor} onClose={() => setAssignFor("")} title="Assign Route">
        <div className="space-y-4">
          <p className="mb-4 rounded-lg bg-white/50 border border-white/70 px-3 py-2 text-sm text-on-surface/80">
            {assignFor ? (names[assignFor] ?? "") : ""}
          </p>
          <Field label="Route">
            <Select value={assignRoute} onChange={(e) => setAssignRoute(e.target.value)}>
              <option value="">Select route…</option>
              {routes.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Pickup Stop">
            <Select value={assignStop} onChange={(e) => setAssignStop(e.target.value)}>
              <option value="">Select stop…</option>
              {routeOf(assignRoute)?.stops.map((s) => (
                <option key={s.name} value={s.name}>{s.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Monthly Fee (₹)">
            <Input type="number" min={0} value={feeInput} onChange={(e) => setFeeInput(e.target.value)} />
          </Field>
          {error && (
            <p className="text-xs text-error bg-rose/10 border border-rose/20 rounded-lg px-3 py-2">{error}</p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <GlassButton variant="ghost" onClick={() => setAssignFor("")}>Cancel</GlassButton>
            <GlassButton onClick={onAssignOne}>Assign</GlassButton>
          </div>
        </div>
      </Modal>

      {/* ── Vehicle details modal ────────────────────────────── */}
      <Modal open={!!vehicleOpen} onClose={() => setVehicleOpen("")} title={vehicle ? `${vehicle.vehicle_no} · ${vehicle.plate}` : "Vehicle"}>
        {vehicle && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-white/50 border border-white/70 p-3">
                <p className="text-xs text-on-surface/50 mb-1">Status</p>
                {vehicle.status === "active" ? (
                  <StatusPill tone="success">Active</StatusPill>
                ) : (
                  <StatusPill tone="warning">Maintenance</StatusPill>
                )}
              </div>
              <div className="rounded-lg bg-white/50 border border-white/70 p-3">
                <p className="text-xs text-on-surface/50 mb-1">Capacity</p>
                <p className="text-sm font-semibold text-on-surface">{vehicle.capacity_seats} Seater</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-on-surface/70 mb-2">Compliance &amp; Documents</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-lg bg-white/50 border border-white/70 px-3 py-2 text-sm">
                  <span className="flex items-center gap-2 text-on-surface/80">
                    <span className="material-symbols-outlined text-base text-primary/50">shield</span>
                    Insurance
                  </span>
                  <span className="text-xs text-on-surface/60">
                    {insuranceDays >= 0 && insuranceDays <= 60 ? (
                      <StatusPill tone="warning">Expires {insuranceDays} days</StatusPill>
                    ) : (
                      <StatusPill tone="success">Valid · {new Date(vehicle.insurance_expiry).toLocaleDateString()}</StatusPill>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-white/50 border border-white/70 px-3 py-2 text-sm">
                  <span className="flex items-center gap-2 text-on-surface/80">
                    <span className="material-symbols-outlined text-base text-primary/50">badge</span>
                    Permit
                  </span>
                  <span className="text-xs text-on-surface/60">
                    {permitDays < 0 ? (
                      <StatusPill tone="error">Expired</StatusPill>
                    ) : (
                      <StatusPill tone="neutral">{new Date(vehicle.permit_expiry).toLocaleDateString()}</StatusPill>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {vehicle.driver_name && (
              <div className="flex items-center gap-3 rounded-lg bg-white/50 border border-white/70 px-3 py-2 text-sm">
                <span className="material-symbols-outlined text-xl text-primary/50">person</span>
                <div>
                  <p className="font-medium text-on-surface">{vehicle.driver_name}</p>
                  <p className="text-xs text-on-surface/50">{vehicle.driver_phone}</p>
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-on-surface/70">Maintenance History</p>
                <button
                  onClick={() => { setServiceOpenFor(vehicle.id); setError(""); }}
                  className="text-xs text-primary flex items-center gap-1 hover:underline"
                >
                  <span className="material-symbols-outlined text-base">edit_document</span>
                  Log New Service
                </button>
              </div>
              {vehicle.services.length === 0 ? (
                <p className="text-xs text-on-surface/40">No service records yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {vehicle.services.map((s, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg bg-white/50 border border-white/70 px-3 py-2 text-sm">
                      <span className="flex items-center gap-2 text-on-surface/80">
                        <span className="material-symbols-outlined text-base text-primary/50">build</span>
                        <span>
                          {s.type}
                          <span className="text-[11px] text-on-surface/50 ml-2">
                            {new Date(s.date).toLocaleDateString()} · {serviceDays(s.date) >= 0 ? `${serviceDays(s.date)}d ago` : ""}
                          </span>
                        </span>
                      </span>
                      <span className="text-on-surface/80">₹{s.cost.toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ── Add vehicle modal ────────────────────────────────── */}
      <Modal open={addVehicleOpen} onClose={() => setAddVehicleOpen(false)} title="Add Vehicle">
        <form className="space-y-4" onSubmit={onAddVehicle}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Vehicle ID *">
              <Input placeholder="e.g. BUS-42" value={vehicleForm.vehicle_no} onChange={(e) => setVehicleForm((f) => ({ ...f, vehicle_no: e.target.value }))} required />
            </Field>
            <Field label="Plate *">
              <Input placeholder="e.g. ABC-1234" value={vehicleForm.plate} onChange={(e) => setVehicleForm((f) => ({ ...f, plate: e.target.value }))} required />
            </Field>
            <Field label="Capacity">
              <Input type="number" min="1" value={vehicleForm.capacity_seats} onChange={(e) => setVehicleForm((f) => ({ ...f, capacity_seats: e.target.value }))} />
            </Field>
            <Field label="Driver Phone">
              <Input placeholder="555-0192" value={vehicleForm.driver_phone} onChange={(e) => setVehicleForm((f) => ({ ...f, driver_phone: e.target.value }))} />
            </Field>
            <Field label="Driver Name">
              <Input placeholder="Driver name" value={vehicleForm.driver_name} onChange={(e) => setVehicleForm((f) => ({ ...f, driver_name: e.target.value }))} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Insurance Expiry">
              <Input type="date" value={vehicleForm.insurance_expiry} onChange={(e) => setVehicleForm((f) => ({ ...f, insurance_expiry: e.target.value }))} />
            </Field>
            <Field label="Permit Expiry">
              <Input type="date" value={vehicleForm.permit_expiry} onChange={(e) => setVehicleForm((f) => ({ ...f, permit_expiry: e.target.value }))} />
            </Field>
          </div>
          {error && (
            <p className="text-xs text-error bg-rose/10 border border-rose/20 rounded-lg px-3 py-2">{error}</p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <GlassButton type="button" variant="ghost" onClick={() => setAddVehicleOpen(false)}>Cancel</GlassButton>
            <GlassButton type="submit">Add Vehicle</GlassButton>
          </div>
        </form>
      </Modal>

      {/* ── Log service modal ────────────────────────────────── */}
      <Modal open={!!serviceOpenFor} onClose={() => setServiceOpenFor("")} title="Log New Service">
        <form className="space-y-4" onSubmit={onLogService}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Date">
              <Input type="date" value={serviceForm.date} onChange={(e) => setServiceForm((f) => ({ ...f, date: e.target.value }))} />
            </Field>
            <Field label="Cost (₹)">
              <Input type="number" min="0" placeholder="e.g. 8000" value={serviceForm.cost} onChange={(e) => setServiceForm((f) => ({ ...f, cost: e.target.value }))} />
            </Field>
          </div>
          <Field label="Service Type *">
            <Input placeholder="e.g. Oil Change, Brake Pads, Annual Inspection" value={serviceForm.type} onChange={(e) => setServiceForm((f) => ({ ...f, type: e.target.value }))} required />
          </Field>
          {error && (
            <p className="text-xs text-error bg-rose/10 border border-rose/20 rounded-lg px-3 py-2">{error}</p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <GlassButton type="button" variant="ghost" onClick={() => setServiceOpenFor("")}>Cancel</GlassButton>
            <GlassButton type="submit">Log Service</GlassButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}