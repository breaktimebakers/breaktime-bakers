import assert from "node:assert/strict";
import test from "node:test";
import { calculateWorkerPayroll, monthBounds, monthsSinceJoining, workerWasEmployedInMonth } from "./payroll.js";

const worker = {
  id: "worker-1",
  joiningDate: "2026-01-15",
  leftDate: null,
  monthlySalary: 26000,
  overtimeRate: 100,
  weekOffDay: "Sunday",
};

test("payroll calculates attendance, overtime, advances, and net payable", () => {
  const attendance = [
    { status: "present", overtimeHours: 2 },
    { status: "present", overtimeHours: 0 },
    { status: "half_day", overtimeHours: 0 },
    { status: "absent", overtimeHours: 0 },
    { status: "week_off", overtimeHours: 0 },
  ];
  const result = calculateWorkerPayroll(worker, attendance, [{ amount: 500 }], 2026, 8);

  assert.equal(result.present, 2);
  assert.equal(result.half, 1);
  assert.equal(result.absent, 1);
  assert.equal(result.overtime, 2);
  assert.equal(result.grossSalary, 2700);
  assert.equal(result.advance, 500);
  assert.equal(result.netPayable, 2200);
});

test("a paid payroll row uses its saved payment snapshot", () => {
  const result = calculateWorkerPayroll(worker, [], [], 2026, 8, {
    amountPaid: 4321.5,
    paidDate: "2026-09-06",
  });

  assert.equal(result.calculatedNetPayable, 0);
  assert.equal(result.netPayable, 4321.5);
  assert.equal(result.paid, true);
  assert.equal(result.paidDate, "2026-09-06");
});

test("month and employment helpers handle boundaries", () => {
  assert.deepEqual(monthBounds(2026, 1), { from: "2026-02-01", to: "2026-02-28" });
  assert.equal(workerWasEmployedInMonth(worker, 2025, 11), false);
  assert.equal(workerWasEmployedInMonth(worker, 2026, 0), true);
  assert.deepEqual(monthsSinceJoining({ ...worker, leftDate: "2026-03-02" }, 2026, 8), [
    { year: 2026, month: 0 },
    { year: 2026, month: 1 },
    { year: 2026, month: 2 },
  ]);
});
