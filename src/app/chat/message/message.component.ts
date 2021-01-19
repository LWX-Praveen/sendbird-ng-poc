import { Component, OnInit, Input } from '@angular/core';
import * as moment from 'moment';

@Component({
  selector: 'app-message',
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.scss']
})
export class MessageComponent implements OnInit {
  @Input() message: any;
  @Input() userInfo: any;

  constructor() { }

  ngOnInit(): void {

  }

  getMessageTime(msgTime: any) {
    return moment(msgTime).format('hh:mm a');
  }

}
