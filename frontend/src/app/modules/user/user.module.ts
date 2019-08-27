import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserRootComponent } from './components/user-root/user-root.component';
import { UserDetailsComponent } from './components/user-details/user-details.component';
import { UserSettingsComponent } from './components/user-settings/user-settings.component';
import { UserRoutingModule } from './user-routing.module';
import { DialogModule } from 'primeng/dialog';
import { SlideMenuModule } from 'primeng/slidemenu';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule}  from 'primeng/progressspinner';
import { EmailVerificationComponent } from './components/email-verification/email-verification.component';
import { UserDialogWindowComponent } from './components/user-dialog-window/user-dialog-window.component';
import { ReactiveFormsModule } from '@angular/forms';
import { InputTextModule, KeyFilterModule } from 'primeng/primeng';
import { DynamicDialogModule } from 'primeng/components/dynamicdialog/dynamicdialog';
import { ImageCropperModule } from 'ngx-image-cropper';
import { PasswordModule } from 'primeng/password';
import { UserPrCardComponent } from './components/user-pr-card/user-pr-card.component';
import { CardModule } from 'primeng/card';
import { UserProjListComponent } from './components/user-proj-list/user-proj-list.component'; 

@NgModule({
    declarations: [
        UserRootComponent, 
        UserDetailsComponent, 
        UserSettingsComponent, 
        EmailVerificationComponent,
        UserDialogWindowComponent,
        UserPrCardComponent,
        UserProjListComponent
    ],
    imports: [
        CommonModule,
        UserRoutingModule,
        DialogModule,
        SlideMenuModule,
        ButtonModule,
        ProgressSpinnerModule,
        ButtonModule,
        ReactiveFormsModule,
        InputTextModule,
        KeyFilterModule,
        DynamicDialogModule,
        ImageCropperModule,
        PasswordModule,
        CardModule
    ],
    entryComponents: [
        UserDialogWindowComponent
      ],
})
export class UserModule { }
