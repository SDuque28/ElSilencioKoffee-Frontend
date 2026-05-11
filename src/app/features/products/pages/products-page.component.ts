import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  type OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { isApiSuccessResponse } from '../../../core/models/api-response.model';
import type { Product } from '../../../core/models/product.model';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { CartStateService } from '../../cart/services/cart-state.service';
import { ProductCardComponent } from '../components/product-card.component';
import { ProductModalService } from '../services/product-modal.service';
import { ProductsService, type ProductsListResponse } from '../services/products.service';

@Component({
  selector: 'app-products-page',
  imports: [ProductCardComponent],
  templateUrl: './products-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsPageComponent implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly productsService = inject(ProductsService);
  private readonly toastService = inject(ToastService);
  private readonly cartState = inject(CartStateService);
  private readonly productModal = inject(ProductModalService);

  products: Product[] = [];
  isLoading = true;

  ngOnInit(): void {
    this.cartState.closeDrawer();
    this.productModal.close();

    this.productsService
      .listProducts()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: ProductsListResponse) => {
          this.products = Array.isArray(response.products) ? response.products : [];
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (_error) => {
          this.products = [];
          this.isLoading = false;
          this.cdr.markForCheck();
        },
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

  trackByProductId(_index: number, product: Product): string {
    return product.id;
  }
}
