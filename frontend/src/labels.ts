export function translateStatus(status?: string | null): string {
  switch (status) {
    case "open":
      return "Otwarte"
    case "closed":
      return "Zamknięte"
    default:
      return "Brak"
  }
}

export function translateStage(stage?: string | null): string {
  switch (stage) {
    case "bachelor":
      return "I stopień"
    case "master":
      return "II stopień"
    case "any":
      return "Dowolny"
    default:
      return "Brak"
  }
}