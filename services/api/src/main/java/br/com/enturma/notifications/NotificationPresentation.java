package br.com.enturma.notifications;

final class NotificationPresentation {
  private NotificationPresentation() {}

  static String title(String kind, String actorName) {
    String who = actorName == null || actorName.isBlank() ? "Alguém" : actorName;
    return switch (kind == null ? "" : kind) {
      case "ROOM_MESSAGE" -> who + " enviou uma mensagem";
      case "PRIVATE_MESSAGE" -> who + " enviou uma mensagem privada";
      case "MENTION" -> who + " mencionou você";
      case "ROOM_NOTICE" -> "Aviso da sala";
      case "FORUM_REPLY" -> who + " respondeu no fórum";
      case "FORUM_LIKE" -> who + " curtiu sua publicação";
      case "FORUM_REACTION" -> who + " reagiu à sua publicação";
      case "FRIEND_REQUEST" -> who + " enviou uma solicitação de amizade";
      case "FRIEND_ACCEPTED" -> who + " aceitou sua amizade";
      case "RIDE_ACCEPTED" -> "Sua carona foi aceita";
      case "RIDE_REQUESTED" -> "Novo interesse na carona";
      case "RIDE_CANCELLED" -> "Atualização da carona";
      case "RIDE_MESSAGE" -> who + " enviou uma mensagem na carona";
      case "RIDE_MATCH_SUGGESTION" -> "Nova combinação de carona";
      case "RIDE_WAITLIST" -> "Lista de espera da carona";
      case "RIDE_WAITLIST_AVAILABLE" -> "Uma vaga foi liberada";
      case "RIDE_STATUS" -> "Andamento da carona";
      case "RIDE_NO_SHOW" -> "Atualização de comparecimento";
      case "RIDE_REMINDER_30" -> "Sua carona está chegando";
      case "ACHIEVEMENT" -> "Nova conquista no Enturma";
      default -> "Enturma";
    };
  }
}
