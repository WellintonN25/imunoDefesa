// Sistema de Projéteis
class Projectile {
    constructor(x, y, targetX, targetY, damage, speed, color, size = 5, type = 'bullet') {
        this.x = x;
        this.y = y;
        this.damage = damage;
        this.speed = speed;
        this.color = color;
        this.size = size;
        this.type = type;
        this.active = true;

        // Calcular direção
        const dx = targetX - x;
        const dy = targetY - y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        this.velocityX = (dx / distance) * speed;
        this.velocityY = (dy / distance) * speed;

        // Propriedades específicas por tipo
        if (type === 'magic') {
            this.trail = [];
            this.maxTrailLength = 10;
        } else if (type === 'lightning') {
            this.lifetime = 10; // Frames
        }
    }

    update(canvasWidth, canvasHeight) {
        this.x += this.velocityX;
        this.y += this.velocityY;

        // Adicionar trilha para projéteis mágicos
        if (this.type === 'magic') {
            this.trail.push({ x: this.x, y: this.y });
            if (this.trail.length > this.maxTrailLength) {
                this.trail.shift();
            }
        }

        // Reduzir tempo de vida do raio
        if (this.type === 'lightning') {
            this.lifetime--;
            if (this.lifetime <= 0) {
                this.active = false;
            }
        }

        // Desativar se sair da tela
        if (this.x < -50 || this.x > canvasWidth + 50 ||
            this.y < -50 || this.y > canvasHeight + 50) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (this.type === 'magic') {
            // Desenhar trilha
            ctx.save();
            for (let i = 0; i < this.trail.length; i++) {
                const alpha = i / this.trail.length;
                ctx.globalAlpha = alpha * 0.5;
                ctx.fillStyle = this.color;
                const size = this.size * (i / this.trail.length);
                ctx.beginPath();
                ctx.arc(this.trail[i].x, this.trail[i].y, size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        // Desenhar projétil principal
        ctx.save();

        if (this.type === 'bullet') {
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'magic') {
            // Orbe mágico com brilho
            const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
            gradient.addColorStop(0, this.color);
            gradient.addColorStop(0.5, this.color + '88');
            gradient.addColorStop(1, this.color + '00');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'lightning') {
            // Raio elétrico
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 3;
            ctx.shadowBlur = 15;
            ctx.shadowColor = this.color;
            ctx.beginPath();
            ctx.moveTo(this.x - this.size, this.y);
            ctx.lineTo(this.x + this.size, this.y);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(this.x, this.y - this.size);
            ctx.lineTo(this.x, this.y + this.size);
            ctx.stroke();
        }

        ctx.restore();
    }

    checkCollision(enemy) {
        const dx = this.x - enemy.x;
        const dy = this.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < this.size + enemy.size;
    }
}

// Arma Orbital (gira ao redor do jogador)
class OrbitalWeapon {
    constructor(player, damage, speed, color, count = 3) {
        this.player = player;
        this.damage = damage;
        this.speed = speed;
        this.color = color;
        this.orbs = [];
        this.radius = 60;
        this.angle = 0;

        // Criar orbes
        for (let i = 0; i < count; i++) {
            this.orbs.push({
                angle: (Math.PI * 2 * i) / count,
                size: 8
            });
        }
    }

    update() {
        this.angle += this.speed;

        // Atualizar posição de cada orbe
        this.orbs.forEach(orb => {
            orb.currentAngle = this.angle + orb.angle;
        });
    }

    draw(ctx) {
        this.orbs.forEach(orb => {
            const x = this.player.x + Math.cos(orb.currentAngle) * this.radius;
            const y = this.player.y + Math.sin(orb.currentAngle) * this.radius;

            // Desenhar orbe com brilho
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, orb.size);
            gradient.addColorStop(0, this.color);
            gradient.addColorStop(0.5, this.color + 'aa');
            gradient.addColorStop(1, this.color + '00');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, orb.size, 0, Math.PI * 2);
            ctx.fill();

            // Brilho adicional
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 15;
            ctx.shadowColor = this.color;
            ctx.beginPath();
            ctx.arc(x, y, orb.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        });
    }

    checkCollisions(enemies, particleSystem) {
        const hits = [];

        this.orbs.forEach(orb => {
            const x = this.player.x + Math.cos(orb.currentAngle) * this.radius;
            const y = this.player.y + Math.sin(orb.currentAngle) * this.radius;

            enemies.forEach(enemy => {
                if (!enemy.active) return;

                const dx = x - enemy.x;
                const dy = y - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < orb.size + enemy.size) {
                    hits.push({ enemy, damage: this.damage });
                    particleSystem.createExplosion(enemy.x, enemy.y, this.color, 10);
                }
            });
        });

        return hits;
    }

    addOrb() {
        const newAngle = (Math.PI * 2 * this.orbs.length) / (this.orbs.length + 1);
        this.orbs.push({
            angle: newAngle,
            size: 8
        });

        // Redistribuir ângulos
        this.orbs.forEach((orb, i) => {
            orb.angle = (Math.PI * 2 * i) / this.orbs.length;
        });
    }
}
