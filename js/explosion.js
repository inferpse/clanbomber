import EventEmitter from './eventemitter';

export default class Explosion extends EventEmitter {
  constructor(options) {
    super();

    // variables
    this.states = [2, 1, 0, 1, 2];
    this.curStateIndex = 0;
    this.curState = this.states[this.curStateIndex];
    this.stateCount = 3;
    this.switchInterval = 0.1;
    this.curTime = 0;
    this.expSize = 2;

    // initialize values
    this.gameField = options.gameField;
    this.rowIndex = options.row;
    this.colIndex = options.col;
    this.power = options.power;
    this.calcExplosionCells();
  }
  calcExplosionCells() {
    var self = this;
    this.explosionCells = [];

    // type enum
    this.expType = {
      HLEFT: 0,
      HMID: 1,
      HRIGHT: 2,
      VTOP: 3,
      VMID: 4,
      VBOT: 5,
      CENTER: 6
    };

    // push center
    this.explosionCells.push({
      expTypeIndex: this.expType.CENTER,
      row: this.rowIndex,
      col: this.colIndex
    });

    // push other parts
    var addExpPath = function(diffX, diffY) {
      var expStep = 1,
        tmpCell,
        tmpType,
        tmpCol,
        tmpRow;

      while (expStep <= self.expSize) {
        tmpCol = self.colIndex + expStep * diffX;
        tmpRow = self.rowIndex + expStep * diffY;

        tmpCell = self.gameField.getMapTileAt(tmpRow, tmpCol);
        if (tmpCell && tmpCell.type !== 'WALL' && tmpCell.type !== 'BOX') {
          // detect type
          if (diffX) {
            tmpType = self.expType.HMID;
            if (expStep === self.expSize) {
              tmpType = diffX > 0 ? self.expType.HRIGHT : self.expType.HLEFT;
            }
          } else if (diffY) {
            tmpType = self.expType.VMID;
            if (expStep === self.expSize) {
              tmpType = diffY > 0 ? self.expType.VBOT : self.expType.VTOP;
            }
          }

          // add partial to collection
          self.explosionCells.push({
            expTypeIndex: tmpType,
            row: tmpRow,
            col: tmpCol
          });
          expStep++;
        } else {
          break;
        }
      }
    };

    // explosion lines
    addExpPath(-1, 0);
    addExpPath(1, 0);
    addExpPath(0, -1);
    addExpPath(0, 1);
  }
  update(dt) {
    this.curTime += dt;
    if (this.curTime >= this.switchInterval) {
      this.curTime = 0;
      this.curStateIndex++;
      this.curState = this.states[this.curStateIndex];
    }
    if (this.curStateIndex === this.states.length && !this.destroyed) {
      this.destroyed = true;
      this.emit('ended');
    }
  }
}
