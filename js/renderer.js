/*
 * All rendering operations here
 */
const mapTileWidth = 40,
      mapTileHeight = 40;

export default class Renderer {
  constructor(options) {
    this.options = options;

    this.assets = options.assets;
    this.ctx = options.ctx;
    this.battleActive = true;

    // map tile render functions
    this.renderMapTile = {
      NONE: function(tile, drawX, drawY) {
        // empty hole
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(drawX, drawY, mapTileWidth, mapTileHeight);
      },
      ARROW: function(tile, drawX, drawY) {
        var arrowSpriteOffset = 0;
        switch (tile.getDirection()) {
          case 'DOWN': arrowSpriteOffset = 1; break;
          case 'LEFT': arrowSpriteOffset = 2; break;
          case 'UP': arrowSpriteOffset = 3; break;
          case 'RIGHT': arrowSpriteOffset = 4; break;
        }
        this.renderMapTile.GROUND.apply(this, arguments);
        this.ctx.drawImage(this.mapTileADDONS, mapTileWidth * arrowSpriteOffset, 0, mapTileWidth, mapTileHeight, drawX, drawY, mapTileWidth, mapTileHeight);
      },
      TRAP: function(tile, drawX, drawY) {
        this.renderMapTile.GROUND.apply(this, arguments);
        this.ctx.drawImage(this.mapTileADDONS, mapTileWidth * 7, 0, mapTileWidth, mapTileHeight, drawX, drawY, mapTileWidth, mapTileHeight);
      },
      GROUND: function(tile, drawX, drawY) {
        this.ctx.drawImage(this.mapTileImage, this.mapTileSpriteOffset, 0, mapTileWidth, mapTileHeight, drawX, drawY, mapTileWidth, mapTileHeight);
      },
      BOX: function(tile, drawX, drawY) {
        this.ctx.drawImage(this.mapTileImage, this.mapTileSpriteOffset + mapTileWidth * 2 + (tile.isDestroying ? mapTileWidth : 0), 0, mapTileWidth, mapTileHeight, drawX, drawY, mapTileWidth, mapTileHeight);
      },
      ICE: function(tile, drawX, drawY) {
        this.renderMapTile.GROUND.apply(this, arguments);
        this.ctx.drawImage(this.mapTileADDONS, 0, 0, mapTileWidth, mapTileHeight, drawX, drawY, mapTileWidth, mapTileHeight);
      },
      WALL: function(tile, drawX, drawY) {
        this.ctx.drawImage(this.mapTileImage, this.mapTileSpriteOffset + mapTileWidth * 1, 0, mapTileWidth, mapTileHeight, drawX, drawY, mapTileWidth, mapTileHeight);
      }
    };
  }
  render(dt) {
    // clear canvas
    this.ctx.clearRect(0, 0, this.options.width, this.options.height);

    // fill with gray background
    this.ctx.fillStyle = '#eee';
    this.ctx.fillRect(0, 0, this.options.width, this.options.height);


    if (this.battleActive && this.battle) {
      this.fieldOffsetX = 60;
      this.fieldOffsetY = 30;

      this.mapTileThemeOffset = 2;
      this.mapTileSpriteCount = 4;

      this.mapTileSpriteOffset = this.mapTileThemeOffset * this.mapTileSpriteCount * mapTileWidth;
      this.mapTileImage = this.assets.images['pics/maptiles.png'];
      this.mapTileADDONS = this.assets.images['pics/maptile_addons.png'];

      this.renderField(dt);

      this.renderBomberPositions(dt);

      this.battle.getCorpses().forEach(corpse => {
        if (!corpse.destroyed) {
          this.renderCorpse(corpse);
        }
      });

      this.battle.getBombs().forEach(bomb => {
        this.renderBomb(bomb, dt);
      });

      this.battle.getBombers().forEach(bomber => {
        this.renderBomber(bomber, dt);
      });

      this.battle.getExplosions().forEach(explosion => {
        this.renderExplosion(explosion);
      });

      this.battle.getMeatParts().forEach(meatPart => {
        if (!meatPart.expired) {
          this.renderMeatPart(meatPart, dt);
        }
      });

      if (this.battle.battleEnded) {
        this.renderGameOver();
      }
    }
  }
  renderGameOver() {
    const gameOverText = 'Game over!';

    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 200, this.options.width, 100);
    this.ctx.fill();

    this.ctx.textBaseline = 'top';
    this.ctx.font = '100px serif';
    this.ctx.fillStyle = '#f00';
    this.ctx.fillText(gameOverText, (this.options.width - this.ctx.measureText(gameOverText).width) / 2, 200);
  }
  renderBomberPositions() {
    this.battle.getBombers().forEach(bomber => {
      if (bomber.isAlive() && !bomber.isFalling()) {
        var coords = bomber.getCoords();
        this.ctx.fillStyle = 'rgba(70, 198, 255, 0.35)';
        this.ctx.fillRect(this.fieldOffsetX + coords.col * mapTileWidth, this.fieldOffsetY + coords.row * mapTileHeight, mapTileWidth, mapTileHeight);
      }
    });
  }
  renderBomb(item) {
    const spriteGrowCount = 4,
          spriteChangePerSecond = 5;

    let spriteImage = this.assets.images['pics/bombs.png'],
      spriteOffsetX = 0, spriteOffsetY = 0,
      drawX = this.fieldOffsetX + item.col * mapTileWidth,
      drawY = this.fieldOffsetY + item.row * mapTileHeight,
      moveState;

    // detect bomb sprite offset
    switch (item.bomb.skin) {
      case 'snake': spriteOffsetX = 0; spriteOffsetY = 0; break;
      case 'tux': spriteOffsetX = spriteGrowCount * mapTileWidth; spriteOffsetY = 0; break;
      case 'bsd': spriteOffsetX = spriteGrowCount * mapTileWidth; spriteOffsetY = mapTileHeight; break;
      case 'dull-blue': spriteOffsetX = spriteGrowCount * mapTileWidth; spriteOffsetY = mapTileHeight * 2; break;
    }

    // bomb grows
    moveState = Math.round(item.bomb.fuseTime / (1 / spriteChangePerSecond)) % spriteGrowCount;

    // draw bomb from sprite
    this.ctx.drawImage(spriteImage, spriteOffsetX + mapTileWidth * moveState, spriteOffsetY, mapTileWidth, mapTileHeight, drawX, drawY, mapTileWidth, mapTileHeight);
  }
  renderExplosion(item) {
    var spriteImage = this.assets.images['pics/explosion2.png'];

    if (item.explosion.destroyed) {
      return;
    }

    item.explosion.explosionCells.forEach(expCell => {
      var spriteOffsetX = expCell.expTypeIndex * mapTileWidth,
        spriteOffsetY = item.explosion.curState * mapTileHeight,
        drawX = this.fieldOffsetX + expCell.col * mapTileWidth,
        drawY = this.fieldOffsetY + expCell.row * mapTileHeight;

      this.ctx.drawImage(spriteImage, spriteOffsetX, spriteOffsetY, mapTileWidth, mapTileHeight, drawX, drawY, mapTileWidth, mapTileHeight);
    });
  }
  renderMeatPart(meatPart, dt) {
    var spriteImage = this.assets.images['pics/corpse_parts.png'];

    var percent = Math.min(1, meatPart.curTime / meatPart.flyTime),
        prevPercent = Math.min(1, (meatPart.curTime - meatPart.dtStep) / meatPart.flyTime),
        spriteOffsetX = meatPart.skin * mapTileWidth,
        spriteOffsetY = 0,
        xDistance = Math.abs(meatPart.startX - meatPart.endX),
        yDistance = Math.abs(meatPart.startY - meatPart.endY),
        prevX = meatPart.startX + xDistance * prevPercent * (meatPart.startX < meatPart.endX ? 1 : -1),
        prevY = meatPart.startY + yDistance * prevPercent * (meatPart.startY < meatPart.endY ? 1 : -1),
        curX = meatPart.startX + xDistance * percent * (meatPart.startX < meatPart.endX ? 1 : -1),
        curY = meatPart.startY + yDistance * percent * (meatPart.startY < meatPart.endY ? 1 : -1),

        // apply lirp
        drawX = this.fieldOffsetX + (curX - prevX) * dt + prevX,
        drawY = this.fieldOffsetY + (curY - prevY) * dt + prevY,
        scale = 1 + (percent < 0.5 ? percent / 0.5 : (1 - percent) / 0.5) * 1.5;

    this.ctx.drawImage(spriteImage, spriteOffsetX, spriteOffsetY, mapTileWidth, mapTileHeight, drawX, drawY, mapTileWidth * scale, mapTileHeight * scale);
  }
  renderBomber(bomber, dt) {
    // detect bomber sprite
    var spriteMap = {
      'snake': 'pics/bomber_snake.png',
      'dull-blue': 'pics/bomber_dull_blue.png',
      'bsd': 'pics/bomber_bsd.png',
      'tux': 'pics/bomber_tux.png'
    };

    // detect sprite sizes
    var spriteImage = this.assets.images[spriteMap[bomber.skin]],
      spriteWidth = spriteImage.width / 10,
      spriteHeight = spriteImage.height / 4,
      size = 1, coords;

    // change bomber size if falling
    if (bomber.isFalling()) {
      coords = bomber.getCoords();
      size = Math.max(0, 1 - bomber.curFallTime / bomber.fallTime);
      bomber.posX = coords.col * mapTileWidth + (1 - size) * mapTileWidth / 2;
      bomber.posY = coords.row * mapTileHeight + (1 - size) * mapTileWidth / 2;
    }
    // Start drawing the foreground elements
    var drawX = this.fieldOffsetX + (bomber.posX - bomber.prevX) * dt + bomber.prevX,
      drawY = this.fieldOffsetY + (bomber.posY - bomber.prevY) * dt + bomber.prevY - spriteHeight % mapTileHeight;

    // draw bomber if alive
    if (bomber.isAlive()) {
      this.ctx.drawImage(spriteImage, bomber.moveState * spriteWidth, bomber.direction * spriteHeight, spriteWidth, spriteHeight, drawX, drawY, spriteWidth * size, spriteHeight * size);
    }
  }
  renderCorpse(corpse) {
    // detect bomber sprite
    var spriteMap = {
      'snake': 'pics/bomber_snake.png',
      'dull-blue': 'pics/bomber_dull_blue.png',
      'bsd': 'pics/bomber_bsd.png',
      'tux': 'pics/bomber_tux.png'
    };

    // detect sprite sizes
    var spriteImage = this.assets.images[spriteMap[corpse.skin]],
        spriteWidth = spriteImage.width / 10,
        spriteHeight = spriteImage.height / 4;

    // Start drawing the foreground elements
    var drawX = this.fieldOffsetX + corpse.posX,
        drawY = this.fieldOffsetY + corpse.posY - spriteHeight % mapTileHeight;

    this.ctx.drawImage(spriteImage, 9 * spriteWidth, corpse.direction * spriteHeight, spriteWidth, spriteHeight, drawX, drawY, spriteWidth, spriteHeight);
  }
  renderField(dt) {
    if (this.battle.gameField) {
      this.battle.gameField.getMapData().forEach((rowTiles, rowIndex) => {
        rowTiles.forEach((tile, colIndex) => {
          var drawX = this.fieldOffsetX + colIndex * mapTileWidth,
            drawY = this.fieldOffsetY + rowIndex * mapTileHeight,
            tileType = tile.type;

          this.renderMapTile[tileType].call(this, tile, drawX, drawY, dt);
        });
      });
    }
  }
}
