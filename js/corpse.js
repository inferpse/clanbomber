import AssetLoader from './assetloader';

export default class Corpse {
  constructor(params) {
    Object.assign(this, params);
    this.bombersOnMe = new Set();
  }
  steppedOnMe() {
    var soundFile = Math.random() > 0.5 ? 'wavs/splash1a.wav' : 'wavs/splash2a.wav';
    AssetLoader.playSound(soundFile);
  }
  stepOn(bomber) {
    if (!this.bombersOnMe.has(bomber)) {
      if (!this.someoneOnMe) {
        this.someoneOnMe = true;
        this.steppedOnMe();
      }
      this.bombersOnMe.add(bomber);
    }
  }
  stepOut(bomber) {
    if (this.bombersOnMe.has(bomber)) {
      this.bombersOnMe.delete(bomber);
      if (!this.bombersOnMe.size) {
        this.someoneOnMe = false;
      }
    }
  }
  destroy() {
    if (!this.destroyed) {
      this.destroyed = true;
      AssetLoader.playSound('wavs/corpse_explode.wav');
    }
  }
}
