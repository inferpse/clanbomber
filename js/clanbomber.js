// main deps
import AssetLoader from './assetloader';
import Renderer from './renderer';
import Battle from './battle';

// dev deps
if (process.env.NODE_ENV !== 'production') {
  require('./fpsmeter');
}

export class ClanBomber {
  constructor(options) {
    this.options = Object.assign({
      container: 'body',
      fps: 20,
      width: 800,
      height: 600,
      slomo: 1
    }, options);

    if (document.body) {
      this.initGame();
    } else {
      window.onload = this.initGame.bind(this);
    }
  }
  initGame() {
    // initialize asset loader
    AssetLoader.init({
      basePath: 'resources/',
      images: [
        'pics/maptile_addons.png',
        'pics/bomber_snake.png',
        'pics/bomber_dull_blue.png',
        'pics/bomber_bsd.png',
        'pics/bomber_tux.png',
        'pics/maptiles.png',
        'pics/explosion2.png',
        'pics/corpse_parts.png',
        'pics/bombs.png'
      ],
      sounds: [
        'wavs/die.wav',
        'wavs/corpse_explode.wav',
        'wavs/splash1a.wav',
        'wavs/splash2a.wav',
        'wavs/deepfall.wav',
        'wavs/explode.wav',
        'wavs/hurry_up.wav',
        'wavs/putbomb.wav'
      ]
    });

    // create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.options.width;
    this.canvas.height = this.options.height;
    this.ctx = this.canvas.getContext('2d');
    document.body.appendChild(this.canvas);
    document.body.style.margin = 0;
    this.canvas.style.outline = '1px solid #000';

    // remove noscript
    var noscript = document.body.querySelector('noscript');
    if (noscript) {
      noscript.remove();
    }

    this.renderer = new Renderer({
      assets: AssetLoader,
      width: 800,
      height: 600,
      ctx: this.ctx
    });

    // start game loop
    this.start();
  }
  start() {
    // start game
    this.battle = new Battle({
      assets: AssetLoader,
      ctx: this.ctx
    });
    this.renderer.battle = this.battle;

    this.run();
  }
  update(dt) {
    if (this.battle.battleEnded && !this.exited) {
      this.exited = true;
    } else {
      this.battle.update(dt);
    }
  }
  render(dt) {
    this.renderer.render(dt);
  }
  run() {
    var now,
      self = this,
      dt = 0,
      last = timestamp(),
      slow = this.options.slomo || 1,
      step = 1 / this.options.fps,
      slowStep = slow * step,
      update = this.update.bind(this),
      render = this.render.bind(this),
      fpsmeter;

    if (process.env.NODE_ENV !== 'production') {
      fpsmeter = new window.FPSMeter({ decimals: 0, graph: true, theme: 'dark', left: '5px' });
    }

    function timestamp() {
      return Date.now();
      // return window.performance && window.performance.now ? window.performance.now() : Date.now();
    }

    function frame() {
      if (process.env.NODE_ENV !== 'production') {
        fpsmeter.tickStart();
      }

      // main game + render loop
      now = timestamp();
      dt = dt + Math.min(1, (now - last) / 1000);
      while (dt > slowStep) {
        dt = dt - slowStep;
        update(step);
      }
      render(dt / slow * self.options.fps);
      last = now;

      if (process.env.NODE_ENV !== 'production') {
        fpsmeter.tick();
      }
      requestAnimationFrame(frame, self.canvas);
    }

    requestAnimationFrame(frame);
  }
}
