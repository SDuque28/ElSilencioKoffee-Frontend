import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core';

import { ClickOutsideDirective } from '../../../shared/directives/click-outside.directive';

export interface AdminFilterSelectOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-admin-filter-select',
  imports: [ClickOutsideDirective],
  styleUrl: './admin-filter-select.component.css',
  template: `
    <div class="admin-filter-select" appClickOutside (appClickOutside)="close()">
      <button
        type="button"
        class="admin-filter-select__trigger"
        [attr.aria-expanded]="isOpen()"
        [disabled]="disabled"
        (click)="toggle()"
      >
        <span class="admin-filter-select__label">{{ selectedLabel }}</span>
        <span class="admin-filter-select__icon" [class.admin-filter-select__icon--open]="isOpen()"></span>
      </button>

      @if (isOpen()) {
        <div class="admin-filter-select__panel">
          @for (option of options; track option.value) {
            <button
              type="button"
              class="admin-filter-select__option"
              [class.admin-filter-select__option--selected]="option.value === value"
              (click)="select(option.value)"
            >
              <span>{{ option.label }}</span>
              @if (option.value === value) {
                <span class="admin-filter-select__check" aria-hidden="true"></span>
              }
            </button>
          }
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminFilterSelectComponent {
  @Input() options: AdminFilterSelectOption[] = [];
  @Input() value = '';
  @Input() placeholder = 'Select';
  @Input() disabled = false;
  @Output() readonly valueChange = new EventEmitter<string>();

  readonly isOpen = signal(false);

  get selectedLabel(): string {
    return this.options.find((option) => option.value === this.value)?.label ?? this.placeholder;
  }

  toggle(): void {
    if (this.disabled) {
      return;
    }

    this.isOpen.update((current) => !current);
  }

  close(): void {
    this.isOpen.set(false);
  }

  select(nextValue: string): void {
    if (this.disabled) {
      return;
    }

    this.valueChange.emit(nextValue);
    this.close();
  }
}
