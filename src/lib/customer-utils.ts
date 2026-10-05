export function isRestaurantOpen(openingHours?: string | null, now = new Date()) {
  if (!openingHours) return true;
  const match = openingHours.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
  if (!match) return false;

  const [, startHour, startMinute, endHour, endMinute] = match;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const opensAt = Number(startHour) * 60 + Number(startMinute);
  const closesAt = Number(endHour) * 60 + Number(endMinute);

  return closesAt >= opensAt
    ? currentMinutes >= opensAt && currentMinutes < closesAt
    : currentMinutes >= opensAt || currentMinutes < closesAt;
}
