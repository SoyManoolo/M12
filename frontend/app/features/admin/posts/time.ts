import { differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds } from 'date-fns';

export function formatTimeAgo(date: string): string {
  const now = new Date();
  const past = new Date(date);
  const seconds = differenceInSeconds(now, past);
  const minutes = differenceInMinutes(now, past);
  const hours = differenceInHours(now, past);
  const days = differenceInDays(now, past);
  if (days > 0) return `${days} ${days === 1 ? 'día' : 'días'}`;
  if (hours > 0) return `${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  if (minutes > 0) return `${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
  return `${seconds} ${seconds === 1 ? 'segundo' : 'segundos'}`;
}
