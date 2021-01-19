import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { ChatService } from 'src/app/services/chat.service';

@Injectable({ providedIn: 'root' })
export class DefaultGuard implements CanActivate {
    constructor(private router: Router, private chatService: ChatService) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        if (loggedInUser && loggedInUser !== null) {
            console.log('in guard');
            this.chatService.connect(loggedInUser.userId.toUpperCase())
                .pipe()
                .subscribe((data: any) => {
                    if (data) {
                        this.chatService.getChannelList();
                        this.chatService.setLoggedInUser(data);
                        this.router.navigate(['chat-app']);
                    // this.chatService.getUsers()
                    //     .pipe()
                    //     .subscribe((userdata: any) => {
                    //         const users = userdata[loggedInUser.userId];
                    //         this.chatService.setConnectedUsers(users);
                    //         this.chatService.setLoggedInUser(data);
                    //         this.router.navigate(['chat-app']);
                    //         return false;
                    //     }, (error) => {
                    //         console.log('login error', error);
                    //         return true;
                    //     });
                    // }
                    }
                },
                (error) => {
                    console.log('error', error);
                    return true;
                });
        } else {
            console.log('outside guard');
            return true;
        }
    }
}
