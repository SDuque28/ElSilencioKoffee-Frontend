import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { NgClass } from '@angular/common';

import { cn } from '../utils/cn';

@Component({
  selector: 'app-input',
  imports: [NgClass],
  templateUrl: './input.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputComponent {
  @Input() type: 'text' | 'email' | 'password' | 'number' | 'search' = 'text';
  @Input() placeholder = '';
  @Input() value = '';
  @Input() disabled = false;
  @Input() className = '';
  @Output() valueChange = new EventEmitter<string>();

  get classes(): string {
    return cn(
      'h-10 w-full rounded-md border border-border bg-white px-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-slate-100',
      this.className,
    );
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.valueChange.emit(target.value);
  }
}
