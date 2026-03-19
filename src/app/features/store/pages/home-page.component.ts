import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  viewChild,
  type OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ChevronLeft, ChevronRight, LucideAngularModule } from 'lucide-angular';

import { isApiSuccessResponse } from '../../../core/models/api-response.model';
import type { Product } from '../../../core/models/product.model';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { CartStateService } from '../../cart/services/cart-state.service';
import { ProductCardComponent } from '../../products/components/product-card.component';
import { ProductsService } from '../../products/services/products.service';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, ProductCardComponent, LucideAngularModule],
  templateUrl: './home-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePageComponent implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly productsService = inject(ProductsService);
  private readonly toastService = inject(ToastService);
  private readonly cartState = inject(CartStateService);
  readonly collectionTrack = viewChild<ElementRef<HTMLElement>>('collectionTrack');

  readonly heroImage =
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1600&q=80';
  protected readonly icons = {
    previous: ChevronLeft,
    next: ChevronRight,
  };

  featuredProducts: Product[] = [];
  collectionProducts: Product[] = [];

  ngOnInit(): void {
    this.productsService
      .listFeaturedProducts()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((products) => {
        this.featuredProducts = products.slice(0, 4);
        this.cdr.markForCheck();
      });

    this.productsService
      .listCollectionProducts()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((products) => {
        this.collectionProducts = products;
        this.cdr.markForCheck();
      });
  }

  scrollCollection(direction: 'previous' | 'next'): void {
    const collectionTrack = this.collectionTrack()?.nativeElement;

    if (!collectionTrack) {
      return;
    }

    const offset = collectionTrack.clientWidth * 0.88;
    collectionTrack.scrollBy({
      left: direction === 'next' ? offset : -offset,
      behavior: 'smooth',
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
}
