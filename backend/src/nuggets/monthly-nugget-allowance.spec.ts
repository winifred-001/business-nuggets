import { monthlyNuggetAllowanceExpiry } from "./monthly-nugget-allowance";

describe("monthly Nugget selection allowance", () => {
  it("ends on the same date of the following calendar month", () => {
    expect(monthlyNuggetAllowanceExpiry("2026-11-23T11:30:45.000Z")).toBe("2026-12-23T11:30:45.000Z");
  });
  it("clamps the last day for February", () => {
    expect(monthlyNuggetAllowanceExpiry("2026-01-31T08:00:00.000Z")).toBe("2026-02-28T08:00:00.000Z");
    expect(monthlyNuggetAllowanceExpiry("2028-01-31T08:00:00.000Z")).toBe("2028-02-29T08:00:00.000Z");
  });
  it("handles crossing from December into January", () => {
    expect(monthlyNuggetAllowanceExpiry("2026-12-31T23:59:00.000Z")).toBe("2027-01-31T23:59:00.000Z");
  });
  it("does not assume every month contains thirty days", () => {
    expect(monthlyNuggetAllowanceExpiry("2026-02-01T08:00:00.000Z")).toBe("2026-03-01T08:00:00.000Z");
  });
});
