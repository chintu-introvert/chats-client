import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { User } from '../models/user.model';
import { environment } from '../../../environments/environment.development';

const STORAGE_KEY = 'chats_app_user';
const API_URL = 'http://localhost:1000/api/auth';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private currentUserSubject = new BehaviorSubject<User | null>(this.getStoredUser());
    currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

    constructor(private router: Router, private http: HttpClient) { }

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

    private persistUser(user: User | null): void {
        if (user) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
        this.currentUserSubject.next(user);
    }

    register(name: string, email: string, password: string): Observable<User> {
        return this.http.post<User>(`${environment.apiUrl}/auth/register`, { name, email, password }).pipe(
            tap(user => this.persistUser(user))
        );
    }

    login(email: string, password: string): Observable<User> {
        return this.http.post<User>(`${environment.apiUrl}/authlogin`, { email, password }).pipe(
            tap(user => this.persistUser(user))
        );
    }

    logout(): void {
        this.persistUser(null);
        this.router.navigate(['/login']);
    }
}
