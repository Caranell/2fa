import { validate, ValidationError } from 'class-validator'

import { errors } from '@/errors'

type FormattedError = {
    message: string
    details: string
}

/**
 * Validates a class instance against its class-validator decorators.
 *
 * @param classToValidate - The instance of the class to be validated.
 *
 * @throws If the validation fails, throws a `BadRequestError` with a formatted message.
 *
 * @returns A promise that resolves to void if validation passes, otherwise throws an error.
 *
 * @example
 * ```typescript
 * class UserRequest {
 *     IsString()
 *     name: string;
 * }
 *
 * const request = new UserRequest();
 * request.name = 123; // Invalid value, should be a string
 *
 * await validateRequest(request); // Throws BadRequestError
 * ```
 */
export async function validateRequest(classToValidate: object) {
    const validationErrors = await validate(classToValidate)

    if (!validationErrors.length) return

    const formattedErrors = formatValidationErrors(validationErrors)

    throw new errors.BadRequestError(
        `Failed to parse request: \n${formattedErrors
            .map(el => `${el.message}: ${el.details}`)
            .join('\n')}`,
    )
}

const formatValidationErrors = (errorsList: ValidationError[]): FormattedError[] => {
    const errors: FormattedError[] = []

    const processErrors = (error: ValidationError, parentPath = ''): void => {
        const propertyPath = parentPath ? `${parentPath}.${error.property}` : error.property

        if (error.constraints) {
            errors.push({
                message: `'${propertyPath}' not passed the validation`,
                details: `'${JSON.stringify(error.value)}' isn't a valid value. ${Object.values(
                    error.constraints,
                ).join(' ')}`,
            })
        }

        if (error.children && error.children.length > 0) {
            error.children.forEach(childError => processErrors(childError, propertyPath))
        }
    }

    errorsList.forEach(error => processErrors(error))

    return errors
}
