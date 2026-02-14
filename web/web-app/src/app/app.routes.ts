import { Routes } from '@angular/router';
import { RagDashboard } from './components/rag-dashboard';
import { ApiTest } from './components/api-test';

export const routes: Routes = [
    { path: 'rag', component: RagDashboard },
    { path: 'api', component: ApiTest },
    { path: '', redirectTo: '/rag', pathMatch: 'full' } // Default page
];