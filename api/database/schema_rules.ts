import { type SchemaRules } from '@adonisjs/lucid/types/schema_generator'

/**
 * O gerador já esconde a coluna password.
 * code_hash é o outro segredo: o hash do código de 6 dígitos.
 */
export default {
  tables: {
    password_resets: {
      columns: {
        code_hash: {
          tsType: 'string',
          imports: [],
          decorators: [{ name: '@column', args: { serializeAs: null } }],
        },
      },
    },
  },
} satisfies SchemaRules
