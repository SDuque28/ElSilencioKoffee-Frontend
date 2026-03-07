import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-form-field',
  templateUrl: './form-field.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormFieldComponent {
  @Input() label = '';
  @Input() hint = '';
  @Input() error = '';
}
