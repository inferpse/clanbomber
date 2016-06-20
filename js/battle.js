import Controllers from './controller';
import GameField from './gamefield';
import MapsList from './maplist';

export default class Battle {
  constructor(options) {
    this.ctx = options.ctx;
    this.assets = options.assets;
    this.init();
  }
  init() {
    this.gameField = new GameField({
      map: MapsList[3].data,
      bombers: [
        {skin: 'snake', input: Controllers.KeyboardCursor},
        {skin: 'dull-blue', input: Controllers.KeyboardWSAD},
        {skin: 'tux', input: Controllers.AI},
        {skin: 'bsd', input: Controllers.AI},
        // {skin:'tux', input: Controllers.Gamepad1}
      ]
    });
  }
  getMeatParts() {
    return this.gameField.meatParts;
  }
  getCorpses() {
    return this.gameField.corpses;
  }
  getBombers() {
    return this.gameField.bombers;
  }
  getBombs() {
    return this.gameField.bombs;
  }
  getExplosions() {
    return this.gameField.explosions;
  }
  update(dt) {
    // update game field
    this.gameField.update(dt);

    // calculate alive bombers count
    let aliveBombers = this.gameField.bombers.reduce((count, bomber) => {
      return count + (bomber.isAlive() ? 1 : 0);
    }, 0);

    // end game
    if (aliveBombers <= 1) {
      this.battleEnded = true;
    }
  }
}
