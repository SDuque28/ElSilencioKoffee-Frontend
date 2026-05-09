import { TestBed } from '@angular/core/testing';

import { AdminDataTableComponent } from './admin-data-table.component';

describe('AdminDataTableComponent', () => {
  it('emits an action event when the header action button is clicked', async () => {
    await TestBed.configureTestingModule({
      imports: [AdminDataTableComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(AdminDataTableComponent);
    const actionClickedSpy = vi.fn();

    fixture.componentInstance.title = 'Recent Orders';
    fixture.componentInstance.actionLabel = 'View All Orders';
    fixture.componentInstance.actionClicked.subscribe(actionClickedSpy);
    fixture.detectChanges();

    const actionButton = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    actionButton.click();

    expect(actionClickedSpy).toHaveBeenCalledTimes(1);
  });
});
