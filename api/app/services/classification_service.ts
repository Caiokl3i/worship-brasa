import { DateTime } from 'luxon'
import type Membership from '#models/membership'
import Classification from '#models/classification'
import MembershipAccessService, { isUuid } from '#services/membership_access_service'
import { ClassificationNotFoundException, FieldException } from '#exceptions/ministry_exceptions'

async function nameTaken(ministryId: string, name: string) {
  return Classification.query()
    .where('ministryId', ministryId)
    .whereNull('archivedAt')
    .whereRaw('lower(name) = ?', [name.toLowerCase()])
    .first()
}

export default class ClassificationService {
  async list(actor: Membership) {
    return Classification.query().where('ministryId', actor.ministryId).orderBy('createdAt', 'asc')
  }

  async create(actor: Membership, name: string, description: string) {
    new MembershipAccessService().assertCanManageRepertoire(actor)
    const trimmed = name.trim()

    if (await nameTaken(actor.ministryId, trimmed)) {
      throw new FieldException('name', 'Já existe uma classificação com esse nome.')
    }

    return Classification.create({
      ministryId: actor.ministryId,
      name: trimmed,
      description: description.trim(),
    })
  }

  async archive(actor: Membership, classificationId: string) {
    new MembershipAccessService().assertCanManageRepertoire(actor)
    const classification = await this.#inMinistry(actor.ministryId, classificationId)

    if (!classification.archivedAt) {
      classification.archivedAt = DateTime.utc()
      await classification.save()
    }

    return classification
  }

  async #inMinistry(ministryId: string, classificationId: string) {
    if (!isUuid(classificationId)) {
      throw new ClassificationNotFoundException()
    }

    const classification = await Classification.query()
      .where('id', classificationId)
      .where('ministryId', ministryId)
      .first()

    if (!classification) {
      throw new ClassificationNotFoundException()
    }

    return classification
  }
}
