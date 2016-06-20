import EventEmitter from './eventemitter';

export default class Bomb extends EventEmitter {
  constructor(options) {
    super();
    this.skin = options.skin;
    this.power = options.power;

    this.explodeTime = 2;
    this.fuseTime = 0;
  }
  explode() {
    this.emit('explode');
    this.destroy();
  }
  getPower() {
    return this.power;
  }
  update(dt) {
    if (this.destroyed) {
      return;
    }

    this.fuseTime += dt;
    if (this.fuseTime >= this.explodeTime) {
      this.explode(dt);
    }
  }
  destroy() {
    this.destroyed = true;
  }
}
