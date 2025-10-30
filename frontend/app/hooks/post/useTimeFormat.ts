import {
  formatDistanceToNow,
  differenceInSeconds,
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
} from "date-fns";
import { es } from "date-fns/locale";

/**
 * Hook para formatear fechas de manera consistente
 */
export function useTimeFormat() {
  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);

    const seconds = differenceInSeconds(now, past);
    const minutes = differenceInMinutes(now, past);
    const hours = differenceInHours(now, past);
    const days = differenceInDays(now, past);

    if (days > 0) {
      return `${days} ${days === 1 ? "día" : "días"}`;
    } else if (hours > 0) {
      return `${hours} ${hours === 1 ? "hora" : "horas"}`;
    } else if (minutes > 0) {
      return `${minutes} ${minutes === 1 ? "minuto" : "minutos"}`;
    } else {
      return `${seconds} ${seconds === 1 ? "segundo" : "segundos"}`;
    }
  };

  const formatRelativeTime = (date: string) => {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: es,
    });
  };

  return { formatTimeAgo, formatRelativeTime };
}
