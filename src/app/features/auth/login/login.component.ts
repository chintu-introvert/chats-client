import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { finalize } from 'rxjs';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
    email = '';
    password = '';
    error = '';
    loading = false;

    constructor(
        private auth: AuthService,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        if (this.auth.isAuthenticated()) {
            this.router.navigate(['/chat']);
        }
    }

    onSubmit(): void {
        this.error = '';
        if (!this.email.trim() || !this.password) {
            this.error = 'Please enter email and password.';
            return;
        }
        this.loading = true;
        this.auth.login(this.email.trim(), this.password)
            .pipe(finalize(() => {
                this.loading = false;
                this.cdr.detectChanges();
            }))
            .subscribe({
                next: (res) => {
                    console.log(res, 'while logging in');
                    if (res.success === true || res.status === true) {
                        this.router.navigate(['/chat']);
                    } else {
                        this.error = res.error || res.message || 'Login failed. Please try again.';
                        this.cdr.detectChanges();
                    }
                },
                error: (err) => {
                    console.log(err, ' error while logging in');
                    this.error = err?.error?.message || err?.error?.error || 'Invalid email or password.';
                    this.cdr.detectChanges();
                }
            });
    }
}
