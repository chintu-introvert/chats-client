import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, map, catchError, throwError } from 'rxjs';
import { User } from '../models/user.model';
import { environment } from '../../../environments/environment.development';
import { ToastrService } from 'ngx-toastr';

const STORAGE_KEY = 'chats_app_user';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private currentUserSubject = new BehaviorSubject<User | null>(this.getStoredUser());
    currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

    constructor(private router: Router, private http: HttpClient, private toastr: ToastrService) { }

    get currentUser(): User | null {
        return this.currentUserSubject.value;
    }

    isAuthenticated(): boolean {
        return !!this.currentUserSubject.value;
    }

    private getStoredUser(): User | null {
        if (typeof localStorage === 'undefined') return null;
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        try {
            return JSON.parse(raw) as User;
        } catch {
            return null;
        }
    }

    private persistUser(user: User | null, token?: string): void {
        if (user) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
            if (token) {
                localStorage.setItem('chats_app_token', token);
            }
        } else {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem('chats_app_token');
        }
        this.currentUserSubject.next(user);
    }

    register(name: string, email: string, password: string): Observable<any> {
        return this.http.post<any>(`${environment.apiUrl}/auth/register`, { name, email, password }).pipe(
            map(res => {
                // If backend returns 200/201 but with success false or missing token
                if (res.success === false || res.error || !res.token) {
                    throw new Error(res.message || res.error || 'Registration failed');
                }
                return res;
            }),
            tap(res => {
                console.log(res, 'while registering');
                this.persistUser(res.user, res.token);
                this.toastr.success('Registration successful!', 'Success');
            }),
            catchError(err => {
                // Normalize both HttpClient errors and custom map errors
                const errorMsg = err.error?.message || err.message || 'An error occurred during registration.';
                // Return an object that matches the structure expected by the component
                return throwError(() => ({ error: { message: errorMsg } }));
            })
        );
    }

    login(email: string, password: string): Observable<{ user: User, token: string }> {
        return this.http.post<{ user: User, token: string }>(`${environment.apiUrl}/auth/login`, { email, password }).pipe(
            tap(res => {
                console.log(res, 'while logging in');
                this.persistUser(res.user, res.token);
                this.toastr.success('Logged in successfully!', 'Success');
            })
        );
    }

    logout(): void {
        this.persistUser(null);
        this.router.navigate(['/login']);
    }
}
