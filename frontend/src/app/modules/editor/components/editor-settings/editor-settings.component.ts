import { Component, OnInit, Input } from '@angular/core';
import { SelectItem } from 'primeng/api';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { UserDetailsDTO } from 'src/app/models/DTO/User/userDetailsDTO';
import { EditorSettingDTO } from 'src/app/models/DTO/Common/editorSettingDTO';
import { UserService } from 'src/app/services/user.service/user.service';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-editor-settings',
    templateUrl: './editor-settings.component.html',
    styleUrls: ['./editor-settings.component.sass']
})
export class EditorSettingsComponent implements OnInit {

    @Input() user: UserDetailsDTO;
    public editorOptions: EditorSettingDTO =
        {
            lineNumbers: "on",
            roundedSelection: false,
            scrollBeyondLastLine: false,
            readOnly: false,
            fontSize: 20,
            tabSize: 5,
            cursorStyle: "line",
            lineHeight: 20,
            theme: "vs",
        };
    public startEditorOptions: EditorSettingDTO;
    public editorSettingsForm: FormGroup;
    public themes: SelectItem[];
    public scrolls: SelectItem[];
    public cursorStyles: SelectItem[];
    public lineNumbers: SelectItem[];
    public settingsUpdate: EditorSettingDTO;
    public settings: EditorSettingDTO;
    public hasDetailsSaveResponse = true;

    constructor(
        private formBuilder: FormBuilder,
        private userService: UserService,
        private toastService: ToastrService
    ) { }

    ngOnInit() {
        this.editorSettingsForm = this.formBuilder.group({
            theme: ['', Validators.required],
            lineHeight: ['', Validators.required],
            cursorStyle: ['', Validators.required],
            tabSize: ['', Validators.required],
            fontSize: ['', Validators.required],
            lineNumbers: ['', Validators.required],
            roundedSelection: ['', Validators.required],
            scrollBeyondLastLine: ['', Validators.required]
        });
        this.themes = [
            { label: 'hc-black', value: 'hc-black' },
            { label: 'vs', value: 'vs' },
            { label: 'vs-dark', value: 'vs-dark' },
        ];
        this.scrolls = [
            { label: 'true', value: true },
            { label: 'false', value: false }
        ];
        this.cursorStyles = [
            { label: 'block', value: 'block' },
            { label: 'line', value: 'line' }
        ];
        this.lineNumbers = [
            { label: 'on', value: 'on' },
            { label: 'off', value: 'off' },
            { label: 'interval', value: 'interval' },
            { label: 'relative', value: 'relative' }
        ];
        this.InitializeEditorSettings(this.user);
    }

    public onSubmit() {
        console.log("bebebe");
        this.hasDetailsSaveResponse = false;
        if (!this.IsSettingsNotChange()) {
            this.getValuesForEditorSettingsUpdate();
            this.userService.updateUser(this.user)
                .subscribe(
                    (resp) => {
                        this.hasDetailsSaveResponse = true;
                        this.toastService.success('New details have successfully saved!');
                        this.startEditorOptions=this.settingsUpdate;
                    },
                    (error) => {
                        this.hasDetailsSaveResponse = true;
                        this.toastService.error('Can\'t save new project details', 'Error Message');
                    }
                );
        }
    }

    public InitializeEditorSettings(userSettings: UserDetailsDTO): void {
        this.settings = JSON.parse(userSettings.editorSettings);
        if (!this.settings) {
            this.user.editorSettings = JSON.stringify(this.editorOptions);
            this.settings = this.editorOptions;
            this.userService.updateUser(this.user).subscribe();
        }
        this.editorSettingsForm.setValue({
            theme: this.settings.theme,
            cursorStyle: this.settings.cursorStyle,
            fontSize: this.settings.fontSize,
            lineHeight: this.settings.lineHeight,
            lineNumbers: this.settings.lineNumbers,
            roundedSelection: this.settings.roundedSelection,
            scrollBeyondLastLine: this.settings.scrollBeyondLastLine,
            tabSize: this.settings.tabSize
        });
        this.startEditorOptions = this.settings;
    }

    public IsSettingsNotChange(): boolean {
        return this.editorSettingsForm.get('theme').value === this.startEditorOptions.theme
            && this.editorSettingsForm.get('cursorStyle').value === this.startEditorOptions.cursorStyle
            && this.editorSettingsForm.get('fontSize').value === this.startEditorOptions.fontSize
            && this.editorSettingsForm.get('lineHeight').value === this.startEditorOptions.lineHeight
            && this.editorSettingsForm.get('lineNumbers').value === this.startEditorOptions.lineNumbers
            && this.editorSettingsForm.get('roundedSelection').value === this.startEditorOptions.roundedSelection
            && this.editorSettingsForm.get('scrollBeyondLastLine').value === this.startEditorOptions.scrollBeyondLastLine
            && this.editorSettingsForm.get('tabSize').value === this.startEditorOptions.tabSize
    }

    private getValuesForEditorSettingsUpdate() {
        this.settingsUpdate = {
            readOnly: false,
            theme: this.editorSettingsForm.get('theme').value,
            fontSize: this.editorSettingsForm.get('fontSize').value,
            lineHeight: this.editorSettingsForm.get('lineHeight').value,
            lineNumbers: this.editorSettingsForm.get('lineNumbers').value,
            roundedSelection: this.editorSettingsForm.get('roundedSelection').value,
            scrollBeyondLastLine: this.editorSettingsForm.get('scrollBeyondLastLine').value,
            tabSize: this.editorSettingsForm.get('tabSize').value,
            cursorStyle: this.editorSettingsForm.get('cursorStyle').value
        }
        this.user.editorSettings = JSON.stringify(this.settingsUpdate);
    }
}
