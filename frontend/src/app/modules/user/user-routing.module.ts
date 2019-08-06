import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { UserRootComponent } from './components/user-root/user-root.component';
import { UserDetailsComponent } from './components/user-details/user-details.component';
import { UserSettingsComponent } from './components/user-settings/user-settings.component';

const userRoutes: Routes = [
  {path: 'user', component: UserRootComponent,
    children: [
      {path: '', component: UserDetailsComponent},
      {path: 'settings', component: UserSettingsComponent}
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(userRoutes)],
  exports: [RouterModule]
})
export class UserRoutingModule { }