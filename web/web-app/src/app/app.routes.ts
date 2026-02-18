import { Routes } from '@angular/router';
import { RagDashboard } from './components/rag-dashboard';
import { ApiTest } from './components/api-test';
import { CustomerRetentionDashboard } from './components/customer-retention/customer-retention-dashboard';
import { CsvUpload } from './components/customer-retention/csv-upload';
import { CustomerBrowser } from './components/customer-retention/customer-browser';
import { CustomerProfile } from './components/customer-retention/customer-profile';
import { CustomerRetentionPlan } from './components/customer-retention/customer-retention-plan';
import { PolicyUpload } from './components/customer-retention/policy-upload';
import { PolicyBasedRetention } from './components/customer-retention/policy-based-retention';

export const routes: Routes = [
    { path: 'rag', component: RagDashboard },
    { path: 'api', component: ApiTest },
    {
        path: 'customer-retention',
        component: CustomerRetentionDashboard,
        children: [
            { path: 'csv-upload', component: CsvUpload },
            { path: 'customer-browser', component: CustomerBrowser },
            { path: 'customer-profile', component: CustomerProfile },
            { path: 'customer-retention-plan', component: CustomerRetentionPlan },
            { path: 'policy-upload', component: PolicyUpload },
            { path: 'policy-based-retention', component: PolicyBasedRetention },
            { path: '', redirectTo: 'csv-upload', pathMatch: 'full' }
        ]
    },
    { path: '', redirectTo: '/rag', pathMatch: 'full' } // Default page
];