import { ChangeDetectionStrategy, Component, DestroyRef, inject, type OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';

import { ProductModalService } from '../services/product-modal.service';
import { ProductsService } from '../services/products.service';

@Component({
  selector: 'app-product-route-entry',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductRouteEntryComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productsService = inject(ProductsService);
  private readonly productModal = inject(ProductModalService);

  ngOnInit(): void {
    const productId = this.route.snapshot.paramMap.get('id');
    const previousUrl = this.router.lastSuccessfulNavigation()?.finalUrl?.toString();
    const fallbackUrl =
      previousUrl && !previousUrl.startsWith('/product/') ? previousUrl : '/products';

    if (!productId) {
      void this.router.navigateByUrl(fallbackUrl, { replaceUrl: true });
      return;
    }

    this.productsService
      .getProduct(productId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((product) => {
        if (product) {
          this.productModal.open(product);
        }

        void this.router.navigateByUrl(fallbackUrl, { replaceUrl: true });
      });
  }
}
