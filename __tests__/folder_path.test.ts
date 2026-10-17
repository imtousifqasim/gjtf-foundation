import { getProofFolderPath } from "../lib/storage/folderPath";

describe("getProofFolderPath: Automatic Year -> MonthName -> Date Folders in Asia/Karachi", () => {
  test("generates expected folder path in regular month", () => {
    // 2026-10-17 12:00 PKT
    const date = new Date("2026-10-17T07:00:00.000Z"); // 07:00 UTC = 12:00 PKT
    const info = getProofFolderPath(date, "Asia/Karachi");

    expect(info.year).toBe("2026");
    expect(info.monthNumber).toBe("10");
    expect(info.monthName).toBe("October");
    expect(info.monthFolder).toBe("October");
    expect(info.day).toBe("17");
    expect(info.dateFolder).toBe("17-October");
    expect(info.pathKey).toBe("2026/10/17");
    expect(info.folderPath).toBe("2026/October/17-October");
  });

  test("critical edge case: 00:30 PKT on 1 November must resolve to 2026/November/01-November (not October)", () => {
    // 00:30 PKT on Nov 1 is 2026-10-31T19:30:00Z in UTC
    const date = new Date("2026-10-31T19:30:00.000Z");
    const info = getProofFolderPath(date, "Asia/Karachi");

    expect(info.year).toBe("2026");
    expect(info.monthNumber).toBe("11");
    expect(info.monthName).toBe("November");
    expect(info.monthFolder).toBe("November");
    expect(info.day).toBe("01");
    expect(info.dateFolder).toBe("01-November");
    expect(info.pathKey).toBe("2026/11/01");
    expect(info.folderPath).toBe("2026/November/01-November");
  });

  test("edge case: 23:59 PKT on 31 October resolves to 2026/October/31-October", () => {
    // 23:59 PKT on Oct 31 is 2026-10-31T18:59:00Z in UTC
    const date = new Date("2026-10-31T18:59:00.000Z");
    const info = getProofFolderPath(date, "Asia/Karachi");

    expect(info.year).toBe("2026");
    expect(info.monthNumber).toBe("10");
    expect(info.monthName).toBe("October");
    expect(info.monthFolder).toBe("October");
    expect(info.day).toBe("31");
    expect(info.dateFolder).toBe("31-October");
    expect(info.folderPath).toBe("2026/October/31-October");
  });

  test("critical year rollover: 23:59 PKT on 31 Dec resolves to 2026/December/31-December", () => {
    // 23:59 PKT on Dec 31, 2026 is 2026-12-31T18:59:00Z in UTC
    const date = new Date("2026-12-31T18:59:00.000Z");
    const info = getProofFolderPath(date, "Asia/Karachi");

    expect(info.year).toBe("2026");
    expect(info.monthNumber).toBe("12");
    expect(info.monthName).toBe("December");
    expect(info.monthFolder).toBe("December");
    expect(info.day).toBe("31");
    expect(info.dateFolder).toBe("31-December");
    expect(info.pathKey).toBe("2026/12/31");
    expect(info.folderPath).toBe("2026/December/31-December");
  });

  test("critical year rollover: 00:01 PKT on 1 Jan 2027 resolves to 2027/January/01-January", () => {
    // 00:01 PKT on Jan 1, 2027 is 2026-12-31T19:01:00Z in UTC
    const date = new Date("2026-12-31T19:01:00.000Z");
    const info = getProofFolderPath(date, "Asia/Karachi");

    expect(info.year).toBe("2027");
    expect(info.monthNumber).toBe("01");
    expect(info.monthName).toBe("January");
    expect(info.monthFolder).toBe("January");
    expect(info.day).toBe("01");
    expect(info.dateFolder).toBe("01-January");
    expect(info.pathKey).toBe("2027/01/01");
    expect(info.folderPath).toBe("2027/January/01-January");
  });
});
