import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable()
export class AuthTokenInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = localStorage.getItem('auth.token');
    // Consider relative and absolute API URLs as backend requests. This helps when services
    // call '/api/...' (relative) instead of the full environment.apiBaseUrl.
    const isBackendRequest =
      req.url.startsWith(environment.apiBaseUrl) || req.url.startsWith('/api') || req.url.includes('/api/');

    // Debugging helpers: log token state and why we may skip setting header.
    // Remove or lower verbosity in production once root cause is found.
    try {
      // avoid logging the full token value
      const tokenPreview = token ? `${token.slice(0, 8)}... (len=${token.length})` : 'null';
      // use console.debug so it doesn't clutter production logs at info level
      console.debug('AuthTokenInterceptor:', { url: req.url, isBackendRequest, tokenPreview, hasAuthHeader: req.headers.has('Authorization') });
    } catch (e) {
      // ignore logging errors
    }

    // In development, allow attaching the token to all outgoing requests when present
    // to help debug auth/CORS issues. In production this will only attach to backend requests.
    const shouldAttach = !!token && !req.headers.has('Authorization') && (environment.production ? isBackendRequest : true);

    if (!shouldAttach) {
      return next.handle(req);
    }

    return next.handle(
      req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      }),
    );
  }
}