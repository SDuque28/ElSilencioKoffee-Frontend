import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { CardComponent } from '../../../shared/ui/card/card.component';
import { CartStateService } from '../services/cart-state.service';

@Component({
  selector: 'app-cart-page',
  imports: [CardComponent, ButtonComponent],
  templateUrl: './cart-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartPageComponent {
  readonly cartState = inject(CartStateService);
}
