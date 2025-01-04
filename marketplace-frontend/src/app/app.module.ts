import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LandingPageComponent } from './pages/landing-page/landing-page.component';
import { SigninPageComponent } from './pages/signin-page/signin-page.component';
import { BuyerPageComponent } from './pages/buyer-page/buyer-page.component';
import { SellerPageComponent } from './pages/seller-page/seller-page.component';
import { SignupPageComponent } from './pages/signup-page/signup-page.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { ModalComponent } from './components/modal/modal.component';
import { SearchBarComponent } from './components/search-bar/search-bar.component';

@NgModule({
  declarations: [
    AppComponent,
    LandingPageComponent,
    SigninPageComponent,
    BuyerPageComponent,
    SellerPageComponent,
    SignupPageComponent,
    NavbarComponent,
    ModalComponent,
    SearchBarComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
