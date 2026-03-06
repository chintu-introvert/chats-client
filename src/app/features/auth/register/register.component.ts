import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent implements OnInit {
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  error = '';
  loading = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
      this.router.navigate(['/chat']);
    }
  }

  onSubmit(): void {
    this.error = '';
    if (!this.name.trim()) {
      this.error = 'Please enter your name.';
      return;
    }
    if (!this.email.trim()) {
      this.error = 'Please enter your email.';
      return;
    }
    if (!this.password) {
      this.error = 'Please enter a password.';
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.error = 'Passwords do not match.';
      return;
    }
    if (this.password.length < 6) {
      this.error = 'Password must be at least 6 characters.';
      return;
    }
    this.loading = true;
    this.auth.register(this.name.trim(), this.email.trim(), this.password).subscribe({
      next: (res: any) => {
        console.log(res, 'while registering');
        if (res.status === true) {
          this.router.navigate(['/chat']);
        } else {
          this.error = res.message || 'Registration failed. Please try again.';
          this.toastr.error(this.error, 'Error');
        }
        this.loading = false;
      },
      error: (err) => {
        console.error(err, 'while registering');
        this.loading = false;
        this.error =
          err?.error?.message || err?.message || 'An error occurred during registration.';
        this.toastr.error(this.error, 'Error');
      },
    });
  }
}
