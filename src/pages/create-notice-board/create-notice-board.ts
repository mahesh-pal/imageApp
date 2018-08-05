import { Component, ViewChild } from '@angular/core';
import { Contact, Contacts } from '@ionic-native/contacts';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

import { AuthProvider } from '../../providers/auth/auth';
import { DomSanitizer } from '@angular/platform-browser';
import { NgForm } from '@angular/forms';
import { NoticeBoardDetailsPage } from '../notice-board-details/notice-board-details';
import { User } from '../../models/user';
import firebase from 'firebase';

@IonicPage()
@Component({
  selector: 'page-create-notice-board',
  templateUrl: 'create-notice-board.html',
})
export class CreateNoticeBoardPage {
  selectedUsers: boolean[] = [];
  users: User[];
  uids: Array<string> = [];
  DETAIL_PAGE = NoticeBoardDetailsPage;
  //Selected contacts to be added to board.
  contactList: string[] = [];

  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    private contactService: Contacts,
    public sanitizer: DomSanitizer,
    private auth: AuthProvider) {
  }

  ionViewWillEnter() {
    this.contactService.find(['phoneNumbers'],
      { filter: '', multiple: true })
      .then(this.onContactRetrival.bind(this));
  }

  onContactRetrival(contacts) {
    for (const contact of contacts) {
      if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
        this.contactList.push(contact.phoneNumbers[0].value);
      }
    }

    firebase.database().ref().child('users').once('value',
      this.getSelectedUsers.bind(this));
  }

  // TODO: get users only for which contact is selected
  getSelectedUsers(snap) {
    const users = snap.val();
    const currentUserUid = this.auth.getActiveUser().uid;
    const selectedUids = Object.keys(users)
      .filter(uid => uid != currentUserUid &&
        this.contactList.indexOf(users[uid].phoneNumber) != -1);

    this.users = [];
    for (const uid of selectedUids) {
      const user = users[uid] as User;
      user.uid = uid;
      this.users.push(user);
    }
  }

  navigateToDetailPage() {
    this.uids = [];
    this.selectedUsers.forEach((isSelected, index) => {
      if (isSelected) {
        this.uids.push(this.users[index].uid);
      }
    });
    this.navCtrl.push(this.DETAIL_PAGE, this.uids);
  }
}
