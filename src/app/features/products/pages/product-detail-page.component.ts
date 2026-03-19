import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  type OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { isApiSuccessResponse } from '../../../core/models/api-response.model';
import type { Product } from '../../../core/models/product.model';
import { BadgeComponent } from '../../../shared/ui/badge/badge.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { CardComponent } from '../../../shared/ui/card/card.component';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { CartStateService } from '../../cart/services/cart-state.service';
import { ProductsService } from '../services/products.service';

@Component({
  selector: 'app-product-detail-page',
  imports: [RouterLink, CardComponent, ButtonComponent, BadgeComponent],
  templateUrl: './product-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailPageComponent implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly productsService = inject(ProductsService);
  private readonly toastService = inject(ToastService);
  private readonly cartState = inject(CartStateService);
  private readonly currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

  readonly productId = this.route.snapshot.paramMap.get('id') ?? 'N/A';
  product: Product | null = null;
  loadError: string | null = null;

  ngOnInit(): void {
    this.productsService
      .getProduct(this.productId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((product) => {
        this.product = product ?? null;
        this.loadError = product ? null : 'This mock product is not available.';
        this.cdr.markForCheck();
      });
  }

  addToCart(product: Product): void {
    this.cartState
      .addItem(product)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => {
        if (isApiSuccessResponse(response)) {
          this.toastService.show({
            title: 'Added to cart',
            description: `${product.name} was added to your selection.`,
            variant: 'success',
          });
          return;
        }

        this.toastService.show({
          title: 'Unable to add item',
          description: response.error,
          variant: 'error',
        });
      });
  }

  formatPrice(price: number): string {
    return this.currencyFormatter.format(price);
  }

  stockVariant(stock: number): 'success' | 'warning' | 'danger' {
    if (stock > 15) {
      return 'success';
    }

    if (stock > 0) {
      return 'warning';
    }

    return 'danger';
  }

  stockLabel(stock: number): string {
    if (stock > 15) {
      return 'In stock';
    }

    if (stock > 0) {
      return `Only ${stock} left`;
    }

    return 'Sold out';
  }
}
