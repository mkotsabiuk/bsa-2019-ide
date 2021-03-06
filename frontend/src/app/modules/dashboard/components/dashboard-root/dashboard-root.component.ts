import { Subject } from 'rxjs';
import { ProjectDialogService } from './../../../../services/proj-dialog.service/project-dialog.service';
import { ProjectCreationType, ProjectWindowComponent } from './../../../project/components/project-window/project-window.component';

import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { EventService } from 'src/app/services/event.service/event.service';
import { faSquare, faFolderPlus, faCheckSquare } from '@fortawesome/free-solid-svg-icons';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faStackOverflow, faGithub, faMedium } from '@fortawesome/free-brands-svg-icons';
import { ProjectType } from 'src/app/modules/project/models/project-type';
import { takeUntil } from 'rxjs/operators';



@Component({
	selector: 'app-dashboard-root',
	templateUrl: './dashboard-root.component.html',
	styleUrls: ['./dashboard-root.component.sass']
})
export class DashboardRootComponent implements OnInit, OnDestroy {

	ProjectCreationType = ProjectCreationType;
	public typeOfProjectCreation: ProjectCreationType
	@ViewChild(ProjectWindowComponent, { static: false })
	private createForm: ProjectWindowComponent;
	private unsubscription = new Subject();
	public isHiddenTileMenu;
	items: string[][];
	public isActive: number;
	display: boolean = false;

	constructor(private router: Router,
		private projectDialogService: ProjectDialogService,
		private eventService: EventService,
	) {

	}

	ngOnInit() {
		this.eventService.onCreateProjectModal$.pipe(takeUntil(this.unsubscription))
			.subscribe(x => {
				if (x) {
					this.showDialog();
				}
			})
		this.isHiddenTileMenu = false;
		this.items = [
			['My projects', '/dashboard'],
			['Assigned projects', '/dashboard/assignedProjects'],
			['Favourite projects', '/dashboard/favouriteProjects']
		];
		this.isActive = this.items.findIndex(x => x[1] === this.router.url);
		this.eventService.currProjectSwitch(null);
	}

	ngOnDestroy(): void {
		this.unsubscription.next();
		this.unsubscription.complete();
	}

	redirect(i: number) {
		this.isActive = i;
		this.router.navigate([this.items[i][1]]);
	}

	public createProject() {
		this.projectDialogService.show(ProjectType.Create);
	}

	showDialog() {
		this.display = true;
		this.isHiddenTileMenu = false;
	}

	onTileClick(evt: ProjectCreationType) {
		this.typeOfProjectCreation = evt;
		if (this.typeOfProjectCreation == ProjectCreationType.CreateFromArchive) {
			let a = document.querySelectorAll("input[type='file']");
			console.log(a);
			(a[0] as HTMLInputElement).click();

		} else {
			this.isHiddenTileMenu = true;
			this.createForm.isNextFromGithub = false;
			this.createForm.resetFormFields();
		}
	}

	onBackEvent() {
		this.isHiddenTileMenu = false;
	}

	public onfileArchiveSelected() {
		this.isHiddenTileMenu = true;
	}

}
