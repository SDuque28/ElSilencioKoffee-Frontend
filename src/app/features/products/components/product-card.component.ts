import { CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
} from '@angular/core';
import { LucideAngularModule, ShoppingCart } from 'lucide-angular';

import { PRODUCT_IMAGE_FALLBACK, type Product } from '../../../core/models/product.model';
import { BadgeComponent } from '../../../shared/ui/badge/badge.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { CardComponent } from '../../../shared/ui/card/card.component';
import { ProductModalService } from '../services/product-modal.service';

@Component({
  selector: 'app-product-card',
  imports: [CurrencyPipe, LucideAngularModule, BadgeComponent, ButtonComponent, CardComponent],
  templateUrl: './product-card.component.html',
  host: {
    class: 'block h-full',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCardComponent {
  private readonly productModal = inject(ProductModalService);

  @Input({ required: true }) product!: Product;
  @Input() compact = false;
  @Input() cardClassName = '';
  @Output() addToCart = new EventEmitter<Product>();

  protected readonly icons = {
    cart: ShoppingCart,
  };
  protected readonly fallbackImage = PRODUCT_IMAGE_FALLBACK;

  get cardClasses(): string {
    const layoutClasses = this.compact
      ? 'h-full overflow-hidden rounded-[26px] border-[#ebe2d8] bg-white p-0 shadow-[0_16px_40px_rgba(92,65,45,0.08)]'
      : 'h-full overflow-hidden rounded-[26px] border-[#ebe2d8] bg-white p-0 shadow-[0_18px_45px_rgba(92,65,45,0.08)]';

    return `${layoutClasses} transition duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:shadow-[0_24px_60px_rgba(92,65,45,0.14)] ${this.cardClassName}`.trim();
  }

  openProduct(): void {
    this.productModal.open(this.product);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    this.openProduct();
  }

  onAddToCart(event: MouseEvent): void {
    event.stopPropagation();
    this.addToCart.emit(this.product);
  }

  onImageError(event: Event): void {
    const image = event.target as HTMLImageElement;

    if (image.src === PRODUCT_IMAGE_FALLBACK) {
      return;
    }

    image.src = PRODUCT_IMAGE_FALLBACK;
  }

  get stockLabel(): string {
    if (this.product.stock > 15) {
      return 'In stock';
    }

    if (this.product.stock > 0) {
      return `Only ${this.product.stock} left`;
    }

    return 'Sold out';
  }

  get stockVariant(): 'success' | 'warning' | 'danger' {
    if (this.product.stock > 15) {
      return 'success';
    }

    if (this.product.stock > 0) {
      return 'warning';
    }

    return 'danger';
  }
}
