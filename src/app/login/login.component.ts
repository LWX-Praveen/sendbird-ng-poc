import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ChatService } from '../services/chat.service';
import { Router } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit, OnDestroy {

  private ngUnsubscribe: Subject<any> = new Subject();
  loginForm: FormGroup;
  loading = false;
  submitted = false;
  constructor(private formBuilder: FormBuilder, private chatService: ChatService, private router: Router) { }

  ngOnInit() {
    this.loginForm = this.formBuilder.group({
      username: ['', Validators.required]
    });
  }

  get f() { return this.loginForm.controls; }

  connect() {
    this.submitted = true;
    if (this.loginForm.invalid) {
      return;
    }
    this.loading = true;
    const userId = this.loginForm.controls.username.value;
    // const token = this.loginForm.controls.password.value;
    const accessInfo = { userId };
    this.chatService.connect(userId.toUpperCase())
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((data: any) => {
        if (data) {
          localStorage.setItem('loggedInUser', JSON.stringify(accessInfo));
          this.chatService.getChannelList();
          this.chatService.setLoggedInUser(data);
          this.router.navigate(['chat-app']);
          // this.chatService.getUsers()
          //   .pipe(takeUntil(this.ngUnsubscribe))
          //   .subscribe((userdata: any) => {
          //     const users = userdata[userId];
          //     console.log('login users', users);
          //     this.chatService.setConnectedUsers(users);
          //     this.chatService.setLoggedInUser(data);
          //     this.loading = false;
          //     this.router.navigate(['chat-app']);
          //   }, (error) => {
          //     console.log('login error', error);
          //   });
        }
      },
      (error) => {
        this.loading = false;
        console.log('error', error);
      });
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
