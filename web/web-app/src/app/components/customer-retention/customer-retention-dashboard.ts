import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-customer-retention-dashboard',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './customer-retention-dashboard.html',
  styleUrl: './customer-retention-dashboard.scss'
})
export class CustomerRetentionDashboard {

}
