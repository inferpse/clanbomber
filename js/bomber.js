import EventEmitter from './eventemitter';
import AssetLoader from './assetloader';
import Bomb from './bomb';

export default class Bomber extends EventEmitter {
  constructor(options) {
    super();
    this.directions = {
      DOWN: 0,
      LEFT: 1,
      UP: 2,
      RIGHT: 3
    };

    this.ctx = options.ctx;
    this.skin = options.skin;
    this.spriteMoveCount = 9;
    this.spriteChangePerSecond = 15;
    this.gameField = options.gameField;

    this.bomberInput = new options.input();
    this.moveSpeed = 200; // px/sec
    this.tileSize = 40;
    this.direction = 1;
    this.moveState = 0;
    this.moveAccum = 0;
    this.fallTime = 0.7;
    this.posX = options.posX || 0;
    this.posY = options.posY || 0;
  }
  getCoords() {
    return {
      row: Math.round(this.posY / this.tileSize),
      col: Math.round(this.posX / this.tileSize)
    };
  }
  getCellUnderBomber() {
    var currentCoords = this.getCoords();
    if (this.gameField.mapTiles) {
      return this.gameField.mapTiles[currentCoords.row] ? this.gameField.mapTiles[currentCoords.row][currentCoords.col] : null;
    }
  }
  putBomb() {
    var bomberCoords;

    if (this.bombActive) {
      return;
    }

    bomberCoords = this.getCoords();
    this.bombActive = true;

    // create bomb
    var newBomb = new Bomb({
      skin: this.skin,
      power: 2
    });

    // handle explode event
    newBomb.on('explode', () => {
      this.bombActive = false;
    });

    this.emit('putbomb', newBomb, bomberCoords.row, bomberCoords.col);
  }
  switchDirection(newDirection, dt) {
    if (this.direction !== newDirection) {
      this.direction = newDirection;
      this.moveAccum = this.moveState = 0;
    } else {
      this.moveAccum += dt;
      this.moveState = Math.round(this.moveAccum / (1 / this.spriteChangePerSecond));

      if (this.moveState >= this.spriteMoveCount) {
        this.moveAccum = this.moveState = 0;
      }
    }
  }
  fallDown(dt) {
    this.falling = true;

    if (typeof this.curFallTime !== 'number') {
      AssetLoader.playSound('wavs/deepfall.wav');
      this.curFallTime = 0;
    }

    if (this.curFallTime >= this.fallTime) {
      this.falling = false;
      this.dead = true;
    } else {
      this.prevFallTime = this.curFallTime;
      this.curFallTime += dt;
    }
  }
  isFalling() {
    return this.falling;
  }
  isDead() {
    return this.dead;
  }
  isAlive() {
    return !this.dead;
  }
  die() {
    AssetLoader.playSound('wavs/die.wav');
    this.dead = true;
  }
  update(dt) {
    // update controller if needed (AI controller)
    if (this.bomberInput.update) {
      this.bomberInput.update(dt);
    }

    // update other stuff
    var cellUnderMe = this.isFalling() ? null : this.getCellUnderBomber();
    if (this.isFalling() || cellUnderMe && cellUnderMe.type === 'NONE') {
      this.fallDown(dt);
    }
  }
}
