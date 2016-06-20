import AssetLoader from './assetloader';
import MapTiles from './maptiles';
import Bomber from './bomber';
import Corpse from './corpse';
import Explosion from './explosion';
import MeatPart from './meatpart';

export default class GameField {
  constructor(options) {
    this.corpses = [];
    this.respawns = [];
    this.mapTiles = [];
    this.bombers = [];
    this.meatParts = [];
    this.areasInFire = new Set();
    this.bombs = [];
    this.explosions = [];
    this.tileSize = 40;
    this.bomberMoveSpeed = 200; // px/sec

    this.entities = {
      '*': 'WALL',
      '-': 'NONE',
      '+': 'BOX',
      ' ': 'GROUND',
      'o': 'TRAP',
      'S': 'ICE',
      'v': 'ARROW',
      '>': 'ARROW',
      '<': 'ARROW',
      '^': 'ARROW',
      'R': 'RANDOM'

      // OTHER TILE CODES: 0-7 (player respawns)
    };

    // parse map
    this.bombersConfig = options.bombers;
    this.parseMap(options.map);

    options.bombers.forEach( (bomberOptions, bomberIndex) => {
      var respawn = this.respawns[bomberIndex],
        bomberInstance;

      bomberOptions.gameField = this;
      bomberOptions.posX = respawn.col * this.tileSize;
      bomberOptions.posY = respawn.row * this.tileSize;
      bomberInstance = new Bomber(bomberOptions);
      this.bombers.push(bomberInstance);

      bomberInstance.on('putbomb', (bomb, row, col) => {
        this.addBomb(bomb, row, col);
      });
    });

    // map size
    this.rows = this.mapTiles.length;
    this.cols = this.mapTiles[0].length;
  }
  getAuthor() {
    return this.author;
  }
  getMaxPlayers() {
    return this.maxPlayers;
  }
  getMapData() {
    return this.mapTiles;
  }
  getMapTileAt(row, col) {
    return this.mapTiles[row] && this.mapTiles[row][col] || null;
  }
  createEntity(mapFileChar, rowIndex, colIndex) {
    var mapTileType = this.entities[mapFileChar];
    if (mapTileType) {
      // handle map tile type
      if (mapTileType === 'RANDOM') {
        return new MapTiles[Math.random() > 0.5 ? 'BOX' : 'GROUND'](mapFileChar);
      } else {
        return new MapTiles[mapTileType](mapFileChar);
      }
    } else {
      // save respawns
      this.respawns.push({
        playerIndex: parseInt(mapFileChar, 10),
        row: rowIndex,
        col: colIndex
      });

      // return GROUND tile where respawn is located
      return new MapTiles.GROUND();
    }
  }
  parseMap(mapFileContent) {
    var rowIndex = null,
        strings = mapFileContent.split(/\n/);

    strings.forEach(str => {
      var newRow;
      str = str.trim();
      if (!str) {
        return;
      } else if (!this.author) {
        this.author = str;
      } else if (!this.maxPlayers) {
        this.maxPlayers = parseInt(str, 10);
      } else {
        if (rowIndex === null) {
          rowIndex = 0;
        }
        newRow = [];
        str.split('').forEach((entity, colIndex) => {
          var newTile = this.createEntity(entity, rowIndex, colIndex),
              expRowIndex = rowIndex;

          // BOX tile can be destroyed by bomb
          if (newTile instanceof MapTiles.BOX) {
            newTile.on('destroy', () => {
              this.mapTiles[expRowIndex][colIndex] = new MapTiles.GROUND();
            });
          }

          newRow.push(newTile);
        });
        this.mapTiles.push(newRow);
        rowIndex++;
      }
    });
  }
  canMoveOverTile(bomber, tileRow, tileCol) {
    var mapTile = this.mapTiles[tileRow] ? this.mapTiles[tileRow][tileCol] : null,
      noBombInTile = true;
    if (mapTile) {
      this.bombs.forEach(function(item) {
        if (item.row === tileRow && item.col === tileCol) {
          noBombInTile = false;
        }
      });
      return noBombInTile && !(mapTile.type === 'WALL' || mapTile.type === 'BOX');
    } else {
      return true;
    }
  }
  processExplosion(centerRow, centerCol, explosion) {
    let wavePower = 1,
        maxPower = explosion.power,
        fireArea = [[centerRow, centerCol]],
        leftFound = false,
        rightFound = false,
        upFound = false,
        downFound = false,
        tmpTile;

    while (wavePower <= maxPower) {
      // explosion wave moves left
      if (!leftFound) {
        tmpTile = this.getMapTileAt(centerRow, centerCol - wavePower);
        if (tmpTile instanceof MapTiles.BOX) {
          tmpTile.destroy();
          leftFound = true;
        } else if (tmpTile && !(tmpTile instanceof MapTiles.WALL)) {
          fireArea.push([centerRow, centerCol - wavePower]);
        }
      }

      // explosion wave moves right
      if (!rightFound) {
        tmpTile = this.getMapTileAt(centerRow, centerCol + wavePower);
        if (tmpTile instanceof MapTiles.BOX) {
          tmpTile.destroy();
          rightFound = true;
        } else if (tmpTile && !(tmpTile instanceof MapTiles.WALL)) {
          fireArea.push([centerRow, centerCol + wavePower]);
        }
      }

      // explosion wave moves up
      if (!upFound) {
        tmpTile = this.getMapTileAt(centerRow - wavePower, centerCol);
        if (tmpTile instanceof MapTiles.BOX) {
          tmpTile.destroy();
          upFound = true;
        } else if (tmpTile && !(tmpTile instanceof MapTiles.WALL)) {
          fireArea.push([centerRow - wavePower, centerCol]);
        }
      }

      // explosion wave moves down
      if (!downFound) {
        tmpTile = this.getMapTileAt(centerRow + wavePower, centerCol);
        if (tmpTile instanceof MapTiles.BOX) {
          tmpTile.destroy();
          downFound = true;
        } else if (tmpTile && !(tmpTile instanceof MapTiles.WALL)) {
          fireArea.push([centerRow + wavePower, centerCol]);
        }
      }

      // increase wave power
      wavePower++;
    }

    // add area of fire to the battle field
    this.areasInFire.add(fireArea);
    explosion.on('ended', () => {
      this.areasInFire.delete(fireArea);
    });
  }
  canPlaceBomb(bomber, tileRow, tileCol) {
    var mapTile = this.getMapTileAt(tileRow, tileCol);
    return mapTile && !(mapTile instanceof MapTiles.NONE);
  }
  addBomb(bomb, tileRow, tileCol) {
    AssetLoader.playSound('wavs/putbomb.wav');
    this.bombs.push({
      bomb: bomb,
      row: tileRow,
      col: tileCol
    });

    // handle explode event
    bomb.on('explode', () => {
      // remove bomb from collection
      this.removeBomb(bomb);

      // create explosion
      var explosion = new Explosion({
        gameField: this,
        power: bomb.power,
        row: tileRow,
        col: tileCol
      });
      this.addExplosion(explosion, tileRow, tileCol);

      // destroy map tiles
      this.processExplosion(tileRow, tileCol, explosion);
    });
  }
  removeBomb(bomb) {
    var bombIndex = -1;
    this.bombs.forEach((curBombInfo, index) => {
      if (curBombInfo.bomb === bomb) {
        bombIndex = index;
      }
    });

    if (bombIndex > -1) {
      this.bombs.splice(bombIndex, 1);
    }
  }
  addCorpse(bomber, posX, posY) {
    var corpse = new Corpse({
      direction: bomber.direction,
      skin: bomber.skin,
      bomber: bomber,
      posX: posX,
      posY: posY
    });

    this.corpses.push(corpse);
  }
  addMeatParts(posX, posY) {
    const meatPartsCount = 30;

    // random number generator
    function getRandomInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // remove item from collection
    let meatPartExpired = (meatPart) => {
      var partIndex = this.meatParts.indexOf(meatPart);
      this.meatParts.splice(partIndex, 1);
    };

    // add some meat parts
    for (let i = 0, meatPart; i < meatPartsCount; i++) {
      meatPart = new MeatPart({
        startX: posX,
        startY: posY,
        endX: getRandomInt(0, this.cols - 1) * 40 + getRandomInt(0, 40) * (Math.random() > 0.5 ? 1 : -1), // TODO: remove hardcode
        endY: getRandomInt(0, this.rows - 1) * 40 + getRandomInt(0, 40) * (Math.random() > 0.5 ? 1 : -1),
        skin: getRandomInt(0, 3),
        expires: getRandomInt(2000, 5000) / 1000
      });
      meatPart.once('expired', meatPartExpired);
      this.meatParts.push(meatPart);
    }
  }
  addExplosion(explosion, tileRow, tileCol) {
    AssetLoader.playSound('wavs/explode.wav');
    this.explosions.push({
      explosion: explosion,
      row: tileRow,
      col: tileCol
    });
  }
  getBomberCoords(bomber) {
    return {
      row: Math.round(bomber.posY / this.tileSize),
      col: Math.round(bomber.posX / this.tileSize)
    };
  }
  getMoveCoords(bomber, direction, dt) {
    var origPosition = bomber.getCoords(),
      position = bomber.getCoords(),
      playerMoveDistance = this.bomberMoveSpeed * dt,
      edgeCellFound = false,
      newCoords = {posX: bomber.posX, posY: bomber.posY},
      changeX = 0,
      changeY = 0;

    // detect changes
    switch (direction) {
      case bomber.directions.RIGHT:
        changeX = 1;
        break;
      case bomber.directions.LEFT:
        changeX = -1;
        break;
      case bomber.directions.UP:
        changeY = -1;
        break;
      case bomber.directions.DOWN:
        changeY = 1;
        break;
    }

    // find edge cell
    while (this.mapTiles[position.row] && this.mapTiles[position.row][position.col]) {
      position.row += changeY;
      position.col += changeX;
      if (!this.canMoveOverTile(bomber, position.row, position.col)) {
        edgeCellFound = true;
        break;
      }
    }

    // calculate result
    switch (direction) {
      case bomber.directions.RIGHT:
        newCoords.posX = Math.min(bomber.posX + playerMoveDistance, edgeCellFound ? this.tileSize * (position.col - 1) : Infinity);
        break;
      case bomber.directions.LEFT:
        newCoords.posX = Math.max(bomber.posX - playerMoveDistance, edgeCellFound ? this.tileSize * (position.col + 1) : -Infinity);
        break;
      case bomber.directions.UP:
        newCoords.posY = Math.max(bomber.posY - playerMoveDistance, edgeCellFound ? this.tileSize * (position.row + 1) : -Infinity);
        break;
      case bomber.directions.DOWN:
        newCoords.posY = Math.min(bomber.posY + playerMoveDistance, edgeCellFound ? this.tileSize * (position.row - 1) : -Infinity);
        break;
    }

    // align bomber to row
    var idealPosX = position.col * this.tileSize,
      idealPosY = position.row * this.tileSize;

    if (direction === bomber.directions.RIGHT) {
      if (bomber.posY < idealPosY && bomber.posX > origPosition.col * this.tileSize && !this.canMoveOverTile(bomber, origPosition.row - 1, origPosition.col + 1)) {
        newCoords.posY = idealPosY;
      } else if (bomber.posY > idealPosY && bomber.posX > origPosition.col * this.tileSize && !this.canMoveOverTile(bomber, origPosition.row + 1, origPosition.col + 1)) {
        newCoords.posY = idealPosY;
      }
    }
    if (direction === bomber.directions.LEFT) {
      if (bomber.posY < idealPosY && bomber.posX < origPosition.col * this.tileSize && !this.canMoveOverTile(bomber, origPosition.row - 1, origPosition.col - 1)) {
        newCoords.posY = idealPosY;
      } else if (bomber.posY > idealPosY && bomber.posX < origPosition.col * this.tileSize && !this.canMoveOverTile(bomber, origPosition.row + 1, origPosition.col - 1)) {
        newCoords.posY = idealPosY;
      }
    }
    if (direction === bomber.directions.UP) {
      if (bomber.posX < idealPosX && bomber.posY < origPosition.row * this.tileSize && !this.canMoveOverTile(bomber, origPosition.row - 1, origPosition.col - 1)) {
        newCoords.posX = idealPosX;
      } else if (bomber.posX > idealPosX && bomber.posY < origPosition.row * this.tileSize && !this.canMoveOverTile(bomber, origPosition.row - 1, origPosition.col + 1)) {
        newCoords.posX = idealPosX;
      }
    }
    if (direction === bomber.directions.DOWN) {
      if (bomber.posX < idealPosX && bomber.posY > origPosition.row * this.tileSize && !this.canMoveOverTile(bomber, origPosition.row + 1, origPosition.col - 1)) {
        newCoords.posX = idealPosX;
      } else if (bomber.posX > idealPosX && bomber.posY > origPosition.row * this.tileSize && !this.canMoveOverTile(bomber, origPosition.row + 1, origPosition.col + 1)) {
        newCoords.posX = idealPosX;
      }
    }

    return newCoords;
  }
  update(dt) {
    // update maptiles
    this.mapTiles.forEach(cols => {
      cols.forEach(tile => {
        tile.update(dt);
      });
    });

    // update bombs state
    this.bombs.forEach(item => {
      item.bomb.update(dt);
    });

    // update explosions state
    this.explosions.forEach(item => {
      item.explosion.update(dt);
    });

    this.bombers.forEach(bomber => {
      var newCoords;

      // ignore dead bombers
      if (bomber.isDead()) {
        return;
      }

      // handle bomber input
      if (!bomber.isFalling()) {
        if (bomber.bomberInput.isRight()) {
          bomber.switchDirection(bomber.directions.RIGHT, dt);
          newCoords = this.getMoveCoords(bomber, bomber.directions.RIGHT, dt);
        } else if (bomber.bomberInput.isLeft()) {
          bomber.switchDirection(bomber.directions.LEFT, dt);
          newCoords = this.getMoveCoords(bomber, bomber.directions.LEFT, dt);
        } else if (bomber.bomberInput.isUp()) {
          bomber.switchDirection(bomber.directions.UP, dt);
          newCoords = this.getMoveCoords(bomber, bomber.directions.UP, dt);
        } else if (bomber.bomberInput.isDown()) {
          bomber.switchDirection(bomber.directions.DOWN, dt);
          newCoords = this.getMoveCoords(bomber, bomber.directions.DOWN, dt);
        }
      }

      // update coords
      bomber.prevX = bomber.posX;
      bomber.prevY = bomber.posY;
      if (newCoords) {
        bomber.posX = newCoords.posX;
        bomber.posY = newCoords.posY;
      }

      // calculate current bomber coords
      let bomberCoords = this.getBomberCoords(bomber);

      // check that bomber is not on fire
      for (let areas of this.areasInFire) {
        for (let coords of areas) {
          if (coords[0] === bomberCoords.row && coords[1] === bomberCoords.col) {
            bomber.die();
            areas.createdCorpse = true;
            this.addCorpse(bomber, bomber.posX, bomber.posY);
          }
        }
      }

      // handle put bomb
      if (bomber.bomberInput.isBomb() && this.canPlaceBomb(bomber, bomberCoords.row, bomberCoords.col) ) {
        bomber.putBomb();
      }

      // update other bomber states
      bomber.update(dt);
    });

    // process corpses
    this.corpses.forEach(corpse => {

      // if bomber stepped on corpse
      let corpseCoords = this.getBomberCoords(corpse);
      this.bombers.forEach(bomber => {
        if (bomber !== corpse.bomber && !corpse.destroyed) {
          let bomberCoords = this.getBomberCoords(bomber);
          if (bomberCoords.row === corpseCoords.row && bomberCoords.col === corpseCoords.col) {
            corpse.stepOn(bomber);
          } else {
            corpse.stepOut(bomber);
          }
        }
      });

      // check if corpse should be destroyed by explosion
      for (let areas of this.areasInFire) {
        for (let coords of areas) {
          if (!areas.createdCorpse && !corpse.destroyed && coords[0] === corpseCoords.row && coords[1] === corpseCoords.col) {
            corpse.destroy();
            this.addMeatParts(corpse.posX, corpse.posY);
          }
        }
      }
    });

    // process meatparts
    this.meatParts.forEach(meatPart => {
      meatPart.update(dt);
    });

  }
}
