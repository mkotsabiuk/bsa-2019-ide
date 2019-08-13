import { Component, OnInit, Input } from '@angular/core';
import { ProjectDescriptionDTO } from '../../../../models/DTO/Project/projectDescriptionDTO';
import { ProjectService } from 'src/app/services/project.service/project.service';

@Component({
    selector: 'app-project-card',
    templateUrl: './project-card.component.html',
    styleUrls: ['./project-card.component.sass']
})
export class ProjectCardComponent implements OnInit {
    DATE = new Date();
    @Input() project: ProjectDescriptionDTO;

    constructor(private projectService: ProjectService) { }

    ngOnInit() { }

    getPhotoLink() {
        return this.project.photoLink ? this.project.photoLink :
            'https://as1.ftcdn.net/jpg/02/06/48/10/500_F_206481019_8BsIcISajJZxJEUBaTlhDwXaedpOEBHD.jpg';
    }

    lastTimeBuild(): string {
        const daysCount = this.getDaysCountFromCurrentDate(this.project.lastBuild);
        if (daysCount > 365) {
            return Math.floor(daysCount / 365) + ' year ago';
        } else if (daysCount > 31) {
            return Math.floor(daysCount / 30) + ' month ago';
        } else {
            return daysCount > 1 ? daysCount + ' days ago' : daysCount === 1 ? 'yesterday' : 'today';
        }
    }

    getDaysCountFromCurrentDate(date: Date): number {
        const days = date.getUTCDate();
        const month = date.getUTCMonth();
        const year = date.getUTCFullYear();

        const currentDays = this.DATE.getUTCDate();
        const currentMonth = this.DATE.getUTCMonth();
        const currentYear = this.DATE.getUTCFullYear();

        return ((currentYear - 2019) * 365 + currentMonth * 30 + currentDays) - ((year - 2019) * 365 + month * 30 + days);
    }

    favourite(event: Event): void {
        event.stopPropagation();
        this.project.favourite = !this.project.favourite;

        this.projectService.changeFavourity(this.project.id)
            .subscribe();
    }
}
