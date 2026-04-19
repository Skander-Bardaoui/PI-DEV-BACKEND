import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import type { ZodSchema } from 'zod';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    try {
      const parsedValue = this.schema.parse(value);
      return parsedValue;
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error, {
          prefix: 'Erreur de validation',
          prefixSeparator: ': ',
          issueSeparator: '; ',
        });
        throw new BadRequestException({
          message: 'Erreur de validation',
          errors: error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
          details: validationError.message,
        });
      }
      throw new BadRequestException('Erreur de validation');
    }
  }
}
