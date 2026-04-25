class Particle {
  constructor(x, y, topLimit) {
    this.x = x;
    this.y = y;
    this.startY = y;
    this.topLimit = topLimit;
    
    // Horizontal drift (slow)
    this.vx = (Math.random() - 0.5) * 1.5;
    // Rising motion (negative = upward)
    this.vy = -(Math.random() * 2.6 + 1.8);
    this.life = 1;
    this.decay = Math.random() * 0.005 + 0.0035;

    // Start particles at 2x their base size, then shrink as they rise.
    this.baseSize = Math.random() * 2 + 1.2;
    this.startSize = this.baseSize * 2;
    this.size = this.startSize;
    this.startOpacity = 0.55 + Math.random() * 0.45;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    // Slight deceleration as particle rises
    this.vy *= 0.987;
    this.life -= this.decay;

    const riseRange = Math.max(1, this.startY - this.topLimit);
    const ascentProgress = Math.min(1, Math.max(0, (this.startY - this.y) / riseRange));
    this.size = this.startSize * (1 - ascentProgress * 0.75);
  }

  getAscentProgress() {
    const riseRange = Math.max(1, this.startY - this.topLimit);
    return Math.min(1, Math.max(0, (this.startY - this.y) / riseRange));
  }

  getGradientProgress() {
    const ascentProgress = this.getAscentProgress();
    const lifetimeProgress = Math.min(1, Math.max(0, 1 - this.life));
    return Math.max(ascentProgress, lifetimeProgress);
  }

  getGradientColor(progress) {
    const stops = [
      { p: 0.0, c: [255, 255, 255] }, // white (bottom)
      { p: 0.25, c: [255, 235, 120] }, // yellow
      { p: 0.5, c: [255, 155, 40] }, // orange
      { p: 0.75, c: [190, 50, 20] }, // red
      { p: 1.0, c: [60, 30, 18] }, // dark brown (top)
    ];

    for (let i = 0; i < stops.length - 1; i++) {
      const a = stops[i];
      const b = stops[i + 1];
      if (progress >= a.p && progress <= b.p) {
        const localT = (progress - a.p) / (b.p - a.p);
        const r = Math.round(a.c[0] + (b.c[0] - a.c[0]) * localT);
        const g = Math.round(a.c[1] + (b.c[1] - a.c[1]) * localT);
        const bl = Math.round(a.c[2] + (b.c[2] - a.c[2]) * localT);
        return `rgb(${r}, ${g}, ${bl})`;
      }
    }

    return "rgb(60, 30, 18)";
  }

  draw(ctx) {
    const progress = this.getGradientProgress();
    ctx.globalAlpha = Math.max(0, (0.2 + this.life * 0.8) * (1 - progress * 0.75) * this.startOpacity);
    ctx.fillStyle = this.getGradientColor(progress);
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.particles = [];
    this.emissionRate = 108;
    this.fireHeight = 0; // top point where fire stops (now 75% up)

    this.resizeCanvas();
    this.seedInitialState();
    window.addEventListener("resize", () => this.resizeCanvas());

    this.animate();
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.fireHeight = 0; // Doubled again: fire now reaches the full screen height
  }

  emitParticles() {
    for (let i = 0; i < this.emissionRate; i++) {
      // Spawn particles across the bottom of screen
      const x = Math.random() * this.canvas.width;
      const y = this.canvas.height + Math.random() * 20;
      this.particles.push(new Particle(x, y, this.fireHeight));
    }
  }

  seedInitialState() {
    const initialCount = Math.floor(this.emissionRate * 80);
    this.particles = [];

    for (let i = 0; i < initialCount; i++) {
      const x = Math.random() * this.canvas.width;
      const y = this.canvas.height + Math.random() * 20;
      const particle = new Particle(x, y, this.fireHeight);

      // Advance each seeded particle by a random number of frames
      // so the first render already looks mid-animation.
      const warmupSteps = Math.floor(Math.random() * 140);
      for (let step = 0; step < warmupSteps && particle.life > 0 && particle.y > this.fireHeight; step++) {
        particle.update();
      }

      if (particle.life > 0 && particle.y > this.fireHeight) {
        this.particles.push(particle);
      }
    }
  }

  update() {
    this.emitParticles();

    this.particles = this.particles.filter((p) => {
      p.update();
      // Remove particles that have faded or risen too high
      return p.life > 0 && p.y > this.fireHeight;
    });
  }

  draw() {
    // Clear canvas completely (no trailing effect for cleaner fire look)
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw particles
    this.particles.forEach((p) => p.draw(this.ctx));
  }

  animate() {
    this.update();
    this.draw();
    requestAnimationFrame(() => this.animate());
  }
}

const canvas = document.getElementById("particleCanvas");
new ParticleSystem(canvas);
