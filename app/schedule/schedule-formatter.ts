export type InternalScheduleItem = {
  id: string;
  location_name: string;
  program_name: string;
  start_date: string;
  end_date?: string | null;
  link_url?: string | null;
  status: "confirmed" | "new_or_changed" | "ishanga_pending" | "center_unconfirmed" | "hall_unfinalized" | "cancelled";
  emoji_prefix: string;
};

const STATUS_ICONS: Record<string, string> = {
  confirmed: "✅",
  new_or_changed: "🌦️",
  ishanga_pending: "❓",
  center_unconfirmed: "‼️",
  hall_unfinalized: "❕",
  cancelled: "❌",
};

export function formatDateRange(startDateStr: string, endDateStr?: string | null): string {
  const start = new Date(startDateStr);
  const startMonth = start.toLocaleDateString("en-US", { month: "short" });
  const startDay = start.getDate();

  if (!endDateStr) {
    return `${startMonth} ${startDay}`;
  }

  const end = new Date(endDateStr);
  const endMonth = end.toLocaleDateString("en-US", { month: "short" });
  const endDay = end.getDate();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} to ${endDay}`;
  }
  return `${startMonth} ${startDay} to ${endMonth} ${endDay}`;
}

export function formatWhatsappText(items: InternalScheduleItem[]): string {
  let text = `STATUS UPDATE\n\nISHA KERALA PROGRAMS\nUpcoming Programs in Kerala:\nhttps://isha.co/Kerala\n\n`;

  items.forEach((item) => {
    const emoji = item.emoji_prefix || "🌊";
    const dateStr = formatDateRange(item.start_date, item.end_date);
    const statusIcon = STATUS_ICONS[item.status] || "";
    
    text += `${emoji} ${dateStr}\n`;
    text += `       ${item.location_name}${statusIcon}\n`;
    text += `${item.program_name}\n`;
    if (item.link_url) {
      text += `${item.link_url}\n`;
    }
    text += `\n`;
  });

  text += `🪷🪷🪷🪷🪷🪷🪷\n\n`;
  text += `🌦️ Newly added or changed\n`;
  text += `❓ Ishanga yet to be assigned\n`;
  text += `‼️ Center yet to confirm\n`;
  text += `❕ Hall yet to be finalized\n`;
  text += `✅ Confirmed\n`;
  text += `❌ Cancelled`;

  return text;
}