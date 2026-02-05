export function formatarDataUTC(date: string) {
  if (!date) return date; // Tratamento básico para valores vazios
  return date.endsWith('Z') ? date : `${date}Z`;
}