import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  signal,
} from '@angular/core';

import { ClickOutsideDirective } from '../../directives/click-outside.directive';

@Component({
  selector: 'app-dropdown',
  imports: [ClickOutsideDirective],
  templateUrl: './dropdown.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DropdownComponent {
  @Input() label = 'Menu';
  @Output() openChange = new EventEmitter<boolean>();

  readonly isOpen = signal(false);

  toggle(): void {
    this.isOpen.update((value) => {
      const next = !value;
      this.openChange.emit(next);
      return next;
    });
  }

  close(): void {
    this.isOpen.set(false);
    this.openChange.emit(false);
  }
}
