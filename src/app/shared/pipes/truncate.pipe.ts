import { Pipe, type PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncate',
})
export class TruncatePipe implements PipeTransform {
  transform(value: string | null | undefined, maxLength = 80): string {
    if (!value) {
      return '';
    }

    if (value.length <= maxLength) {
      return value;
    }

    return `${value.slice(0, maxLength)}...`;
  }
}
