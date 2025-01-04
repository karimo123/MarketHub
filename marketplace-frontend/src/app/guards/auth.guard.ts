import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { createClient } from '@supabase/supabase-js';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private supabase = createClient(
    environment.supabaseUrl,
    environment.supabaseAnonKey
  );

  constructor(private router: Router) {}

  async canActivate(): Promise<boolean> {
    const { data: { session } } = await this.supabase.auth.getSession();

    if (session) {
      return true;
    } else {
      this.router.navigate(['/signin-page']);
      return false;
    }
  }
}
