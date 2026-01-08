// Sistema de Partículas para Efeitos Visuais
class Particle {
    constructor(x, y, color, size = 3, velocityX = 0, velocityY = 0) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = size;
        this.velocityX = velocityX;
        this.velocityY = velocityY;
        this.alpha = 1;
        this.decay = 0.02;
    }

    update() {
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.alpha -= this.decay;
        this.size *= 0.98;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    isDead() {
        return this.alpha <= 0 || this.size <= 0.5;
    }
}

// Gerenciador de Partículas
class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    createExplosion(x, y, color, count = 20) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = 2 + Math.random() * 3;
            const velocityX = Math.cos(angle) * speed;
            const velocityY = Math.sin(angle) * speed;
            const size = 2 + Math.random() * 3;
            
            this.particles.push(new Particle(x, y, color, size, velocityX, velocityY));
        }
    }

    createBlood(x, y, count = 15) {
        const colors = ['#ff3366', '#ff0044', '#cc0033'];
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 4;
            const velocityX = Math.cos(angle) * speed;
            const velocityY = Math.sin(angle) * speed;
            const size = 2 + Math.random() * 4;
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            this.particles.push(new Particle(x, y, color, size, velocityX, velocityY));
        }
    }

    createLevelUp(x, y) {
        const colors = ['#00f0ff', '#ff00ea', '#ffd700'];
        for (let i = 0; i < 50; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 5;
            const velocityX = Math.cos(angle) * speed;
            const velocityY = Math.sin(angle) * speed - 2; // Bias para cima
            const size = 3 + Math.random() * 5;
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            const particle = new Particle(x, y, color, size, velocityX, velocityY);
            particle.decay = 0.015; // Dura mais tempo
            this.particles.push(particle);
        }
    }

    createXPOrb(x, y) {
        const colors = ['#00f0ff', '#00ccff'];
        for (let i = 0; i < 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.5 + Math.random() * 1;
            const velocityX = Math.cos(angle) * speed;
            const velocityY = Math.sin(angle) * speed;
            const size = 2 + Math.random() * 2;
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            this.particles.push(new Particle(x, y, color, size, velocityX, velocityY));
        }
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].isDead()) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        this.particles.forEach(particle => particle.draw(ctx));
    }

    clear() {
        this.particles = [];
    }
}
