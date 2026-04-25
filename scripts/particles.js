class Particle {
  constructor(x, y, screenHeight) {
    this.x = x;
    this.y = y;
    this.screenHeight = screenHeight;
    
    // Horizontal drift (slow)
    this.vx = (Math.random() - 0.5) * 1.5;
    // Rising motion (negative = upward)
    this.vy = -(Math.random() * 2.5 + 1.5);
    this.life = 1;
    this.decay = Math.random() * 0.012 + 0.008;
    
    // Fire colors: red, orange, yellow
    const colors = ["#ff4500", "#ff6347", "#ffa500", "#ffb347", "#ffd700", "#ff8c00"];
    this.color = colors[Math.floor(Math.random() * colors.length)];
    this.size = Math.random() * 3 + 1;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    // Slight deceleration as particle rises
    this.vy *= 0.98;
    this.life -= this.decay;
  }

  draw(ctx) {
    ctx.globalAlpha = this.life * 0.5;
    ctx.fillStyle = this.color;
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
    this.emissionRate = 24;
    this.fireHeight = 0; // top point where fire stops (now 75% up)

    this.resizeCanvas();
    window.addEventListener("resize", () => this.resizeCanvas());

    this.animate();
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.fireHeight = this.canvas.height * 0.75; // Fire now reaches 75% up
  }

  emitParticles() {
    for (let i = 0; i < this.emissionRate; i++) {
      // Spawn particles across the bottom of screen
      const x = Math.random() * this.canvas.width;
      const y = this.canvas.height + Math.random() * 20;
      this.particles.push(new Particle(x, y, this.canvas.height));
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
