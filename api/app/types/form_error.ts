/**
 * Erro de formulário combinado para o projeto inteiro.
 * A Etapa 1 passa a devolver esta forma quando a senha ou o e-mail falham.
 */
export type FieldError = {
    field: string
    message: string
  }
  
  export type FormErrorResponse = {
    errors: FieldError[]
  }