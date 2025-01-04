import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandingPageComponent } from './pages/landing-page/landing-page.component';
import { BuyerPageComponent } from './pages/buyer-page/buyer-page.component';
import { SellerPageComponent } from './pages/seller-page/seller-page.component';
import { SigninPageComponent } from './pages/signin-page/signin-page.component';
import { SignupPageComponent } from './pages/signup-page/signup-page.component';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  { path: '', component: LandingPageComponent },
  { path: 'signin-page', component: SigninPageComponent },
  { path: 'signup-page', component: SignupPageComponent },
  { path: 'buyer-page', component: BuyerPageComponent, canActivate: [AuthGuard] },
  { path: 'seller-page', component: SellerPageComponent, canActivate: [AuthGuard] },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
