import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-signup-page',
  templateUrl: './signup-page.component.html',
  styleUrls: ['./signup-page.component.css']
})
export class SignupPageComponent implements OnInit {
  name: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  role: string = '';
  errorMessage: string | null = null;

  constructor(private router: Router, private userService: UserService) {}

  ngOnInit(): void {
  }

  onLoginClick(){
    this.router.navigate(['/signin-page']);
  }

  onCreateAccountClick(event: Event) {
    event.preventDefault();

    if (!this.name.trim()) {
      this.errorMessage = "Name is required.";
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.errorMessage = "Please enter a valid email address.";
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage = "Password must be at least 6 characters long.";
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = "Passwords do not match.";
      return;
    }

    if (!this.role) {
      this.errorMessage = "Please select a role (Buyer or Seller).";
      return;
    }

    this.errorMessage = null;
    console.log('Account creation details:', {
      name: this.name,
      email: this.email,
      role: this.role
    });

   this.userService
   .registerUser({
     name: this.name,
     email: this.email,
     password: this.password,
     role: this.role,
   })
   .subscribe({
     next: (response) => {
       console.log('User registered successfully:', response);
       if (this.role === 'Buyer') {
         this.router.navigate(['/buyer-page']);
       } else {
         this.router.navigate(['/seller-page']);
       }
     },
     error: (err) => {
      if (err.status === 409) {
        this.errorMessage = 'A user with this email already exists.';
      } else {
        this.errorMessage = 'Failed to register user. Please try again.';
      }
       console.error('Error registering user:', err);
     },
   });
  }
}
