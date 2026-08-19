import i18next from "i18next";

const { t } = i18next;

export const formatTimestamp = (isoTimestamp: string): string => {
  if (!isoTimestamp) return t("common.timeAgo.unknown");

  const diffMs = Date.now() - new Date(isoTimestamp).getTime();
  const totalMinutes = Math.floor(diffMs / 60_000);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);

  if (totalMinutes < 1) return t("common.timeAgo.lessThanMinute");
  if (totalMinutes < 60) return t("common.timeAgo.minutesAgo", { count: totalMinutes });

  if (totalHours < 24) {
    const remainingMinutes = totalMinutes % 60;
    if (totalHours === 1) {
      return remainingMinutes > 0
        ? t("common.timeAgo.oneHourAndMinutesAgo", { minutes: remainingMinutes })
        : t("common.timeAgo.oneHourAgo");
    }
    return remainingMinutes > 0
      ? t("common.timeAgo.hoursAndMinutesAgo", { hours: totalHours, minutes: remainingMinutes })
      : t("common.timeAgo.hoursAgo", { count: totalHours });
  }

  const remainingHours = totalHours % 24;
  if (totalDays === 1) {
    return remainingHours > 0
      ? t("common.timeAgo.oneDayAndHoursAgo", { hours: remainingHours })
      : t("common.timeAgo.oneDayAgo");
  }
  return remainingHours > 0
    ? t("common.timeAgo.daysAndHoursAgo", { days: totalDays, hours: remainingHours })
    : t("common.timeAgo.daysAgo", { count: totalDays });
};
