import EventEmitter from './eventemitter';

export default class MeatPart extends EventEmitter {
  constructor(options) {
    super();
    this.flyTime = 0.85;
    this.dtStep = 0;
    this.curTime = 0;
    Object.assign(this, options);
  }
  update(dt) {
    this.dtStep = dt;
    this.curTime += dt;
    if (!this.expired && this.curTime >= this.expires) {
      this.expired = true;
      this.emit('expired', this);
    }
  }
}
