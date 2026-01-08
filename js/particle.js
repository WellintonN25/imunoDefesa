// Sistema de Partículas para Efeitos Visuais
class Particle {
    constructor() {
        this.reset(0, 0, '#fff', 3, 0, 0);
        this.active = false;
    }

    reset(x, y, color, size, velocityX, velocityY) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = size;
        this.velocityX = velocityX;
        this.velocityY = velocityY;
        this.alpha = 1;
        this.decay = 0.02;
        this.active = true;
    }

    update() {
        if (!this.active) return;

        this.x += this.velocityX;
        this.y += this.velocityY;
        this.alpha -= this.decay;
        this.size *= 0.98;

        if (this.alpha <= 0 || this.size <= 0.5) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        // Otimização: Desenhando quadrado em vez de círculo para performance se estiver muito pesado (opcional)
        // ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// Gerenciador de Partículas com Object Pooling
class ParticleSystem {
    constructor() {
        this.poolSize = 400; // Limite máximo de partículas
        this.particles = new Array(this.poolSize).fill(null).map(() => new Particle());
        this.activeCount = 0;
    }

    getParticle() {
        // Encontrar uma partícula inativa
        // Estratégia simples: Linear scan. Melhorável com lista de livres, mas para 400 é ok.
        for (let i = 0; i < this.poolSize; i++) {
            if (!this.particles[i].active) {
                return this.particles[i];
            }
        }
        // Se todas ativas, recicla a mais antiga (índice 0 ou round robin) - Por enquanto, não spawna.
        return null;
    }

    createExplosion(x, y, color, count = 15) {
        // Reduzido para performance
        for (let i = 0; i < count; i++) {
            const p = this.getParticle();
            if (!p) break;

            const angle = (Math.PI * 2 * i) / count;
            const speed = 2 + Math.random() * 3;
            p.reset(
                x, y, color,
                2 + Math.random() * 3, // Size
                Math.cos(angle) * speed, // VX
                Math.sin(angle) * speed  // VY
            );
        }
    }

    createBlood(x, y, count = 8) {
        // Reduzido count padrão
        const colors = ['#ff3366', '#ff0044', '#cc0033'];
        for (let i = 0; i < count; i++) {
            const p = this.getParticle();
            if (!p) break;

            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 4;
            p.reset(
                x, y,
                colors[Math.floor(Math.random() * colors.length)],
                2 + Math.random() * 4,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed
            );
        }
    }

    createLevelUp(x, y) {
        const colors = ['#00f0ff', '#ff00ea', '#ffd700'];
        for (let i = 0; i < 30; i++) { // Reduzido de 50
            const p = this.getParticle();
            if (!p) break;

            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 5;
            p.reset(
                x, y,
                colors[Math.floor(Math.random() * colors.length)],
                3 + Math.random() * 5,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed - 2
            );
            p.decay = 0.015;
        }
    }

    createXPOrb(x, y) {
        const colors = ['#00f0ff', '#00ccff'];
        for (let i = 0; i < 4; i++) {
            const p = this.getParticle();
            if (!p) break;

            const angle = Math.random() * Math.PI * 2;
            const speed = 0.5 + Math.random() * 1;
            p.reset(
                x, y,
                colors[Math.floor(Math.random() * colors.length)],
                2 + Math.random() * 2,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed
            );
        }
    }

    update() {
        for (let i = 0; i < this.poolSize; i++) {
            if (this.particles[i].active) {
                this.particles[i].update();
            }
        }
    }

    draw(ctx) {
        // Otimização: Não criar novos arrays ou objetos aqui
        for (let i = 0; i < this.poolSize; i++) {
            if (this.particles[i].active) {
                this.particles[i].draw(ctx);
            }
        }
    }

    clear() {
        for (let i = 0; i < this.poolSize; i++) {
            this.particles[i].active = false;
        }
    }
}
