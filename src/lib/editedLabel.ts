/** "Edited 2 hours ago", "Edited yesterday", "Edited Nov 3". */
export const editedLabel = (date?: Date, now: Date = new Date()) => {
  if (!date) return "";
  const d = new Date(date);
  const seconds = Math.round((now.getTime() - d.getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (seconds < 60) return "Edited just now";
  if (seconds < 3600) return `Edited ${rtf.format(-Math.round(seconds / 60), "minute")}`;
  if (seconds < 86400) return `Edited ${rtf.format(-Math.round(seconds / 3600), "hour")}`;
  if (seconds < 7 * 86400) return `Edited ${rtf.format(-Math.round(seconds / 86400), "day")}`;
  const sameYear = d.getFullYear() === now.getFullYear();
  return `Edited ${d.toLocaleDateString("en", { month: "short", day: "numeric", ...(sameYear ? {} : { year: "numeric" }) })}`;
};
