import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CreditService {
  private creditsUpdatedSource = new Subject<void>();
  creditsUpdated$ = this.creditsUpdatedSource.asObservable();

  notifyCreditsUpdated(): void {
    this.creditsUpdatedSource.next();
  }
}
