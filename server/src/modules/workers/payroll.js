const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const roundMoney = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

export const monthBounds = (year, month) => {
  const monthNumber = String(month + 1).padStart(2, "0");
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return {
    from: `${year}-${monthNumber}-01`,
    to: `${year}-${monthNumber}-${String(lastDay).padStart(2, "0")}`,
  };
};

export const workerWasEmployedInMonth = (worker, year, month) => {
  const { from, to } = monthBounds(year, month);
  return worker.joiningDate <= to && (!worker.leftDate || worker.leftDate >= from);
};

const workingDaysInMonth = (year, month, weekOffDay) => {
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  let count = 0;

  for (let day = 1; day <= lastDay; day += 1) {
    const dayName = DAY_NAMES[new Date(Date.UTC(year, month, day)).getUTCDay()];
    if (dayName !== weekOffDay) count += 1;
  }

  return count;
};

export const calculateWorkerPayroll = (worker, attendance, advances, year, month, payment) => {
  const present = attendance.filter((entry) => entry.status === "present").length;
  const half = attendance.filter((entry) => entry.status === "half_day").length;
  const absent = attendance.filter((entry) => entry.status === "absent").length;
  const overtime = attendance.reduce((sum, entry) => sum + Number(entry.overtimeHours || 0), 0);
  const workingDays = workingDaysInMonth(year, month, worker.weekOffDay);
  const dailySalary = workingDays ? Number(worker.monthlySalary) / workingDays : 0;
  const grossSalary = roundMoney(
    present * dailySalary + half * 0.5 * dailySalary + overtime * Number(worker.overtimeRate || 0),
  );
  const advance = roundMoney(advances.reduce((sum, entry) => sum + Number(entry.amount || 0), 0));
  const calculatedNetPayable = roundMoney(Math.max(0, grossSalary - advance));
  const paid = Boolean(payment);

  return {
    present,
    half,
    absent,
    overtime,
    dailySalary: roundMoney(dailySalary),
    grossSalary,
    advance,
    calculatedNetPayable,
    // Once settled, the stored amount is authoritative even if attendance is edited later.
    netPayable: paid ? Number(payment.amountPaid) : calculatedNetPayable,
    paid,
    amountPaid: paid ? Number(payment.amountPaid) : null,
    paidDate: payment?.paidDate || null,
  };
};

export const monthsSinceJoining = (worker, throughYear, throughMonth) => {
  const [startYear, startMonth] = worker.joiningDate.split("-").map(Number);
  let year = startYear;
  let month = startMonth - 1;
  let endYear = throughYear;
  let endMonth = throughMonth;

  if (worker.leftDate) {
    const [leftYear, leftMonth] = worker.leftDate.split("-").map(Number);
    if (leftYear < endYear || (leftYear === endYear && leftMonth - 1 < endMonth)) {
      endYear = leftYear;
      endMonth = leftMonth - 1;
    }
  }

  const months = [];
  while (year < endYear || (year === endYear && month <= endMonth)) {
    months.push({ year, month });
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }
  return months;
};
