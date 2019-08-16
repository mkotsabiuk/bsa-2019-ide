import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ProjectService } from 'src/app/services/project.service/project.service';
import { ProjectCreateDTO } from '../../../../models/DTO/Project/projectCreateDTO';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

@Component({
    selector: 'app-create-project',
    templateUrl: './create-project.component.html',
    styleUrls: ['./create-project.component.sass']
})
export class CreateProjectComponent implements OnInit, OnDestroy {

    public languages: any;
    public projectTypes: any;
    public compilerTypes: any;
    public access: any;
    public colors;
    private project: ProjectCreateDTO;

    constructor(
        private fb: FormBuilder,
        private projectService: ProjectService,
        private toastrService: ToastrService,
        private router: Router) { }

    public projectForm = this.fb.group({
        name: ['', Validators.required],
        description: ['', Validators.required],
        access: ['', Validators.required],
        language: ['', Validators.required],
        projectType: ['', Validators.required],
        compilerType: ['', Validators.required],
        countOfSavedBuilds: ['', [Validators.required, Validators.max(10)]],
        countOfBuildAttempts: ['', [Validators.required, Validators.max(10)]],
        color: ['', Validators.required]
    });

    onSubmit() {

        this.project = {
            name: this.projectForm.get('name').value,
            description: this.projectForm.get('description').value,
            language: this.projectForm.get('language').value,
            projectType: this.projectForm.get('projectType').value,
            compilerType: this.projectForm.get('compilerType').value,
            countOfSaveBuilds: this.projectForm.get('countOfSavedBuilds').value,
            countOfBuildAttempts: this.projectForm.get('countOfBuildAttempts').value,
            color: this.projectForm.get('color').value,
            access: this.projectForm.get('access').value
        };

        this.projectService.addProject(this.project)
            .subscribe(res => {
                this.toastrService.success("Project created");
                let projectId = res.body;
                this.router.navigate([`/project/${projectId}`]);
            },
                error => {
                    this.toastrService.error('error');
                })
    }

    public changeLanguage(e:number) {

        switch(e){
            case 0:{
                this.compilerTypes = [
                    { label: 'CoreCLR', value: 0 },
                    { label: 'Roslyn', value: 1 }
                ];
                this.projectTypes = [
                    { label: 'Console App', value: 0 },
                    { label: 'Web App', value: 1 },
                    { label: 'Library', value: 2 }
                ];
                break;
            }
            case 1:{
                this.compilerTypes = [
                    { label: 'V8', value: 2 }
                ];
                this.projectTypes = [
                    { label: 'Console App', value: 0 },
                ];
                break;
            }
            case 2:{
                this.compilerTypes = [
                    { label: 'V8', value: 2 }
                ];
                this.projectTypes = [
                    { label: 'Console App', value: 0 },
                ];
                break;
            }
            case 3:{
                this.compilerTypes = [
                    { label: 'Gc', value: 3 }
                ];
                this.projectTypes = [
                    { label: 'Console App', value: 0 },
                ];
                break;
            }
      }
    }
    ngOnInit(): void {
        this.colors = [
            { label: 'Red', value: '#ff0000' },
            { label: 'Black', value: '#000000' },
            { label: 'Blue', value: '#0080ff' },
            { label: 'Blueviolet', value: '#bf00ff'},
            { label: 'Dark Magenta', value: '#8b008b' },
            { label: 'Dark Orange', value: '#ff8c00' },
            { label: 'Gold', value: '#ffd700' },
            { label: 'Green', value: '#008000' },
            { label: 'Light Slate Grey', value: '#778899' },
            { label: 'Aqua', value: '#00ffff' }
        ]

        this.languages = [
            { label: 'C#', value: 0 },
            { label: 'TypeScript', value: 1 },
            { label: 'JavaScript', value: 2 },
            { label: 'Go', value: 3}
        ];

        this.access = [
            { label: 'Public', value: 0 },
            { label: 'Private', value: 1 }
        ];
        this.projectForm.get('access').setValue(0);
    }

    ngOnDestroy(): void {
        this.projectForm = null;
    }

    public getErrorMessage(field: string): string {
      const control = this.projectForm.get(field);
      const isMaxError: boolean = !!control.errors && !!control.errors.max;
      return control.hasError('required')
        ? 'Value is required!'
        : (isMaxError)
          ? `Quantity must be less than ${control.errors.max.max}!`
          : 'validation error';
    }
}
