import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

import { cn } from '../utils/cn';

@Component({
  selector: 'app-card',
  imports: [NgClass],
  templateUrl: './card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent {
  @Input() className = '';

  get cardClasses(): string {
    return cn('rounded-xl border border-border bg-surface p-5 shadow-soft', this.className);
  }
}
