import { Component, OnInit } from '@angular/core';
import { ProductService } from 'src/app/services/product.service';
import { OrderService } from 'src/app/services/order.service';

@Component({
  selector: 'app-seller-page',
  templateUrl: './seller-page.component.html',
  styleUrls: ['./seller-page.component.css']
})
export class SellerPageComponent implements OnInit {

  constructor(private productService: ProductService, private orderService: OrderService) {}

  showOrders = false;
  showCreateListingModal = false;
  showDeleteModal = false;
  editMode = false;
  showErrors = false;
  defaultImageUrl = 'https://via.placeholder.com/300';
  products: any[] = [];
  productIdToDelete: number | null = null;
  productToEdit: any = null;
  sellerName = 'Seller';
  orders: any[] = [];


  newListing = {
    id: 0,
    title: '',
    description: '',
    price: 0,
    category: '',
    image: this.defaultImageUrl,
    stock: 0,
  };

  categories = [
    'Electronics',
    'Fashion',
    'Home & Kitchen',
    'Books',
    'Toys',
    'Sports',
    'Health & Beauty',
    'Automotive',
    'Gaming',
    'Jewelry',
    'Musical Instruments',
    'Office Supplies',
    'Garden',
    'Baby Products',
    'Groceries',
    'Pet Supplies',
    'Crafts & DIY',
    'Art',
    'Fitness',
    'Tools',
    'Other',
  ];

  ngOnInit(): void {
    this.fetchProductsForSeller();
    this.fetchSellerName();
  }

  toggleView(): void {
    this.showOrders = !this.showOrders;
    if (this.showOrders) {
      this.fetchOrdersForSeller();
    }
  }

  fetchOrdersForSeller(): void {
    this.orderService.getOrdersForSeller().subscribe({
      next: (data) => {
        console.log('Seller Orders:', data);
        this.orders = data.map((order: any) => ({
          id: order.id,
          productTitle: order.title,
          quantity: order.quantity,
          total: order.totalPrice,
          buyerEmail: order.buyerEmail || 'N/A',
          orderDate: new Date(order.orderDate).toLocaleDateString(),
        }));
      },
      error: (err) => {
        console.error('Error fetching orders for seller:', err);
      },
    });
  }

  fetchSellerName(): void {
    const userMetadata = localStorage.getItem('user_metadata');
    if (userMetadata) {
      try {
        const metadata = JSON.parse(userMetadata);
        this.sellerName = metadata.name || 'Seller';
      } catch (error) {
        console.error('Error parsing user metadata:', error);
      }
    } else {
      console.warn('User metadata not found in local storage.');
    }
  }


  fetchProductsForSeller(): void {
    this.productService.getSellerProducts().subscribe({
      next: (data) => {
        console.log('Seller Products List:', data);
        this.products = data;
      },
      error: (err) => {
        console.error('Error fetching seller products:', err);
      },
    });
  }

    createListing(): void {
      if (
          this.newListing.title &&
          this.newListing.description &&
          this.newListing.price > 0 &&
          this.newListing.category && 
          this.newListing.stock >= 0
      ) {
          const payload = {
              ...this.newListing,
              imageUrl: this.newListing.image,
          };

          this.productService.createProduct(payload).subscribe({
              next: (response) => {
                  this.products.push(response.product);
                  console.log('Created product:', response.product);
                  this.resetForm();
                  this.showCreateListingModal = false;
              },
              error: (err) => {
                if (err.status === 401 && err.error?.message === 'Only sellers can create products.') {
                  alert('Buyers cannot create products. Please switch to a seller account to use this feature.');
                } else {
                  console.error('Error creating product:', err);
                  alert('An error occurred while creating the product. Please try again.');
                }
              },
          });
      } else {
          this.showErrors = true;
      }
  }

  updateListing(): void {
    if (
      this.newListing.title &&
      this.newListing.description &&
      this.newListing.price > 0 &&
      this.newListing.category &&
      this.newListing.stock >= 0
    ) {
      const payload = {
        ...this.newListing,
        imageUrl: this.newListing.image,
      };

      this.productService.updateProduct(this.newListing.id, payload).subscribe({
        next: (response) => {
          const index = this.products.findIndex((p) => p.id === this.newListing.id);
          if (index !== -1) {
            this.products[index] = response.product;
          }
          console.log('Updated product:', response.product);
          this.resetForm();
          this.showCreateListingModal = false;
          this.editMode = false;
        },
        error: (err) => {
          this.editMode = false;
          console.error('Error updating product:', err);
        },
      });
    } else {
      this.showErrors = true;
    }
  }

  openEditModal(product: any): void {
    this.editMode = true;
    this.showCreateListingModal = true;
    this.productToEdit = product;
    this.newListing = { 
      id: product.id,
      title: product.title,
      description: product.description,
      price: product.price,
      category: product.category,
      image: product.imageUrl,
      stock: product.stock,
    };
  }
  
  closeModal() {
    this.resetForm();
    this.showCreateListingModal = false;
    this.editMode = false;
  }

  openDeleteModal(productId: number): void {
    this.productIdToDelete = productId;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.productIdToDelete = null;
    this.showDeleteModal = false;
  }

  confirmDelete(): void {
    if (this.productIdToDelete !== null) {
      this.productService.deleteProduct(this.productIdToDelete).subscribe({
        next: () => {
          this.products = this.products.filter(product => product.id !== this.productIdToDelete);
          this.closeDeleteModal();
        },
        error: (err) => {
          console.error('Error deleting product:', err);
        },
      });
    }
  }
  onAddImageClick(): void {
    const fileInput = document.getElementById('imageUpload') as HTMLInputElement;
    fileInput.click();
  }
  
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
  
      const fileReader = new FileReader();
      fileReader.onload = () => {
        this.newListing.image = fileReader.result as string;
      };
      fileReader.readAsDataURL(file); 
    }
  }

  resetForm(): void {
    this.newListing = { id: 0, title: '', description: '', price: 0, category: '', image:'', stock: 0 };
    this.showErrors = false;
  }
}
