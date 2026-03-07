import { Directive, ElementRef, EventEmitter, HostListener, Output, inject } from '@angular/core';

@Directive({
  selector: '[appClickOutside]',
})
export class ClickOutsideDirective {
  @Output() appClickOutside = new EventEmitter<void>();

  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as Node;

    if (!this.elementRef.nativeElement.contains(target)) {
      this.appClickOutside.emit();
    }
  }
}
