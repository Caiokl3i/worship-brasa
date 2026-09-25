import { DateTime } from 'luxon'
import type Membership from '#models/membership'
import MinistryFunction from '#models/ministry_function'
import MembershipAccessService, { isUuid } from '#services/membership_access_service'
import { FieldException, RequestNotFoundException } from '#exceptions/ministry_exceptions'

async function activeNameTaken(ministryId: string, name: string, exceptId?: string) {
  const query = MinistryFunction.query()
    .where('ministryId', ministryId)
    .whereNull('archivedAt')
    .whereRaw('lower(name) = ?', [name.toLowerCase()])

  if (exceptId) {
    query.whereNot('id', exceptId)
  }

  return query.first()
}

export default class MinistryFunctionService {
  async list(actor: Membership) {
    return MinistryFunction.query()
      .where('ministryId', actor.ministryId)
      .orderByRaw('archived_at is null desc')
      .orderBy('sortOrder', 'asc')
  }

  async create(actor: Membership, name: string) {
    new MembershipAccessService().assertCanManageFunctions(actor)

    if (await activeNameTaken(actor.ministryId, name)) {
      throw new FieldException('name', 'Já existe uma função com esse nome.')
    }

    const latest = await MinistryFunction.query()
      .where('ministryId', actor.ministryId)
      .orderBy('sortOrder', 'desc')
      .first()

    return MinistryFunction.create({
      ministryId: actor.ministryId,
      name,
      sortOrder: (latest?.sortOrder ?? -1) + 1,
    })
  }

  async rename(actor: Membership, functionId: string, name: string) {
    new MembershipAccessService().assertCanManageFunctions(actor)
    const ministryFunction = await this.#inMinistry(actor.ministryId, functionId)

    if (ministryFunction.archivedAt) {
      throw new FieldException('name', 'Esta função está arquivada.')
    }

    if (await activeNameTaken(actor.ministryId, name, ministryFunction.id)) {
      throw new FieldException('name', 'Já existe uma função com esse nome.')
    }

    ministryFunction.name = name
    await ministryFunction.save()
    return ministryFunction
  }

  async reorder(actor: Membership, ids: string[]) {
    new MembershipAccessService().assertCanManageFunctions(actor)

    const current = await MinistryFunction.query()
      .where('ministryId', actor.ministryId)
      .whereNull('archivedAt')

    const currentIds = new Set(current.map((item) => item.id))
    const nextIds = new Set(ids)
    const sameSize = currentIds.size === nextIds.size
    const sameIds = sameSize && [...currentIds].every((id) => nextIds.has(id))

    if (!sameIds) {
      throw new FieldException('ids', 'A ordem precisa incluir todas as funções ativas.')
    }

    await Promise.all(
      ids.map((id, sortOrder) =>
        MinistryFunction.query()
          .where('id', id)
          .where('ministryId', actor.ministryId)
          .update({ sortOrder })
      )
    )
  }

  async archive(actor: Membership, functionId: string) {
    new MembershipAccessService().assertCanManageFunctions(actor)
    const ministryFunction = await this.#inMinistry(actor.ministryId, functionId)

    if (!ministryFunction.archivedAt) {
      ministryFunction.archivedAt = DateTime.utc()
      await ministryFunction.save()
    }

    return ministryFunction
  }

  async #inMinistry(ministryId: string, functionId: string) {
    if (!isUuid(functionId)) {
      throw new RequestNotFoundException()
    }

    const ministryFunction = await MinistryFunction.query()
      .where('id', functionId)
      .where('ministryId', ministryId)
      .first()

    if (!ministryFunction) {
      throw new RequestNotFoundException()
    }

    return ministryFunction
  }
}
