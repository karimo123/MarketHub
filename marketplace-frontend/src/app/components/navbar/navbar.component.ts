import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { createClient } from '@supabase/supabase-js';
import { UserService } from 'src/app/services/user.service';
import { CartService } from 'src/app/services/cart.service';
import { CreditService } from 'src/app/services/creditservice.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  isLoggedIn: boolean = false;
  showLogoutButton: boolean = true;
  credits: number = 0;
  isBuyer: boolean = false;
  showCartModal: boolean = false;
  cartItems: any[] = [];

  private supabase = createClient(
    environment.supabaseUrl,
    environment.supabaseAnonKey
  );

  constructor(private router: Router, private userService: UserService, private cartService: CartService, private creditService: CreditService) {}

  async ngOnInit() {
    const { data: { session } } = await this.supabase.auth.getSession();
    this.isLoggedIn = !!session;

    if (this.isLoggedIn && session?.user?.id) {
      this.fetchUserCredits(session.user.id);
      this.checkUserRole(session.user.id);

      this.creditService.creditsUpdated$.subscribe(() => {
        this.fetchUserCredits(session.user.id);
      });
    }

    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        const currentRoute = event.url;
        this.showLogoutButton = !(currentRoute === '/' || currentRoute.includes('signin-page') || currentRoute.includes('signup-page'));
      }
    });
  }

  private fetchUserCredits(userId: string): void {
    this.userService.getUserCredits(userId).subscribe({
      next: (data) => {
        this.credits = data.credits || 0;
      },
      error: (err) => {
        console.error('Error fetching user credits:', err);
      },
    });
  }

  updateCartQuantity(item: any, newQuantity: number): void {
    if (newQuantity < 1 || newQuantity > item.stock) {
      return;
    }
  
    this.cartService.updateCartQuantity(item.id, newQuantity).subscribe({
      next: () => {
        const cartItem = this.cartItems.find(cart => cart.id === item.id);
        if (cartItem) {
          cartItem.quantity = newQuantity;
        }
      },
      error: (err) => {
        console.error('Error updating cart quantity:', err);
        alert('You are exceding the item stock');
      },
    });
  }
  

  private checkUserRole(userId: string): void {
    this.userService.getUserRole(userId).subscribe({
      next: (data) => {
        this.isBuyer = data.role === 'Buyer';
      },
      error: (err) => {
        console.error('Error fetching user role:', err);
      },
    });
  }

  openCartModal(): void {
    this.supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error('Error fetching session:', error);
        return;
      }
  
      const session = data?.session;
      const supabaseUserId = session?.user?.id;
  
      if (!supabaseUserId) {
        console.error('Supabase user ID not found');
        return;
      }
  
      this.userService.getUserId(supabaseUserId).subscribe({
        next: (userData) => {
          const userId = userData.id;
  
          this.cartService.getCartItems(userId).subscribe({
            next: (data) => {
              console.log(data)
              this.cartItems = data;
              this.showCartModal = true;
            },
            error: (err) => {
              console.error('Error fetching cart items:', err);
            },
          });
        },
        error: (err) => {
          console.error('Error fetching user ID:', err);
        },
      });
    });
  }
  
  removeFromCart(cartItemId: number): void {
    this.cartService.removeFromCart(cartItemId).subscribe({
      next: () => {
        this.cartItems = this.cartItems.filter(item => item.id !== cartItemId);
      },
      error: (err) => {
        console.error('Error removing item from cart:', err);
        alert('Failed to remove item from cart.');
      },
    });
  }

  checkoutCart(): void {
    this.cartService.checkoutCart().subscribe({
      next: () => {
        alert('Cart purchase successful!');
        this.closeCartModal();
        this.cartItems = [];
        
        this.supabase.auth.getSession().then(({ data, error }) => {
          if (error) {
            console.error('Error fetching session:', error);
            return;
          }
  
          const session = data?.session;
          const supabaseUserId = session?.user?.id;
  
          if (supabaseUserId) {
            this.fetchUserCredits(supabaseUserId);
          }
        });
      },
      error: (err) => {
        console.error('Error during checkout:', err);
        alert('Failed to complete the purchase. Please try again.');
      },
    });
  }

  closeCartModal(): void {
    this.showCartModal = false;
    this.cartItems = [];
  }
  
  async onLogout() {
    await this.supabase.auth.signOut();
    this.isLoggedIn = false;
    this.router.navigate(['/signin-page']);
  }
}
