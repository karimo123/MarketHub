import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { createClient } from '@supabase/supabase-js';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-signin-page',
  templateUrl: './signin-page.component.html',
  styleUrls: ['./signin-page.component.css'],
})
export class SigninPageComponent {
  email: string = '';
  password: string = '';
  errorMessage: string | null = null;

  private supabase = createClient(
    environment.supabaseUrl,
    environment.supabaseAnonKey
  );

  constructor(private router: Router) {}

  onSignUpClick(){
    this.router.navigate(['/signup-page']);
  }

  async onSignIn(event: Event) {
    event.preventDefault();
    this.errorMessage = null;
  
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: this.email,
        password: this.password,
      });
  
      if (error) {
        this.errorMessage = 'Invalid email or password.';
        console.error('Sign-in error:', error.message);
        return;
      }
      const userMetadata = data.user?.user_metadata;
      if (userMetadata) {
          localStorage.setItem('user_metadata', JSON.stringify(userMetadata));
      }
  
      const token = data.session?.access_token;
      if (token) {
        localStorage.setItem('accessToken', token);
      }
      
      const user = data.user;
      const role = user?.user_metadata?.['role'];
  
      if (role === 'Buyer') {
        this.router.navigate(['/buyer-page']);
      } else if (role === 'Seller') {
        this.router.navigate(['/seller-page']);
      } else {
        console.warn('Role not found. Redirecting to default dashboard.');
        this.router.navigate(['/']);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      this.errorMessage = 'An unexpected error occurred. Please try again later.';
    }
  }
}
