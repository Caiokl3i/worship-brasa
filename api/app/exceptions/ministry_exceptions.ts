import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

export class MinistryNotFoundException extends Exception {
  static status = 404
  static code = 'E_MINISTRY_NOT_FOUND'

  constructor() {
    super('Ministério não encontrado.', { status: 404, code: 'E_MINISTRY_NOT_FOUND' })
  }
}

export class SongNotFoundException extends Exception {
  static status = 404
  static code = 'E_SONG_NOT_FOUND'

  constructor() {
    super('Música não encontrada.', { status: 404, code: 'E_SONG_NOT_FOUND' })
  }
}

export class FolderNotFoundException extends Exception {
  static status = 404
  static code = 'E_FOLDER_NOT_FOUND'

  constructor() {
    super('Pasta não encontrada.', { status: 404, code: 'E_FOLDER_NOT_FOUND' })
  }
}

export class ClassificationNotFoundException extends Exception {
  static status = 404
  static code = 'E_CLASSIFICATION_NOT_FOUND'

  constructor() {
    super('Classificação não encontrada.', { status: 404, code: 'E_CLASSIFICATION_NOT_FOUND' })
  }
}

export class ScheduleNotFoundException extends Exception {
  static status = 404
  static code = 'E_SCHEDULE_NOT_FOUND'

  constructor() {
    super('Escala não encontrada.', { status: 404, code: 'E_SCHEDULE_NOT_FOUND' })
  }
}

export class ScheduleConflictException extends Exception {
  static status = 409
  static code = 'E_SCHEDULE_CONFLICT'

  constructor() {
    super('Esta escala foi alterada, reabra.', { status: 409, code: 'E_SCHEDULE_CONFLICT' })
  }
}

export class RequestNotFoundException extends Exception {
  static status = 404
  static code = 'E_REQUEST_NOT_FOUND'

  constructor() {
    super('Pedido não encontrado.', { status: 404, code: 'E_REQUEST_NOT_FOUND' })
  }
}

export class ForbiddenActionException extends Exception {
  static status = 403
  static code = 'E_FORBIDDEN_ACTION'

  constructor() {
    super('Você não pode fazer isso.', { status: 403, code: 'E_FORBIDDEN_ACTION' })
  }
}

export class FieldException extends Exception {
  static status = 422
  static code = 'E_FIELD'
  field: string

  constructor(field: string, message: string) {
    super(message, { status: 422, code: 'E_FIELD' })
    this.field = field
  }

  async handle(error: this, ctx: HttpContext) {
    return ctx.response.unprocessableEntity({
      errors: [{ field: error.field, message: error.message }],
    })
  }
}
