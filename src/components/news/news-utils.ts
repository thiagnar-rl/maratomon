const fmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

/** "10 de nov., 14:30" no fuso de Brasília. */
export function newsDate(iso: string) {
  return fmt.format(new Date(iso)).replace(" de ", " ").replace(".", "");
}
