import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  type OnChanges,
  type SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Plus, X, LucideAngularModule } from 'lucide-angular';

import type { AdminProductCreateRequest } from '../models/admin-api.model';
import type { AdminSelectOption } from '../models/admin-view.model';

export interface AdminProductFormModel {
  name: string;
  imageUrl: string;
  price: number | null;
  presentationId: number | null;
  productionId: number | null;
}

export type AdminProductFormValue = AdminProductFormModel;

@Component({
  selector: 'app-product-modal',
  imports: [FormsModule, LucideAngularModule],
  template: `
    @if (open) {
      <div
        class="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm"
        tabindex="0"
        role="button"
        (click)="cancelled.emit()"
        (keydown.enter)="cancelled.emit()"
        (keydown.space)="cancelled.emit()"
      ></div>
      <section class="fixed left-1/2 top-1/2 z-50 w-[min(92vw,760px)] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-white/10 bg-[#242424] shadow-2xl">
        <header class="flex items-start justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 class="text-sm font-semibold text-white">{{ title }}</h2>
            <p class="mt-1 text-xs text-zinc-500">{{ description }}</p>
          </div>
          <button type="button" class="text-zinc-500 hover:text-white" (click)="cancelled.emit()">
            <lucide-icon [img]="icons.close" class="h-4 w-4" />
          </button>
        </header>

        <form class="grid gap-5 p-5 md:grid-cols-[1.2fr_0.8fr]" (ngSubmit)="submit()">
          <div class="space-y-4">
            <label class="block text-xs text-zinc-400">
              Product Name
              <input
                name="name"
                required
                [(ngModel)]="form.name"
                placeholder="e.g. Ethiopian Yirgacheffe G1"
                class="mt-2 h-10 w-full rounded-md border border-white/10 bg-white/[0.06] px-3 text-sm text-white outline-none focus:border-[#f97316]/60"
              />
            </label>

            <label class="block text-xs text-zinc-400">
              Description
              <textarea
                disabled
                rows="4"
                placeholder="Pending backend support"
                class="mt-2 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-zinc-500 outline-none"
              ></textarea>
            </label>

            <label class="block text-xs text-zinc-400">
              Product Media
              <input
                name="imageUrl"
                [(ngModel)]="form.imageUrl"
                placeholder="https://..."
                class="mt-2 h-10 w-full rounded-md border border-white/10 bg-white/[0.06] px-3 text-sm text-white outline-none focus:border-[#f97316]/60"
              />
            </label>
          </div>

          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <label class="block text-xs text-zinc-400">
                Price ($)
                <input
                  name="price"
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  [(ngModel)]="form.price"
                  class="mt-2 h-10 w-full rounded-md border border-white/10 bg-white/[0.06] px-3 text-sm text-white outline-none focus:border-[#f97316]/60"
                />
              </label>
              <label class="block text-xs text-zinc-400">
                Inventory
                <input
                  disabled
                  value="N/A"
                  class="mt-2 h-10 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm text-zinc-500"
                />
              </label>
            </div>

            <label class="block text-xs text-zinc-400">
              Category
              <select
                name="presentationId"
                required
                [(ngModel)]="form.presentationId"
                class="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#1b1b1d] px-3 text-sm text-white outline-none [color-scheme:dark] focus:border-[#f97316]/60"
              >
                <option [ngValue]="null" class="bg-[#1b1b1d] text-white">Select a presentation</option>
                @for (option of presentationOptions; track option.value) {
                  <option [ngValue]="option.value" class="bg-[#1b1b1d] text-white">{{ option.label }}</option>
                }
              </select>
            </label>

            <label class="block text-xs text-zinc-400">
              Production
              <select
                name="productionId"
                required
                [(ngModel)]="form.productionId"
                class="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#1b1b1d] px-3 text-sm text-white outline-none [color-scheme:dark] focus:border-[#f97316]/60"
              >
                <option [ngValue]="null" class="bg-[#1b1b1d] text-white">Select production</option>
                @for (option of productionOptions; track option.value) {
                  <option [ngValue]="option.value" class="bg-[#1b1b1d] text-white">{{ option.label }}</option>
                }
              </select>
            </label>

            <div class="space-y-2 rounded-lg bg-black/20 p-3 text-xs text-zinc-500">
              <label class="flex items-center justify-between">
                Featured Product
                <input type="checkbox" disabled />
              </label>
              <label class="flex items-center justify-between">
                Organic Certified
                <input type="checkbox" disabled checked />
              </label>
              <p class="pt-2 text-[11px] text-zinc-600">
                Featured, organic and inventory fields are visual only until the backend exposes them.
              </p>
            </div>
          </div>

          @if (errorMessage) {
            <p class="md:col-span-2 rounded-md border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
              {{ errorMessage }}
            </p>
          }

          <footer class="flex justify-end gap-3 border-t border-white/10 pt-4 md:col-span-2">
            <button type="button" class="rounded-md px-4 py-2 text-sm text-zinc-400 hover:text-white" (click)="cancelled.emit()">
              Cancel
            </button>
            <button
              type="submit"
              class="inline-flex items-center gap-2 rounded-md bg-[#f97316] px-4 py-2 text-sm font-semibold text-black disabled:opacity-60"
              [disabled]="saving"
            >
              <lucide-icon [img]="icons.plus" class="h-4 w-4" />
              {{ submitLabel }}
            </button>
          </footer>
        </form>
      </section>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductModalComponent implements OnChanges {
  @Input() open = false;
  @Input() saving = false;
  @Input() errorMessage: string | null = null;
  @Input() presentationOptions: AdminSelectOption[] = [];
  @Input() productionOptions: AdminSelectOption[] = [];
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() initialValue: AdminProductFormValue | null = null;
  @Output() cancelled = new EventEmitter<void>();
  @Output() saved = new EventEmitter<AdminProductCreateRequest>();

  form: AdminProductFormModel = this.emptyForm();

  protected readonly icons = {
    close: X,
    plus: Plus,
  };

  get title(): string {
    return this.mode === 'edit' ? 'Edit Coffee' : 'Add New Coffee';
  }

  get description(): string {
    return this.mode === 'edit'
      ? 'Update the current coffee profile using the existing catalog fields.'
      : 'Configure your high-end coffee profile.';
  }

  get submitLabel(): string {
    if (this.saving) {
      return this.mode === 'edit' ? 'Saving changes...' : 'Saving...';
    }

    return this.mode === 'edit' ? 'Save Changes' : 'Save Product';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialValue'] || (changes['open'] && this.open)) {
      this.form = this.toForm(this.initialValue);
    }
  }

  submit(): void {
    if (!this.form.name.trim() || !this.form.price || !this.form.presentationId || !this.form.productionId) {
      return;
    }

    this.saved.emit({
      name: this.form.name.trim(),
      imageUrl: this.form.imageUrl.trim() || null,
      price: this.form.price,
      presentationId: this.form.presentationId,
      productionId: this.form.productionId,
    });
  }

  reset(): void {
    this.form = this.toForm(this.initialValue);
  }

  private emptyForm(): AdminProductFormModel {
    return {
      name: '',
      imageUrl: '',
      price: null,
      presentationId: null,
      productionId: null,
    };
  }

  private toForm(value: AdminProductFormValue | null): AdminProductFormModel {
    if (!value) {
      return this.emptyForm();
    }

    return {
      name: value.name,
      imageUrl: value.imageUrl,
      price: value.price,
      presentationId: value.presentationId,
      productionId: value.productionId,
    };
  }
}
