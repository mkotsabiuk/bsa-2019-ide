import { Injectable } from '@angular/core';
import { HttpClientWrapperService } from '../http-client-wrapper.service';
import { Observable } from 'rxjs';
import { HttpResponse } from '@angular/common/http';
import { WebSiteInfo } from 'src/app/models/DTO/Common/webSiteInfo';
import { LikedProjectDTO } from 'src/app/models/DTO/Project/likedProjectDTO';

@Injectable({
  providedIn: 'root'
})
export class InfoService {

    private address = 'info';

    constructor(private httpClient: HttpClientWrapperService) { }

    public getMostLikedProjects(): Observable<HttpResponse<LikedProjectDTO[]>> {
        return this.httpClient.getRequest(this.address);
    }

    public getWebSiteStats(): Observable<HttpResponse<WebSiteInfo>> {
        return this.httpClient.getRequest(this.address + '/stats');
    }

    public getFileStructureSize(projectStructureId: string, fileStructureId: string): Observable<HttpResponse<number>>{
        return this.httpClient.getRequest("projectstructure/size/"+projectStructureId+'/'+fileStructureId);
    }
}
