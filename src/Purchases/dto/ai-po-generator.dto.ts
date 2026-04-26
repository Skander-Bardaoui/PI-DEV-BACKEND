import { IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

export class AiPOGeneratorDto {
  @IsString({ message: 'Le texte doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le texte est obligatoire' })
  @MinLength(10, { message: 'Le texte doit contenir au moins 10 caractères' })
  @MaxLength(5000, { message: 'Le texte ne peut pas dépasser 5000 caractères' })
  text: string;
}