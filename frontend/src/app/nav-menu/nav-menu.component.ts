import { Component, OnInit, OnDestroy, OnChanges } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { AuthDialogService } from '../services/auth-dialog.service/auth-dialog.service';
import { DialogType } from '../modules/authorization/models/auth-dialog-type';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ProjectService } from '../services/project.service/project.service';
import { TokenService } from '../services/token.service/token.service';
import { SearchProjectDTO } from '../models/DTO/Project/searchProjectDTO'
import { SignalRService } from '../services/signalr.service/signal-r.service';
import { HttpClientWrapperService } from '../services/http-client-wrapper.service';
import { NotificationDTO } from '../models/DTO/Common/notificationDTO';
import { element } from 'protractor';
import { NotificationService } from '../services/notification.service/notification.service';

@Component({
    selector: 'app-nav-menu',
    templateUrl: './nav-menu.component.html',
    styleUrls: ['./nav-menu.component.sass']
})
export class NavMenuComponent implements OnInit, OnDestroy {
    authUserItems: MenuItem[];
    unAuthUserItems: MenuItem[];

    public project: SearchProjectDTO;
    public filterProhects: SearchProjectDTO[]
    public dialogType = DialogType;
    public isAuthorized: boolean;
    public items: MenuItem[];
    public showNotification = false;
    public data: NotificationDTO[];
    public notReadNotification: NotificationDTO[]=[];
    private unsubscribe$ = new Subject<void>();

    constructor(
        private authDialogService: AuthDialogService,
        private router: Router,
        private tokenService: TokenService,
        private projectService: ProjectService,
        private signalRService: SignalRService,
        private http: HttpClientWrapperService,
        private notificationService: NotificationService
    ) { }

    ngOnInit() {
        this.getUser();
        const userId = this.tokenService.getUserId();
        this.signalRService.startConnection(this.isAuthorized,userId);
        this.loadNotifications(userId);
        this.authUserItems = [
            {
                label: 'Home',
                command: () => {
                    if (!this.router.url.startsWith('/dashboard')) {
                        this.router.navigate(['/dashboard'])
                    }
                }
            }
        ];
        this.unAuthUserItems = [
            {
                label: 'Home',
                command: (event: any) => {
                    this.openAuthDialog(this.dialogType.SignIn);
                }
            }
        ];

        this.tokenService.isAuthenticatedEvent$
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((auth) => (this.isAuthorized = auth));

        this.items = [
            {
                label: 'Log out', icon: 'pi pi-sign-out', command: () => {
                    this.LogOut();
                }
            }
        ];
        
        if (this.isAuthorized) {
            
            this.signalRService.addToGroup(userId);
        }
    }

    public loadNotifications(userId: number): void
    {
        this.notificationService.getUserNotifications(userId)
        .subscribe(
            (resp)=>{
                this.notReadNotification = resp.body;
            }
        );
        this.data = this.signalRService.addTransferChartDataListener();
    }

    public showNotificationPanel(): void {
        this.showNotification = !this.showNotification;
        const dataForDelete =this.data;
        if (!this.showNotification) {
            this.signalRService.crearData();     
            this.signalRService.deleteTransferChartDataListener();
            this.data=this.signalRService.addTransferChartDataListener();
            dataForDelete.forEach(element => {
                this.signalRService.markNotificationIsRead(element.id);
            });
            this.notReadNotification.forEach(element=>{
                this.signalRService.markNotificationIsRead(element.id);
            })
            this.notReadNotification=[];
        }
    }

    public filterProject(event): void {
        const query = event.query;
        this.projectService.getProjectsName().subscribe(projects => {
            this.filterProhects = this.filter(query, projects.body);
        });
    }

    public checkProject(project: SearchProjectDTO): void {
        this.project = null;
        this.router.navigate([`/project/${project.id}`]);
    }

    public filter(query, projects: SearchProjectDTO[]): SearchProjectDTO[] {
        const filtered: SearchProjectDTO[] = [];
        for (let i = 0; i < projects.length; i++) {
            const project = projects[i];
            if (project.name.toLowerCase().indexOf(query.toLowerCase()) !== -1) {
                filtered.push(project);
            }
        }
        if (filtered.length === 0) {
            const notFound: SearchProjectDTO = {
                id: 0,
                name: "We couldn’t find any project matching " + query
            }
            filtered.push(notFound);
        }
        return filtered;
    }

    public goToUserDetails() {
        this.router.navigate(['/user/details']);
    }

    public getMenuItems() {
        if (this.isAuthorized) {
            return this.authUserItems;
        } else {
            return this.unAuthUserItems;
        }
    }

    public ngOnDestroy() {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    public openAuthDialog(type: DialogType) {
        this.authDialogService.openAuthDialog(type);
    }

    public LogOut() {
        this.tokenService.logout();
        this.isAuthorized = undefined;
        this.signalRService.crearData();
    }

    private getUser() {
        if (!this.tokenService.areTokensExist()) {
            return;
        }

        this.tokenService
            .IsAuthorized()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((auth) => this.isAuthorized = auth);
    }
}
