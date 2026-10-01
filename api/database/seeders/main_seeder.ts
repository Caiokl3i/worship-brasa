import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'
import { randomUUID } from 'node:crypto'
import db from '@adonisjs/lucid/services/db'
import User from '#models/user'
import Ministry from '#models/ministry'
import MinistryFunction from '#models/ministry_function'
import Membership from '#models/membership'
import Unavailability from '#models/unavailability'
import Folder from '#models/folder'
import Classification from '#models/classification'
import Song from '#models/song'
import SongVersion from '#models/song_version'
import SongLink from '#models/song_link'
import Schedule from '#models/schedule'
import ScheduleParticipant from '#models/schedule_participant'
import ScheduleAssignment from '#models/schedule_assignment'
import ScheduleSong from '#models/schedule_song'
import ScriptItem from '#models/script_item'
import ScriptTemplate from '#models/script_template'
import ScriptTemplateItem from '#models/script_template_item'
import Notice from '#models/notice'
import Notification from '#models/notification'
import ChatThread from '#models/chat_thread'
import ChatMessage from '#models/chat_message'
import Invite from '#models/invite'
import Series from '#models/series'
import ScheduleChange from '#models/schedule_change'
import NotificationPreference from '#models/notification_preference'
import MinistryGenerationDefault from '#models/ministry_generation_default'

export default class MainSeeder extends BaseSeeder {
  async run() {
    console.log('🧹 Limpando dados anteriores para seed completo...')

    await db.rawQuery(`
      TRUNCATE TABLE 
        birthday_digests,
        calendar_event_links,
        calendar_connections,
        chat_messages,
        chat_threads,
        email_invites,
        integration_tokens,
        invites,
        notifications,
        notification_preferences,
        password_resets,
        schedule_song_highlights,
        schedule_songs,
        schedule_assignments,
        schedule_participants,
        schedule_changes,
        script_items,
        schedules,
        series_script_items,
        series,
        script_template_items,
        script_templates,
        song_links,
        song_versions,
        songs,
        folders,
        classifications,
        unavailabilities,
        notices,
        member_functions,
        ministry_generation_defaults,
        ministry_functions,
        memberships,
        ministries,
        users
      CASCADE;
    `)

    console.log('👤 Criando usuários...')
    const now = DateTime.utc().setZone('America/Sao_Paulo', { keepLocalTime: true })
    const todayMonth = now.month
    const todayDay = now.day

    // 1. Usuários Principais
    const userAdmin = await User.create({
      name: 'Caio Klein',
      email: 'admin@louveapp.com',
      password: 'password123',
      birthDate: DateTime.fromObject({ year: 1992, month: 5, day: 18 }),
      authVersion: 1,
    })

    // EXCEÇÃO: Aniversariantes de HOJE!
    const userMariana = await User.create({
      name: 'Mariana Souza',
      email: 'mariana@louveapp.com',
      password: 'password123',
      birthDate: DateTime.fromObject({ year: 1998, month: todayMonth, day: todayDay }),
      authVersion: 1,
    })

    const userDavi = await User.create({
      name: 'Davi Alencar',
      email: 'davi@louveapp.com',
      password: 'password123',
      birthDate: DateTime.fromObject({ year: 1994, month: todayMonth, day: todayDay }),
      authVersion: 1,
    })

    // Aniversariante no mês corrente
    const userBeatriz = await User.create({
      name: 'Beatriz Lima',
      email: 'beatriz@louveapp.com',
      password: 'password123',
      birthDate: DateTime.fromObject({ year: 2000, month: todayMonth, day: todayDay === 15 ? 16 : 15 }),
      authVersion: 1,
    })

    const userGabriel = await User.create({
      name: 'Gabriel Santos',
      email: 'gabriel@louveapp.com',
      password: 'password123',
      birthDate: DateTime.fromObject({ year: 1997, month: 10, day: 12 }),
      authVersion: 1,
    })

    // Usuário que terá INDISPONIBILIDADE / Conflito
    const userRodrigo = await User.create({
      name: 'Rodrigo Nogueira',
      email: 'rodrigo@louveapp.com',
      password: 'password123',
      birthDate: DateTime.fromObject({ year: 1995, month: 11, day: 20 }),
      authVersion: 1,
    })

    const userFelipe = await User.create({
      name: 'Felipe Rocha',
      email: 'felipe@louveapp.com',
      password: 'password123',
      birthDate: DateTime.fromObject({ year: 1999, month: 8, day: 24 }),
      authVersion: 1,
    })

    const userLarissa = await User.create({
      name: 'Larissa Mendes',
      email: 'larissa@louveapp.com',
      password: 'password123',
      birthDate: DateTime.fromObject({ year: 2002, month: 4, day: 22 }),
      authVersion: 1,
    })

    const userThiago = await User.create({
      name: 'Thiago Martins',
      email: 'thiago@louveapp.com',
      password: 'password123',
      birthDate: DateTime.fromObject({ year: 1993, month: 7, day: 19 }),
      authVersion: 1,
    })

    const userSarah = await User.create({
      name: 'Sarah Oliveira',
      email: 'sarah@louveapp.com',
      password: 'password123',
      birthDate: DateTime.fromObject({ year: 2001, month: 1, day: 14 }),
      authVersion: 1,
    })

    // Equipe de Mídia & Transmissão
    const userLucas = await User.create({
      name: 'Lucas Ribeiro',
      email: 'midia@louveapp.com',
      password: 'password123',
      birthDate: DateTime.fromObject({ year: 1996, month: 7, day: 3 }),
      authVersion: 1,
    })

    const userCamila = await User.create({
      name: 'Camila Ferreira',
      email: 'camila@louveapp.com',
      password: 'password123',
      birthDate: DateTime.fromObject({ year: 1999, month: 12, day: 19 }),
      authVersion: 1,
    })

    const userJoao = await User.create({
      name: 'João Pedro Costa',
      email: 'joao@louveapp.com',
      password: 'password123',
      birthDate: DateTime.fromObject({ year: 1998, month: 3, day: 27 }),
      authVersion: 1,
    })

    const userAmanda = await User.create({
      name: 'Amanda Silveira',
      email: 'amanda@louveapp.com',
      password: 'password123',
      birthDate: DateTime.fromObject({ year: 2003, month: 6, day: 11 }),
      authVersion: 1,
    })

    // Usuário com pedido pendente
    const userPedro = await User.create({
      name: 'Pedro Henrique',
      email: 'pedro@louveapp.com',
      password: 'password123',
      birthDate: DateTime.fromObject({ year: 2000, month: 2, day: 9 }),
      authVersion: 1,
    })

    console.log('🏛️ Criando ministérios...')

    // MINISTÉRIO 1: LOUVOR PRINCIPAL
    const ministryWorship = await Ministry.create({
      name: 'Louvor Principal - Brasa Church',
      color: '#0084f7',
      timezone: 'America/Sao_Paulo',
      musicModuleEnabled: true,
    })

    // MINISTÉRIO 2: MÍDIA & TRANSMISSÃO
    const ministryMedia = await Ministry.create({
      name: 'Ministério de Mídia & Transmissão',
      color: '#8b5cf6',
      timezone: 'America/Sao_Paulo',
      musicModuleEnabled: false,
    })

    // MINISTÉRIO 3: YOUTH
    const ministryYouth = await Ministry.create({
      name: 'Worship Youth - Jovens Brasa',
      color: '#10b981',
      timezone: 'America/Sao_Paulo',
      musicModuleEnabled: true,
    })

    console.log('🏷️ Criando funções nos ministérios...')

    // Funções Louvor
    const fnMinistro = await MinistryFunction.create({ ministryId: ministryWorship.id, name: 'Ministro de Louvor', sortOrder: 1 })
    const fnSoprano = await MinistryFunction.create({ ministryId: ministryWorship.id, name: 'Vocal Soprano', sortOrder: 2 })
    const fnContralto = await MinistryFunction.create({ ministryId: ministryWorship.id, name: 'Vocal Contralto', sortOrder: 3 })
    const fnBacking = await MinistryFunction.create({ ministryId: ministryWorship.id, name: 'Backing Vocal', sortOrder: 4 })
    const fnViolao = await MinistryFunction.create({ ministryId: ministryWorship.id, name: 'Violão', sortOrder: 5 })
    const fnGuitarra = await MinistryFunction.create({ ministryId: ministryWorship.id, name: 'Guitarra', sortOrder: 6 })
    const fnBaixo = await MinistryFunction.create({ ministryId: ministryWorship.id, name: 'Baixo', sortOrder: 7 })
    const fnTeclado = await MinistryFunction.create({ ministryId: ministryWorship.id, name: 'Teclado & Synth', sortOrder: 8 })
    const fnBateria = await MinistryFunction.create({ ministryId: ministryWorship.id, name: 'Bateria', sortOrder: 9 })
    const fnPercussao = await MinistryFunction.create({ ministryId: ministryWorship.id, name: 'Percussão / Cajón', sortOrder: 10 })

    // Funções Mídia
    const fnSom = await MinistryFunction.create({ ministryId: ministryMedia.id, name: 'Operador de Som (FOH)', sortOrder: 1 })
    const fnProjecao = await MinistryFunction.create({ ministryId: ministryMedia.id, name: 'Projeção (Holyrics)', sortOrder: 2 })
    const fnTransmissao = await MinistryFunction.create({ ministryId: ministryMedia.id, name: 'Transmissão (OBS/Live)', sortOrder: 3 })
    const fnCamera1 = await MinistryFunction.create({ ministryId: ministryMedia.id, name: 'Câmera Principal', sortOrder: 4 })
    const fnIluminacao = await MinistryFunction.create({ ministryId: ministryMedia.id, name: 'Iluminação Cênica', sortOrder: 5 })

    console.log('🤝 Criando membros e permissões...')

    // Membership Caio (Admin Louvor & Admin Mídia)
    const mbCaioWorship = await Membership.create({
      userId: userAdmin.id,
      ministryId: ministryWorship.id,
      isAdmin: true,
      canManageSchedules: true,
      canManageRepertoire: true,
      canManageFunctions: true,
      canEditScheduleSongs: true,
      status: 'active',
    })
    await db.table('member_functions').insert([
      { membership_id: mbCaioWorship.id, function_id: fnMinistro.id },
      { membership_id: mbCaioWorship.id, function_id: fnViolao.id },
    ])

    await Membership.create({
      userId: userAdmin.id,
      ministryId: ministryMedia.id,
      isAdmin: true,
      canManageSchedules: true,
      canManageRepertoire: false,
      canManageFunctions: true,
      canEditScheduleSongs: false,
      status: 'active',
    })

    await Membership.create({
      userId: userAdmin.id,
      ministryId: ministryYouth.id,
      isAdmin: true,
      canManageSchedules: true,
      canManageRepertoire: true,
      canManageFunctions: true,
      canEditScheduleSongs: true,
      status: 'active',
    })

    // Outros Membros do Louvor
    const mbMariana = await Membership.create({
      userId: userMariana.id,
      ministryId: ministryWorship.id,
      isAdmin: false,
      canManageSchedules: true,
      canManageRepertoire: true,
      canManageFunctions: false,
      canEditScheduleSongs: true,
      status: 'active',
    })
    await db.table('member_functions').insert([
      { membership_id: mbMariana.id, function_id: fnMinistro.id },
      { membership_id: mbMariana.id, function_id: fnSoprano.id },
    ])

    const mbDavi = await Membership.create({
      userId: userDavi.id,
      ministryId: ministryWorship.id,
      isAdmin: false,
      canManageSchedules: false,
      canManageRepertoire: true,
      canManageFunctions: false,
      canEditScheduleSongs: true,
      status: 'active',
    })
    await db.table('member_functions').insert([{ membership_id: mbDavi.id, function_id: fnTeclado.id }])

    const mbBeatriz = await Membership.create({
      userId: userBeatriz.id,
      ministryId: ministryWorship.id,
      isAdmin: false,
      canManageSchedules: false,
      canManageRepertoire: false,
      canManageFunctions: false,
      canEditScheduleSongs: false,
      status: 'active',
    })
    await db.table('member_functions').insert([{ membership_id: mbBeatriz.id, function_id: fnContralto.id }])

    const mbGabriel = await Membership.create({
      userId: userGabriel.id,
      ministryId: ministryWorship.id,
      isAdmin: false,
      canManageSchedules: false,
      canManageRepertoire: false,
      canManageFunctions: false,
      canEditScheduleSongs: false,
      status: 'active',
    })
    await db.table('member_functions').insert([{ membership_id: mbGabriel.id, function_id: fnGuitarra.id }])

    const mbRodrigo = await Membership.create({
      userId: userRodrigo.id,
      ministryId: ministryWorship.id,
      isAdmin: false,
      canManageSchedules: false,
      canManageRepertoire: false,
      canManageFunctions: false,
      canEditScheduleSongs: false,
      status: 'active',
    })
    await db.table('member_functions').insert([{ membership_id: mbRodrigo.id, function_id: fnBaixo.id }])

    const mbFelipe = await Membership.create({
      userId: userFelipe.id,
      ministryId: ministryWorship.id,
      isAdmin: false,
      canManageSchedules: false,
      canManageRepertoire: false,
      canManageFunctions: false,
      canEditScheduleSongs: false,
      status: 'active',
    })
    await db.table('member_functions').insert([{ membership_id: mbFelipe.id, function_id: fnBateria.id }])

    const mbLarissa = await Membership.create({
      userId: userLarissa.id,
      ministryId: ministryWorship.id,
      isAdmin: false,
      canManageSchedules: false,
      canManageRepertoire: false,
      canManageFunctions: false,
      canEditScheduleSongs: false,
      status: 'active',
    })
    await db.table('member_functions').insert([{ membership_id: mbLarissa.id, function_id: fnBacking.id }])

    const mbThiago = await Membership.create({
      userId: userThiago.id,
      ministryId: ministryWorship.id,
      isAdmin: false,
      canManageSchedules: false,
      canManageRepertoire: false,
      canManageFunctions: false,
      canEditScheduleSongs: false,
      status: 'active',
    })
    await db.table('member_functions').insert([{ membership_id: mbThiago.id, function_id: fnViolao.id }])

    const mbSarah = await Membership.create({
      userId: userSarah.id,
      ministryId: ministryWorship.id,
      isAdmin: false,
      canManageSchedules: false,
      canManageRepertoire: false,
      canManageFunctions: false,
      canEditScheduleSongs: false,
      status: 'active',
    })
    await db.table('member_functions').insert([{ membership_id: mbSarah.id, function_id: fnPercussao.id }])

    // Membro Pendente no Louvor (Para testar solicitações de entrada)
    await Membership.create({
      userId: userPedro.id,
      ministryId: ministryWorship.id,
      isAdmin: false,
      canManageSchedules: false,
      canManageRepertoire: false,
      canManageFunctions: false,
      canEditScheduleSongs: false,
      status: 'pending',
    })

    // Membros de Mídia
    const mbLucasMedia = await Membership.create({
      userId: userLucas.id,
      ministryId: ministryMedia.id,
      isAdmin: true,
      canManageSchedules: true,
      canManageRepertoire: false,
      canManageFunctions: true,
      canEditScheduleSongs: false,
      status: 'active',
    })
    await db.table('member_functions').insert([{ membership_id: mbLucasMedia.id, function_id: fnSom.id }])

    const mbCamilaMedia = await Membership.create({
      userId: userCamila.id,
      ministryId: ministryMedia.id,
      isAdmin: false,
      canManageSchedules: false,
      canManageRepertoire: false,
      canManageFunctions: false,
      canEditScheduleSongs: false,
      status: 'active',
    })
    await db.table('member_functions').insert([{ membership_id: mbCamilaMedia.id, function_id: fnProjecao.id }])

    const mbJoaoMedia = await Membership.create({
      userId: userJoao.id,
      ministryId: ministryMedia.id,
      isAdmin: false,
      canManageSchedules: false,
      canManageRepertoire: false,
      canManageFunctions: false,
      canEditScheduleSongs: false,
      status: 'active',
    })
    await db.table('member_functions').insert([{ membership_id: mbJoaoMedia.id, function_id: fnTransmissao.id }])

    const mbAmandaMedia = await Membership.create({
      userId: userAmanda.id,
      ministryId: ministryMedia.id,
      isAdmin: false,
      canManageSchedules: false,
      canManageRepertoire: false,
      canManageFunctions: false,
      canEditScheduleSongs: false,
      status: 'active',
    })
    await db.table('member_functions').insert([
      { membership_id: mbAmandaMedia.id, function_id: fnCamera1.id },
      { membership_id: mbAmandaMedia.id, function_id: fnIluminacao.id },
    ])

    console.log('⛔ Criando indisponibilidades e conflitos de agenda...')

    // EXCEÇÃO: Rodrigo Nogueira com indisponibilidade no próximo fim de semana!
    const nextSunday = now.plus({ days: (7 - now.weekday) % 7 || 7 })
    const prevSunday = now.minus({ days: now.weekday % 7 })

    await Unavailability.create({
      membershipId: mbRodrigo.id,
      startsOn: nextSunday.minus({ days: 1 }),
      endsOn: nextSunday.plus({ days: 1 }),
      description: 'Viagem corporativa / Conferência Estadual em Curitiba',
    })

    await Unavailability.create({
      membershipId: mbLarissa.id,
      startsOn: now.plus({ days: 8 }),
      endsOn: now.plus({ days: 10 }),
      description: 'Plantão médico no Hospital Regional',
    })

    console.log('🎵 Criando pastas, classificações e repertório musical...')

    // Pastas
    const folderCongregacional = await Folder.create({ ministryId: ministryWorship.id, name: 'Louvor Congregacional' })
    const folderAdoracao = await Folder.create({ ministryId: ministryWorship.id, name: 'Adoração Íntima' })
    const folderCelebracao = await Folder.create({ ministryId: ministryWorship.id, name: 'Júbilo & Celebração' })
    const folderCeia = await Folder.create({ ministryId: ministryWorship.id, name: 'Ceia do Senhor' })

    // Classificações
    const classAdoracao = await Classification.create({ ministryId: ministryWorship.id, name: 'Adoração', description: 'Músicas de profunda reverência e entrega' })
    const classJubilo = await Classification.create({ ministryId: ministryWorship.id, name: 'Júbilo', description: 'Músicas festivas e alegres de celebração' })
    const classContemplacao = await Classification.create({ ministryId: ministryWorship.id, name: 'Contemplação', description: 'Músicas meditativas sobre os atributos de Deus' })
    const classCeia = await Classification.create({ ministryId: ministryWorship.id, name: 'Ceia', description: 'Foco na cruz, ressurreição e graça' })

    // Músicas
    const songCasaSua = await Song.create({
      ministryId: ministryWorship.id,
      folderId: folderCongregacional.id,
      classificationId: classAdoracao.id,
      title: 'A Casa É Sua',
      artist: 'Casa Worship',
      bpm: 72,
      defaultKey: 'C',
      durationSeconds: 420,
    })
    await SongVersion.create({ songId: songCasaSua.id, name: 'Versão Ministro Masculino', key: 'D' })
    await SongVersion.create({ songId: songCasaSua.id, name: 'Versão Ministro Feminino', key: 'G' })
    await SongLink.create({ songId: songCasaSua.id, kind: 'youtube', label: 'YouTube - Vídeo Oficial', url: 'https://www.youtube.com/watch?v=12345' })
    await SongLink.create({ songId: songCasaSua.id, kind: 'cifra', label: 'Cifra Club', url: 'https://www.cifraclub.com.br/casa-worship/a-casa-e-sua/' })

    const songRujaLeao = await Song.create({
      ministryId: ministryWorship.id,
      folderId: folderCelebracao.id,
      classificationId: classJubilo.id,
      title: 'Ruja o Leão',
      artist: 'Talita Catanzaro / Central 3',
      bpm: 128,
      defaultKey: 'Em',
      durationSeconds: 350,
    })
    await SongLink.create({ songId: songRujaLeao.id, kind: 'youtube', label: 'Clipe Oficial', url: 'https://youtube.com/watch?v=leao123' })

    const songBondade = await Song.create({
      ministryId: ministryWorship.id,
      folderId: folderCongregacional.id,
      classificationId: classContemplacao.id,
      title: 'Bondade de Deus',
      artist: 'Isaías Saad',
      bpm: 70,
      defaultKey: 'G',
      durationSeconds: 310,
    })

    const songSobreVoce = await Song.create({
      ministryId: ministryWorship.id,
      folderId: folderAdoracao.id,
      classificationId: classAdoracao.id,
      title: 'É Tudo Sobre Você',
      artist: 'Morada',
      bpm: 68,
      defaultKey: 'D',
      durationSeconds: 400,
    })
    await SongVersion.create({ songId: songSobreVoce.id, name: 'Versão Estendida com Ministração', key: 'D' })

    await Song.create({
      ministryId: ministryWorship.id,
      folderId: folderAdoracao.id,
      classificationId: classAdoracao.id,
      title: 'Digno de Tudo',
      artist: 'FHOP',
      bpm: 72,
      defaultKey: 'D',
      durationSeconds: 440,
    })

    await Song.create({
      ministryId: ministryWorship.id,
      folderId: folderAdoracao.id,
      classificationId: classAdoracao.id,
      title: 'Me Atraiu',
      artist: 'Gabriela Rocha',
      bpm: 74,
      defaultKey: 'F',
      durationSeconds: 360,
    })

    await Song.create({
      ministryId: ministryWorship.id,
      folderId: folderCelebracao.id,
      classificationId: classJubilo.id,
      title: 'Ele Vem',
      artist: 'Gabriel Guedes',
      bpm: 68,
      defaultKey: 'Bb',
      durationSeconds: 330,
    })

    await Song.create({
      ministryId: ministryWorship.id,
      folderId: folderAdoracao.id,
      classificationId: classAdoracao.id,
      title: 'Lugar Secreto',
      artist: 'Gabriela Rocha',
      bpm: 70,
      defaultKey: 'A',
      durationSeconds: 295,
    })

    await Song.create({
      ministryId: ministryWorship.id,
      folderId: folderCeia.id,
      classificationId: classCeia.id,
      title: 'Porque Ele Vive',
      artist: 'Harpa Cristã',
      bpm: 65,
      defaultKey: 'G',
      durationSeconds: 260,
    })

    await Song.create({
      ministryId: ministryWorship.id,
      folderId: folderAdoracao.id,
      classificationId: classAdoracao.id,
      title: 'Quero Conhecer Jesus',
      artist: 'Alessandro Vilas Boas',
      bpm: 70,
      defaultKey: 'G',
      durationSeconds: 450,
    })

    await Song.create({
      ministryId: ministryWorship.id,
      folderId: folderCelebracao.id,
      classificationId: classJubilo.id,
      title: 'Tu És Bom',
      artist: 'Fred Arrais',
      bpm: 126,
      defaultKey: 'E',
      durationSeconds: 280,
    })

    console.log('📅 Criando escalas, participantes, conflitos e roteiros...')

    // ESCALA 1: PRÓXIMO DOMINGO MANHÃ (Publicada, rica)
    const scheduleSundayMorning = await Schedule.create({
      ministryId: ministryWorship.id,
      title: 'Culto de Celebração - Domingo Manhã',
      startsAt: nextSunday.set({ hour: 10, minute: 0, second: 0 }),
      endsAt: nextSunday.set({ hour: 11, minute: 45, second: 0 }),
      status: 'published',
      dressCode: 'Camisas neutras / Tons terrosos (bege, terracota, cáqui)',
      notes: 'Chegada dos músicos às 09:00 impreterivelmente para passagem de som e oração pré-culto.',
      confirmationRequired: true,
      version: 1,
      detachedFromSeries: false,
    })

    // Participantes da escala domingo manhã:
    // Caio (Ministro & Violão) - CONFIRMADO
    const ptCaio = await ScheduleParticipant.create({
      scheduleId: scheduleSundayMorning.id,
      membershipId: mbCaioWorship.id,
      confirmation: 'confirmed',
      confirmedAt: now.minus({ hours: 12 }),
      absent: false,
    })
    await ScheduleAssignment.create({ participantId: ptCaio.id, functionId: fnMinistro.id })
    await ScheduleAssignment.create({ participantId: ptCaio.id, functionId: fnViolao.id })

    // Mariana (Vocal) - CONFIRMADO (Faz aniversário hoje!)
    const ptMariana = await ScheduleParticipant.create({
      scheduleId: scheduleSundayMorning.id,
      membershipId: mbMariana.id,
      confirmation: 'confirmed',
      confirmedAt: now.minus({ hours: 10 }),
      absent: false,
    })
    await ScheduleAssignment.create({ participantId: ptMariana.id, functionId: fnSoprano.id })

    // Beatriz (Vocal) - CONFIRMADO
    const ptBeatriz = await ScheduleParticipant.create({
      scheduleId: scheduleSundayMorning.id,
      membershipId: mbBeatriz.id,
      confirmation: 'confirmed',
      confirmedAt: now.minus({ hours: 8 }),
      absent: false,
    })
    await ScheduleAssignment.create({ participantId: ptBeatriz.id, functionId: fnContralto.id })

    // Davi (Teclado) - CONFIRMADO (Faz aniversário hoje!)
    const ptDavi = await ScheduleParticipant.create({
      scheduleId: scheduleSundayMorning.id,
      membershipId: mbDavi.id,
      confirmation: 'confirmed',
      confirmedAt: now.minus({ hours: 6 }),
      absent: false,
    })
    await ScheduleAssignment.create({ participantId: ptDavi.id, functionId: fnTeclado.id })

    // Gabriel (Guitarra) - CONFIRMADO
    const ptGabriel = await ScheduleParticipant.create({
      scheduleId: scheduleSundayMorning.id,
      membershipId: mbGabriel.id,
      confirmation: 'confirmed',
      confirmedAt: now.minus({ hours: 5 }),
      absent: false,
    })
    await ScheduleAssignment.create({ participantId: ptGabriel.id, functionId: fnGuitarra.id })

    // Felipe (Bateria) - PENDENTE (Ainda não confirmou)
    const ptFelipe = await ScheduleParticipant.create({
      scheduleId: scheduleSundayMorning.id,
      membershipId: mbFelipe.id,
      confirmation: 'pending',
      absent: false,
    })
    await ScheduleAssignment.create({ participantId: ptFelipe.id, functionId: fnBateria.id })

    // EXCEÇÃO: Rodrigo (Baixo) - DECLINED por Conflito de Viagem!
    const ptRodrigo = await ScheduleParticipant.create({
      scheduleId: scheduleSundayMorning.id,
      membershipId: mbRodrigo.id,
      confirmation: 'declined',
      absent: false,
    })
    await ScheduleAssignment.create({ participantId: ptRodrigo.id, functionId: fnBaixo.id })

    // Músicas da escala domingo manhã:
    await ScheduleSong.create({
      scheduleId: scheduleSundayMorning.id,
      songId: songRujaLeao.id,
      position: 1,
      keyOverride: null,
      notes: 'Abertura com pegada forte e bumbo marcando.',
      durationSeconds: 350,
      titleSnapshot: songRujaLeao.title,
      artistSnapshot: songRujaLeao.artist,
    })

    // EXCEÇÃO: KeyOverride na música
    await ScheduleSong.create({
      scheduleId: scheduleSundayMorning.id,
      songId: songCasaSua.id,
      position: 2,
      keyOverride: 'D', // Tom D alterado para a voz masculina!
      notes: 'Tom D (elevado 1 tom). Entrada com pad e teclado após o término de Ruja o Leão.',
      durationSeconds: 420,
      titleSnapshot: songCasaSua.title,
      artistSnapshot: songCasaSua.artist,
    })

    await ScheduleSong.create({
      scheduleId: scheduleSundayMorning.id,
      songId: songBondade.id,
      position: 3,
      keyOverride: null,
      notes: 'Vocal solo no refrão 2, coro uníssono na ponte.',
      durationSeconds: 310,
      titleSnapshot: songBondade.title,
      artistSnapshot: songBondade.artist,
    })

    await ScheduleSong.create({
      scheduleId: scheduleSundayMorning.id,
      songId: songSobreVoce.id,
      position: 4,
      keyOverride: null,
      notes: 'Ministração espontânea no final com dinâmica crescendo.',
      durationSeconds: 450,
      titleSnapshot: songSobreVoce.title,
      artistSnapshot: songSobreVoce.artist,
    })

    // Roteiro litúrgico do culto:
    await ScriptItem.create({
      scheduleId: scheduleSundayMorning.id,
      position: 1,
      title: 'Abertura & Oração Inicial',
      notes: 'Pastor dá as boas-vindas à igreja e visitantes.',
      durationSeconds: 300,
      source: 'manual',
    })
    await ScriptItem.create({
      scheduleId: scheduleSundayMorning.id,
      position: 2,
      title: 'Louvor Congregacional (4 Músicas)',
      notes: 'Ruja o Leão, A Casa É Sua (D), Bondade de Deus, É Tudo Sobre Você',
      durationSeconds: 1530,
      source: 'songs',
    })
    await ScriptItem.create({
      scheduleId: scheduleSundayMorning.id,
      position: 3,
      title: 'Avisos da Semana & Dízimos e Ofertas',
      notes: 'Vídeo institucional da igreja e recolhimento das ofertas.',
      durationSeconds: 420,
      source: 'manual',
    })
    await ScriptItem.create({
      scheduleId: scheduleSundayMorning.id,
      position: 4,
      title: 'Pregação da Palavra',
      notes: 'Série de mensagens: "Fundamentos da Fé"',
      durationSeconds: 2700,
      source: 'manual',
    })
    await ScriptItem.create({
      scheduleId: scheduleSundayMorning.id,
      position: 5,
      title: 'Ministração Final & Bênção Apostólica',
      notes: 'Fundo suave de teclado e oração pelos enfermos.',
      durationSeconds: 600,
      source: 'manual',
    })

    // ESCALA 2: DOMINGO NOITE (18:30)
    const scheduleSundayNight = await Schedule.create({
      ministryId: ministryWorship.id,
      title: 'Culto de Celebração - Domingo Noite',
      startsAt: nextSunday.set({ hour: 18, minute: 30, second: 0 }),
      endsAt: nextSunday.set({ hour: 20, minute: 15, second: 0 }),
      status: 'published',
      dressCode: 'Camisa ou camiseta preta básica',
      notes: 'Passagem de som às 17:30 pontual.',
      confirmationRequired: true,
      version: 1,
      detachedFromSeries: false,
    })

    const ptCaioNight = await ScheduleParticipant.create({
      scheduleId: scheduleSundayNight.id,
      membershipId: mbCaioWorship.id,
      confirmation: 'confirmed',
      absent: false,
    })
    await ScheduleAssignment.create({ participantId: ptCaioNight.id, functionId: fnMinistro.id })

    const ptThiagoNight = await ScheduleParticipant.create({
      scheduleId: scheduleSundayNight.id,
      membershipId: mbThiago.id,
      confirmation: 'confirmed',
      absent: false,
    })
    await ScheduleAssignment.create({ participantId: ptThiagoNight.id, functionId: fnViolao.id })

    const ptSarahNight = await ScheduleParticipant.create({
      scheduleId: scheduleSundayNight.id,
      membershipId: mbSarah.id,
      confirmation: 'confirmed',
      absent: false,
    })
    await ScheduleAssignment.create({ participantId: ptSarahNight.id, functionId: fnPercussao.id })

    // ESCALA 3: QUARTA-FEIRA (20:00)
    const nextWednesday = nextSunday.plus({ days: 3 })
    await Schedule.create({
      ministryId: ministryWorship.id,
      title: 'Culto de Oração & Palavra - Quarta',
      startsAt: nextWednesday.set({ hour: 20, minute: 0, second: 0 }),
      endsAt: nextWednesday.set({ hour: 21, minute: 30, second: 0 }),
      status: 'published',
      dressCode: 'Livre / Casual',
      notes: 'Formato acústico com violão, cajón e teclado.',
      confirmationRequired: false,
      version: 1,
      detachedFromSeries: false,
    })

    // EXCEÇÃO: ESCALA 4 EM RASCUNHO (DRAFT)
    const vigiliaDate = nextSunday.plus({ days: 5 })
    await Schedule.create({
      ministryId: ministryWorship.id,
      title: 'Vigília de Adoração & Quebrantamento',
      startsAt: vigiliaDate.set({ hour: 22, minute: 0, second: 0 }),
      endsAt: vigiliaDate.plus({ hours: 4 }),
      status: 'draft', // RASCUNHO!
      dressCode: 'Roupas confortáveis',
      notes: 'Rascunho de escala para alinhamento entre os líderes.',
      confirmationRequired: false,
      version: 1,
      detachedFromSeries: false,
    })

    // ESCALA 5: CULTO PASSADO (Histórico com falta registrada)
    if (prevSunday) {
      const schedulePast = await Schedule.create({
        ministryId: ministryWorship.id,
        title: 'Culto de Celebração - Domingo Anterior',
        startsAt: prevSunday.set({ hour: 10, minute: 0, second: 0 }),
        endsAt: prevSunday.set({ hour: 11, minute: 45, second: 0 }),
        status: 'published',
        dressCode: 'Branco ou Azul',
        notes: 'Culto realizado com sucesso.',
        confirmationRequired: true,
        version: 1,
        detachedFromSeries: false,
      })

      const ptPastCaio = await ScheduleParticipant.create({
        scheduleId: schedulePast.id,
        membershipId: mbCaioWorship.id,
        confirmation: 'confirmed',
        absent: false,
      })
      await ScheduleAssignment.create({ participantId: ptPastCaio.id, functionId: fnMinistro.id })

      // EXCEÇÃO: Ausência / Falta registrada para alimentar relatórios!
      const ptPastLarissa = await ScheduleParticipant.create({
        scheduleId: schedulePast.id,
        membershipId: mbLarissa.id,
        confirmation: 'confirmed',
        absent: true, // Faltou no culto
        absentAt: prevSunday.set({ hour: 12, minute: 0, second: 0 }),
      })
      await ScheduleAssignment.create({ participantId: ptPastLarissa.id, functionId: fnBacking.id })
    }

    // Escala no Ministério de Mídia
    const scheduleMediaSunday = await Schedule.create({
      ministryId: ministryMedia.id,
      title: 'Transmissão & Som - Domingo Manhã',
      startsAt: nextSunday.set({ hour: 9, minute: 30, second: 0 }),
      endsAt: nextSunday.set({ hour: 12, minute: 0, second: 0 }),
      status: 'published',
      dressCode: 'Camiseta preta da equipe de mídia',
      notes: 'Checagem de cabos e teste de microfones às 09:15.',
      confirmationRequired: true,
      version: 1,
      detachedFromSeries: false,
    })

    const ptLucasMedia = await ScheduleParticipant.create({
      scheduleId: scheduleMediaSunday.id,
      membershipId: mbLucasMedia.id,
      confirmation: 'confirmed',
      absent: false,
    })
    await ScheduleAssignment.create({ participantId: ptLucasMedia.id, functionId: fnSom.id })

    const ptCamilaMedia = await ScheduleParticipant.create({
      scheduleId: scheduleMediaSunday.id,
      membershipId: mbCamilaMedia.id,
      confirmation: 'confirmed',
      absent: false,
    })
    await ScheduleAssignment.create({ participantId: ptCamilaMedia.id, functionId: fnProjecao.id })

    console.log('📢 Criando mural de avisos...')

    await Notice.create({
      ministryId: ministryWorship.id,
      membershipId: mbCaioWorship.id,
      title: 'Ensaio Geral da Equipe de Louvor - Sábado às 15:00',
      body: 'Olá equipe! Teremos nosso ensaio geral no sábado para passar as 4 músicas do culto dominical e alinhar os arranjos de teclado e guitarra. Favor levar fones de ouvido para o retorno in-ear.',
      pinned: true,
      expiresAt: nextSunday.plus({ days: 1 }),
    })

    await Notice.create({
      ministryId: ministryWorship.id,
      membershipId: mbCaioWorship.id,
      title: 'Dress Code de Domingo: Tons Terrosos e Neutros',
      body: 'Neste próximo culto estaremos usando tons terrosos (bege, areia, cáqui, terracota suave). Evitem roupas com estampas grandes ou logotipos chamativos para manter a harmonia no altar.',
      pinned: true,
      expiresAt: nextSunday.plus({ days: 1 }),
    })

    await Notice.create({
      ministryId: ministryWorship.id,
      membershipId: mbCaioWorship.id,
      title: 'Oficina de Técnica Vocal & Fonoaudiologia',
      body: 'No próximo dia 18 teremos uma fonoaudióloga especialista em voz cantada dando um workshop prático de 2 horas sobre aquecimento, respiração diafragmática e cuidados com a voz.',
      pinned: false,
    })

    await Notice.create({
      ministryId: ministryWorship.id,
      membershipId: mbCaioWorship.id,
      title: 'Novo banco de patches de piano e pads no Google Drive',
      body: 'O Davi preparou novos presets para o MainStage e Nord Stage já configurados nos timbres que usamos nos arranjos de domingo. O link está na pasta da equipe.',
      pinned: false,
    })

    // Aviso arquivado
    await Notice.create({
      ministryId: ministryWorship.id,
      membershipId: mbCaioWorship.id,
      title: 'Aviso antigo de teste arquivado',
      body: 'Este aviso foi arquivado no mês passado para liberar o mural.',
      pinned: false,
      archivedAt: now.minus({ days: 15 }),
    })

    console.log('💬 Criando mensagens no chat da equipe...')

    const threadGeneral = await ChatThread.create({
      ministryId: ministryWorship.id,
      scheduleId: null,
    })

    await ChatMessage.create({
      threadId: threadGeneral.id,
      membershipId: mbCaioWorship.id,
      body: 'A paz pessoal! Escala de domingo de manhã está publicada. Por favor confirmem presença até sexta-feira!',
    })

    await ChatMessage.create({
      threadId: threadGeneral.id,
      membershipId: mbMariana.id,
      body: 'Confirmadíssima! Vamos passar a música nova "A Casa É Sua" no ensaio de sábado?',
    })

    await ChatMessage.create({
      threadId: threadGeneral.id,
      membershipId: mbDavi.id,
      body: 'Com certeza, já preparei o patch do teclado em Tom D com o pad suave na introdução.',
    })

    await ChatMessage.create({
      threadId: threadGeneral.id,
      membershipId: mbGabriel.id,
      body: 'Excelente! Já tirei o solo de guitarra no mesmo timbre do vídeo oficial.',
    })

    await ChatMessage.create({
      threadId: threadGeneral.id,
      membershipId: mbRodrigo.id,
      body: 'Gente, infelizmente nesse domingo estarei em viagem a trabalho em Curitiba, já cadastrei minha indisponibilidade no app. Bom culto a todos!',
    })

    console.log('🔔 Criando notificações com badge para o usuário...')

    // EXCEÇÃO: Notificações de Aniversariantes do dia
    await Notification.create({
      userId: userAdmin.id,
      ministryId: ministryWorship.id,
      type: 'birthday',
      title: 'Aniversariantes do dia! 🎂',
      body: 'Hoje é aniversário de Mariana Souza e Davi Alencar! Não deixe de parabenizá-los.',
      link: `/m/${ministryWorship.id}`,
      readAt: null, // NÃO LIDA!
    })

    // Notificação de escala
    await Notification.create({
      userId: userAdmin.id,
      ministryId: ministryWorship.id,
      scheduleId: scheduleSundayMorning.id,
      type: 'schedule',
      title: 'Escala Confirmada',
      body: 'Você foi escalado como Ministro de Louvor para Culto de Celebração - Domingo Manhã.',
      link: `/m/${ministryWorship.id}/escalas/${scheduleSundayMorning.id}`,
      readAt: null, // NÃO LIDA!
    })

    // Notificação de aviso
    await Notification.create({
      userId: userAdmin.id,
      ministryId: ministryWorship.id,
      type: 'notice',
      title: 'Novo Aviso no Mural',
      body: 'Ensaio Geral da Equipe de Louvor - Sábado às 15:00',
      link: `/m/${ministryWorship.id}/avisos`,
      readAt: null, // NÃO LIDA!
    })

    // Notificação já lida
    await Notification.create({
      userId: userAdmin.id,
      ministryId: ministryWorship.id,
      type: 'schedule',
      title: 'Presença Confirmada',
      body: 'Mariana Souza confirmou presença no Culto de Celebração - Domingo Manhã.',
      link: `/m/${ministryWorship.id}/escalas/${scheduleSundayMorning.id}`,
      readAt: now.minus({ hours: 4 }),
    })

    console.log('📋 Criando modelos de roteiro...')

    const templateDomingo = await ScriptTemplate.create({
      ministryId: ministryWorship.id,
      name: 'Culto Dominical Padrão (90 min)',
    })

    await ScriptTemplateItem.create({ templateId: templateDomingo.id, position: 1, title: 'Oração Inicial & Abertura', durationSeconds: 300, notes: '5 min' })
    await ScriptTemplateItem.create({ templateId: templateDomingo.id, position: 2, title: 'Louvor Congregacional (4 canções)', durationSeconds: 1500, notes: '25 min' })
    await ScriptTemplateItem.create({ templateId: templateDomingo.id, position: 3, title: 'Dízimos & Ofertório', durationSeconds: 420, notes: '7 min' })
    await ScriptTemplateItem.create({ templateId: templateDomingo.id, position: 4, title: 'Pregação da Palavra', durationSeconds: 2700, notes: '45 min' })
    await ScriptTemplateItem.create({ templateId: templateDomingo.id, position: 5, title: 'Ministração & Apelo Final', durationSeconds: 600, notes: '10 min' })

    console.log('🔑 Criando código de convite ativo...')

    await Invite.create({
      ministryId: ministryWorship.id,
      createdByUserId: userAdmin.id,
      code: 'BRASA1',
      expiresAt: now.plus({ days: 30 }),
    })

    console.log('🎂 Inserindo digests de aniversário...')
    const localDateStr = now.setZone(ministryWorship.timezone).toISODate()!
    await db.rawQuery(
      `INSERT INTO birthday_digests (id, user_id, ministry_id, local_date, created_at)
       VALUES (?, ?, ?, ?, now())
       ON CONFLICT DO NOTHING`,
      [randomUUID(), userAdmin.id, ministryWorship.id, localDateStr]
    )

    console.log('⚠️ Completando exceções, jovens, lixeira e série...')

    const userHelena = await User.create({
      name: 'Helena Cruz',
      email: 'helena@louveapp.com',
      password: 'password123',
      birthDate: null,
      authVersion: 1,
    })
    await Membership.create({
      userId: userHelena.id,
      ministryId: ministryWorship.id,
      isAdmin: false,
      canManageSchedules: false,
      canManageRepertoire: false,
      canManageFunctions: false,
      canEditScheduleSongs: false,
      status: 'active',
    })

    const userRafael = await User.create({
      name: 'Rafael Dias',
      email: 'rafael@louveapp.com',
      password: 'password123',
      birthDate: DateTime.fromObject({ year: 1991, month: 9, day: 2 }),
      authVersion: 1,
    })
    await Membership.create({
      userId: userRafael.id,
      ministryId: ministryWorship.id,
      isAdmin: false,
      canManageSchedules: false,
      canManageRepertoire: false,
      canManageFunctions: false,
      canEditScheduleSongs: false,
      status: 'left',
    })

    await MinistryFunction.create({
      ministryId: ministryWorship.id,
      name: 'Saxofone',
      sortOrder: 11,
      archivedAt: now.minus({ days: 20 }),
    })

    const soundcheck = nextSunday.set({ hour: 10, minute: 20, second: 0 })
    const scheduleOverlap = await Schedule.create({
      ministryId: ministryWorship.id,
      title: 'Passagem de som — mesmo horário do culto',
      startsAt: soundcheck,
      endsAt: soundcheck.plus({ minutes: 40 }),
      status: 'published',
      dressCode: '',
      notes: 'Coincide com o culto da manhã. Caio e Mariana estão nas duas escalas.',
      confirmationRequired: true,
      version: 1,
      detachedFromSeries: false,
    })
    for (const [membership, fn] of [
      [mbCaioWorship, fnMinistro],
      [mbMariana, fnSoprano],
    ] as const) {
      const participant = await ScheduleParticipant.create({
        scheduleId: scheduleOverlap.id,
        membershipId: membership.id,
        confirmation: 'pending',
        absent: false,
      })
      await ScheduleAssignment.create({ participantId: participant.id, functionId: fn.id })
    }

    const rehearsal = nextSunday.set({ hour: 9, minute: 0, second: 0 })
    const scheduleRehearsal = await Schedule.create({
      ministryId: ministryWorship.id,
      title: 'Ensaio de bateria antes do culto',
      startsAt: rehearsal,
      endsAt: rehearsal.plus({ hours: 2 }),
      status: 'draft',
      dressCode: '',
      notes: 'Rascunho que ainda cruza o culto. Felipe está nas duas.',
      confirmationRequired: false,
      version: 1,
      detachedFromSeries: false,
    })
    const ptFelipeRehearsal = await ScheduleParticipant.create({
      scheduleId: scheduleRehearsal.id,
      membershipId: mbFelipe.id,
      confirmation: 'pending',
      absent: false,
    })
    await ScheduleAssignment.create({
      participantId: ptFelipeRehearsal.id,
      functionId: fnBateria.id,
    })

    const highlighted = await ScheduleSong.create({
      scheduleId: scheduleSundayMorning.id,
      songId: songRujaLeao.id,
      position: 5,
      keyOverride: 'F#m',
      notes: 'Solo da Mariana no refrão. Tom fora do padrão da música.',
      durationSeconds: 200,
      titleSnapshot: songRujaLeao.title,
      artistSnapshot: songRujaLeao.artist,
    })
    await db.table('schedule_song_highlights').insert({
      schedule_song_id: highlighted.id,
      participant_id: ptMariana.id,
      function_id: fnSoprano.id,
    })

    await ScheduleChange.create({
      scheduleId: scheduleSundayMorning.id,
      userId: userAdmin.id,
      summary: 'Tom de Ruja o Leão alterado para F#m e solo marcado para Mariana.',
    })

    const threadSchedule = await ChatThread.create({
      ministryId: ministryWorship.id,
      scheduleId: scheduleSundayMorning.id,
    })
    await ChatMessage.create({
      threadId: threadSchedule.id,
      membershipId: mbCaioWorship.id,
      body: 'Passagem de som às 9h. Quem atrasar entra no segundo bloco.',
    })
    await ChatMessage.create({
      threadId: threadSchedule.id,
      membershipId: mbFelipe.id,
      body: 'Ainda não confirmei a bateria. Posso responder até sexta?',
    })

    const twoWeeksAgo = prevSunday.minus({ weeks: 1 }).set({ hour: 18, minute: 30, second: 0 })
    const scheduleOlder = await Schedule.create({
      ministryId: ministryWorship.id,
      title: 'Culto de Domingo — duas semanas atrás',
      startsAt: twoWeeksAgo,
      endsAt: twoWeeksAgo.plus({ hours: 2 }),
      status: 'published',
      dressCode: 'Preto',
      notes: '',
      confirmationRequired: true,
      version: 1,
      detachedFromSeries: false,
    })
    for (const [membership, fn, absent] of [
      [mbCaioWorship, fnMinistro, false],
      [mbGabriel, fnGuitarra, false],
      [mbThiago, fnViolao, true],
    ] as const) {
      const participant = await ScheduleParticipant.create({
        scheduleId: scheduleOlder.id,
        membershipId: membership.id,
        confirmation: 'confirmed',
        absent,
        absentAt: absent ? twoWeeksAgo.plus({ hours: 3 }) : null,
      })
      await ScheduleAssignment.create({ participantId: participant.id, functionId: fn.id })
    }

    const removedSong = await Song.create({
      ministryId: ministryWorship.id,
      folderId: folderCelebracao.id,
      classificationId: classJubilo.id,
      title: 'Canção arquivada por engano',
      artist: 'Equipe local',
      bpm: 100,
      defaultKey: 'C',
      durationSeconds: 180,
    })
    removedSong.deletedAt = now.minus({ days: 4 })
    await removedSong.save()

    const removedSchedule = await Schedule.create({
      ministryId: ministryWorship.id,
      title: 'Culto especial cancelado',
      startsAt: nextSunday.plus({ days: 2 }).set({ hour: 19, minute: 0, second: 0 }),
      endsAt: nextSunday.plus({ days: 2 }).set({ hour: 20, minute: 30, second: 0 }),
      status: 'draft',
      dressCode: '',
      notes: 'Ficou na lixeira há 3 dias.',
      confirmationRequired: false,
      version: 1,
      detachedFromSeries: false,
    })
    removedSchedule.deletedAt = now.minus({ days: 3 })
    await removedSchedule.save()

    const wednesdaySeries = await Series.create({
      ministryId: ministryWorship.id,
      frequency: 'weekly',
      interval: 1,
      weekdays: JSON.stringify([3]),
      endsMode: 'after_count',
      occurrenceCount: 4,
      startsAt: nextWednesday.set({ hour: 20, minute: 0, second: 0 }),
      durationMinutes: 90,
      title: 'Culto de Quarta — série',
      notes: 'Uma das datas foi desvinculada da série.',
      dressCode: 'Livre / Casual',
      confirmationRequired: false,
    })
    const seriesFirst = nextWednesday.set({ hour: 20, minute: 0, second: 0 })
    const seriesSecond = seriesFirst.plus({ weeks: 1 })
    await Schedule.create({
      ministryId: ministryWorship.id,
      seriesId: wednesdaySeries.id,
      title: wednesdaySeries.title,
      startsAt: seriesSecond,
      endsAt: seriesSecond.plus({ minutes: 90 }),
      originalStartsAt: seriesSecond,
      status: 'published',
      dressCode: wednesdaySeries.dressCode,
      notes: wednesdaySeries.notes,
      confirmationRequired: false,
      version: 1,
      detachedFromSeries: false,
    })
    await Schedule.create({
      ministryId: ministryWorship.id,
      seriesId: wednesdaySeries.id,
      title: 'Quarta especial — fora da série',
      startsAt: seriesSecond.plus({ weeks: 1 }),
      endsAt: seriesSecond.plus({ weeks: 1, minutes: 90 }),
      originalStartsAt: seriesSecond.plus({ weeks: 1 }),
      status: 'published',
      dressCode: 'Branco',
      notes: 'Esta data não acompanha mais a série.',
      confirmationRequired: false,
      version: 1,
      detachedFromSeries: true,
    })

    const fnYouthVocal = await MinistryFunction.create({
      ministryId: ministryYouth.id,
      name: 'Vocal',
      sortOrder: 1,
    })
    const fnYouthGuitar = await MinistryFunction.create({
      ministryId: ministryYouth.id,
      name: 'Violão',
      sortOrder: 2,
    })
    const mbLarissaYouth = await Membership.create({
      userId: userLarissa.id,
      ministryId: ministryYouth.id,
      isAdmin: false,
      canManageSchedules: false,
      canManageRepertoire: false,
      canManageFunctions: false,
      canEditScheduleSongs: false,
      status: 'active',
    })
    await db.table('member_functions').insert({
      membership_id: mbLarissaYouth.id,
      function_id: fnYouthVocal.id,
    })
    const mbSarahYouth = await Membership.create({
      userId: userSarah.id,
      ministryId: ministryYouth.id,
      isAdmin: false,
      canManageSchedules: true,
      canManageRepertoire: true,
      canManageFunctions: false,
      canEditScheduleSongs: true,
      status: 'active',
    })
    await db.table('member_functions').insert({
      membership_id: mbSarahYouth.id,
      function_id: fnYouthGuitar.id,
    })
    const youthFolder = await Folder.create({ ministryId: ministryYouth.id, name: 'Encontro de jovens' })
    const youthClass = await Classification.create({
      ministryId: ministryYouth.id,
      name: 'Jovens',
      description: 'Repertório do encontro de sexta',
    })
    const youthSong = await Song.create({
      ministryId: ministryYouth.id,
      folderId: youthFolder.id,
      classificationId: youthClass.id,
      title: 'Oceanos',
      artist: 'Hillsong',
      bpm: 64,
      defaultKey: 'D',
      durationSeconds: 380,
    })
    const youthFriday = nextSunday.minus({ days: 2 }).set({ hour: 19, minute: 30, second: 0 })
    const youthSchedule = await Schedule.create({
      ministryId: ministryYouth.id,
      title: 'Encontro Youth — sexta',
      startsAt: youthFriday,
      endsAt: youthFriday.plus({ hours: 2 }),
      status: 'published',
      dressCode: 'Casual',
      notes: 'Formato acústico.',
      confirmationRequired: true,
      version: 1,
      detachedFromSeries: false,
    })
    const ptYouth = await ScheduleParticipant.create({
      scheduleId: youthSchedule.id,
      membershipId: mbLarissaYouth.id,
      confirmation: 'confirmed',
      absent: false,
    })
    await ScheduleAssignment.create({ participantId: ptYouth.id, functionId: fnYouthVocal.id })
    await ScheduleSong.create({
      scheduleId: youthSchedule.id,
      songId: youthSong.id,
      position: 1,
      keyOverride: null,
      notes: '',
      durationSeconds: 380,
      titleSnapshot: youthSong.title,
      artistSnapshot: youthSong.artist,
    })

    await MinistryGenerationDefault.create({
      ministryId: ministryWorship.id,
      allowMultipleFunctions: true,
      conflictMode: 'warn',
      historyMonths: 3,
      includeUnplayed: true,
      minGapDays: 7,
      minSongGapDays: 14,
      peopleStrategy: 'balanced',
      preferFewerAbsences: true,
      songCount: 4,
      songStrategy: 'rotation',
      unavailabilityMode: 'respect',
      vacancies: JSON.stringify([
        { functionId: fnMinistro.id, quantity: 1 },
        { functionId: fnBateria.id, quantity: 1 },
        { functionId: fnViolao.id, quantity: 1 },
      ]),
    })

    await NotificationPreference.create({
      userId: userAdmin.id,
      type: 'chat_ministry',
      inApp: true,
      email: false,
    })
    await Notification.create({
      userId: userAdmin.id,
      ministryId: ministryWorship.id,
      type: 'join_requested',
      title: 'Pedido de entrada',
      body: 'Pedro Henrique pediu para entrar em Louvor Principal.',
      link: `/m/${ministryWorship.id}/convite`,
      readAt: null,
    })

    console.log('✨ Seed completo concluído com sucesso!')
    console.log('----------------------------------------------------')
    console.log('🔑 Credenciais para testar a interface:')
    console.log('  E-mail: admin@louveapp.com')
    console.log('  Senha:  password123')
    console.log('----------------------------------------------------')
  }
}