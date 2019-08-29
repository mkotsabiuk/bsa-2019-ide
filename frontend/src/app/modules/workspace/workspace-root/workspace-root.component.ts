import { LeavePageDialogService } from './../../../services/leave-page-dialog.service';
import { FileUpdateDTO } from './../../../models/DTO/File/fileUpdateDTO';
import { WorkspaceService } from './../../../services/workspace.service';

import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { ResizeEvent } from 'angular-resizable-element';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { EditorSectionComponent } from '../editor-section/editor-section.component';
import { Observable, of, Subscription, Subject } from 'rxjs';
import { switchMap } from 'rxjs/internal/operators/switchMap';
import { map } from 'rxjs/internal/operators/map';

import { HttpResponse } from '@angular/common/http';
import { FileService } from 'src/app/services/file.service/file.service';
import { MenuItem } from 'primeng/api';
import { catchError } from 'rxjs/internal/operators/catchError';
import { ProjectService } from 'src/app/services/project.service/project.service';
import { ProjectInfoDTO } from 'src/app/models/DTO/Project/projectInfoDTO';
import { TokenService } from 'src/app/services/token.service/token.service';
import { ProjectDialogService } from 'src/app/services/proj-dialog.service/project-dialog.service';
import { ProjectType } from '../../project/models/project-type';
import { RightsService } from 'src/app/services/rights.service/rights.service';
import { UserAccess } from 'src/app/models/Enums/userAccess';
import { ProjectUpdateDTO } from 'src/app/models/DTO/Project/projectUpdateDTO';
import { FileBrowserSectionComponent, SelectedFile } from '../file-browser-section/file-browser-section.component';
import { FileDTO } from 'src/app/models/DTO/File/fileDTO';
import { HotkeyService } from 'src/app/services/hotkey.service/hotkey.service';
import { FileRenameDTO } from '../../../models/DTO/File/fileRenameDTO';
import { BuildService } from 'src/app/services/build.service';
import { Language } from 'src/app/models/Enums/language';
import { EditorSettingDTO } from 'src/app/models/DTO/Common/editorSettingDTO';

@Component({
    selector: 'app-workspace-root',
    templateUrl: './workspace-root.component.html',
    styleUrls: ['./workspace-root.component.sass']
})
export class WorkspaceRootComponent implements OnInit, OnDestroy {

    public projectId: number;
    public userId: number;
    public access: UserAccess;
    public showFileBrowser = true;
    public showSearchField = false;
    public large = false;
    public canRun = false;
    public canBuild = false;
    public canNotEdit = false;
    public expandFolder = false;
    public project: ProjectInfoDTO;
    public options: EditorSettingDTO;

    private routeSub: Subscription;
    private authorId: number;

    public eventsSubject: Subject<void> = new Subject<void>();

    @ViewChild(EditorSectionComponent, { static: false })
    private editor: EditorSectionComponent;

    @ViewChild('fileBrowser', { static: false })
    private fileBrowser: FileBrowserSectionComponent;

    constructor(
        private route: ActivatedRoute,
        private toast: ToastrService,
        private workSpaceService: WorkspaceService,
        private saveOnExit: LeavePageDialogService,
        private fileService: FileService,
        private rightService: RightsService,
        private projectService: ProjectService,
        private projectEditService: ProjectDialogService,
        private tokenService: TokenService,
        private hotkeys: HotkeyService,
        private buildService: BuildService) {
        this.hotkeys.addShortcut({ keys: 'shift.h' })
            .subscribe(() => {
                this.hideFileBrowser();
            });
    }

    ngOnInit() {
        this.userId = this.tokenService.getUserId();
        this.routeSub = this.route.params.subscribe(params => {
            this.projectId = params['id'];
        });
        this.projectService.getAuthorId(this.projectId)
            .subscribe(
                (resp) => {
                    this.authorId = resp.body;

                    if (this.userId != this.authorId) {
                        this.rightService.getUserRightById(this.userId, this.projectId)
                            .subscribe(
                                (resp) => {
                                    this.access = resp.body;
                                    this.setUserAccess();
                                    this.getProjectById();
                                }
                            )
                    }
                    else {
                        this.getProjectById();
                    }
                });
    }

    public getProjectById() {
        this.projectService.getProjectById(this.projectId)
            .subscribe(
                (resp) => {
                    this.project = resp.body;
                    this.options = this.project.editorProjectSettings;
                    if (this.canNotEdit) {
                        this.options.readOnly = true;
                    }
                },
                (error) => {
                    this.toast.error("Can't load selected project.", 'Error Message');
                }
            );
    }

    public getProjectColor(): string {
        return this.project.color;
    }

    public Settings() {
        const a = this.workSpaceService.show(this.project);
        a.subscribe(
            (resp) => {
                if(resp) {
                    this.options = resp as EditorSettingDTO;
                }
            }
        );  
    }

    public setUserAccess() {
        switch (this.access) {
            case 0:
                this.canNotEdit = true;
                break;
            case 2:
                this.canNotEdit = false;
                this.canBuild = true;
                break;
            case 3:
                this.canNotEdit = false;
                this.canBuild = true;
                this.canRun = true;
                break;
            default:
                break
        }
    }

    public isAuthor(): boolean {
        if (this.authorId == this.tokenService.getUserId()) {
            return true;
        }
        return false;
    }

    public onFileRenaming(fileUpdate: FileRenameDTO) {
        const tab = this.editor.tabs.find(x => x.id === fileUpdate.id);
        if (tab !== undefined) {
            tab.label = fileUpdate.name;
        }
    }

    public onFileSelected(selectedFile: SelectedFile): void {
        if (this.editor && this.editor.openedFiles.some(f => f.innerFile.id === selectedFile.fileId)) {
            this.editor.activeItem = this.editor.tabs.find(i => i.id === selectedFile.fileId);
            this.editor.code = this.editor.openedFiles.find(f => f.innerFile.id === selectedFile.fileId).innerFile.content;
            return;
        }

        this.workSpaceService.getFileById(selectedFile.fileId)
            .subscribe(
                (resp) => {
                    if (resp.ok) {
                        const { id, name, content, folder, updaterId } = resp.body as FileDTO;
                        const fileUpdateDTO: FileUpdateDTO = { id, name, content, folder };
                        this.editor.AddFileToOpened(fileUpdateDTO);
                        this.editor.tabs.push({ label: name, icon: selectedFile.fileIcon, id: id });
                        this.editor.activeItem = this.editor.tabs[this.editor.tabs.length - 1];
                        this.editor.code = content;
                    } else {
                        this.toast.error("Can't load selected file.", 'Error Message');
                    }
                },
                (error) => {
                    this.toast.error("Can't load selected file.", 'Error Message');
                    console.error(error.message);
                }
            );
    }

    public onBuild() {
        if (this.project.language !== Language.cSharp) {
            this.toast.info('Only C# project available for build', 'Info Message', { tapToDismiss: true });
            return;
        }

        this.buildService.buildProject(this.project.id).subscribe(
            (response) => {
                debugger;
                this.toast.info('Build was started', 'Info Message', { tapToDismiss: true });
            },
            (error) => {
                console.log(error);
                this.toast.error('Something bad happened(', 'Error Message', { tapToDismiss: true });
            }
        )
    }

    public onFilesSave(files?: FileUpdateDTO[]) {
        if (!this.editor.anyFileChanged()) {
            return;
        }
        this.saveFilesRequest(files)
            .subscribe(
                success => {
                    if (success.every(x => x.ok)) {
                        this.toast.success("Files saved", 'Success', { tapToDismiss: true });
                    } else {
                        this.toast.error("Can't save files", 'Error', { tapToDismiss: true });
                    }
                },
                error => { console.log(error); this.toast.error("Error: can't save files", 'Error', { tapToDismiss: true }) });
    }

    public hideSearchField() {
        this.showSearchField = !this.showSearchField;
    }

    public hideFileBrowser() {
        this.showFileBrowser = !this.showFileBrowser;
    }

    public editProjectSettings() {
        this.projectEditService.show(ProjectType.Update, this.projectId);
    }

    public expand() {
        this.eventsSubject.next()
    }

    private saveFilesRequest(files?: FileUpdateDTO[]): Observable<HttpResponse<FileUpdateDTO>[]> {
        if (!files) {
            files = this.editor.openedFiles.map(x => x.innerFile);
        }
        return this.workSpaceService.saveFilesRequest(files);
    }

    canDeactivate(): Observable<boolean> {
        return !this.editor.anyFileChanged() ? of(true) : this.saveOnExit.confirm('Save changes?')
            .pipe(
                switchMap(
                    mustSave => mustSave ? this.saveFilesRequest().pipe(map(result => result.every(x => x.ok) ? true : false)) : of(false)));
    }

    ngOnDestroy() {
        this.routeSub.unsubscribe();
    }
}
