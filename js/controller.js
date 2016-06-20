/*
 * ClanBomber controllers
 */
import Input from './input';
var Controllers = {};

/*
 * Cursor Keys controller
 */
Controllers.KeyboardCursor = function() {

  var KEY = Input.Keyboard.KEY,
    kbd = new Input.Keyboard({
      preventKeys: [KEY.UP, KEY.DOWN, KEY.LEFT, KEY.RIGHT, KEY.RETURN]
    });

  return {
    isUp: function() {
      return kbd.isKeyPressed(KEY.UP);
    },
    isDown: function() {
      return kbd.isKeyPressed(KEY.DOWN);
    },
    isLeft: function() {
      return kbd.isKeyPressed(KEY.LEFT);
    },
    isRight: function() {
      return kbd.isKeyPressed(KEY.RIGHT);
    },
    isBomb: function() {
      return kbd.isKeyPressed(KEY.RETURN);
    }
  };

};

/*
 * WSAD Keys controller
 */
Controllers.KeyboardWSAD = function() {

  var KEY = Input.Keyboard.KEY,
    kbd = new Input.Keyboard({
      preventKeys: [KEY.W, KEY.S, KEY.A, KEY.D, KEY.TAB]
    });

  return {
    isUp: function() {
      return kbd.isKeyPressed(KEY.W);
    },
    isDown: function() {
      return kbd.isKeyPressed(KEY.S);
    },
    isLeft: function() {
      return kbd.isKeyPressed(KEY.A);
    },
    isRight: function() {
      return kbd.isKeyPressed(KEY.D);
    },
    isBomb: function() {
      return kbd.isKeyPressed(KEY.TAB);
    }
  };

};

/*
 * Test gamepad controller
 */
Controllers.Gamepad1 = function() {

  var pad = new Input.Gamepad(),
    BUTTONS = Input.Gamepad.BUTTONS;

  return {
    isUp: function() {
      return pad.isButtonPressed(BUTTONS.PAD_TOP);
    },
    isDown: function() {
      return pad.isButtonPressed(BUTTONS.PAD_BOTTOM);
    },
    isLeft: function() {
      return pad.isButtonPressed(BUTTONS.PAD_LEFT);
    },
    isRight: function() {
      return pad.isButtonPressed(BUTTONS.PAD_RIGHT);
    },
    isBomb: function() {
      return pad.isButtonPressed(BUTTONS.FACE_1);
    }
  };

};

/*
 * Stupid AI controller
 */
Controllers.AI = function() {

  // single AI for now
  var actionsList = {
    DOWN: true,
    RIGHT: false,
    UP: false,
    LEFT: false,
    BOMB: false
  };
  var accum = 0,
    moveSeconds = 0.5,
    current = 'DOWN';

  function handleUpdate(dt) {
    var directions, directionIndex;
    if (accum < moveSeconds) {
      accum += dt;
    } else {
      accum = 0;
      actionsList[current] = false;
      directions = Object.keys(actionsList);
      directions.pop();

      // walk in square
      directionIndex = directions.indexOf(current);
      if (directionIndex < directions.length - 1) {
        current = directions[directionIndex + 1];
      } else {
        current = directions[0];
      }
      actionsList[current] = true;

      // randomly put bombs
      actionsList.BOMB = Math.random() < 0.25;
    }
  }

  return {
    update: function(dt) {
      handleUpdate(dt);
    },
    isUp: function() {
      return actionsList.UP;
    },
    isDown: function() {
      return actionsList.DOWN;
    },
    isLeft: function() {
      return actionsList.LEFT;
    },
    isRight: function() {
      return actionsList.RIGHT;
    },
    isBomb: function() {
      return actionsList.BOMB;
    }
  };

};

export default Controllers;
