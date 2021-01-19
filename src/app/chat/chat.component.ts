import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { ChatService } from '../services/chat.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';
import * as moment from 'moment';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('scrollMe') private myScrollContainer: ElementRef;
  private ngUnsubscribe: Subject<any> = new Subject();
  users: any = [];
  messages: any = [];
  userInfo: any;
  userMsg: any;
  selectedUser = null;

  constructor(private chatService: ChatService, private router: Router) { }

  ngOnInit() {
    this.chatService.connected.pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((data: any) => {
        if (!data) {
          this.router.navigate(['login']);
        }
      });

    this.chatService.loggedInUser.pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((data: any) => {
        if (data) {
          this.userInfo = data;
        }
    });

    this.chatService.getMsg.pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((msg: any) => {
        if (msg) {
          if (msg && msg.length >= 0) {
            this.messages = msg;
          } else {
            this.messages.push(msg);
          }
        }
      });

    this.loadUsers();
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
        this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }

  loadUsers() {
    this.chatService.connectedUsers
    .pipe(takeUntil(this.ngUnsubscribe))
    .subscribe((data) => {
      this.users = data;
    });
  }

  chatWithUser(channel) {
    this.messages = [];
    console.log('userinfo', this.userInfo);
    this.selectedUser = this.chatService.getSelectedMember(channel.members, this.userInfo);
    console.log(this.selectedUser);
    this.chatService.startChat(channel);
  }

  sendMessage(msg) {
    this.userMsg = '';
    this.chatService.sendMessage(msg, this.selectedUser);
  }

  checkSenderAndReceiver(message) {
    return (this.chatService.grpChannel.url === message.channelUrl);
  }

  getMessageTime(msgTime: any) {
    return moment(msgTime).format('hh:mm a');
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  logout() {
    this.chatService.logout();
    this.router.navigate(['login']);
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
