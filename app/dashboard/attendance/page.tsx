"use client";

import { useEffect, useState } from "react";
import { listClasses } from "@/lib/data";
import { Field, GlassCard, Select } from "@/components/ui";
import { useTeacherScope } from "@/components/dashboard/teacher-scope";
import { ClassAttendance } from "@/components/dashboard/class-attendance";

type Class = { id: string; name: string; section: string };

export default function AttendancePage() {
  const scope = useTeacherScope();
  const [classes, setClasses] = useState<Class[]>([]);
  const [classId, setClassId] = useState("");

  useEffect(() => {
    listClasses()
      .then((all) =>
        setClasses(scope.isAdmin ? all : all.filter((c) => scope.classIds.includes(c.id)))
      )
      .catch(() => {});
  }, [scope]);

  return (
    <div className="space-y-6">
      <header className="glass-panel p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Daily Attendance</h1>
          <p className="text-sm text-on-surface/60">
            Mark present, late or absent for each student.
          </p>
        </div>
      </header>

      {!scope.ready ? (
        <p className="text-sm text-on-surface/60 py-8 text-center">Loading…</p>
      ) : !scope.isAdmin && scope.classIds.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <p className="text-sm text-on-surface/60">
            No classes assigned to you yet. Ask an admin to assign you as class teacher.
          </p>
        </GlassCard>
      ) : (
        <GlassCard className="p-4 sm:p-6">
          <Field label="Class">
            <Select value={classId} onChange={(e) => setClassId(e.target.value)}>
              <option value="">Select class…</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.section}
                </option>
              ))}
            </Select>
          </Field>
          <div className="mt-6">{classId ? <ClassAttendance classId={classId} /> : null}</div>
        </GlassCard>
      )}
    </div>
  );
}