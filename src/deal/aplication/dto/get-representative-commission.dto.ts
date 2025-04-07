import { IsOptional, Matches } from 'class-validator';

export class GetRepresentativeCommissionDto {
  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])-\d{2}$/, {
    message: 'Month must be in the format YYYY-MM',
  })
  month?: string;
}
