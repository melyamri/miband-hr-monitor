// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

window.onload = (() => {
  document.getElementById('start').addEventListener("click", initHRMonitor);
  document.getElementById('stop').addEventListener("click", stopHRMonitor);

  window.requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.oRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      function (callback, element) {
        window.setTimeout(callback, 1000 / 60);
      };
  })();

  let wrapper, canvas, context, width = 300, height = 300, Tau = Math.PI * 2,
    systems = [], heartSystem,
    ticker = 1,
    bps = (60 / bpm) * 1000, // BPM converted to beats per second, in milliseconds, for timer interval
    repaintColour = 'rgba(0,0,0, .05)', // Alpha allows particle path to fade slowly
    pathObjects = [];
  pathObjects.push({
    pLength: 0,
    dom: null,
    pcStep: 0,
    pt: null,
    id: 'heart',
    shape: 'M 209.95 88.4 Q 210 86.85 210 86.5 210 86.05 210 85.6 210.65 27.5 177.7 7.25 143.7 -13.75 104.9 26 66.3 -13.75 32.3 7.25 -1.85 28.2 0.1 89.75 2.05 151.35 104.9 230 207.95 151.35 209.9 89.75 209.9 89.05 209.95 88.4 Z'
  });
  pathObjects.push({
    pLength: 0,
    dom: null,
    pcStep: 0,
    pt: null,
    id: 'smallHeart',
    shape: 'M 174.15 97.5 Q 174.2 96.45 174.2 96.25 174.2 95.95 174.2 95.65 174.6 57.35 152.9 44.05 130.5 30.2 104.95 56.4 79.55 30.2 57.15 44.05 34.65 57.85 35.9 98.35 37.2 138.95 104.95 190.75 172.85 138.95 174.15 98.35 174.15 97.9 174.15 97.5 Z'
  });
  pathObjects.push({pLength: 0, dom: null, pcStep: 0, pt: null, id: 'line', shape: 'M0,0 l20,0z'});

  var ParticleSystem = function () {
    Object.defineProperty(this, 'colour', {value: '#FF1515', writable: true});
    Object.defineProperty(this, 'friction', {value: .9, writable: true});                // f < 1 == slows;  f > 1 == speeds up
    Object.defineProperty(this, 'height', {value: 100, writable: true});
    Object.defineProperty(this, 'maxSpeed', {value: 10, writable: true});
    Object.defineProperty(this, 'numParticles', {value: 50, writable: true});
    Object.defineProperty(this, 'particles', {value: [], writable: true});
    Object.defineProperty(this, 'springTo', {value: true, writable: true});
    Object.defineProperty(this, 'springForce', {value: .01, writable: true});           // speed of return to spring point. tightness
    Object.defineProperty(this, 'wandering', {value: true, writable: true});
    Object.defineProperty(this, 'wander', {value: 1, writable: true});                  // bigger number - fuzzier .05 just perceptible
    Object.defineProperty(this, 'wanderMod', {value: this.wander * .5, writable: true});
    Object.defineProperty(this, 'width', {value: 100, writable: true});
  }
  ParticleSystem.prototype.generate = function () {
    for (let j = 0; j < pathObjects.length; j += 1) {
      pathObjects[j].pcStep = pathObjects[j].pLength / this.numParticles;
    }
    let pShapeArrayX, pShapeArrayY;
    for (let i = 0; i < this.numParticles; i++) {
      // pass in pattern points
      pShapeArrayX = [];
      pShapeArrayY = [];
      for (let p = 0; p < pathObjects.length; p += 1) {
        pathObjects[p].pt = pathObjects[p].dom.getPointAtLength(i * pathObjects[p].pcStep);
        pShapeArrayX.push(pathObjects[p].pt.x + ((this.width - 190) / 2));
        pShapeArrayY.push(pathObjects[p].pt.y + ((this.height - 200) / 2));
      }
      this.particles.push(new Particle(pShapeArrayX, pShapeArrayY, this));
    }
  }
  ParticleSystem.prototype.update = function () {
    for (let i = 0; i < this.numParticles; i++) {
      this.particles[i].pUpdate();
    }
  }
  ParticleSystem.prototype.pShapeMorph = function (value) {
    for (let i = 0; i < this.numParticles; i++) {
      this.particles[i].pChangeSpringPoint(value);
    }
  }

  var Particle = function (x, y, parentSystem) {
    Object.defineProperty(this, 'shapesX', {value: x, writable: true});
    Object.defineProperty(this, 'shapesY', {value: y, writable: true});
    Object.defineProperty(this, 'x', {value: this.shapesX[0], writable: true});
    Object.defineProperty(this, 'y', {value: this.shapesY[0], writable: true});
    Object.defineProperty(this, 'sx', {value: this.x, writable: true});
    Object.defineProperty(this, 'sy', {value: this.y, writable: true});
    Object.defineProperty(this, 'vx', {value: 0, writable: true});
    Object.defineProperty(this, 'vy', {value: 0, writable: true});
    Object.defineProperty(this, 'parentSystem', {value: parentSystem, writable: true});
    return this;
  }
  Particle.prototype.pChangeSpringPoint = function (value) {
    // change spring point - causes morph
    if (value < 0) value = 0;
    if (value >= this.x.length) value = this.x.length - 1;
    this.sx = this.shapesX[value];
    this.sy = this.shapesY[value];
  }
  Particle.prototype.pUpdate = function () {
    // randomise movement slightly
    if (this.parentSystem.wandering) {
      this.vx += Math.random() * this.parentSystem.wander - this.parentSystem.wanderMod;
      this.vy += Math.random() * this.parentSystem.wander - this.parentSystem.wanderMod;
    }
    // apply friction
    this.vx *= this.parentSystem.friction;
    this.vy *= this.parentSystem.friction;
    // constrain to speed bounds
    let speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > this.parentSystem.maxSpeed) {
      this.vx = this.parentSystem.maxSpeed * this.vx / speed;
      this.vy = this.parentSystem.maxSpeed * this.vy / speed;
    }
    // stay attached to point
    if (this.parentSystem.springTo) {
      this.vx += (this.sx - this.x) * this.parentSystem.springForce;
      this.vy += (this.sy - this.y) * this.parentSystem.springForce;
    }
    // update position
    this.x += this.vx;
    this.y += this.vy;
  }

  function createCanvas(id, w, h) {
    let tCanvas = document.createElement('canvas');
    tCanvas.width = w;
    tCanvas.height = h;
    tCanvas.id = id;
    return tCanvas;
  }

  function init() {
    let tPath;
    for (let i = 0; i < pathObjects.length; i += 1) {
      tPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      tPath.setAttribute('d', pathObjects[i].shape);
      pathObjects[i].dom = tPath;
      pathObjects[i].pLength = tPath.getTotalLength();
    }
    wrapper = document.querySelector('.wrapper');
    canvas = createCanvas('canvas', width, height);
    wrapper.appendChild(canvas);
    context = canvas.getContext('2d');
    /* Define new ParticleSystems and set values */
    heartSystem = new ParticleSystem();
    heartSystem.width = width;
    heartSystem.height = height;
    heartSystem.numParticles = 100;
    heartSystem.springForce = .03;
    heartSystem.wander = .5;
    heartSystem.generate();

    systems.push(heartSystem);

  }

  function update() {
    for (let i = 0; i < systems.length; i++) {
      systems[i].update();
    }
  }


  function draw() {
    for (let i = 0; i < systems.length; i++) {
      let system = systems[i];
      context.fillStyle = system.colour;
      let particle;
      for (let j = 0; j < system.numParticles; j += 1) {
        particle = system.particles[j];
        context.beginPath();
        context.arc(particle.x, particle.y, 1, 0, Tau, false);

        context.fill();
      }
    }
  }

  /* Switch between small and big heart, to create beat */
  function heartBeat() {
    let pulseDuration = ticker % 2 ? (bps * .33) : (bps * .66); // Heart contraction is faster
    heartSystem.pShapeMorph(ticker++ % 2);


    // Recurse function with asymetric beat
    setTimeout(() => heartBeat(), Math.random() * 100 + pulseDuration);
  }

  function animate() {
    context.fillStyle = repaintColour;
    context.fillRect(0, 0, width, height);
    update();
    draw();
    requestAnimFrame(animate);
  }

  function updateUI() {
    document.querySelector('.heart-rate').innerHTML = bpm;
    setTimeout(() => updateUI(), 1000);
  }

  /* Maps number (v) in input range(i1/12) to equivalent in output range (o1/o2) */
  function map(v, i1, i2, o1, o2) {
    return o1 + (o2 - o1) * ((v - i1) / (i2 - i1));
  }

  init();
  animate();
  heartBeat();
  updateUI();

})
