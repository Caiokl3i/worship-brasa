# LouveApp — mapa funcional de referência

Documento de contexto para o ministério de louvor. Descreve o que o [LouveApp](https://louveapp.com/home#inicio) faz e como cada parte se comporta, para servir de base ao desenhar um sistema próprio.

Fonte: site público, política e termos, ficha da Google Play e da App Store (Brasil), tela de login da versão web e os textos de interface do próprio aplicativo (português). Não houve login em uma conta de igreja, então detalhes que só aparecem depois de autenticado foram lidos na interface do app e no site, não executados ao vivo. Preços são os da App Store brasileira em setembro de 2026 e podem divergir na Google Play.

Produto publicado em 2020, mantido por Gilnei Junior. Site, app Android, app iOS/iPad e versão web (`app.louveapp.com.br`). O site fala em mais de 150 mil usuários; a Play Store indica 100 mil+ downloads.

---

## 1. O que o sistema é

Um sistema de organização de ministérios de igreja. O caso principal é o ministério de louvor, mas a mesma conta serve para outros departamentos (multimídia, kids, dança, recepção e outros).

A promessa do produto, nas palavras do site: escalas, confirmação de presença, repertório, WhatsApp, Google Agenda e Holyrics no mesmo lugar.

Três ideias organizam quase tudo:

1. **Ministério** é o grupo (a equipe). Tem membros, funções, repertório, escalas e chat.
2. **Escala** é um compromisso com data e hora (culto, ensaio, evento). Tem participantes, músicas, roteiro e confirmações.
3. **Pessoa** tem uma conta e pode estar em vários ministérios ao mesmo tempo. O que ela vê depende do ministério selecionado e das permissões dela naquele ministério.

---

## 2. Onde se usa

| Superfície | Papel |
| --- | --- |
| Android (Google Play) | App principal. Contratação de planos acontece aqui ou no iOS. |
| iPhone e iPad (App Store) | Mesma conta, sincronizada. |
| Navegador (`app.louveapp.com.br`) | Mesmos dados, mais espaço para escalas, relatórios e gestão. Login com e-mail, Google ou Apple. |
| WhatsApp | Canal de aviso e confirmação, sem abrir o app. Só em ministérios pagos que atendem o critério de vagas (ver planos). |
| Google Agenda | Cada pessoa conecta a própria agenda. |
| Holyrics e API de parceiros | O ministério libera leitura de escalas e repertório para software de projeção. |

Idiomas da interface, notificações, e-mails e mensagens de WhatsApp: português, inglês e espanhol. Fuso horário é por ministério, então horários e lembretes seguem a igreja, não o celular de quem está viajando. Tema claro, escuro ou o padrão do sistema.

Pagamento de assinatura é feito nas lojas (Google Play e App Store). O LouveApp declara que não guarda cartão. A versão web mostra os planos, mas a contratação em si é pelo app mobile.

---

## 3. Conta

### Cadastro e entrada

- E-mail e senha (mínimo 6 caracteres), com confirmação de senha.
- Entrar ou cadastrar com Google.
- Entrar ou cadastrar com Apple.
- reCAPTCHA na versão web.
- “Esqueci a senha”: o sistema envia um código por e-mail (avisando para olhar o spam) e a pessoa define uma nova senha. Também dá para trocar a senha estando logado, informando a senha atual.
- Convite por e-mail cria uma conta pendente: a pessoa recebe um link, define a senha e ativa a conta. O link pode expirar; nesse caso pede-se outro ao administrador. Dá para corrigir o e-mail de um convite ainda pendente e reenviar.
- Uma conta Google ou Apple já vinculada a outro usuário não pode ser reaproveitada. Um e-mail que já existe não cria conta nova: a pessoa entra ou recupera a senha e, se quiser, entra no ministério com o código.
- Contas vinculadas (Google/Apple) podem ser desvinculadas. Se a conta Google não estiver ligada, o login Google não entra: usa e-mail e senha ou faz cadastro.
- Sessão expira e pede login de novo.
- Excluir a própria conta é irreversível e apaga o cadastro por completo.

### Perfil

- Nome e sobrenome.
- E-mail.
- Data de nascimento, usada só para mostrar aniversário aos membros do ministério. Só o dono da conta altera os dados pessoais.
- Foto.
- No aniversário, os outros membros podem receber aviso (“Não esqueça de dar os parabéns”) e a pessoa vê uma mensagem de parabéns.

### Primeiro uso

Se a pessoa ainda não está em nenhum ministério, o app oferece dois caminhos:

- **Cadastrar um ministério novo** e passar a organizá-lo.
- **Ingressar** com um código de convite.

Há um carrossel de boas-vindas (Salmo 145.3) apresentando organização, agenda, comunicação e relatórios.

---

## 4. Ministérios

Uma conta pode criar e participar de vários ministérios. A pessoa escolhe o ministério ativo (“Toque para selecionar o ministério”).

### Criar

- Nome (exemplo da interface: “Louvor Ágape”).
- Imagem de capa, paleta de cores, cor de fundo, brilho, opção de fundo dinâmico e logo (o logo entra na arte da escala).
- **Modelo inicial**, com funções típicas já prontas. O site cita Louvor, Multimídia, Kids, Dança e Recepção. Na interface aparecem papéis de louvor, mídia, som, luz, recepção, limpeza e conteúdo. Dá para adicionar e remover funções antes de concluir, e também criar sem módulo de música.
- Fuso horário do ministério.
- Ao terminar, o app pergunta se a pessoa quer convidar membros.

### Módulos

Dá para desligar o módulo de músicas. Quando desligado, somem para os membros: aba de repertório, músicas nas escalas, relatórios de músicas, metrônomo e classificações. A própria interface recomenda isso para multimídia, transmissão, iluminação e projeção.

### Encerrar

Excluir o ministério desativa o grupo e avisa todos os membros. A recuperação pode ser pedida ao suporte em até 30 dias; depois disso os dados podem ser apagados de vez. A pessoa também pode sair de um ministério sem apagá-lo.

### O que vive dentro de um ministério

Membros, administradores, funções, permissões, convites, repertório e pastas, classificações, escalas (inclusive rascunho, recorrência e lixeira), roteiros-modelo, indisponibilidades, chat geral, avisos, relatórios, cores/logo, plano de vagas aplicado ali, tokens de integração (Holyrics/API) e a preferência padrão da geração automática de escala.

---

## 5. Pessoas, papéis e permissões

### Papéis

- **Administrador.** Gerencia o ministério. Permissões de administrador não são editáveis uma a uma: administrador tem o conjunto completo. Só outro administrador altera a lista de administradores. Deixar de ser administrador pede confirmação. É obrigatório manter pelo menos um.
- **Membro.** Entra por convite aprovado. Vê o que foi publicado e faz o que as permissões específicas liberarem.
- **Gestor de escalas.** Não é um cargo com esse nome na interface, mas rascunhos ficam visíveis “apenas para gestores de escalas”. Quem tem permissão de escalas enxerga e publica rascunhos.
- **Responsável pela assinatura.** Quem pagou o plano na loja. Só essa pessoa troca, cancela ou move a assinatura. Pode ser diferente do administrador do dia a dia.
- **Membro bloqueado.** Continua no ministério, mas não acessa escalas nem músicas. Acontece quando o grupo passa do limite de vagas. Ninguém é apagado por isso; o acesso volta quando houver vaga.

### Permissões por membro (além de administrador)

A interface descreve três permissões explícitas, e uma quarta ligada à escala:

| Permissão | O que libera | O que não libera |
| --- | --- | --- |
| Escalas | Criar, editar e excluir escalas: data, participantes, músicas e observações. | — |
| Repertório | Adicionar, editar e excluir músicas do repertório do ministério. | Alterar as músicas que já estão numa escala. |
| Funções | Criar, editar e excluir as funções do ministério, e reordenar. | Mudar a função atribuída a um membro. |
| Alterar músicas da escala | Participante edita só as músicas daquela escala. | O restante da escala. |

Só administrador muda permissões. Sem a permissão, a pessoa vê mensagens do tipo “você não tem permissão para cadastrar escalas / músicas / pastas”.

### Funções (papéis no culto, não cargos de acesso)

Função é o que a pessoa faz na escala: vocal, guitarra, projeção, recepção. Uma pessoa pode ter funções no ministério (o que ela sabe fazer) e, em cada escala, ser escalada numa ou mais delas.

A interface traz um catálogo grande, vindo dos modelos. Não é uma lista fechada: o ministério cria funções novas (exemplo: “Backing Vocal”), escolhe ícone, pode pedir sugestão de ícone novo, remove funções padrão que não usa e define a ordem.

Grupos que aparecem prontos:

- **Louvor:** ministro, vocalista, backing vocal, coral, soprano, mezzo-soprano, contralto, tenor, barítono, diretor musical, violão, guitarra, baixo, teclado, piano, bateria, percussão, pandeiro, triângulo, flauta, gaita, violino, saxofone.
- **Mídia e técnica:** som, mesa de som, projeção, datashow, Holyrics, transmissão, câmera, operador de câmera, videomaker, operador de gimbal, iluminação, iluminação cênica, operador de iluminação, diretor de luz, técnico de áudio, técnico PA, técnico de retorno, técnico live, sonoplasta.
- **Conteúdo:** social media, story, reels, designer, criador de artes, editor de vídeo, editor de foto, copywriter, diretor de vídeo, diretor de operação, coordenação de mídia, fotógrafo, planejamento de conteúdo, conteúdo para redes sociais.
- **Apoio:** coordenador, recepção, suporte geral, limpeza, monitor de culto.

### Convite e aprovação

Quatro formas de chamar alguém: link, texto, QR Code e código. Também existe convite direto por e-mail.

Fluxo do convidado:

1. Recebe link, texto, QR ou código (exemplo de formato: `a7B2`, mínimo 4 caracteres).
2. Se abriu pelo link, o código já vem preenchido.
3. Envia a solicitação de entrada.
4. Fica como solicitação pendente até um administrador aprovar ou rejeitar.
5. Aprovação ou rejeição pode gerar notificação.

Do lado de quem administra:

- Há no máximo um convite ativo por vez, com data de validade. Dá para gerar outro (o anterior deixa de valer).
- O link traz instruções e, quando possível, abre o aplicativo.
- O código também vai embutido no link e no texto.
- Pedidos feitos com o código do ministério aparecem numa fila: aprovar ou rejeitar. A pessoa pode cancelar a própria solicitação pendente.
- Se o e-mail já tem conta no LouveApp, não se cria outra conta por ela. Entrega-se o código e a própria pessoa pede para entrar.

Novos membros aprovados passam a contar nas vagas. Se não houver vaga, entram bloqueados.

---

## 6. Escalas

A escala é o centro do sistema. Exemplos de título sugeridos na interface: “Culto de Jovens”, “Ensaio dia…”.

### O que uma escala contém

- Título.
- Data e hora de início e término. Início não pode ser depois do término. Pode ser o dia inteiro.
- Período do dia, usado na organização: matutino, vespertino, noturno.
- Status de publicação: **rascunho** ou **publicada**.
- Participantes, cada um com uma ou mais funções, status de confirmação e, se for o caso, falta.
- Músicas, na ordem definida, com tom daquela escala (pode ser diferente do tom cadastrado), versão escolhida, ministro/funções em destaque naquela música, observações e duração.
- Roteiro do culto (ver seção própria).
- Observações gerais.
- Vestimenta (exemplo da interface: “geral, camiseta azul”).
- Equipes.
- Pedido de confirmação ligado ou desligado.
- Histórico de alterações (quem alterou, e o histórico é apagado numa data determinada).
- Se fizer parte de uma série, o vínculo com a recorrência.
- Chat daquela escala.

### Rascunho e publicação

- Rascunho fica visível só para quem gere escalas. O restante do ministério não vê.
- Publicar avisa os participantes e passa a escala para todos os membros.
- Dá para voltar o conceito de visibilidade: “visível para todos” ou “visível apenas para gestores”.

### Montar a equipe

- Adicionar participantes a partir dos membros, buscando por nome ou função.
- Atribuir função na escala. Dá para permitir mais de uma função na mesma pessoa (isso também é opção da geração automática).
- Agrupar a lista por função.
- Limpar todos os participantes de uma vez (com confirmação).
- Remover uma pessoa, ou a própria pessoa sair da escala. Ao sair, ela pode voltar a ficar disponível naquela data.
- **Funções em destaque na música:** entre os participantes, marcar quem se destaca naquela canção (por exemplo, o ministro da música). Só faz sentido depois que há gente na escala.
- Modo simples e modo avançado na edição.

### Músicas na escala

- Incluir músicas do repertório, reordenar, remover todas de uma vez.
- Trocar o tom só naquela escala, sem mudar o cadastro da música. Também existe tom personalizado.
- Escolher a versão da música.
- As músicas escolhidas na aba de músicas entram sozinhas no roteiro.

### Conflitos

Ao escalar, o sistema detecta:

- Pessoa já escalada em outro compromisso no mesmo horário.
- Pessoa que declarou indisponibilidade naquela data.

O aviso não impede: “você ainda pode mantê-los nesta escala”. Há atalhos para remover todos os indisponíveis, ou remover automaticamente e continuar. Conflitos também aparecem na edição rápida do panorama.

### Confirmação de presença

- A escala pode pedir confirmação.
- Cada participante fica em um destes estados: confirmação pendente, confirmado, não participarei.
- A pessoa confirma no app ou, se conectou o WhatsApp, pelo botão da mensagem.
- O status atualiza para quem gere a escala.
- Depois que a data passou, não dá mais para confirmar.
- Administradores podem ser notificados quando alguém confirma.

### Faltas

- Falta só pode ser registrada depois que a data da escala passou.
- Fica no histórico da pessoa e entra nos relatórios.
- A geração automática pode priorizar quem falta menos.

### Edição concorrente

Se duas pessoas editam a mesma escala, a segunda é avisada de que a escala mudou, precisa reabrir e revisar. Não grava por cima em silêncio.

### Excluir, clonar, lixeira

- Excluir pede confirmação. Administradores recuperam escala excluída na **lixeira por 30 dias**.
- Músicas excluídas do repertório também ficam 30 dias na lixeira.
- Clonar uma escala existe como ação da interface.

### Formas de ver as escalas

- Modo calendário, modo lista e modo linha do tempo.
- Filtros e filtros avançados, inclusive “apenas as que eu participo” e “escalas gerais”.
- Panorama: uma grade por função e data. Toque na célula abre opções, a escala ou o relatório daquela função. Edição rápida no panorama, já mostrando conflitos.
- “Minhas escalas” para o membro comum.

### Histórico da escala

A tela de alterações mostra, entre outros: músicas adicionadas, removidas, alteradas ou reordenadas; membros adicionados, removidos ou com função alterada; quem alterou.

---

## 7. Geração automática da escala

Na hora de criar, há dois caminhos: montar na mão ou **gerar escala automática**. O app sugere pessoas e músicas a partir do histórico do ministério. O resultado é uma proposta para revisar antes de salvar. Dá para gerar de novo e receber outra sugestão. A configuração pode ser salva como padrão daquele ministério.

### Pessoas

A pessoa escolhe as funções e quantas vagas cada função tem.

Estratégias:

| Estratégia | Efeito |
| --- | --- |
| Equilibrada | Prioriza quem participou menos no período. |
| Mais ativos | Prioriza quem participa com mais frequência. |
| Menos ativos | Prioriza fortemente quem quase não participa. |
| Padrão dos últimos meses | Repete quem costuma servir naquele dia da semana. |

Controles:

- Período de análise (quantos meses de histórico entram na conta).
- Intervalo mínimo entre participações (ou sem mínimo).
- Priorizar quem falta menos.
- Permitir ou não mais de uma função por membro.
- Respeitar indisponibilidades.
- Conflito com outra escala: não escalar, escalar e avisar, ou ignorar.
- Lista de membros que não devem ser escalados.
- Pessoas fixas (o site descreve que o rodízio respeita quem deve permanecer).
- O resultado explica a escolha (“por que estes membros?”), com sinais como “nenhuma participação no período”, “nunca escalado”, “menos escalados recentemente primeiro” e a data da última escala. Não é uma caixa-preta.
- Se não achar gente para as vagas, ou não houver função cadastrada, a geração avisa.

### Músicas

| Estratégia | Efeito |
| --- | --- |
| Rodízio | Prioriza as que estão há mais tempo sem serem tocadas. |
| Mais tocadas | Prioriza as favoritas do ministério. |
| Equilibrada | Distribui as execuções pelo repertório. |

Controles:

- Quantidade de músicas.
- Intervalo mínimo para repetir uma música.
- Incluir músicas novas (ainda não tocadas no período).
- Considerar as tendências do mês no LouveApp (o que outras igrejas estão cantando).
- Modelo de roteiro para já nascer com o culto estruturado.
- Se as sugeridas já estiverem na escala, ou se o repertório estiver vazio, a geração avisa.

---

## 8. Escalas recorrentes

Cria-se a série uma vez. O app gera as próximas datas sozinho, com antecedência (o site fala em até 90 dias), para o culto não ficar sem escala.

Recorrência:

- Não se repete, ou repetir a cada N dias, semanas, meses ou anos.
- Em recorrência semanal, escolhem-se os dias da semana.
- Término: nunca, numa data, ou depois de um número de ocorrências.
- Horário, e opcionalmente o dia inteiro.
- A ocorrência nasce com título, horário, funções e roteiro. Os participantes de cada data são preenchidos depois, na mão ou com a geração automática.

Editar ou excluir pergunta o alcance:

- Apenas esta ocorrência.
- Esta e as próximas.
- Todas as ocorrências.

Se uma data for editada sozinha, ela se desliga da série e deixa de receber as alterações do modelo. A interface mostra a próxima ocorrência e a lista das próximas.

---

## 9. Indisponibilidades

O membro registra um período em que não pode servir (exemplo da interface: “Estarei de férias em Acapulco”), com início e término.

- A descrição é visível só para administradores.
- Existe indisponibilidade recorrente.
- Na hora de escalar, o sistema avisa e pode impedir ou apenas alertar, conforme a opção da geração automática. Na montagem manual, o aviso não bloqueia.
- O membro pode remover a própria indisponibilidade e voltar a ficar disponível.
- Notificações separadas para cadastro, alteração e remoção.
- Entram no relatório.

Não há, no material público, um fluxo em que o próprio membro ache um substituto, mande o pedido e a escala se atualize sozinha. Isso aparece como sugestão de usuário na Play Store, não como função pronta.

---

## 10. Repertório

Cada ministério tem o próprio repertório. Some por completo se o módulo de músicas estiver desligado.

### Cadastro da música

- Título e artista. A busca por título ou artista acelera o cadastro e dispara o autopreenchimento.
- O autopreenchimento traz artista, capa e duração, e preenche links de vídeo, cifra, letra e áudio. Pode ser música a música ou o repertório inteiro.
- Fontes citadas no site: Spotify, YouTube, Deezer, Apple Music, Cifra Club, MultiTracks, entre outras.
- Duração e BPM. O BPM pode ser descoberto no **Tap BPM** (tocar no ritmo) ou no metrônomo.
- Classificação (ver abaixo).
- Várias **versões** da mesma música, cada uma com nome e tom (exemplo: “Partitura guitarra”, “Voz soprano”). O tom da escala pode divergir do tom da versão.
- Referências extras por link: cifra, letra, vídeo, áudio, e arquivos customizados (imagem, PDF etc.). O app não hospeda esses arquivos: a orientação é subir no Drive, OneDrive, Dropbox ou iCloud e colar o link.
- Pastas para organizar. Tirar a música da pasta não tira do repertório. Excluir a pasta também não apaga as músicas.
- Playlist de YouTube associada.

### Classificações

Há classificações padrão, que o ministério pode remover, e classificações próprias. As descrições padrão são teológicas, não só etiquetas:

- **Adoração:** reconhecimento a Deus pelo que Ele é.
- **Alegria (júbilo):** alegria pelo Senhor e pelos Seus feitos.
- **Consagração:** dedicação da vida e santificação.
- **Contemplação:** meditação na pessoa de Deus, caráter, natureza e qualidades.
- **Louvor:** elogio e agradecimento pelo que Deus fez, faz ou fará.
- **Especiais:** casamento, batizado e temas semelhantes.

### Operações em lote

- Importar por planilha `.xlsx`. Há um modelo para baixar; as linhas de exemplo não entram como repertório de verdade. Antes de gravar, existe prévia: importar ou não importar cada linha. Música que já existe não é duplicada.
- Exportar o repertório para arquivo.
- Excluir todas as músicas do repertório, de todas as pastas e das escalas futuras. Pede confirmação forte.
- Exclusão em lote de uma seleção.
- Música excluída vai para a lixeira por 30 dias e pode ser restaurada para o repertório.

### Tendências e “mais tocadas”

- Dentro do ministério: relatório e ordenação do que mais foi tocado, e “última vez” para ajudar o rodízio.
- No LouveApp como um todo: uma vitrine do que está em alta entre as igrejas no mês, usada também como sinal na geração automática.

### Metrônomo

Ferramenta de ensaio, marcada como beta na interface, com pedido para reportar problema em “Sugerir melhoria”. O site fala em 9 sons e BPM por toque. Atualizações recentes melhoraram o metrônomo.

---

## 11. Roteiro do culto

O roteiro descreve a ordem do evento, não só a lista de músicas.

- Itens com nome, ícone, duração, equipe responsável e observação (exemplo: “Os recepcionistas começam a passar após a oração”).
- As músicas não são redigitadas: entram a partir da aba Músicas.
- **Modelos de roteiro** reutilizáveis (exemplo: “Escola bíblica”), com criar, editar e escolher na escala ou na geração automática.
- Itens prontos que aparecem na interface: abertura do culto, oração inicial, boas-vindas, louvor, ministração, dinâmica, palavra, preleção, oferta, avisos, anúncios, encerramento.

---

## 12. Comunicação

### Chat

- Um chat geral do ministério.
- Um chat por escala, para ensaio e detalhes daquele culto.
- Tempo real.
- Administrador pode limpar o histórico. Os participantes deixam de ver as mensagens; o suporte ainda pode recuperar.
- Notificação separada para mensagem do ministério e mensagem da escala.
- Há um tutorial “Como usar o chat”.

### Mural de avisos

- Criar e editar aviso.
- Opção de notificar os membros ao salvar.
- Comentários no aviso, se “habilitar mensagens” estiver ligado.
- Destaque: o aviso aparece na tela Início.
- Data de vencimento: arquiva sozinho nessa data.
- Arquivar e desarquivar manualmente. Existe lista de avisos arquivados.
- Notificações: aviso novo, aviso alterado, mensagem num aviso.

### Fora do app

Escala também sai como texto (para colar em WhatsApp, e-mail ou SMS) ou como imagem. Ver a seção de compartilhamento.

---

## 13. Compartilhar a escala

### Como texto

Prévia fiel ao que será enviado. Presets: completa, resumida, só participantes, só músicas, ou personalizada.

Dá para incluir ou omitir: funções, confirmações (marcas de confirmado e pendente), tons, BPM, ministro, links, observações da música, durações, e restringir a apenas quem confirmou. Negrito no estilo WhatsApp (`*texto*`) e emojis são opcionais. Título e data sempre entram. O texto pode ser copiado.

### Como imagem

Formatos: Story/Reels/Status (9:16), feed quadrado (1:1) e feed vertical (4:5). Modelos: Clássico, Cartaz e Faixa. Tema claro ou escuro, cor e logo do ministério. Escalados em lista ou em avatares. Repertório com tons e roteiro. Listas longas são resumidas para a arte continuar legível. Salvar na galeria ou compartilhar direto.

---

## 14. Relatórios

Pensados para quem lidera, e mais confortáveis na versão web.

- **Visão geral** do ministério.
- Quem mais serve e quem está ficando de fora.
- Confirmações, não confirmados, faltas, indisponibilidades.
- Músicas mais tocadas.
- Relatórios separados de escalas, músicas, membros, faltas e funções.
- No panorama, total de escalações por pessoa, confirmações de presença e funções associadas.
- Última participação de cada membro, também usada na hora de escalar.
- Filtros de período (com um período máximo), todos os membros, só quem tem escala ou só quem não tem.
- Abrir o relatório a partir de uma função no panorama.

---

## 15. Notificações e lembretes

Cada pessoa liga ou desliga o que quer receber. Há push no celular, e-mail em alguns fluxos, lembrete na Google Agenda e WhatsApp (quando conectado).

Lembretes automáticos de escala, no app: **5 dias antes, 1 dia antes e 2 horas antes**. No WhatsApp, o lembrete é o de 1 dia antes.

Eventos que têm interruptor próprio na interface:

- Fui adicionado a uma escala.
- Fui removido de uma escala.
- Escala cadastrada, alterada ou removida (geral, ou só as que eu participo).
- Alguém confirmou presença (só administradores).
- Indisponibilidade cadastrada, alterada ou removida.
- Música adicionada, alterada ou removida do repertório.
- Mensagem no chat do ministério ou no chat da escala.
- Aviso novo, aviso alterado, mensagem num aviso.
- Aniversariantes do dia.
- Pedido de entrada no ministério, aprovação e rejeição.
- Administrador adicionado ou removido.

Na Google Agenda, cada pessoa define os próprios lembretes: notificação (popup) ou e-mail, em minutos, horas ou dias.

---

## 16. Integrações

### WhatsApp

Individual: cada membro conecta o próprio número.

1. Informa o número com DDD.
2. Recebe um código de 6 dígitos no WhatsApp e confirma.
3. Escolhe quando quer aviso: ao ser adicionado ou removido, alterações, e o lembrete de 1 dia.
4. Na mensagem, um botão confirma presença. Outro abre o menu da escala: repertório com tons, links para ouvir, participantes, roteiro e histórico.

Requisito de plano: a integração custa para o LouveApp, então só liga em ministério com **plano ilimitado** ou com **pelo menos 5 vagas adicionais**. Se nenhum ministério da pessoa atender a isso, ela conecta o número mas não recebe avisos. A tela “Ministérios sincronizados” mostra em quais grupos o WhatsApp está ativo. Desconectar para os avisos.

O site descreve a integração como WhatsApp oficial e exclusiva dos planos pagos.

### Google Agenda

Também individual. A pessoa conecta a conta Google uma vez.

- Escalas futuras em que ela participa viram eventos.
- Mudou data, hora ou função: o evento acompanha.
- Dá para ressincronizar, adicionar uma escala avulsa ao calendário, e apagar todos os eventos criados pelo LouveApp.
- Desconectar remove os eventos futuros.
- Nem toda escala é “elegível” para sincronização (a interface tem esse estado).
- Lembretes próprios, separados dos lembretes do app.
- Grátis, segundo o site. Não depende do plano do ministério.

### Holyrics

Para o software de projeção puxar escala e repertório sem digitar a música duas vezes.

- No app, a área de integrações mostra um pareamento: escanear o QR Code que o Holyrics exibe, ou gerar um token e colar manualmente no Holyrics.
- O token é mostrado uma vez; se fechar sem copiar, não recupera.
- Dá para revogar. Token revogado corta o acesso na hora.
- Há tutorial dentro do app.
- Grátis no site do LouveApp.

### API para outros sistemas

O administrador gera um token e marca, um a um, o que o parceiro pode **ler** (nada de escrita):

- Escalas
- Repertório
- Membros e equipes
- Indisponibilidades
- Relatórios
- Dados do ministério

Dá para ver último uso, total de usos, data de expiração (ou sem expiração) e revogar na hora. Tokens ativos e revogados ficam em listas separadas.

A documentação e as credenciais de parceiro só saem depois de um cadastro aprovado. O pedido é por e-mail (`contato@louveapp.com`) ou pelo WhatsApp indicado no site, informando: nome do sistema, site, como a integração será usada, quais dados precisa ler, quem são os usuários atendidos e o contato técnico. O nome de exemplo na interface é “Holyrics Igreja Sede”.

### Login social

Google e Apple, tanto para entrar quanto para vincular numa conta que já existe.

---

## 17. Planos e vagas

O limite é de **pessoas no ministério**, não de escalas ou de músicas. Quase toda função de produto está no gratuito e no pago. A exceção explícita é o WhatsApp.

### Regra das vagas

- Todo ministério nasce com **10 vagas grátis**, para sempre, sem cartão e sem prazo.
- Vagas extras vêm de uma assinatura e **não ficam presas a um ministério**. A pessoa distribui e redistribui entre os ministérios que administra.
- As 10 grátis continuam em cada ministério; a assinatura soma só o extra.
- Mais de uma pessoa pode colocar vagas no mesmo ministério. O que cada uma aplica se soma às 10 grátis.
- Um único plano pode atender vários ministérios. Não é “um plano por ministério”.
- Se passar do limite, ninguém é excluído: os excedentes ficam bloqueados (sem ver escalas e músicas) até sobrar vaga.
- Existe plano de **membros ilimitados em um ministério**.
- Vagas presas num ministério do qual a pessoa já saiu só são liberadas falando com o suporte.
- Dá para zerar a distribuição e recomeçar (“limpar vagas alocadas”).

### Contratação

- Feita no app Android ou iOS, pela loja. A web consulta planos, não cobra.
- Renovação automática. Cancelar não corta na hora: o benefício vai até o fim do período já pago.
- Trocar de plano é conversão na mesma loja, sem pagar as duas. Não dá para migrar uma assinatura da Play Store para a App Store ou o contrário.
- Dá para mover a assinatura para outro ministério, mas só quem pagou.
- Se a pessoa tiver várias assinaturas, o app sugere trocar por um plano único maior.
- Assinatura descontinuada continua valendo para quem já tem; só não é vendida de novo.
- Há “corrigir compra” / sincronizar com a loja, sem gerar cobrança nova, e histórico de assinaturas.
- Estados visíveis: ativo, pagamento pendente, renovação desativada, encerrando, cancelada, expirou.

### Preços publicados na App Store (Brasil)

A interface nomeia Bronze, Prata, Ouro, Esmeralda I e II, Ruby I e II, Diamante I e II, e planos “+” (vagas avulsas). A ficha da loja mostra estes valores, sem publicar na mesma tela quantas vagas cada nome inclui:

| Item na loja | Preço |
| --- | --- |
| Bronze | R$ 14,99 |
| Prata | R$ 24,99 |
| Ouro | R$ 34,99 |
| Plano +10 | R$ 14,99 |
| Plano +20 | R$ 24,99 |
| Esmeralda I | R$ 44,90 |
| Esmeralda II | R$ 54,90 |
| Rubi I | R$ 64,90 |
| Diamante II | R$ 99,90 |
| Bronze anual | R$ 159,90 |

A quantidade de vagas de cada nome não está no site. O que está escrito no produto é: 10 grátis por ministério, pacotes de vagas extras (a interface usa “+30” como exemplo de conta), plano ilimitado, e WhatsApp a partir de 5 vagas extras ou no ilimitado.

---

## 18. Navegação que o produto deixa ver

Não é um mapa de menu medido tela a tela dentro de uma conta logada. É o conjunto de destinos que a interface nomeia.

**Entrada:** login, cadastro, recuperar senha, ativar conta pelo link, entrar com Google ou Apple.

**Sem ministério:** criar ministério (com modelo), ingressar com código.

**Dentro do ministério:**

- Início, com avisos em destaque e aniversariantes.
- Escalas: calendário, lista, linha do tempo, panorama, minhas escalas, rascunhos, criar, gerar automática, editar, recorrência, lixeira.
- Uma escala: participantes, músicas, roteiro, observações, vestimenta, confirmações, faltas, chat, histórico, compartilhar (texto ou imagem).
- Repertório: músicas, pastas, versões, classificações, importar/exportar, tendências, metrônomo, lixeira de músicas.
- Indisponibilidades.
- Avisos.
- Chat do ministério.
- Membros: funções, permissões, administradores, convites, solicitações, bloqueados.
- Relatórios.
- Configurações do ministério: dados, cores, módulos, fuso, excluir.
- Integrações: WhatsApp (na conta), Google Agenda (na conta), Holyrics e tokens (no ministério).
- Planos e distribuição de vagas.

**Na conta:** perfil, senha, contas vinculadas, idioma, tema, notificações, suporte, sugerir melhoria, perguntas frequentes, tutoriais, excluir conta, sair.

---

## 19. Fluxos, do começo ao culto

### Abrir um ministério de louvor

1. Criar conta.
2. Criar ministério pelo modelo de louvor, ajustar funções e fuso.
3. Convidar por link, QR, código ou e-mail.
4. Aprovar quem pede entrada.
5. Marcar administradores e, se quiser, soltar permissão de repertório para quem cuida das músicas e permissão de escala para quem monta o culto.
6. Cadastrar o repertório (busca com autopreenchimento, ou planilha).
7. Se passar de 10 pessoas, contratar vagas e distribuir para esse ministério.

### Escalar o domingo

1. Criar a série recorrente (todo domingo, sem término, ou até uma data).
2. Nas ocorrências que o app já gerou, gerar a escala automática ou preencher na mão.
3. Revisar conflitos e indisponíveis.
4. Ajustar tons e quem ministra cada música.
5. Completar o roteiro (ou aplicar um modelo).
6. Publicar. Participantes são notificados.
7. Quem quiser, recebe de novo no WhatsApp e na Google Agenda.
8. Acompanhar confirmações. Se alguém cair, editar a escala; a alteração pode avisar de novo.
9. No dia, quem projeta no Holyrics lê a escala por lá.
10. Depois do culto, registrar falta de quem não veio. Isso alimenta o próximo rodízio.

### Ensaio e culto no dia

- Chat da escala para combinar horário e tom.
- Metrônomo e links de cifra, letra, áudio e vídeo em cada música.
- Imagem da escala para stories, ou texto no grupo.

### Outro departamento na mesma igreja

Criar outro ministério (modelo multimídia, por exemplo), desligar o módulo de músicas se não servir, convidar as mesmas pessoas ou outras. A vaga extra contratada por alguém pode ser dividida entre louvor e multimídia.

---

## 20. Regras que o sistema insiste em cumprir

Úteis como requisitos, porque são o comportamento real e não só o texto de marketing.

- Rascunho não vaza para o membro comum.
- Publicar é o ato que notifica.
- Indisponibilidade e conflito avisam; na edição manual não apagam a pessoa sozinhos, a menos que alguém confirme a remoção.
- Descrição da indisponibilidade é dado de administrador.
- Tom da escala não reescreve o tom do repertório.
- Permissão de repertório não edita a música dentro da escala; isso é outra permissão.
- Permissão de funções não troca a função de um membro.
- Administrador não tem as permissões rebaixadas campo a campo.
- Edição simultânea não sobrescreve: manda reabrir.
- Ocorrência editada fora da série sai da série.
- Confirmação trava depois do horário passado. Falta só existe depois.
- Exclusão de escala, música e ministério tem janela de 30 dias. Conta de usuário excluída não tem essa janela.
- Acima do limite de vagas, bloqueia acesso em vez de apagar gente.
- WhatsApp, Agenda e Holyrics são consentimentos separados. Agenda e WhatsApp são da pessoa; token de API é do ministério.
- Token de API é somente leitura, escopo a escopo, e só vale para parceiro aprovado.
- Arquivo de cifra/PDF não fica no servidor deles: só o link.
- Cobrança mora na loja do celular em que a assinatura nasceu.

---

## 21. O que este mapa não fecha

- Quantas vagas exatas vêm em Bronze, Prata, Ouro e nos planos com nome de pedra. A loja mostra preço; o app, na hora da compra, mostra o tamanho.
- A ordem exata dos menus depois do login, porque esta leitura não entrou com uma conta de igreja.
- Se kids, dança e recepção são modelos com lista própria de funções ou só um recorte dos papéis já listados aqui. O site os cita; a interface detalha louvor, mídia e apoio.
- Um fluxo de substituição iniciado pelo próprio membro (achar alguém livre e transferir a vaga) não aparece como função. Hoje a troca é editar a escala, em geral por quem tem permissão.
- Conteúdo dos tutoriais e da FAQ além dos títulos (“Como usar o chat”, perguntas de vagas e de assinatura).

---

## 22. Como usar isto no sistema da igreja

Isto é um mapa do LouveApp, não um backlog obrigatório. Para um ministério só, o núcleo que sustenta o resto é pequeno:

1. Conta, ministério, membros e funções.
2. Escala com rascunho, publicação, confirmação e conflito de horário.
3. Indisponibilidade.
4. Repertório com tom, link de cifra/vídeo e tom por escala.
5. Aviso de escala para quem foi escalado.

Geração automática, recorrência, panorama, relatórios, arte para stories, WhatsApp, Agenda e Holyrics são camadas em cima desse núcleo. O LouveApp foi publicado em 2020 e essas camadas entraram aos poucos (roteiro, avisos, importação, faltas, pastas, rascunho, Google Agenda, WhatsApp, panorama, recorrência, geração automática, lixeira, arte da escala). Dá para seguir uma ordem parecida em vez de abrir tudo no primeiro versão.
