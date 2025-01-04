import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css']
})
export class LandingPageComponent {
  title: string = 'MarketHub';
  aboutText: string = 'MarketHub is a vibrant community where buyers and sellers come together to exchange unique and exciting products. We pride ourselves on offering a wide variety of items, from handmade crafts to cutting-edge technology. Our platform is designed to be user-friendly, secure, and fair for all participants. Join us today and experience the future of online shopping!';

  constructor(private router: Router) {}

  onLogin() {
    this.router.navigate(['/signin-page']);
  }

  onSignup() {
    this.router.navigate(['/signup-page']);
  }
}
