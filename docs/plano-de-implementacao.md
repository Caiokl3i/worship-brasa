# Plano de implementação — Worship Brasa

Documento de construção do sistema do ministério. A referência do que o produto precisa fazer está em `docs/referencia-louveapp.md`. Este arquivo diz em que ordem construir, o que entra em cada etapa e como saber que a etapa ficou correta antes de seguir.

O sistema é para a igreja, com vários ministérios na mesma conta (louvor, mídia, recepção). A primeira versão é web. Celular, WhatsApp, Google Agenda e Holyrics entram depois que escala, repertório e confirmação estiverem estáveis.

---

## Decisões travadas

Estas escolhas evitam refação no meio do caminho. Mudar uma delas depois da Etapa 2 custa caro.

| Decisão | Escolha |
| --- | --- |
| Interface | Aplicação web responsiva. O celular usa o navegador até existir app. |
| Stack | React + TypeScript no front (Vite). AdonisJS + TypeScript na API. PostgreSQL e Lucid. |
| Autenticação | E-mail e senha com sessão em cookie httpOnly. Google entra na Etapa 15. |
| Relógio | Todo instante é gravado em `timestamptz` (UTC). A tela formata no fuso do ministério. |
| Isolamento | Toda leitura e escrita de dado de ministério filtra `ministryId` no servidor. O id vem da URL, não de um estado só no navegador. |
| Pessoa na escala | Participante aponta para a **filiação** (`Membership`), nunca só para o `User`. A mesma pessoa pode estar em dois ministérios. |
| Tom | O tom cadastrado na música e o tom daquela escala são campos diferentes. Salvar a escala não altera o repertório. |
| Publicação | Rascunho e escala publicada são estados. Salvar rascunho não notifica. Publicar notifica. |
| Apagar | Escala, música e ministério usam `deletedAt`. Conta de usuário apagada é definitiva. |
| Permissão | Checagem no servidor, em toda ação. Esconder botão na tela não é segurança. |

Fora das primeiras versões, de propósito: cobrança e vagas pagas, loja de aplicativos, API para parceiros, vários idiomas, app nativo. Um ministério de igreja não precisa disso para funcionar. O limite de 10 pessoas do LouveApp não se aplica aqui.

---

## Regras que valem em todas as etapas

1. Nenhuma etapa começa com a anterior sem os critérios de aceite marcados.
2. Cada etapa termina com os testes da própria seção passando. Teste de regressão das etapas anteriores roda junto.
3. Migração de banco é incremental. Não reescrever tabelas já em uso; acrescentar coluna ou tabela nova.
4. Nome de domínio fica estável desde a Etapa 2: Ministério, Filiação, Função, Música, Escala, Participação, Indisponibilidade.
5. Texto de interface em português.
6. Formulário inválido explica o campo. Erro de permissão diz que a pessoa não pode fazer aquilo, sem revelar dado de outro ministério.
7. Operação que mexe em várias tabelas (publicar escala, aprovar membro, gerar ocorrência) roda numa transação.
8. Lista vazia tem estado próprio. Não é tela em branco nem erro.

---

## Modelo que as etapas vão preenchendo

Visão única para as tabelas não nascerem contraditórias. Os campos entram na etapa indicada. Não criar tabela de etapa futura “por precaução”.

```
User
  id, name, email, passwordHash, birthDate, avatarUrl, createdAt, deletedAt

Ministry
  id, name, timezone, coverUrl, color, musicModuleEnabled, deletedAt

Membership
  id, userId, ministryId, status (pending | active | left)
  isAdmin
  canManageSchedules, canManageRepertoire, canManageFunctions, canEditScheduleSongs

MinistryFunction
  id, ministryId, name, sortOrder, archivedAt

MemberFunction
  membershipId, functionId

Song
  id, ministryId, title, artist, bpm, durationSeconds
  defaultKey, classificationId, folderId, deletedAt

SongVersion
  id, songId, name, key

SongLink
  id, songId, versionId nullable, kind (cifra | letra | video | audio | custom), label, url

Schedule
  id, ministryId, title, startsAt, endsAt
  status (draft | published)
  notes, dressCode
  seriesId nullable, detachedFromSeries
  version (inteiro, sobe a cada gravação)
  deletedAt

ScheduleParticipant
  id, scheduleId, membershipId
  confirmation (pending | confirmed | declined)
  confirmedAt, absent, absentAt

ScheduleAssignment
  id, participantId, functionId

ScheduleSong
  id, scheduleId, songId, versionId nullable
  position, keyOverride nullable, notes, durationSeconds

ScheduleSongHighlight
  scheduleSongId, participantId, functionId

Unavailability
  id, membershipId, startsOn, endsOn, description, deletedAt

Series
  id, ministryId, frequency, interval, weekdays, until, count
  template de título, duração, roteiro

ScriptItem
  id, scheduleId, position, title, notes, durationSeconds, icon

Notice, ChatMessage, NotificationPreference
  entram nas etapas 8, 9 e 10
```

Identificadores são UUID. E-mail é único entre contas ativas. Código de convite é único. Em participação, o par (escala, filiação) é único.

---

## Etapa 0 — Fundação do projeto

### Objetivo

Ter um projeto que sobe, conecta no banco, aplica migração vazia e já deixa o jeito certo de organizar código. Nenhuma tela de ministério ainda.

### Resultado visível

`npm run dev` abre uma página inicial simples. `npm run test` e `npm run lint` passam. O banco aceita a primeira migração.

### Passos

1. Criar dois pacotes no mesmo repositório: `api` (AdonisJS + TypeScript) e `web` (Vite + React + TypeScript).
2. Na API, separar desde o início:
   - controllers finos, só recebem a requisição e devolvem a resposta
   - `app/services` — regras de ministério, escala, permissão e repertório
   - Lucid fica só nos services e nos models, nunca no React
3. No React, rotas por URL (`/m/:ministryId/...`). O id do ministério não mora só em estado global.
4. Subir PostgreSQL local (Docker Compose com usuário, senha e banco só de desenvolvimento).
5. Configurar o PostgreSQL na `config/database` do Adonis, com a URL em `.env`. Colocar `.env` no `.gitignore`. Ter `.env.example` sem segredo.
6. Criar a primeira migration pelo Ace e um teste que só verifica se o Lucid conecta.
7. Definir o fuso padrão `America/Sao_Paulo` numa constante, usado até o ministério existir.
8. Combinar o formato de erro de formulário: campo, mensagem em português.
9. Sessão em cookie httpOnly emitido pelo Adonis. O React chama a API com credencial.
10. Colocar na raiz um README curto: como subir o banco, a API, o front, como migrar e como rodar o teste.

### Critérios de aceite

- Outra pessoa clona o repositório, copia `.env.example`, sobe o banco e vê a página inicial.
- Nenhum segredo está commitado.
- O React não importa o Lucid. Regra de negócio mora em `api/app/services`.

### Erros que esta etapa evita

- Regra de negócio espalhada em componente.
- Banco apontando para produção no primeiro commit.
- Data salva como texto sem fuso.

---

## Etapa 1 — Conta e sessão

### Objetivo

A pessoa cria conta, entra, sai, recupera a senha e edita o próprio perfil. Ainda não existe ministério.

### Pré-requisito

Etapa 0 aceita.

### Fora desta etapa

Google, Apple, foto obrigatória, aniversário avisando o ministério, apagar conta. Data de nascimento pode existir no perfil, sem efeito ainda.

### Modelo

`User`: nome, e-mail normalizado em minúsculas, hash de senha (argon2 ou bcrypt), data de nascimento opcional.

Tabela `PasswordReset`: usuário, código de 6 dígitos, expira em 30 minutos, usado no máximo uma vez.

Sessão em cookie httpOnly, Secure em produção, SameSite Lax, expiração de 30 dias com renovação no uso. O id do usuário na sessão é o único dado de identidade. Papel de ministério não vai no cookie.

### Regras

- E-mail válido e único. Se já existe, a mensagem é a mesma de um cadastro genérico na recuperação (“se o e-mail existir, enviamos o código”), para não revelar quem tem conta. No cadastro, pode dizer que o e-mail já está em uso, porque a pessoa está tentando criar.
- Senha com no mínimo 8 caracteres. Confirmação igual à senha.
- Login com senha errada responde “e-mail ou senha inválidos”, sem dizer qual dos dois falhou.
- Troca de senha logada exige a senha atual.
- Código de recuperação expirado ou já usado não define senha nova.
- Ao redefinir a senha, as outras sessões daquela conta caem.

### Telas

- Entrar: e-mail, senha, link para cadastro e para esqueci a senha.
- Cadastrar: nome, e-mail, senha, confirmar senha.
- Esqueci a senha: pede e-mail, depois pede código e senha nova.
- Perfil: nome, e-mail (somente leitura nesta etapa), data de nascimento, alterar senha, sair.

Depois do login, a rota `/` manda para `/ministerios`, que na etapa seguinte deixa de estar vazia. Nesta etapa essa rota mostra só “você entrou” e o nome.

### Passos

1. Migração de `User` e `PasswordReset`.
2. Funções de servidor: cadastrar, entrar, sair, pedir código, confirmar código, trocar senha, atualizar perfil.
3. Cookie de sessão criado só depois da senha conferir. Comparação de hash em tempo constante.
4. Middleware protegendo tudo fora de `/entrar`, `/cadastrar` e `/recuperar-senha`.
5. Layout autenticado com o nome e o botão sair.
6. Envio de e-mail atrás de uma interface. Em desenvolvimento, o código aparece no log do servidor, nunca na tela.

### Critérios de aceite

- Cadastro, entrada e saída funcionam no navegador.
- Senha não aparece em log, banco nem resposta da API. No banco só existe o hash.
- Código velho não recupera senha. Código novo, usado uma vez, não serve de novo.
- Abrir uma rota interna sem cookie redireciona para entrar.
- Duas contas não ficam com o mesmo e-mail.

### Erros que esta etapa evita

- Sessão guardada em `localStorage`.
- Senha em texto.
- Rota de API que confia no id de usuário mandado pelo navegador. O id sai da sessão.

---

## Etapa 2 — Ministério, membros, funções e permissões

### Objetivo

Criar o ministério de louvor, entrar nele, convidar pessoas, aprovar, definir quem é administrador e o que cada membro pode fazer. A partir daqui todo dado de trabalho tem dono: um ministério.

### Pré-requisito

Etapa 1 aceita.

### Fora desta etapa

Vários modelos visuais elaborados, capa e paleta além de uma cor, módulo de desligar música, QR Code, bloqueio por plano.

### Modelo

- `Ministry`: nome, fuso (padrão `America/Sao_Paulo`), cor, `musicModuleEnabled` true.
- `Membership`: usuário, ministério, status `pending | active | left`, flags de permissão, `isAdmin`.
- `MinistryFunction`: nome e ordem, por ministério.
- `MemberFunction`: quais funções a pessoa sabe exercer naquele ministério.
- `Invite`: ministério, código de 6 caracteres, criador, expira em 7 dias, `revokedAt`. Só um convite ativo por ministério. Código novo revoga o anterior.

Quem cria o ministério nasce administrador ativo, com as quatro permissões ligadas.

Funções iniciais do modelo Louvor, nesta ordem: Ministro, Vocal, Backing vocal, Violão, Guitarra, Baixo, Teclado, Bateria, Percussão. Dá para incluir, renomear, reordenar e arquivar. Arquivar não apaga histórico futuro; só impede uso em escala nova.

### Permissões

| Ação | Quem pode |
| --- | --- |
| Ver membros ativos e funções | Qualquer filiação ativa |
| Ver solicitações pendentes | Administrador |
| Aprovar ou rejeitar entrada | Administrador |
| Convidar, revogar convite | Administrador |
| Promover ou rebaixar administrador | Administrador, sem remover o último |
| Ligar permissões de um não-administrador | Administrador |
| Criar, editar, arquivar função do ministério | `canManageFunctions` ou administrador |
| Atribuir função a um membro | Administrador |
| Editar nome, fuso e cor | Administrador |
| Sair do ministério | O próprio membro, se não for o último administrador |

Administrador ignora as flags: pode escalas, repertório e funções. As flags dele não são editáveis na tela. Para limitar alguém, essa pessoa deixa de ser administrador e recebe flags.

Filiação `pending` não abre escala nem repertório. Filiação `left` some das listas e não entra em escala nova. O histórico dela permanece.

### Fluxo de convite

1. Administrador gera convite. A tela mostra o código e um link `/convite/[codigo]`.
2. Pessoa logada abre o link ou digita o código.
3. O sistema cria `Membership` pendente. Se já existe pendente, não duplica. Se já é membro ativo, avisa que ela já participa. Se tinha saído, a solicitação pode reabrir.
4. Administrador aprova ou rejeita. Rejeitar apaga a pendência ou marca como recusada, sem criar membro ativo.
5. A própria pessoa pode cancelar a pendência.

E-mail que já tem conta não ganha outra conta. A pessoa entra e usa o código.

### Telas

- `/ministerios`: lista dos ministérios ativos da pessoa e botão criar. Vazio explica os dois caminhos: criar ou usar um código.
- Criar: nome. Funções do louvor já vêm marcadas, com opção de tirar e acrescentar antes de salvar.
- `/m/[ministryId]`: início simples com o nome do ministério e atalhos (ainda vazios) para repertório e escalas.
- Membros: lista, busca por nome, funções de cada um, administradores.
- Convite: código, copiar, gerar outro, fila de pedidos.
- Entrar com código: campo e botão solicitar.
- Troca de ministério: seletor no topo. Trocar navega para `/m/[outroId]`, não só muda um estado local.

Toda página sob `/m/[ministryId]` carrega a filiação no servidor. Sem filiação ativa, responde 404. Não 403 com o nome do ministério, para não confirmar que ele existe para quem está de fora.

### Passos

1. Migração das tabelas desta etapa e o índice único (usuário, ministério).
2. Função única `getMembership(sessionUserId, ministryId)` usada por todas as páginas e ações. Ela devolve a filiação ativa ou falha.
3. Ações: criar ministério, atualizar dados, gerar convite, solicitar entrada, aprovar, rejeitar, cancelar pedido, sair, alterar admin, alterar flags, CRUD de função, atribuir funções ao membro.
4. Impedir, na transação, ficar com zero administradores.
5. Testes de servidor cobrindo: membro comum não aprova; último admin não sai; código revogado não entra; usuário do ministério A não lê membros do ministério B.

### Critérios de aceite

- Duas contas: uma cria o louvor, a outra entra pelo código e só aparece depois da aprovação.
- Membro comum não vê a fila de pedidos nem altera permissão, mesmo chamando a ação direto.
- Trocar o id na URL para outro ministério não vaza dados.
- Arquivar função tira ela da lista de novas atribuições e mantém o nome em quem já a tinha.
- Gerar convite novo invalida o código anterior.

### Erros que esta etapa evita

- Guardar “ministério atual” só no navegador e esquecer de filtrar a consulta.
- Usar `userId` onde o resto do sistema precisará de `membershipId`.
- Tratar administrador como uma flag solta que pode ficar zerada.

---

## Etapa 3 — Repertório

### Objetivo

O ministério cadastra as músicas que toca, com artista, tom, versões, links e pastas. A escala ainda não existe. Esta etapa só guarda o catálogo.

### Pré-requisito

Etapa 2 aceita. Módulo de música ligado.

### Fora desta etapa

Importar planilha, autopreenchimento por Spotify ou YouTube, tendências, metrônomo, lixeira com restauração, playlist. Link é colado na mão.

### Modelo

- `Classification`: nome e descrição, por ministério. Semear Adoração, Alegria, Consagração, Contemplação, Louvor e Especiais, com os textos da referência. O ministério pode criar outra e arquivar as padrão.
- `Folder`: nome, por ministério.
- `Song`: título, artista, BPM opcional, duração opcional, tom padrão, classificação opcional, pasta opcional.
- `SongVersion`: nome e tom daquela versão.
- `SongLink`: tipo, rótulo e URL. Pode pertencer à música ou a uma versão.

Tom é texto livre restrito a uma lista: C, C#, D, Eb, E, F, F#, G, Ab, A, Bb, B, e os menores correspondentes (Cm, C#m, …). Valor fora da lista é rejeitado. Campo vazio é permitido.

URL de link precisa ser `http` ou `https`.

### Regras

- Criar, editar e excluir música exige `canManageRepertoire` ou administrador.
- Qualquer membro ativo pode listar e abrir música.
- Título com pelo menos 2 caracteres. Artista opcional.
- Excluir música nesta etapa é `deletedAt`. Ela some das listas. A restauração fica para a Etapa 15, mas a coluna já nasce agora para a escala futura não apontar para linha destruída.
- Música de um ministério não aparece em outro.
- Tirar a música da pasta não exclui a música. Excluir a pasta desassocia as músicas e apaga só a pasta.
- Versão sem nome é rejeitada. O tom da versão não copia por cima do tom padrão da música.

### Telas

- Lista com busca por título ou artista, filtro por pasta e por classificação, ordem alfabética.
- Estado vazio com o botão de cadastrar, visível para quem tem permissão. Quem não tem vê o vazio sem o botão.
- Formulário da música: título, artista, tom, BPM, duração, classificação, pasta, versões e links.
- Pastas: criar, renomear, excluir.
- Classificações: listar, criar, arquivar.

### Passos

1. Migração e semente de classificações no momento em que o ministério é criado (completar a ação da Etapa 2, sem mudar o comportamento de convite).
2. Ações de CRUD com a checagem de permissão no servidor.
3. Busca simples com `contains` case-insensitive no título e no artista, sempre com `ministryId` e `deletedAt` nulo.
4. Testes: membro sem permissão não grava; tom inválido não grava; música do ministério A não sai na busca do B.

### Critérios de aceite

- Uma música com duas versões (por exemplo “Base” em G e “Ministro” em A) salva e reabre com os dois tons intactos.
- Link com texto que não é URL não salva.
- Membro sem permissão de repertório abre a lista e não consegue gravar, nem pela ação direta.
- Excluir tira da lista. O registro continua no banco com `deletedAt`.

### Erros que esta etapa evita

- Um único campo “tom” que a escala futura teria de sobrescrever.
- Aceitar qualquer texto em tom e quebrar a geração de cifra depois.
- Apagar a linha da música e órfãos quando a escala passar a referenciá-la.

---

## Etapa 4 — Escala manual

### Objetivo

Montar um culto ou ensaio na mão: data, equipe, músicas, tom daquele dia, observações. Salvar como rascunho ou publicar. Esta é a etapa central. As seguintes apoiam nela.

### Pré-requisito

Etapas 2 e 3 aceitas.

### Fora desta etapa

Recorrência, geração automática, confirmação, falta, conflito, roteiro, chat, compartilhar imagem, notificações. Publicar só muda o estado e quem pode ver.

### Modelo

Campos de `Schedule`, `ScheduleParticipant`, `ScheduleAssignment`, `ScheduleSong` e `ScheduleSongHighlight` descritos no modelo geral.

`Schedule.version` começa em 1 e incrementa em toda gravação bem-sucedida. O formulário manda a versão que abriu. Se a versão do banco for outra, a gravação falha com “esta escala foi alterada, reabra”.

Participante é único por escala. Funções dele ficam em `ScheduleAssignment` (uma ou mais). A função precisa existir no ministério e não estar arquivada no momento de atribuir. Função já atribuída que for arquivada depois permanece naquela escala.

`ScheduleSong.position` é 1, 2, 3… sem buraco depois de salvar. `keyOverride` nulo significa “usar o tom da versão, ou o tom padrão da música”. Preenchido, vale só nesta escala.

`ScheduleSongHighlight` liga um participante já escalado a uma música, com uma função que ele tem naquela escala. Não dá para destacar quem não está na equipe.

### Regras de visibilidade

| Status | Quem vê na lista e abre a tela |
| --- | --- |
| Rascunho | Administrador ou `canManageSchedules` |
| Publicada | Qualquer filiação ativa |
| `deletedAt` preenchido | Ninguém nesta etapa |

Membro comum que força a URL de um rascunho recebe 404.

### Regras de edição

- Criar, editar, publicar, despublicar (voltar a rascunho) e excluir exigem `canManageSchedules` ou administrador.
- `canEditScheduleSongs` altera somente a lista de músicas de uma escala que a pessoa já pode abrir. Não altera data, participantes nem observações. Não publica.
- Início obrigatório. Término, se existir, é maior que o início.
- Título obrigatório.
- Música da escala precisa ser do mesmo ministério e não estar excluída.
- Participante precisa ser filiação ativa daquele ministério.
- Excluir preenche `deletedAt`. Não apaga participações, para a lixeira futura restaurar inteiro.
- Salvar rascunho não muda status. Publicar muda para `published` numa transação junto com o conteúdo.

### Telas

- Lista de escalas futuras e passadas, separadas. Gestor vê rascunhos com um selo. Membro comum não vê rascunho.
- Criar: título, início, término, observações, vestimenta.
- Editor em abas: Dados, Equipe, Músicas.
- Equipe: buscar membro por nome, escolher uma ou mais funções, remover, limpar todos com confirmação.
- Músicas: incluir do repertório, ordenar, tom da escala (vazio = tom de origem), versão, observação, destacar participante.
- Barra de estado: Rascunho ou Publicada, com botões Salvar, Publicar e Excluir conforme a permissão.
- Detalhe para o membro: somente leitura quando ele não tem permissão de editar. Músicas mostram o tom efetivo (override ou origem) e os links do repertório.

### Passos

1. Migração das tabelas de escala com as unicidades e a coluna `version`.
2. Ação de salvar recebendo o pacote inteiro (dados, equipe, músicas) e a versão. Uma transação substitui participações e músicas daquela escala. Não fazer várias requisições soltas que possam salvar pela metade.
3. Ação publicar separada de salvar, para o estado ficar explícito.
4. Cálculo do tom efetivo numa função pura, testada sem banco: override se houver, senão tom da versão, senão tom padrão, senão vazio.
5. Testes de concorrência: duas gravações com a mesma versão, a segunda falha e a primeira permanece.
6. Testes de visibilidade do rascunho e de isolamento entre ministérios.
7. Teste de que salvar a escala não muda `Song.defaultKey` nem `SongVersion.key`.

### Critérios de aceite

- Gestor cria rascunho com 4 pessoas e 3 músicas, publica, e um membro comum passa a ver. Antes de publicar, o membro recebe 404 na URL.
- Alterar o tom na escala deixa o repertório igual.
- Duas funções na mesma pessoa salvam e reaparecem.
- Destaque numa música só lista quem está na equipe.
- Editar em duas abas: a segunda gravação avisa para reabrir e não perde o que a primeira salvou.
- Pessoa com só `canEditScheduleSongs` reordena músicas e não consegue mudar a equipe.

### Erros que esta etapa evita

- Publicar sem querer ao clicar em salvar.
- Tom da escala escrito no cadastro da música.
- Perder a escala inteira porque a gravação da equipe e a das músicas foram pedidos separados.
- Última gravação silenciosa quando duas pessoas editam juntas.

---

## Etapa 5 — Confirmação, indisponibilidade, conflito e falta

### Objetivo

Saber quem vem, quem não pode no período, quem está em duas escalas no mesmo horário e quem faltou depois do culto.

### Pré-requisito

Etapa 4 aceita.

### Fora desta etapa

WhatsApp, lembrete automático, indisponibilidade recorrente, geração automática respeitando estas regras (a geração vem na Etapa 12 e deve reutilizar as funções desta etapa).

### Modelo

Em `ScheduleParticipant`: `confirmation`, `confirmedAt`, `absent`, `absentAt`.

`Unavailability`: filiação, data inicial, data final inclusiva, descrição, `deletedAt`. A descrição só é lida por administrador. O membro vê as próprias descrições. Os outros membros veem apenas que a pessoa está indisponível no período, sem o texto.

Coluna `Schedule.confirmationRequired`, padrão true em escala nova.

### Regras de confirmação

- Só existe pedido de confirmação em escala publicada, com a opção ligada.
- O próprio participante confirma ou recusa. Gestor pode registrar em nome dele, porque no dia alguém avisa por fora.
- Estados: pendente, confirmado, não participarei.
- Confirmar ou recusar depois do término da escala é rejeitado.
- Voltar a escala para rascunho não apaga as respostas já dadas. Republicar mantém o que já estava confirmado.
- Sair da escala (remover a própria participação, se o gestor permitir, ou o gestor remover) apaga a participação. Não vira “não participarei”.

### Regras de falta

- Marcar ou desmarcar falta exige permissão de escalas ou administrador.
- Só depois do término. Antes disso a ação explica que a falta só existe quando o culto já passou.
- Falta não muda a confirmação. Alguém pode ter confirmado e faltado.
- Membro comum vê a própria falta. A lista completa de faltas da equipe é do gestor.

### Regras de indisponibilidade

- O membro cria, edita e remove as próprias. Gestor cria para qualquer membro do ministério.
- Data final maior ou igual à inicial.
- Períodos podem se sobrepor. Na consulta, basta existir um que cubra o dia da escala.
- Remover preenche `deletedAt`.

### Conflito

Função pura `findConflicts(membershipId, startsAt, endsAt, ignoreScheduleId)`:

- Outra escala publicada do mesmo ministério, não excluída, com participação daquela filiação, cujo intervalo cruza.
- Indisponibilidade ativa que cubra o dia local da escala no fuso do ministério.

O editor de equipe mostra o aviso ao adicionar e também um resumo ao abrir a escala. O aviso não impede salvar. Há uma ação explícita “remover indisponíveis desta escala”, que tira só quem tem indisponibilidade, numa transação, e não mexe em quem tem só conflito de outra escala.

Conflito entre ministérios diferentes não bloqueia nesta versão. A pessoa pode servir no louvor e na mídia no mesmo horário; o aviso, se for feito, fica para uma etapa posterior e deve dizer o nome do outro ministério. Nesta etapa o conflito é dentro do ministério.

### Telas

- Na escala publicada, o participante vê Confirmar e Não participarei, com o estado atual.
- Gestor vê a lista com os três estados e o botão de falta quando a data já passou.
- Página Indisponibilidades: as minhas, e para o gestor a de todos com a descrição.
- No adicionar participante: selo “indisponível” ou “já escalado neste horário”.

### Passos

1. Migração das colunas e da tabela.
2. Implementar `findConflicts` com testes de intervalo: encostando no horário, sobrepondo, terminando um minuto antes, escala excluída, rascunho (rascunho não conta como conflito para o membro, porque ele não vê rascunho; gestor vê o aviso de rascunho também).
3. Travar confirmação e falta nas ações, com a comparação de tempo no fuso certo: “já passou” usa `endsAt`, ou `startsAt` se não houver término.
4. Garantir que a API de lista de indisponibilidade do membro comum não devolve `description` dos outros.
5. Ligar o aviso na tela de equipe sem impedir o submit.

### Critérios de aceite

- Membro confirma a própria escala e o gestor vê o status sem recarregar a regra no cliente: um novo carregamento mostra confirmado.
- Depois do término, confirmar falha com mensagem clara. Marcar falta passa a funcionar.
- Descrição “férias” não aparece para outro membro comum.
- Adicionar alguém indisponível mostra o aviso e, se o gestor salvar mesmo assim, a pessoa permanece.
- “Remover indisponíveis” tira só esses.
- Duas escalas publicadas no mesmo horário geram aviso nas duas.

### Erros que esta etapa evita

- Tratar falta e “não participarei” como o mesmo campo.
- Comparar data de indisponibilidade em UTC e marcar a pessoa livre no domingo à noite no Brasil.
- Vazar o motivo da ausência para a equipe inteira.
- Impedir salvar por causa de um aviso e não ter como escalar a pessoa de propósito.

---

## Etapa 6 — Recorrência

### Objetivo

Cadastrar o culto de domingo uma vez e o sistema criar as próximas datas, sem duplicar e sem editar o domingo errado.

### Pré-requisito

Etapa 4 aceita. A Etapa 5 deve estar aceita para as ocorrências novas nascerem com confirmação pendente. Se a Etapa 5 ainda não entrou, a recorrência espera.

### Fora desta etapa

Geração automática de pessoas e músicas em cada data. A ocorrência nasce com título, horário e, se já existir roteiro (Etapa 7), a estrutura do roteiro. Equipe e músicas entram depois, na mão.

### Modelo

`Series`: ministério, frequência (`daily | weekly | monthly | yearly`), intervalo (repetir a cada N), dias da semana quando for semanal, término (`never | on_date | after_count`), data final ou quantidade, hora de início, duração em minutos, título, observações, vestimenta.

`Schedule.seriesId` e `Schedule.detachedFromSeries`.

`Schedule.originalStartsAt` guarda o horário de nascimento da ocorrência, para identificar a data lógica mesmo se alguém mudar o horário dela.

Ocorrências são materializadas até 90 dias à frente. Um comando idempotente `materializeSeries(seriesId, now)` cria as que faltam e não mexe nas que já existem.

### Regras

- Série semanal exige ao menos um dia da semana.
- Término por data ou por quantidade é coerente com a frequência. “Nunca” continua gerando na janela de 90 dias, cada vez que o comando roda.
- Editar ou excluir pergunta o alcance e o servidor só aceita um destes valores: `only_this`, `this_and_following`, `all`.
- `only_this` marca `detachedFromSeries`. A série deixa de alterar essa linha.
- `this_and_following` encerra a série antiga na ocorrência anterior e abre uma série nova a partir da editada, já desanexando a editada se o conteúdo dela também mudou. Implementação mais segura: a partir da ocorrência escolhida, as futuras ainda ligadas são apagadas logicamente e recriadas com o novo padrão. Ocorrências desanexadas no meio do caminho permanecem.
- `all` altera o padrão e recria as futuras ainda ligadas. Passadas não são reescritas.
- Ocorrência com equipe ou música já preenchida não é recriada no escopo `this_and_following` e `all` sem uma confirmação extra “substituir ocorrências que já têm equipe”. Padrão é preservar as que já têm participante ou música e só atualizar as vazias. Isso evita apagar o culto que alguém já montou.
- O comando de materializar pode rodar duas vezes seguidas sem duplicar. Unicidade: (`seriesId`, `originalStartsAt`) onde `deletedAt` é nulo.

### Telas

- No criar escala, opção “repetir”.
- Na escala ligada a uma série, mostrar “faz parte da série de domingo” e, se desanexada, “esta data não acompanha mais a série”.
- Modal de edição e de exclusão com os três alcances, escrito por extenso com a data (“somente 28 de setembro”, “esta e as seguintes”, “todas”).
- Lista das próximas ocorrências da série.

### Passos

1. Função pura que, dada a série e um instante, devolve as datas locais na janela. Testar domingo, quinzenal, mensal no dia 31 (mês curto cai no último dia do mês), e fuso em que o UTC já é o dia seguinte.
2. `materializeSeries` idempotente, com teste de rodar duas vezes.
3. Ações de editar e excluir com os três alcances, cobertas por teste que monta uma série de 4 datas, preenche a segunda, edita “esta e as seguintes” e confere que a segunda preenchida não foi apagada.
4. Agendar o comando uma vez por dia no servidor. Até existir agendador, um botão “atualizar próximas datas” na série, visível ao gestor, resolve e deve continuar existindo.

### Critérios de aceite

- “Todo domingo às 18h” cria as ocorrências dos próximos 90 dias, uma por domingo, no fuso do ministério.
- Rodar de novo não duplica.
- Editar só uma data muda essa data e as outras seguem o padrão antigo.
- Editar “todas” não apaga uma ocorrência que já tem equipe, a menos que o gestor confirme a substituição.
- Excluir “somente esta” tira uma data e a próxima materialização não a recria. Guardar `excludedStartsAt` na série, ou manter a linha com `deletedAt` e a unicidade considerando essa data lógica. A segunda opção é a escolhida: a linha fica excluída com `originalStartsAt`, e a materialização trata data já existente, mesmo excluída, como já resolvida.

### Erros que esta etapa evita

- Gerar o culto de domingo no sábado por causa de UTC.
- Duplicar ocorrências cada vez que a página abre.
- “Editar todas” destruindo escalas já montadas.
- Reaparecer uma data que o gestor excluiu de propósito.

---

## Etapa 7 — Roteiro do culto

### Objetivo

Além da lista de músicas, a escala descreve a ordem do culto: abertura, oração, louvor, palavra, oferta, avisos.

### Pré-requisito

Etapa 4 aceita. Se a Etapa 6 já existe, o modelo de roteiro da série copia itens para a ocorrência nova.

### Modelo

`ScriptTemplate`: ministério, nome.

`ScriptTemplateItem`: modelo, posição, título, observação, duração em segundos.

`ScriptItem`: escala, posição, título, observação, duração, `source` (`manual | songs`).

Itens `songs` não são editados um a um. São reconstruídos a partir de `ScheduleSong` sempre que as músicas salvam: um bloco “Louvor” com as músicas na ordem, ou um item por música com o título e o tom efetivo. A escolha desta versão é um item por música, para a duração de cada uma aparecer no roteiro. Itens manuais ficam na posição definida pelo gestor e não são apagados quando as músicas mudam.

### Regras

- Editar roteiro exige a mesma permissão de editar a escala.
- Duração vazia é permitida.
- Soma das durações aparece no topo, só como informação. Não precisa fechar com o horário da escala.
- Excluir a escala mantém os itens (soft delete da escala). Restaurar no futuro traz o roteiro junto.
- Modelo é do ministério. Aplicar modelo numa escala copia os itens manuais. Não fica ligado ao vivo: mudar o modelo depois não muda cultos antigos.

Itens sugeridos no modelo inicial “Culto”: Abertura, Oração, Boas-vindas, Louvor, Palavra, Oferta, Avisos, Encerramento. O bloco Louvor é o que será preenchido pelas músicas; os outros nascem manuais.

### Telas

- Aba Roteiro na escala, com reordenar, incluir item, duração e observação.
- Músicas aparecem no lugar do bloco de louvor e trazem um cadeado visual: para mudar a ordem delas, a pessoa vai na aba Músicas.
- Tela de modelos: criar, editar, aplicar na escala.

### Critérios de aceite

- Reordenar músicas reordena os itens de música no roteiro e não mexe na Oração nem na Palavra.
- Tirar uma música tira o item correspondente.
- Aplicar modelo não apaga músicas já escolhidas.
- Membro sem permissão vê o roteiro publicado e não edita.

### Erros que esta etapa evita

- Digitar a música de novo no roteiro e os dois lados divergirem.
- Modelo ligado ao vivo, alterando culto passado quando alguém corrige um texto.

---

## Etapa 8 — Avisos

### Objetivo

O ministério publica um recado que a equipe vê ao entrar, com opção de destacar na início e de arquivar sozinho numa data.

### Pré-requisito

Etapa 2 aceita.

### Fora desta etapa

Comentários no aviso e notificação push. O aviso é lido dentro do sistema.

### Modelo

`Notice`: ministério, autor (filiação), título, corpo, `pinned`, `expiresAt` opcional, `archivedAt`, `createdAt`.

### Regras

- Criar, editar, arquivar e desarquivar: administrador ou `canManageSchedules`. Quem organiza a escala também comunica. Se isso ficar largo demais na prática, a flag pode ser separada depois; nesta etapa não criar permissão nova.
- Qualquer membro ativo lista avisos não arquivados e não vencidos.
- Vencido arquiva na leitura: se `expiresAt` já passou, a listagem trata como arquivado. Um comando pode preencher `archivedAt`, mas a tela não depende disso para esconder.
- Destaque mostra no máximo 3 na início, os mais recentes entre os marcados.
- Autor vê o próprio nome. Editar não troca o autor; guarda `updatedAt`.

### Telas

- Início do ministério passa a mostrar avisos em destaque e aniversariantes só se a data de nascimento existir (o aviso de aniversário em si é a Etapa 15; aqui a início só lista avisos).
- Página Avisos, com arquivados numa segunda lista para o gestor.
- Formulário: título, texto, destaque, data de vencimento opcional.

### Critérios de aceite

- Membro vê o aviso destacado na início e deixa de ver no dia seguinte ao vencimento, no fuso do ministério.
- Membro comum não cria aviso.
- Arquivar tira da início e mantém na lista de arquivados do gestor.

---

## Etapa 9 — Chat do ministério e chat da escala

### Objetivo

A equipe conversa no ministério e, separado, no culto daquela data.

### Pré-requisito

Etapas 2 e 4 aceitas.

### Fora desta etapa

Anexo, áudio, limpar histórico com recuperação pelo suporte. Apagar mensagem individual pode esperar.

### Modelo

`ChatThread`: um por ministério (`ministry`) e um por escala (`schedule`). Criados na primeira mensagem, não no cadastro.

`ChatMessage`: thread, autor (filiação), corpo, `createdAt`.

### Regras

- Chat do ministério: qualquer filiação ativa lê e escreve.
- Chat da escala: quem pode ver a escala pode ler e escrever. Rascunho continua restrito a gestores. Membro comum não lê chat de rascunho.
- Mensagem vazia ou só com espaços é rejeitada. Limite de 2000 caracteres.
- Autor é sempre a filiação da sessão. Não aceitar autor vindo do cliente.
- Ordem de exibição é `createdAt` crescente. Paginar de 50 em 50, do fim para o começo.
- Atualização: a tela recarrega a cada poucos segundos ou ao focar. Tempo real com websocket fica fora até o chat simples estar correto. Não bloquear a etapa por causa de socket.

### Telas

- Página Chat do ministério.
- Aba Chat dentro da escala.
- Nome do autor e horário no fuso do ministério.

### Critérios de aceite

- Mensagem no culto A não aparece no culto B nem no chat geral.
- Membro sem acesso ao rascunho não lê o chat desse rascunho pela API.
- Duas pessoas enviando juntas não gravam uma no lugar da outra.

### Erros que esta etapa evita

- Um chat único para o ministério inteiro misturando ensaio e aviso geral.
- Confiar em atualização otimista sem a mensagem ter voltado do servidor com id.

---

## Etapa 10 — Notificações e lembretes

### Objetivo

A pessoa fica sabendo, dentro do sistema e por e-mail, do que mudou na escala dela. Cada um escolhe o que recebe.

### Pré-requisito

Etapas 4 e 5 aceitas. Avisos e chat, se já existirem, entram nos mesmos interruptores.

### Modelo

`Notification`: usuário destinatário, ministério, tipo, título, corpo, link, `readAt`, `createdAt`.

`NotificationPreference`: usuário, tipo, `inApp`, `email`. Padrão ligado para os tipos de escala que me afetam; desligado para o que é barulho de todo o ministério.

Tipos desta etapa:

- Adicionado a uma escala
- Removido de uma escala
- Escala em que participo foi alterada
- Escala em que participo foi cancelada (excluída)
- Pedido de entrada no ministério (para administradores)
- Entrada aprovada ou rejeitada (para o solicitante)

Lembretes, gerados por comando agendado, para participante de escala publicada ainda não recusada:

- 5 dias antes do início
- 1 dia antes
- 2 horas antes

Cada lembrete é único por (usuário, escala, tipo). Rodar o comando de novo não manda o segundo e-mail.

### Regras

- Notificação só nasce depois da transação principal concluir. Se publicar falhar, ninguém é avisado.
- Rascunho não gera notificação.
- Alterar escala publicada notifica os participantes atuais. Quem foi incluído nessa edição recebe “adicionado”. Quem foi tirado recebe “removido”. Quem permaneceu recebe “alterada” só se data, horário, função ou lista de músicas mudou. Mudar só uma observação também notifica: é simples e evita esquecer aviso importante. O texto diz o que mudou em uma linha.
- O destinatário só recebe se a preferência daquele tipo estiver ligada. Sem linha de preferência, vale o padrão.
- E-mail usa a mesma interface da Etapa 1. Falha de e-mail não desfaz a escala. A notificação interna continua criada. O erro fica em log.
- Lembrete não sai para quem recusou presença.
- Horário do lembrete é calculado no fuso do ministério a partir de `startsAt`.

### Telas

- Sino com a lista e o estado lido / não lido.
- Página de preferências com um interruptor por tipo, separado em “no sistema” e “e-mail”.
- Não existe tela de “enviar notificação” manual nesta etapa. O aviso do mural é outra coisa.

### Critérios de aceite

- Publicar escala com 3 pessoas cria 3 notificações e, com o e-mail de desenvolvimento, 3 registros no log.
- Salvar rascunho cria zero.
- Desligar o e-mail de “adicionado” continua criando a notificação interna e não manda e-mail.
- O comando de lembrete, rodado duas vezes no mesmo dia, manda um só “1 dia antes”.
- Pessoa que recusou não recebe lembrete.

### Erros que esta etapa evita

- Notificar no meio da transação e avisar de uma escala que deu rollback.
- Lembrete em UTC disparando de madrugada para culto às 18h.
- E-mail quebrado impedindo publicar a escala.

---

## Etapa 11 — Relatórios e panorama

### Objetivo

Quem lidera vê quem está servindo demais, quem está parado, confirmações, faltas e músicas mais tocadas, e enxerga o mês numa grade.

### Pré-requisito

Etapas 4 e 5 aceitas. Recorrência ajuda a encher o mês, mas não é obrigatória.

### Regras de contagem

Todas as contagens usam escala publicada, não excluída, no intervalo pedido, no fuso do ministério.

- Escalação: uma por participação, não por função. Se a pessoa tem duas funções no mesmo culto, conta uma escala e duas atribuições. O relatório mostra os dois números com rótulo explícito.
- Confirmação: contagem dos três estados entre os participantes dessas escalas.
- Falta: participações com `absent` verdadeiro.
- Música mais tocada: quantidade de `ScheduleSong` em escalas publicadas no período. A mesma música duas vezes na mesma escala conta duas, porque soou duas vezes.
- “Sem escala no período”: filiação ativa que não tem participação em escala publicada naquele intervalo.
- Rascunho não entra em relatório.

Período máximo de uma consulta: 12 meses. Acima disso a tela pede um intervalo menor.

Quem vê: administrador ou `canManageSchedules`. Membro comum vê só “minhas escalas”, que já existe desde a Etapa 4, e não o relatório da equipe.

### Panorama

Grade do mês: linhas são funções, colunas são dias que têm escala. Célula lista os nomes escalados naquela função. Toque abre a escala. Conflito e indisponibilidade usam a função da Etapa 5 e aparecem na célula.

Edição rápida não entra nesta etapa. O panorama abre a escala no editor que já existe. Evita um segundo caminho de gravação.

### Telas

- Visão geral: totais do mês corrente.
- Relatório de membros, de faltas, de músicas, de confirmações.
- Filtro de início e fim.
- Panorama mensal.

### Critérios de aceite

- Escala em rascunho não aumenta “quem mais serve”.
- Pessoa com violão e vocal no mesmo culto conta 1 escala e 2 atribuições.
- Música excluída do repertório ainda aparece no relatório histórico pelo título gravado. Para isso, `ScheduleSong` deve guardar `titleSnapshot` e `artistSnapshot` no momento de salvar a escala (acrescentar na Etapa 4 se ainda não existir; se a Etapa 4 já passou, esta etapa adiciona a coluna e preenche no próximo save, e o relatório usa o snapshot quando houver, senão o título atual).
- Membro comum recebe 404 no relatório.
- Mês com culto no domingo 23h continua no domingo certo.

### Erros que esta etapa evita

- Contar rascunho como serviço realizado.
- Perder o nome da música no relatório porque ela saiu do repertório.
- Um formulário de edição no panorama que não passa pela versão da escala e pisa na edição de outra pessoa.

---

## Etapa 12 — Geração automática

### Objetivo

O gestor escolhe funções, vagas e uma estratégia, e o sistema propõe pessoas e músicas. Nada é gravado até ele aceitar.

### Pré-requisito

Etapas 3, 4 e 5 aceitas. A Etapa 11 não é obrigatória. A Etapa 6 é desejável, porque a geração roda em cima de uma ocorrência já criada.

### Princípio

A geração é uma função pura que recebe um retrato já carregado (membros, funções que exercem, histórico, indisponibilidades, conflitos, repertório) e devolve uma proposta mais uma lista de motivos. Ela não escreve no banco. A tela mostra a proposta. Salvar usa a mesma ação da Etapa 4.

Isso impede a geração de ter regras diferentes da escala manual.

### Entrada

- Escala já existente (rascunho ou publicada).
- Vagas: função e quantidade.
- Estratégia de pessoas: equilibrada, mais ativos, menos ativos, padrão do dia da semana.
- Meses de histórico (1 a 12), padrão 3.
- Intervalo mínimo entre participações, em dias, ou nenhum.
- Priorizar quem falta menos: sim ou não.
- Permitir mais de uma função na mesma pessoa: sim ou não.
- Indisponibilidade: respeitar (não sugerir) ou avisar (pode sugerir com selo).
- Conflito com outra escala: não sugerir, sugerir com selo, ou ignorar.
- Membros excluídos da sugestão.
- Estratégia de músicas: rodízio, mais tocadas, equilibrada.
- Quantidade de músicas.
- Intervalo mínimo para repetir a mesma música, em dias.
- Incluir músicas nunca tocadas no período: sim ou não.

“Pessoas fixas” desta versão: o gestor marca membros que já devem ficar. A geração preenche só as vagas restantes e não remove os fixos.

### Como a estratégia escolhe pessoas

Histórico só de escalas publicadas não excluídas, no ministério, dentro dos meses pedidos.

Para cada vaga, percorrer candidatos que exercem aquela função e estão ativos. Tirar quem está na lista de exclusão, quem ficou dentro do intervalo mínimo, quem está indisponível se a opção for respeitar, e quem está em conflito se a opção for não sugerir.

Ordenar:

- Equilibrada: menos participações no período primeiro. Empate: participação mais antiga primeiro. Quem nunca foi fica na frente.
- Mais ativos: mais participações primeiro.
- Menos ativos: o inverso da equilibrada, com peso maior para quem tem zero.
- Padrão do dia da semana: mais participações naquele dia da semana (no fuso do ministério) primeiro. Empate cai na equilibrada.

Se “priorizar quem falta menos” estiver ligado, o número de faltas no período desempata antes da data antiga.

Cada candidato escolhido leva um motivo legível: “2 escalas nos últimos 3 meses”, “nunca escalado”, “última vez em 12 de julho”, “indisponível — incluído porque você permitiu aviso”.

Se faltarem pessoas para a vaga, a proposta vem incompleta e o aviso diz quantas faltaram. Não inventa membro.

### Como a estratégia escolhe músicas

Universo: músicas não excluídas do ministério.

- Rodízio: há mais tempo sem serem tocadas primeiro. Nunca tocadas na frente se “incluir novas” estiver ligado; senão ficam no fim.
- Mais tocadas: maior contagem no período.
- Equilibrada: menos execuções no período primeiro.

Respeitar o intervalo mínimo de repetição. Não sugerir a mesma música duas vezes na mesma proposta.

Motivo em cada uma: “última vez em …” ou “ainda não tocada”.

### Regras

- Gerar não publica e não notifica.
- Aceitar a proposta chama o salvar da Etapa 4, inclusive a checagem de versão. Se alguém editou no meio, a proposta não grava e a tela pede para recarregar.
- A proposta não é salva sozinha. Se a pessoa fechar a tela, some. Não criar rascunho paralelo.
- Configuração pode ser salva como padrão do ministério (`MinistryGenerationDefault`, um registro por ministério). É só o formulário, não uma escala.

### Telas

- Na escala, botão “Sugerir equipe e músicas”.
- Formulário com as opções e o botão gerar.
- Resultado: vagas preenchidas, motivos, avisos, músicas. Botões “gerar outra vez” e “usar esta sugestão”.
- “Usar esta sugestão” mostra o que será substituído na equipe e nas músicas antes de confirmar. Participantes fixos permanecem.

### Critérios de aceite

- Com histórico controlado em teste, a estratégia equilibrada escolhe quem tem menos escalas, e o motivo bate com a contagem.
- Indisponível não aparece quando a opção é respeitar, e aparece com selo quando a opção é avisar.
- Música tocada ontem não volta se o intervalo mínimo é 7 dias.
- Aceitar a sugestão não muda o tom padrão do repertório.
- Gerar não muda `Schedule.status`.
- Segunda geração, sem aceitar, não grava nada.

### Erros que esta etapa evita

- Gravar a sugestão direto e publicar sem revisão.
- Uma regra de conflito dentro da geração diferente da regra da Etapa 5. A geração chama `findConflicts`.
- Sorteio sem explicação, que a equipe não confia.

---

## Etapa 13 — Compartilhar a escala

### Objetivo

O gestor copia um texto fiel da escala ou baixa uma imagem simples para o grupo da equipe.

### Pré-requisito

Etapa 4 aceita. Confirmação (Etapa 5) enriquece o texto se já existir.

### Texto

Gerado no servidor a partir da escala visível para quem pede. Rascunho só para gestor.

Presets: completa, resumida, só participantes, só músicas. Opções: funções, status de confirmação, tom efetivo, ministro em destaque, links, observações, vestimenta, apenas confirmados.

Título e data entram sempre. Data formatada no fuso do ministério, com dia da semana.

O texto é determinístico: o mesmo dado produz o mesmo texto. Teste compara a string inteira.

Negrito com `*asteriscos*` é opção. Sem negrito, o texto sai limpo.

### Imagem

Nesta etapa, um único modelo, vertical, com nome do ministério, título, data, hora, músicas com tom e a equipe por função. Cor do ministério no topo. Sem editor de vários temas. Se a lista passar de um limite (por exemplo 12 linhas), a imagem diz “lista completa no sistema” em vez de encolher a fonte até ficar ilegível.

A imagem é gerada no servidor (SVG convertido ou HTML renderizado) para o membro baixar. Não depende de fonte instalada na máquina de quem desenvolve.

### Critérios de aceite

- O texto mostra o tom efetivo, não o tom antigo do repertório, quando há override.
- Membro comum não gera texto de rascunho.
- “Apenas confirmados” omite pendente e quem recusou.
- A imagem contém os mesmos nomes do texto no preset correspondente.

### Erros que esta etapa evita

- Montar o texto no navegador com fuso do computador de quem compartilhou, diferente do fuso da igreja.
- Prometer três modelos visuais e atrasar o uso real do grupo.

---

## Etapa 14 — Integrações externas

Cada integração é independente. A ordem interna é a desta seção. Nenhuma delas bloqueia o uso do sistema.

### 14.1 Google Agenda

Cada usuário conecta a própria conta. Escala publicada em que ele é participante vira evento. Mudou horário ou ele saiu da escala: o evento atualiza ou some. Desconectar apaga os eventos futuros criados pelo sistema.

Guardar o id do evento externo em `CalendarEventLink (userId, scheduleId, externalId)`.

Não colocar a escala no calendário de outra pessoa. Não pedir permissão de escrita além de eventos criados pela aplicação.

Critério: alterar o horário da escala altera o evento; sair da escala remove o evento; rascunho não cria evento.

### 14.2 E-mail de convite

Complemento da Etapa 2. O administrador informa um e-mail. Se a conta existe, manda o código. Se não existe, cria um convite pendente de ativação com link para definir senha, no mesmo fluxo de recuperação da Etapa 1, e ao concluir associa a filiação pendente. Não criar usuário ativo sem senha definida.

### 14.3 WhatsApp

Só começar com um provedor oficial definido e um número da igreja para testes. Fora isso, não improvisar envio.

Escopo mínimo: mensagem quando a pessoa é adicionada a uma escala publicada, com texto da Etapa 13 e dois retornos autenticados: confirmar e não participar. O retorno chama as mesmas ações da Etapa 5. O número de telefone fica no perfil, verificado por código.

Se o provedor não estiver contratado, esta subetapa não inicia. O e-mail da Etapa 10 já cobre o aviso.

### 14.4 Holyrics ou leitura externa

Um token por ministério, mostrado uma vez, somente leitura, revogável. Endpoints: escala publicada por id ou por intervalo, com músicas, tom efetivo e equipe. Sem rascunho. Sem escrita.

Critério: revogar o token faz a chamada seguinte falhar; rascunho não sai na API; ministério errado não vaza.

---

## Etapa 15 — Acabamento

Itens que deixam o sistema completo para o dia a dia, cada um pequeno e independente.

- **Lixeira de 30 dias.** Gestor restaura escala e música com `deletedAt` dentro da janela. Restaurar escala traz participações, músicas e roteiro. Depois de 30 dias um comando pode apagar de verdade, ou só continuar oculto. Preferir continuar oculto até haver backup confiável.
- **Aniversário.** Na início, quem faz aniversário no dia local do ministério. Preferência de notificação “aniversariantes do dia” para os membros, um aviso por dia, não um por pessoa entrando na tela.
- **Histórico da escala.** Tabela `ScheduleChange` gravada na mesma transação do salvar: quem, quando, resumo (músicas adicionadas, equipe alterada, publicada). Não guardar o pacote inteiro se o resumo basta.
- **Entrar com Google.** Liga numa conta existente pelo e-mail verificado. E-mail não verificado não vincula. Não cria segunda conta para o mesmo e-mail.
- **Apagar a própria conta.** Remove sessão, anonimiza nome e e-mail, mantém participações passadas como “membro removido” para o relatório não quebrar. Esta ação é definitiva e pede a senha.
- **Tema claro e escuro.** Só visual.
- **Modelo de ministério de mídia.** Ao criar, opção sem módulo de música: esconde repertório, músicas na escala, metrônomo e relatório de músicas. Escala, equipe e avisos continuam.
- **Metrônomo e tap BPM.** Ferramenta local na página da música, sem gravar áudio. BPM calculado pode ser salvo no campo que já existe.
- **Importar e exportar repertório em planilha.** Modelo com colunas título, artista, tom, BPM, classificação, link de cifra, link de vídeo. Prévia antes de gravar. Linha cujo título e artista já existem não duplica. Exportar o que está ativo.

Cada item tem o próprio critério: a ação feliz, o caso sem permissão e o caso que não pode destruir dado vizinho.

---

## Ordem e o que testar ao avançar

A ordem é obrigatória até a Etapa 5. Da 6 em diante, avisos (8) podem vir antes de recorrência se a equipe precisar de mural. Geração (12) não começa antes de conflito (5) e repertório (3). Compartilhar (13) pode vir logo depois da escala (4) se o grupo de WhatsApp manual for a prioridade da igreja; o texto fica mais pobre sem confirmação e melhora sozinho quando a Etapa 5 entrar.

Ao fechar uma etapa, repetir este roteiro no navegador, com duas contas (gestor e membro):

1. Entrar com as duas.
2. Confirmar que o membro não vê rascunho, fila de aprovação nem relatório.
3. Abrir uma escala publicada, confirmar presença com o membro.
4. Mudar o tom na escala e abrir a música no repertório: o tom de origem permanece.
5. Trocar o id do ministério na URL com a conta que não pertence a ele e receber 404.

Esse roteiro pega a maior parte dos vazamentos e dos efeitos colaterais entre etapas.

---

## Definição de pronto do primeiro uso real

A igreja pode largar a planilha quando as Etapas 0 a 5 e a 10 estiverem aceitas, mais o texto de compartilhamento da Etapa 13. Com isso existe conta, equipe, música, culto, confirmação, falta, indisponibilidade, aviso por e-mail e um texto para colar no grupo.

Recorrência, roteiro, chat, panorama, geração automática e integrações são o passo seguinte, na ordem deste documento, cada uma só depois dos critérios da anterior.
