import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-dialog',
  templateUrl: './dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogComponent {
  @Input() open = false;
  @Input() title = '';
  @Input() description = '';
  @Output() openChange = new EventEmitter<boolean>();

  close(): void {
    this.openChange.emit(false);
  }
}
