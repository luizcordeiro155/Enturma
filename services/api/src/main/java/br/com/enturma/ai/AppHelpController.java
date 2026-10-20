package br.com.enturma.ai;

import br.com.enturma.common.ApiException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/help")
public class AppHelpController {
  private final AiProvider provider;

  public AppHelpController(AiProvider provider) {
    this.provider = provider;
  }

  public record Question(@NotBlank @Size(max = 1200) String question) {}

  static final String GUIDE =
      """
      GUIA OFICIAL DE USO DO ENTURMA
      Início /home: matérias, salas acontecendo agora, publicações e progresso acadêmico.
      Perfil /profile: personalize foto, banner, bio, nome, cores, movimento, mural, widgets e insígnias. Cada painel tem prévia e Aplicar; Salvar perfil publica o conjunto. Cancelar restaura o painel.
      Privacidade do perfil: escolha campos públicos; atividade de jogos e estudos é opcional. Ligações privadas nunca aparecem na atividade.
      Tema: no cabeçalho, abra o seletor e escolha Claro, Escuro ou Sistema. Acessibilidade permite reduzir movimento e ajustar leitura.
      Salas /rooms: crie por matéria e assunto; horas até 10 pessoas e dias até 45. Convite por código pode ultrapassar o limite e entrar após iniciar. Encerradas não recebem entradas. Removidos/bloqueados não podem voltar pelo código.
      Host: em Gerenciar, personalize foto/banner e feche entradas públicas para estudar. Compartilhe o código na sala.
      Monitor Enturma: atua na sala fechada/ativa. Mencione @Monitor Enturma para perguntar. Pode sugerir uma pergunta após inatividade com conversa anterior, sem insistir se ninguém responder. Usa mensagens, imagens, materiais e cadernos compartilhados.
      Cadernos IA /notebooks: crie um caderno, envie PDF/DOCX/TXT/MD/imagens até 3MB ou cole texto/link. Aguarde processamento real; selecione até 10 fontes prontas. Gere aula, resumo, quiz, flashcards ou plano de estudo; confira citações. Compartilhar em sala é uma ação explícita em Materiais e pode ser revogada.
      Amigos /friends: adicione pelo nome de usuário, aceite o convite para conversar. Conversas cifradas sincronizam pelo login da conta. Quem já usava senha separada pode migrar uma vez no dispositivo que tem o histórico ou usando a senha antiga. Não peça senhas no chat de ajuda.
      Caronas /caronas: escolha campus/sentido, defina ponto e destino, seja motorista ou passageiro. Após aceite, motorista vai ao ponto; passageiro fornece PIN de 4 dígitos quando embarcar. Motorista digita e inicia. Cinco erros bloqueiam PIN; passageiro renova após cinco minutos. Ao chegar, motorista finaliza; ambos podem avaliar com estrelas.
      Segurança da carona: depende de GPS preciso compartilhado. Mudança sustentada do trajeto ou demora excessiva pode gerar pergunta ao passageiro. Está tudo bem adia novo aviso por dez minutos. Ajuda abre discador 190. Não existe garantia de segurança, acionamento automático da polícia ou monitoramento quando GPS está indisponível.
      Portfólio /portfolio: edite apresentação, competências e projetos; adicione imagens e PDFs até 3MB, seis por projeto. Arquivos vinculados só são públicos quando Portfólio público é salvo. Link público /p/nome-de-usuario.
      Configurações /settings: sessões ativas, notificações, privacidade, atualização do app e recuperação de senha. Sessão temporariamente sem rede pode ser recuperada; não recomende apagar dados de conversas.
      Verificação acadêmica /verify-academic: novos cadastros selecionam instituição do catálogo e confirmam e-mail autorizado ou enviam comprovante para análise. Aprovação só ocorre após confirmação real. Contas anteriores preservam seu acesso.
      Fórum /forum: publique dúvidas, responda e reaja. Denúncias permitem informar conteúdo impróprio.
      Downloads /download: versões do Enturma para Windows e Android. Atualizações também aparecem nas configurações.
      LIMITES DA AJUDA: explique somente recursos de uso documentados acima. Se faltar informação, reconheça e indique o painel relacionado. Não tem acesso a senhas, conversas privadas, localização, documentos, código-fonte, infraestrutura ou configurações internas. Não execute ações e não diga que alterou uma conta.
      """;

  @GetMapping
  public Object available() {
    return Map.of("available", provider.enabled());
  }

  @PostMapping
  public Object answer(@Valid @RequestBody Question value) {
    if (!provider.enabled())
      throw new ApiException(
          503,
          "HELP_UNAVAILABLE",
          "A ajuda por IA está indisponível no momento. Você pode consultar o Guia do Enturma no"
              + " Início.");
    var answer = provider.answer(GUIDE, value.question(), "APP_HELP", false);
    if (answer.text() == null || answer.text().isBlank())
      throw new ApiException(
          502, "HELP_EMPTY", "Não foi possível responder agora. Tente novamente.");
    return Map.of("answer", answer.text());
  }
}
