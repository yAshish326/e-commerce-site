import { Component, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.scss',
})
export class App {
  title = 'E-Commerce';
  private readonly router = inject(Router);
  private readonly themeService = inject(ThemeService);

  constructor() {
    void this.themeService.currentTheme;

    if (this.wasPageReloaded()) {
      void this.router.navigate(['/auth/login'], { replaceUrl: true });
    }
  }

  readonly isLayoutManagedPage$: Observable<boolean> = this.router.events.pipe(
    startWith(new NavigationEnd(0, this.router.url, this.router.url)),
    filter((event): event is NavigationEnd => event instanceof NavigationEnd),
    map((event) => event.urlAfterRedirects || event.url),
    map((url) =>
      url.startsWith('/auth') ||
      url.startsWith('/customer') ||
      url.startsWith('/seller'),
    ),
  );

  private wasPageReloaded(): boolean {
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    if (navigationEntry) {
      return navigationEntry.type === 'reload';
    }

    const deprecatedNavigation = (performance as Performance & { navigation?: { type?: number } }).navigation;
    return deprecatedNavigation?.type === 1;
  }
}
