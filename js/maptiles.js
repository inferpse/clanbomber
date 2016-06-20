/*
 * Available Map Tiles
 */
import EventEmitter from './eventemitter';

let MapTiles = {};

class MapTile extends EventEmitter {
  constructor() {
    super();
  }
  update() {
    // implement in subclass
  }
  destroy() {
    // implement in subclass
  }
}

MapTiles.WALL = class extends MapTile {
  constructor() {
    super();
    this.type = 'WALL';
  }
};

MapTiles.NONE = class extends MapTile {
  constructor() {
    super();
    this.type = 'NONE';
  }
};

MapTiles.BOX = class extends MapTile {
  constructor() {
    super();
    this.type = 'BOX';
    this.destroyTime = 0;
  }
  update(dt) {
    const destroyDuration = 0.4;
    if (this.isDestroying) {
      if (this.destroyTime < destroyDuration) {
        this.destroyTime += dt;
      } else if (!this.destroyed) {
        this.destroyed = true;
        this.emit('destroy');
      }
    }
  }
  destroy() {
    this.isDestroying = true;
  }
};

MapTiles.GROUND = class extends MapTile {
  constructor() {
    super();
    this.type = 'GROUND';
  }
};

MapTiles.TRAP = class extends MapTile {
  constructor() {
    super();
    this.type = 'TRAP';
  }
};

MapTiles.ICE = class extends MapTile {
  constructor() {
    super();
    this.type = 'ICE';
  }
};

MapTiles.ARROW = class extends MapTile {
  constructor(direction) {
    super();

    this.directions = {
      '^': 'UP',
      'v': 'DOWN',
      '<': 'LEFT',
      '>': 'RIGHT'
    };

    this.type = 'ARROW';
    this.currentDirection = this.directions[direction];

    this.getDirection = function() {
      return this.currentDirection;
    };
  }
};

export default MapTiles;
