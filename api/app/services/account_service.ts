import { errors } from '@adonisjs/auth'
import { type DateTime } from 'luxon'
import User from '#models/user'

type RegisterInput = {
  name: string
  email: string
  password: string
}

type ProfileInput = {
  name: string
  birthDate: DateTime | null
}

export default class AccountService {
  async register(input: RegisterInput) {
    return User.create({
      name: input.name,
      email: input.email,
      password: input.password,
      authVersion: 1,
    })
  }

  /**
   * Devolve o usuário ou null.
   * null vira a mesma frase para e-mail desconhecido e senha errada.
   * verifyCredentials já gasta o tempo do hash nos dois casos.
   */
  async authenticate(email: string, password: string) {
    try {
      return await User.verifyCredentials(email, password)
    } catch (error) {
      if (error instanceof errors.E_INVALID_CREDENTIALS) {
        return null
      }
      throw error
    }
  }

  async updateProfile(user: User, input: ProfileInput) {
    user.name = input.name
    user.birthDate = input.birthDate
    await user.save()
    return user
  }

  /**
   * A senha atual precisa conferir.
   * authVersion sobe para as outras sessões caírem.
   * Quem chamou grava o número novo na sessão desta requisição.
   */
  async changePassword(user: User, currentPassword: string, nextPassword: string) {
    const matches = await user.verifyPassword(currentPassword)
    if (!matches) {
      return false
    }

    user.password = nextPassword
    user.authVersion += 1
    await user.save()
    return true
  }
}
