import { Injectable } from '@angular/core';
import * as SendBird from 'sendbird';
import { BehaviorSubject, Observable } from 'rxjs';
import { chatConfig } from '../core/configurations/chat-config';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })


export class ChatService {
  sb: any;
  grpChannel: any;
  channelId: any;

  private isConnect = new BehaviorSubject(false);
  connected = this.isConnect.asObservable();

  private user = new BehaviorSubject(null);
  loggedInUser = this.user.asObservable();

  private msg = new BehaviorSubject(null);
  getMsg = this.msg.asObservable();

  private users = new BehaviorSubject(null);
  connectedUsers = this.users.asObservable();

  constructor(private http: HttpClient) {
    this.sb = new SendBird({ appId: chatConfig.APP_ID });
  }

  connect(id): Observable<any> {
    return Observable.create(observer => {
      const connectCallback = (user, error) => {
          if (error) {
            console.log(error);
            observer.error(error);
          }
          observer.next(user);
          observer.complete();
      };
      this.sb.connect(id, (user, error) => connectCallback(user, error));
    });
  }

  setLoggedInUser(user) {
    this.user.next(user);
    this.isConnect.next(true);
  }
  startChat(channel) {
    if (this.grpChannel) {
      this.sb.removeChannelHandler(this.grpChannel.url);
    }
    this.grpChannel = channel;
    this.grpChannel.markAsRead();
    this.addChannelHandler(channel.url);
  }
  chatWithUser(loggedInUserId, userId) {
    console.log(this.channelId);
    this.sb.removeChannelHandler(this.channelId);
    this.checkExistingChannel(loggedInUserId, userId);
  }
  checkExistingChannel(loggedInUserId, userId) {
    const that = this;
    that.channelId = loggedInUserId + '-' + userId;
    const filteredQuery = that.sb.GroupChannel.createMyGroupChannelListQuery();
    filteredQuery.userIdsIncludeFilter = [loggedInUserId, userId];
    console.log('filteredQuery', filteredQuery);
    filteredQuery.next((groupChannels, error) => {
      if (error) {
        console.log('inside the error', error);
        that.createGroupChannel(that.channelId, userId);
      } else {
        console.log('inside the channel', groupChannels);
        if (groupChannels.length > 0) {
          that.grpChannel = groupChannels[0];
          that.addChannelHandler(that.channelId);
        } else {
          that.createGroupChannel(that.channelId, userId);
        }
      }
    });
  }

  getUsers() {
    return this.http.get('./assets/users.json');
  }

  getSelectedMember(members: any, loggedInUser) {
    if (members.length > 0) {
      const selected = members.filter(member => member.userId !== loggedInUser.userId);
      if (selected.length > 0) {
        return selected[0];
      }
    }
  }
  setConnectedUsers(users) {
    const that = this;
    const userIds = users.map(user => user.userId);
    const ApplicationUserListQuery = that.sb.createApplicationUserListQuery();
    ApplicationUserListQuery.userIdsFilter = userIds;
    ApplicationUserListQuery.next((res, error) => {
        if (error) {
            return;
        }
        console.log('users', res);
        this.users.next(res);
    });
  }

  getChannelList() {
    const that = this;
    const channelListQuery = that.sb.GroupChannel.createMyGroupChannelListQuery();
    channelListQuery.includeEmpty = true;
    channelListQuery.order = 'channel_name_alphabetical';
    channelListQuery.limit = 15;    // The value of pagination limit could be set up to 100.

    if (channelListQuery.hasNext) {
        channelListQuery.next((channelList, error) => {
            if (error) {
                return;
            }
            console.log('channelList', channelList);
            this.users.next(channelList);
        });
    }
  }

  createGroupChannel(channelId, userId) {
    const that = this;
    const params = new that.sb.GroupChannelParams();
    params.isPublic = false;
    params.isDistinct = true;
    params.addUserIds([userId]);
    params.channelUrl = this.channelId;
    that.sb.GroupChannel.createChannel(params, (groupChannel, err) => {
      if (err) {
        console.log('err', err);
        return;
      }
      that.grpChannel = groupChannel;
      that.addChannelHandler(this.channelId);
    });
  }

  addChannelHandler(chHandlerId) {
    const that = this;
    const ChannelHandler = new that.sb.ChannelHandler();
    ChannelHandler.onMessageReceived = (channel, message) => {
      if (this.grpChannel.channelUrl === channel.channelUrl) {
        console.log('message received', message);
        this.msg.next(message);
      }
    };

    ChannelHandler.onUserJoined = (channel, user) => {
      console.log('user joined', user);
    };

    ChannelHandler.onReadReceiptUpdated = (groupChannel) => {
      groupChannel.unreadMessageCount = 0;
    };

    that.sb.addChannelHandler(chHandlerId , ChannelHandler);
    that.getPreviousMessages();
  }

  getPreviousMessages() {
    const that = this;
    const prevMessageListQuery = that.grpChannel.createPreviousMessageListQuery();
    prevMessageListQuery.load((messages, error) => {
      if (error) {
        return;
      }
      this.msg.next(messages);
    });
  }

  sendMessage(msgs, user) {
    const that = this;
    const params = new that.sb.UserMessageParams();
    params.message = msgs;
    params.customType = 'CUSTOM_TYPE';
    params.data = 'DATA';
    params.mentionType = 'users';
    params.mentionedUserIds = [user.userId];
    params.metaArrayKeys = ['linkTo', 'itemType'];
    params.pushNotificationDeliveryOption = 'default';

    that.grpChannel.sendUserMessage(params, (message, error) => {
      if (error) {
        console.log('here', error);
        return;
      }
      this.msg.next(message);
      this.getChannelList();
    });
  }

  logout() {
    this.sb.removeChannelHandler(this.channelId);
    this.sb.disconnect();
    localStorage.removeItem('loggedInUser');
  }

}
