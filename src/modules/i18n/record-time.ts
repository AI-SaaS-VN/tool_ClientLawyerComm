// REQ-MSG-11 / REQ-FILE-04. The clock uses the timezone passed in, which on
// the page is the computer's own zone. The offset is printed beside the time.
export function formatRecordTime(input: string | Date, timeZone?: string): string {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return "";
  const zone = timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  const clock = `${pick("year")}-${pick("month")}-${pick("day")} ${pick("hour")}:${pick("minute")}`;
  return `${clock} ${offsetLabel(date, zone)}`;
}

function offsetLabel(date: Date, timeZone: string): string {
  const name =
    new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "shortOffset" })
      .formatToParts(date)
      .find((part) => part.type === "timeZoneName")?.value ?? "";
  const match = name.match(/(?:GMT|UTC)([+-])(\d{1,2})(?::(\d{2}))?/i);
  if (!match) return "UTC";
  const hours = String(Number(match[2]));
  const minutes = match[3] && match[3] !== "00" ? `:${match[3]}` : "";
  return `UTC${match[1]}${hours}${minutes}`;
}
