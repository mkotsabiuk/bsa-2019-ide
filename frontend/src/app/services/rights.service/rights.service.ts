import { Injectable } from '@angular/core';
import { HttpClientWrapperService } from '../http-client-wrapper.service';
import { Observable } from 'rxjs';
import { HttpResponse } from '@angular/common/http';
import { UpdateUserRightDTO } from 'src/app/models/DTO/User/updateUserRightDTO';

@Injectable({
  providedIn: 'root'
})
export class RightsService {

    private address = 'rights';

  constructor(private httpClient: HttpClientWrapperService) { }

  public setUsersRigths(update: UpdateUserRightDTO): Observable<HttpResponse<[]>>
    {
        return this.httpClient.putRequest(this.address,update);
    }
}
