import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const router = inject(Router);
    let authToken = '';

    if (typeof localStorage !== 'undefined') {
        authToken = localStorage.getItem('chats_app_token') || '';
    }

    // Clone the request and append the token if it exists
    if (authToken) {
        req = req.clone({
            setHeaders: {
                Authorization: `Bearer ${authToken}`
            }
        });
    }

    return next(req);
};
