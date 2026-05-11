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
import { Minus, Plus, X, LucideAngularModule } from 'lucide-angular';

import type { AdminSelectOption } from '../models/admin-view.model';

export interface AdminProductFormModel {
  name: string;
  imageUrl: string;
  price: number | null;
  stockQuantity: number | null;
  presentationId: number | null;
  productionId: number | null;
}

export interface AdminProductFormSubmission {
  name: string;
  imageUrl: string | null;
  price: number;
  stockQuantity: number | null;
  presentationId: number;
  productionId: number;
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
            <div class="grid gap-3 sm:grid-cols-2">
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
                Stock Units
                <div
                  class="mt-2 flex items-center rounded-md border border-white/10 bg-white/[0.06] transition focus-within:border-[#f97316]/60"
                >
                  <button
                    type="button"
                    class="inline-flex h-10 w-10 items-center justify-center rounded-l-md border-r border-white/10 text-zinc-400 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:text-zinc-600"
                    [disabled]="mode === 'create' || saving || (form.stockQuantity ?? 0) <= 0"
                    (click)="stepStock(-1)"
                    aria-label="Decrease stock"
                  >
                    <lucide-icon [img]="icons.minus" class="h-4 w-4" />
                  </button>
                  <input
                    name="stockQuantity"
                    type="number"
                    min="0"
                    step="1"
                    [disabled]="mode === 'create'"
                    [ngModel]="form.stockQuantity"
                    (ngModelChange)="onStockQuantityChange($event)"
                    class="stock-input h-10 w-full border-0 bg-transparent px-3 text-center text-sm text-white outline-none disabled:cursor-not-allowed disabled:text-zinc-500"
                  />
                  <button
                    type="button"
                    class="inline-flex h-10 w-10 items-center justify-center rounded-r-md border-l border-white/10 text-zinc-400 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:text-zinc-600"
                    [disabled]="mode === 'create' || saving"
                    (click)="stepStock(1)"
                    aria-label="Increase stock"
                  >
                    <lucide-icon [img]="icons.plus" class="h-4 w-4" />
                  </button>
                </div>
                <span class="mt-2 block text-[11px] text-zinc-500">
                  {{
                    mode === 'edit'
                      ? 'Adjust live stock directly from this edit flow.'
                      : 'Stock becomes editable after the product is created.'
                  }}
                </span>
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

            <div class="rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-zinc-500">
              <p class="font-medium text-zinc-400">Production pairing</p>
              <p class="mt-2 leading-5">
                Select the presentation and production batch that should remain linked to this catalog entry.
              </p>
            </div>
          </div>

          @if (validationMessage || errorMessage) {
            <p class="md:col-span-2 rounded-md border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
              {{ validationMessage || errorMessage }}
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
  styles: [
    `
      .stock-input {
        appearance: textfield;
        -moz-appearance: textfield;
      }

      .stock-input::-webkit-outer-spin-button,
      .stock-input::-webkit-inner-spin-button {
        margin: 0;
        -webkit-appearance: none;
      }
    `,
  ],
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
  @Output() saved = new EventEmitter<AdminProductFormSubmission>();

  form: AdminProductFormModel = this.emptyForm();
  validationMessage: string | null = null;

  protected readonly icons = {
    close: X,
    minus: Minus,
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
      this.validationMessage = null;
    }
  }

  submit(): void {
    this.validationMessage = null;

    if (!this.form.name.trim()) {
      this.validationMessage = 'Product name is required.';
      return;
    }

    if (this.form.price === null || this.form.price <= 0) {
      this.validationMessage = 'Price must be greater than 0.';
      return;
    }

    if (!this.form.presentationId || !this.form.productionId) {
      this.validationMessage = 'Presentation and production are required.';
      return;
    }

    if (this.mode === 'edit' && (this.form.stockQuantity === null || !Number.isInteger(this.form.stockQuantity))) {
      this.validationMessage = 'Stock must be a whole number.';
      return;
    }

    if (this.form.stockQuantity !== null && this.form.stockQuantity < 0) {
      this.validationMessage = 'Stock cannot be negative.';
      return;
    }

    this.saved.emit({
      name: this.form.name.trim(),
      imageUrl: this.form.imageUrl.trim() || null,
      price: this.form.price,
      stockQuantity: this.mode === 'edit' ? this.form.stockQuantity : null,
      presentationId: this.form.presentationId,
      productionId: this.form.productionId,
    });
  }

  reset(): void {
    this.form = this.toForm(this.initialValue);
  }

  stepStock(delta: number): void {
    if (this.mode !== 'edit') {
      return;
    }

    const currentValue = this.form.stockQuantity ?? 0;
    this.form.stockQuantity = Math.max(0, Math.trunc(currentValue + delta));
  }

  onStockQuantityChange(value: number | string | null): void {
    if (value === null || value === '') {
      this.form.stockQuantity = null;
      return;
    }

    const parsedValue = Number(value);
    if (!Number.isFinite(parsedValue)) {
      this.form.stockQuantity = null;
      return;
    }

    this.form.stockQuantity = Math.max(0, Math.trunc(parsedValue));
  }

  private emptyForm(): AdminProductFormModel {
    return {
      name: '',
      imageUrl: '',
      price: null,
      stockQuantity: null,
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
      stockQuantity: value.stockQuantity,
      presentationId: value.presentationId,
      productionId: value.productionId,
    };
  }
}
