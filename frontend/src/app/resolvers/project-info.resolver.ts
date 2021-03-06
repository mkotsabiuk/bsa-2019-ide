import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, Router } from '@angular/router';
import { ProjectInfoDTO} from '../models/DTO/Project/projectInfoDTO';
import { of, Observable, Subject } from 'rxjs';
import { ProjectService } from '../services/project.service/project.service';
import { ToastrService } from 'ngx-toastr';
import { map, catchError, takeUntil } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ProjectInfoResolver  {

    private unsubscribe$ = new Subject<void>();
    
    constructor(
        private service: ProjectService,
        private toastrService: ToastrService,
        private router:Router){
    }
  
     resolve(route: ActivatedRouteSnapshot): Observable<ProjectInfoDTO> {
         return this.service.getProjectById(+route.params['id']).pipe(
             map(resp=>{
                 if(resp.body.id!=null)
                     return resp.body;
             }),takeUntil(this.unsubscribe$),
             catchError((error) => {
                 this.toastrService.error('can`t retrieve data from the server');
                 this.router.navigate(['/dashboard']);
                 return of(null); 
             })
         )
     }
}