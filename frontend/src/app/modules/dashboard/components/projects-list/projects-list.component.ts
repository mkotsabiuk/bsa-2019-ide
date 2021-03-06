import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ProjectDialogService } from 'src/app/services/proj-dialog.service/project-dialog.service';
import { ProjectType } from 'src/app/modules/project/models/project-type';
import { ProjectDescriptionDTO } from 'src/app/models/DTO/Project/projectDescriptionDTO';
import { EventService } from 'src/app/services/event.service/event.service';

@Component({
    selector: 'app-projects-list',
    templateUrl: './projects-list.component.html',
    styleUrls: ['./projects-list.component.sass']
})
export class ProjectsListComponent implements OnInit {
    @Input() projects: ProjectDescriptionDTO[];
    currentMenu: any;

    constructor(
        private projectDialogService: ProjectDialogService,
        private eventService: EventService
        ) { }

    ngOnInit() { }

    public createProject() {
        //this.projectDialogService.show(ProjectType.Create);
        this.eventService.createProjectModal.next(true);
    }

    hideAllMenus(menu: any) {
        if (this.currentMenu !== undefined) {
            this.currentMenu.hide();
        }
        this.currentMenu = menu;
    }
}
