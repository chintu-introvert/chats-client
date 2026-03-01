import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

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
        this.auth.login(this.email.trim(), this.password).subscribe({
            next: (res) => {
                console.log(res, 'while logging in')
                this.loading = false;
                this.router.navigate(['/chat']);
            },
            error: (res) => {
                console.log(res, ' error while logging in')
                this.loading = false;
                this.error = 'Invalid email or password.';
                this.cdr.detectChanges();
            }
        });
    }
}
