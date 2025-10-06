import { ValidationPipe, ValidationError, BadRequestException, HttpStatus } from '@nestjs/common';

interface ValidationErrorItem {
  field: string;
  message: string;
}

export class CustomValidationPipe extends ValidationPipe {
  constructor() {
    super({
      whitelist: true,
      transform: true,
      exceptionFactory: (errors: ValidationError[]) => {
        return new BadRequestException({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Validation failed',
          errors: this.buildValidationErrors(errors),
        });
      },
    });
  }

  private buildValidationErrors(errors: ValidationError[]): ValidationErrorItem[] {
    const formattedErrors = this.processValidationErrors(errors);
    
    return formattedErrors.length > 0 
      ? formattedErrors 
      : [{ field: 'general', message: 'Validation failed' }];
  }

  private processValidationErrors(
    errors: ValidationError[], 
    parentPath = ''
  ): ValidationErrorItem[] {
    return errors.flatMap(error => {
      const fieldPath = parentPath ? `${parentPath}.${error.property}` : error.property;
      const errorItems: ValidationErrorItem[] = [];

      // Processar constraints do erro atual
      if (error.constraints) {
        const constraintMessages = Object.values(error.constraints)
          .filter((constraint): constraint is string => 
            typeof constraint === 'string' && constraint.trim().length > 0
          )
          .map(constraint => ({ field: fieldPath, message: constraint.trim() }));
        
        errorItems.push(...constraintMessages);
      }

      // Processar erros aninhados recursivamente
      if (error.children?.length > 0) {
        const nestedErrors = this.processValidationErrors(error.children, fieldPath);
        errorItems.push(...nestedErrors);
      }

      return errorItems;
    });
  }
}
