import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class NavbarComponent {
  // Use a signal for the hamburger toggle state
  isMenuOpen = signal(false);

  toggleMenu() {
    this.isMenuOpen.update(val => !val);
  }
}