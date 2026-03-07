import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { BadgeComponent } from '../../../shared/ui/badge/badge.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { CardComponent } from '../../../shared/ui/card/card.component';

@Component({
  selector: 'app-product-detail-page',
  imports: [RouterLink, CardComponent, ButtonComponent, BadgeComponent],
  templateUrl: './product-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailPageComponent {
  private readonly route = inject(ActivatedRoute);

  readonly productId = this.route.snapshot.paramMap.get('id') ?? 'N/A';
}
