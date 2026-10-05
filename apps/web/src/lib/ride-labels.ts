export function tripStatusLabel(status: string) {
  const labels: Record<string, string> = {
    SCHEDULED: "Agendada",
    MATCHING: "Procurando combinações",
    DRIVER_ON_THE_WAY: "Motorista a caminho",
    ARRIVING: "Motorista chegando",
    WAITING_PASSENGER: "Aguardando passageiro",
    IN_PROGRESS: "Em viagem",
    ARRIVED: "Destino alcançado",
    COMPLETED: "Concluída",
    CANCELLED: "Cancelada",
  };
  return labels[status] ?? status.replaceAll("_", " ");
}

export function matchLevelLabel(level: string) {
  return level === "COMPATIVEL" ? "COMPATÍVEL" : level;
}
