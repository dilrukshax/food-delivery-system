// src/app/shared/components/loading-spinner/loading-spinner.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-spinner.component.html',
  styleUrl: './loading-spinner.component.css'
})
export class LoadingSpinnerComponent implements OnInit {
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() type: 'spinner' | 'pulse' = 'spinner';
  @Input() isDark: boolean = false;
  @Input() overlay: boolean = false;
  @Input() label: string = '';

  // Computed classes
  sizeClasses: string = '';
  borderClasses: string = '';
  pulseContainerClasses: string = '';
  pulseInnerClasses: string = '';

  ngOnInit(): void {
    this.setSizeClasses();
  }

  private setSizeClasses(): void {
    // Border classes for the spinner
    if (this.size === 'sm') {
      this.borderClasses = 'w-5 h-5 border-2';
      this.pulseContainerClasses = 'w-5 h-5';
      this.pulseInnerClasses = 'w-5 h-5';
    } else if (this.size === 'lg') {
      this.borderClasses = 'w-12 h-12 border-4';
      this.pulseContainerClasses = 'w-12 h-12';
      this.pulseInnerClasses = 'w-12 h-12';
    } else {
      // Default medium size
      this.borderClasses = 'w-8 h-8 border-3';
      this.pulseContainerClasses = 'w-8 h-8';
      this.pulseInnerClasses = 'w-8 h-8';
    }

    // Container classes
    if (this.overlay) {
      this.sizeClasses = 'h-full w-full';
    } else {
      this.sizeClasses = '';
    }
  }
}
