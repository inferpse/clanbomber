/*
 * Input Namespace
 */
var Input = {};

/*
 * Keyboard input
 */
Input.Keyboard = (function() {

  class KeyboardInput {
    constructor(options) {
      this.preventMap = {};
      if (options.preventKeys) {
        options.preventKeys.forEach(keyCode => {
          this.preventMap[keyCode] = true;
        });
      }

      this.pressed = {};
      this.init();
    }
    init() {
      this.state = {};

      this.keydownHandler = (e) => {
        if (this.preventMap[e.which]) {
          e.preventDefault();
        }
        this.setKeyState(e.which, true);
      };
      this.keyupHandler = (e) => {
        this.setKeyState(e.which, false);
      };

      document.addEventListener('keydown', this.keydownHandler, false);
      document.addEventListener('keyup', this.keyupHandler, false);
    }
    setKeyState(keyCode, isPressed) {
      this.state[keyCode] = isPressed;
    }
    isKeyPressed(keyCode) {
      return !!this.state[keyCode];
    }
    destroy() {
      delete this.state;
      document.removeEventListener('keydown', this.keydownHandler, false);
      document.removeEventListener('keyup', this.keyupHandler, false);
    }
  }

  KeyboardInput.KEY = {
    BACKSPACE: 8,
    TAB: 9,
    RETURN: 13,
    ESC: 27,
    SPACE: 32,
    PAGEUP: 33,
    PAGEDOWN: 34,
    END: 35,
    HOME: 36,
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    INSERT: 45,
    DELETE: 46,
    ZERO: 48, ONE: 49, TWO: 50, THREE: 51, FOUR: 52, FIVE: 53, SIX: 54, SEVEN: 55, EIGHT: 56, NINE: 57,
    A: 65, B: 66, C: 67, D: 68, E: 69, F: 70, G: 71, H: 72, I: 73, J: 74, K: 75, L: 76, M: 77, N: 78, O: 79, P: 80, Q: 81, R: 82, S: 83, T: 84, U: 85, V: 86, W: 87, X: 88, Y: 89, Z: 90,
    TILDA: 192
  };

  return KeyboardInput;
}());

/*
 * Gamepad input handler
 */
Input.Gamepad = (function() {
  var gamepadSupportAvailable = !!navigator.webkitGetGamepads || !!navigator.webkitGamepads;

  class GamepadInput {
    constructor() {
      this.state = {};
      if (gamepadSupportAvailable) {
        this.startPolling();
      }
    }
    startPolling() {
      var self = this;

      function tickHandle() {
        self.pollStatus();
      }

      if (!this.ticking) {
        this.ticking = true;
        this.timer = setInterval(tickHandle, 100);
      }
    }
    stopPolling() {
      if (this.ticking) {
        this.ticking = false;
        clearInterval(this.timer);
      }
    }
    isButtonPressed(buttonCode) {
      if (this.state && this.state.buttons) {
        return this.state.buttons[buttonCode].pressed;
      }
    }
    pollStatus() {
      this.state = navigator.getGamepads()[0] || null;
    }
  }

  GamepadInput.BUTTONS = {
    FACE_1: 0, // Face (main) buttons
    FACE_2: 1,
    FACE_3: 2,
    FACE_4: 3,
    LEFT_SHOULDER: 4, // Top shoulder buttons
    RIGHT_SHOULDER: 5,
    LEFT_SHOULDER_BOTTOM: 6, // Bottom shoulder buttons
    RIGHT_SHOULDER_BOTTOM: 7,
    SELECT: 8,
    START: 9,
    LEFT_ANALOGUE_STICK: 10, // Analogue sticks (if depressible)
    RIGHT_ANALOGUE_STICK: 11,
    PAD_TOP: 12, // Directional (discrete) pad
    PAD_BOTTOM: 13,
    PAD_LEFT: 14,
    PAD_RIGHT: 15
  };

  return GamepadInput;
}());

export default Input;
