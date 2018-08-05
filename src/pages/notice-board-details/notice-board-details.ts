import { Camera, CameraOptions, PictureSourceType } from '../../../node_modules/@ionic-native/camera';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

import { AlertProvider } from '../../providers/alert/alert';
import { AuthProvider } from '../../providers/auth/auth';
import { Component } from '@angular/core';
import { HomePage } from '../home/home';
import { LoadingProvider } from '../../providers/loading/loading';
import { NoticeBoard } from '../../models/notice-board';
import { UtilProvider } from '../../providers/util/util';
import firebase from 'firebase';

const options: CameraOptions = {
  quality: 100,
  destinationType: 0,
  mediaType: 0,
  targetHeight: 210,
  targetWidth: 210,
  allowEdit: true,
}

@IonicPage()
@Component({
  selector: 'page-notice-board-details',
  templateUrl: 'notice-board-details.html',
})
export class NoticeBoardDetailsPage {
  userIds: string[];
  dbRef = firebase.database().ref();
  boardName = '';
  description = '';
  url = '';

  constructor(public navCtrl: NavController,
    public navParams: NavParams, private auth: AuthProvider,
    private loadingProvider: LoadingProvider, private camera: Camera,
    private alertProvider: AlertProvider,
    private util: UtilProvider) {
    this.userIds = this.navParams.data;
  }

  createNoticeBoard() {
    const currentUser = this.auth.getActiveUser();
    this.userIds.push(currentUser.uid);
    const loader = this.loadingProvider.showLoading('creating group');
    const board = {
      createdBy: currentUser.uid,
      createdDate: Date.now() + '',
      boardName: this.boardName,
      users: [...this.userIds],
      description: this.description,
      admins: [currentUser.uid],
      imageUrl: this.url
    } as NoticeBoard;

    // Saving board to firebase
    this.dbRef.child('boards')
      .push(board)
      .then((res) => {
        this.loadingProvider.dismiss(loader);
        this.onSuccessfullGroupCreation(res);
      });
  }

  getUploadOptions() {
    this.util.createImageUploadActionSheet(this.getImage.bind(this))
      .present();
  }

  onSuccessfullGroupCreation(res) {
    this.url = '';
    const loader = this.loadingProvider
      .showLoading('adding group members');
    const promises = [];
    for (const id of this.userIds) {
      promises.push(this.dbRef.child('users').child(id).child('boards')
        .child(res.key).set({
          boardName: this.boardName
        }));
    }
    Promise.all(promises).then(() => {
      this.loadingProvider.dismiss(loader);
      this.navCtrl.setRoot(HomePage);
    });
  }

  async getImage(sourceType: PictureSourceType) {
    options.sourceType = sourceType;

    /**
     * TODO: get pic usinf FILE_URI.
     */
    try {
      var loader = this.loadingProvider.showLoading()
      const user = this.auth.getActiveUser();
      let picData = await this.camera.getPicture(options);

      picData = 'data:image/jpeg;base64,' + picData;
      const ref = firebase.storage().ref().child('boardsImages');

      ref.putString(picData, firebase.storage.StringFormat.DATA_URL);

      this.url = await ref.getDownloadURL();

      this.loadingProvider.dismiss(loader);
    } catch (error) {
      this.loadingProvider.dismiss(loader);
      this.alertProvider
        .showAlert('profile pic upload failed.', 'profile pic update failed');
    }
  }

}
