import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'select',
  standalone: true
})
export class SelectPipe implements PipeTransform {

  transform(value: any[], key: string): any {
    return value.map(item => item[key]);
  }

}
