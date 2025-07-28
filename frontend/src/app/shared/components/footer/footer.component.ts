import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent {
  constructor(private authService: AuthService) {}
  currentYear: number = new Date().getFullYear();
  // Only show footer for customers
  shouldShow(): boolean {
    const user = this.authService.currentUserValue;
    return !user || user.role === 'CUSTOMER';
  }
}
