import { Component, OnInit } from '@angular/core';
import { ProductService } from 'src/app/services/product.service';
import { UserService } from 'src/app/services/user.service';
import { CartService } from 'src/app/services/cart.service';
import { createClient } from '@supabase/supabase-js';
import { CreditService } from 'src/app/services/creditservice.service';
import { OrderService } from 'src/app/services/order.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-buyer-page',
  templateUrl: './buyer-page.component.html',
  styleUrls: ['./buyer-page.component.css']
})
export class BuyerPageComponent implements OnInit {
  products: any[] = [];
  filteredProducts: any[] = [];
  showSortMenu = false;
  showOrders = false;
  addedToCart: Set<number> = new Set();
  showBuyNowModal = false;
  selectedProduct: any = null;
  buyerCredits: number = 0;
  userRole: string = '';
  orders: any[] = [];

  private supabase = createClient(
    environment.supabaseUrl,
    environment.supabaseAnonKey
  );

  constructor(
    private productService: ProductService, 
    private userService: UserService, 
    private cartService: CartService,  
    private creditService: CreditService, 
    private orderService: OrderService
  ) {}

  async ngOnInit(): Promise<void> {
    this.fetchProducts();
    this.fetchBuyerOrders();
  
    try {
      const { data, error } = await this.supabase.auth.getSession();
      if (error) {
        console.error('Error getting Supabase session:', error);
        return;
      }
  
      const session = data?.session;
      if (session?.user) {
        const supabaseUserId = session.user.id;
        this.fetchBuyerCredits(supabaseUserId);
        this.fetchUserRole(supabaseUserId);
      }
    } catch (err) {
      console.error('Unexpected error getting session:', err);
    }
  }

  toggleView(): void {
    this.showOrders = !this.showOrders;
  }

  fetchUserRole(supabaseUserId: string): void {
    this.userService.getUserRole(supabaseUserId).subscribe({
      next: (data) => {
        this.userRole = data.role;
      },
      error: (err) => {
        console.error('Error fetching user role:', err);
      },
    });
  }

  fetchBuyerOrders(): void {
    this.orderService.getOrdersForBuyer().subscribe({
      next: (data) => {
        console.log('Buyer Orders:', data);
        this.orders = data.map(order => ({
          id: order.id,
          productTitle: order.productTitle,
          quantity: order.quantity,
          total: order.totalPrice,
          sellerEmail: order.sellerEmail || 'N/A',
          orderDate: new Date(order.orderDate).toLocaleDateString()
        }));
      },
      error: (err) => {
        console.error('Error fetching buyer orders:', err);
      }
    });
  }
  

  fetchProducts(): void {
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products = data.filter((product) => product.stock > 0);
        this.filteredProducts = [...this.products];
      },
      error: (err) => {
        console.error('Error fetching products:', err);
      }
    });
  }

  fetchBuyerCredits(supabaseUserId: string): void {
    this.userService.getUserCredits(supabaseUserId).subscribe({
      next: (data) => {
        this.buyerCredits = data.credits;
      },
      error: (err) => {
        console.error('Error fetching credits:', err);
      },
    });
  }

  onBuyNow(product: any): void {
    if (this.userRole === 'Seller') {
      alert('Sellers cannot purchase products.');
      return;
    }
    this.selectedProduct = product;
    this.showBuyNowModal = true;
  }

  closeBuyNowModal(): void {
    this.showBuyNowModal = false;
    this.selectedProduct = null;
  }

  confirmPurchase(): void {
    if (this.selectedProduct) {
      if (this.buyerCredits < this.selectedProduct.price) {
        alert('Insufficient credits.');
        this.closeBuyNowModal();
        return;
      }
  
      this.productService.purchaseProduct(this.selectedProduct.id).subscribe({
        next: () => {
          this.buyerCredits -= this.selectedProduct.price;
  
          this.creditService.notifyCreditsUpdated();
  
          this.closeBuyNowModal();
        },
        error: (err) => {
          console.error('Error processing purchase:', err);
          alert('Failed to complete the purchase. Please try again.');
        },
      });
    }
  }
  
  
  onAddToCart(product: any): void {
    if (this.userRole === 'Seller') {
      alert('Sellers cannot add products to the cart.');
      return;
    }

    this.cartService.addToCart(product.id, 1).subscribe({
      next: () => {
        this.addedToCart.add(product.id);
      },
      error: (err) => {
        console.error('Error adding to cart:', err);
        alert('Failed to add product to cart.');
      }
    });
  }


  onSearch(term: any): void {
    if (!term || typeof term !== 'string' || !term.trim()) {
      this.filteredProducts = [...this.products];
      return;
    }
  
    const trimmedTerm = term.trim();
    this.productService.filterProducts(trimmedTerm).subscribe({
      next: (data) => {
        this.filteredProducts = data;
        this.filteredProducts = data.filter((product) => product.stock > 0);
      },
      error: (err) => {
        console.error('Error filtering products:', err);
      },
    });
  }

  toggleSortMenu(): void {
    this.showSortMenu = !this.showSortMenu;
  }

  sortProducts(sortBy: string, order: string): void {
    this.productService.sortProducts(sortBy, order).subscribe({
      next: (data) => {
        this.filteredProducts = data;
        this.filteredProducts = data.filter((product) => product.stock > 0);
        this.showSortMenu = false;
      },
      error: (err) => {
        console.error('Error sorting products:', err);
      },
    });
  }
  
}
