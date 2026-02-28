import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../models/user.model';

const STORAGE_KEY = 'chats_app_user';
const USERS_KEY = 'chats_app_users';

interface StoredUser extends User {
    email: string;
    password: string;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private currentUserSubject = new BehaviorSubject<User | null>(this.getStoredUser());
    currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

    constructor(private router: Router) {}

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

    private getStoredUsers(): StoredUser[] {
        if (typeof localStorage === 'undefined') return [];
        const raw = localStorage.getItem(USERS_KEY);
        if (!raw) return [];
        try {
            return JSON.parse(raw);
        } catch {
            return [];
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

    private persistUsers(users: StoredUser[]): void {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    register(name: string, email: string, password: string): boolean {
        const users = this.getStoredUsers();
        if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
            return false;
        }
        const id = 'user_' + Date.now();
        const newUser: StoredUser = {
            id,
            name: name.trim(),
            email: email.trim().toLowerCase(),
            avatarUrl: `https://i.pravatar.cc/150?u=${id}`,
            bio: 'Hey there! I am using Chats.',
            password
        };
        users.push(newUser);
        this.persistUsers(users);
        const { password: _, email: __, ...user } = newUser;
        this.persistUser(user);
        return true;
    }

    login(email: string, password: string): boolean {
        const users = this.getStoredUsers();
        const stored = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
        if (!stored) return false;
        const { password: _, email: __, ...user } = stored;
        this.persistUser(user);
        return true;
    }

    logout(): void {
        this.persistUser(null);
        this.router.navigate(['/login']);
    }
}
