// Orbe de XP
class XPOrb {
    constructor(x, y, value) {
        this.reset(x, y, value);
    }

    reset(x, y, value) {
        this.x = x;
        this.y = y;
        this.value = value;
        this.size = 6;
        this.active = true;
        this.magnetRange = 100;
        this.speed = 0;
        this.maxSpeed = 8;
    }

    update(player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Magnetismo - atrai para o jogador quando próximo
        if (distance < this.magnetRange) {
            this.speed = Math.min(this.speed + 0.5, this.maxSpeed);
            const dirX = dx / distance;
            const dirY = dy / distance;
            this.x += dirX * this.speed;
            this.y += dirY * this.speed;

            // Coletar se tocar o jogador
            if (distance < player.size + this.size) {
                this.active = false;
                return true;
            }
        }

        return false;
    }

    draw(ctx) {
        // Brilho externo
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 2);
        gradient.addColorStop(0, '#00f0ff');
        gradient.addColorStop(0.5, '#00f0ff44');
        gradient.addColorStop(1, '#00f0ff00');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
        ctx.fill();

        // Núcleo
        ctx.fillStyle = '#00f0ff';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00f0ff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

// Inimigo
class Enemy {
    constructor(x, y, type = 'basic') {
        this.reset(x, y, type);
    }

    reset(x, y, type = 'basic') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.active = true;

        // Configurar stats baseado no tipo
        this.setupType(type);

        this.maxHealth = this.health;
        this.hitFlash = 0;
    }

    setupType(type) {
        const types = {
            basic: {
                health: 30,
                speed: 1.5,
                damage: 10,
                size: 15,
                color: '#ff6b9d', // Rosa/vermelho (vírus)
                xpValue: 5
            },
            fast: {
                health: 15,
                speed: 3,
                damage: 5,
                size: 12,
                color: '#ffaa44', // Laranja (bactéria rápida)
                xpValue: 8
            },
            tank: {
                health: 100,
                speed: 0.8,
                damage: 20,
                size: 25,
                color: '#9966ff', // Roxo (superbactéria)
                xpValue: 15
            },
            boss: {
                health: 500,
                speed: 1,
                damage: 30,
                size: 40,
                color: '#ff3366', // Vermelho intenso (vírus mutante)
                xpValue: 100
            }
        };

        const config = types[type] || types.basic;
        Object.assign(this, config);
    }

    update(player) {
        // IA: perseguir o jogador
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
        }

        // Reduzir flash de dano
        if (this.hitFlash > 0) {
            this.hitFlash--;
        }

        // Verificar colisão com jogador
        if (distance < this.size + player.size) {
            return true; // Colidiu
        }

        return false;
    }

    takeDamage(damage) {
        this.health -= damage;
        this.hitFlash = 5;

        if (this.health <= 0) {
            this.active = false;
            return true; // Morreu
        }

        return false;
    }

    draw(ctx) {
        ctx.save();

        // Sombra projetada
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(this.x + 5, this.y + this.size + 5, this.size * 0.8, this.size * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Aplicar transformações
        ctx.translate(this.x, this.y);

        // Animação de flutuação
        const floatOffset = Math.sin(Date.now() * 0.003 + this.x) * 3;
        ctx.translate(0, floatOffset);

        // Flash branco quando toma dano
        if (this.hitFlash > 0) {
            ctx.fillStyle = '#ffffff';
        } else {
            ctx.fillStyle = this.color;
        }

        // Brilho externo
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size * 1.5);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(0.6, this.color + '88');
        gradient.addColorStop(1, this.color + '00');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Corpo principal baseado no tipo
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;

        if (this.type === 'boss') {
            // Boss - Vírus mutante com espículas ameaçadoras
            ctx.fillStyle = this.hitFlash > 0 ? '#ffffff' : this.color;
            ctx.beginPath();
            for (let i = 0; i < 12; i++) {
                const angle = (Math.PI * 2 * i) / 12;
                const radius = i % 2 === 0 ? this.size : this.size * 0.7;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();

            // Núcleo viral pulsante
            const pulseSize = this.size * 0.5 + Math.sin(Date.now() * 0.01) * 4;
            ctx.fillStyle = '#330011';
            ctx.shadowBlur = 30;
            ctx.shadowColor = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, pulseSize, 0, Math.PI * 2);
            ctx.fill();

            // Espículas extras
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 * i) / 8 + Date.now() * 0.001;
                ctx.beginPath();
                ctx.moveTo(Math.cos(angle) * this.size * 0.6, Math.sin(angle) * this.size * 0.6);
                ctx.lineTo(Math.cos(angle) * this.size * 1.3, Math.sin(angle) * this.size * 1.3);
                ctx.strokeStyle = this.hitFlash > 0 ? '#ffffff' : this.color;
                ctx.lineWidth = 3;
                ctx.stroke();
            }
        } else if (this.type === 'tank') {
            // Tank - Superbactéria com cápsula grossa
            ctx.fillStyle = this.hitFlash > 0 ? '#ffffff' : this.color;

            // Corpo bacteriano oval
            ctx.beginPath();
            ctx.ellipse(0, 0, this.size, this.size * 0.8, 0, 0, Math.PI * 2);
            ctx.fill();

            // Cápsula (camada externa)
            ctx.strokeStyle = this.hitFlash > 0 ? '#cccccc' : '#cc99ff';
            ctx.lineWidth = 4;
            ctx.stroke();

            // Flagelos (cauda)
            for (let i = 0; i < 3; i++) {
                const angle = Math.PI + (i - 1) * 0.3;
                const wave = Math.sin(Date.now() * 0.005 + i) * 0.3;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.quadraticCurveTo(
                    Math.cos(angle) * this.size * 0.7,
                    Math.sin(angle + wave) * this.size * 0.7,
                    Math.cos(angle) * this.size * 1.5,
                    Math.sin(angle + wave) * this.size * 1.5
                );
                ctx.strokeStyle = this.hitFlash > 0 ? '#ffffff' : this.color;
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        } else if (this.type === 'fast') {
            // Fast - Bactéria alongada com flagelo
            ctx.fillStyle = this.hitFlash > 0 ? '#ffffff' : this.color;

            // Corpo alongado
            ctx.beginPath();
            ctx.ellipse(0, 0, this.size * 1.4, this.size * 0.6, Math.PI / 6, 0, Math.PI * 2);
            ctx.fill();

            // Flagelo ondulante
            ctx.beginPath();
            ctx.moveTo(-this.size, 0);
            const segments = 5;
            for (let i = 0; i <= segments; i++) {
                const t = i / segments;
                const x = -this.size - t * this.size * 2;
                const y = Math.sin(Date.now() * 0.01 + t * Math.PI * 2) * this.size * 0.5;
                ctx.lineTo(x, y);
            }
            ctx.strokeStyle = this.hitFlash > 0 ? '#ffffff' : this.color;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Membrana
            ctx.strokeStyle = this.hitFlash > 0 ? '#ffffff' : '#ffcc77';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(0, 0, this.size * 1.4, this.size * 0.6, Math.PI / 6, 0, Math.PI * 2);
            ctx.stroke();
        } else {
            // Basic - Vírus esférico com espículas
            ctx.fillStyle = this.hitFlash > 0 ? '#ffffff' : this.color;
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fill();

            // Espículas virais (proteínas de superfície)
            for (let i = 0; i < 16; i++) {
                const angle = (Math.PI * 2 * i) / 16 + Date.now() * 0.0005;
                const spikeLength = this.size * 0.4;

                ctx.beginPath();
                ctx.moveTo(Math.cos(angle) * this.size * 0.8, Math.sin(angle) * this.size * 0.8);
                ctx.lineTo(Math.cos(angle) * (this.size + spikeLength), Math.sin(angle) * (this.size + spikeLength));
                ctx.strokeStyle = this.hitFlash > 0 ? '#ffffff' : '#ff99bb';
                ctx.lineWidth = 2;
                ctx.stroke();

                // Ponta da espícula
                ctx.fillStyle = this.hitFlash > 0 ? '#ffffff' : '#ff99bb';
                ctx.beginPath();
                ctx.arc(
                    Math.cos(angle) * (this.size + spikeLength),
                    Math.sin(angle) * (this.size + spikeLength),
                    2, 0, Math.PI * 2
                );
                ctx.fill();
            }

            // Núcleo viral
            ctx.fillStyle = '#cc3355';
            ctx.beginPath();
            ctx.arc(0, 0, this.size * 0.4, 0, Math.PI * 2);
            ctx.fill();
        }

        // Olhos brilhantes
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#ff0000';
        const eyeOffset = this.size * 0.3;
        const eyeSize = this.size * 0.15;
        ctx.beginPath();
        ctx.arc(-eyeOffset, -eyeOffset * 0.5, eyeSize, 0, Math.PI * 2);
        ctx.arc(eyeOffset, -eyeOffset * 0.5, eyeSize, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Barra de vida (apenas se não estiver com vida cheia)
        if (this.health < this.maxHealth) {
            const barWidth = this.size * 2.5;
            const barHeight = 5;
            const barX = this.x - barWidth / 2;
            const barY = this.y - this.size - 15;

            // Fundo da barra com borda
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            ctx.strokeRect(barX, barY, barWidth, barHeight);

            // Barra de vida com gradiente
            const healthPercent = this.health / this.maxHealth;
            const healthGradient = ctx.createLinearGradient(barX, barY, barX + barWidth * healthPercent, barY);

            if (healthPercent > 0.5) {
                healthGradient.addColorStop(0, '#00ff88');
                healthGradient.addColorStop(1, '#00cc66');
            } else if (healthPercent > 0.25) {
                healthGradient.addColorStop(0, '#ffaa00');
                healthGradient.addColorStop(1, '#ff8800');
            } else {
                healthGradient.addColorStop(0, '#ff3366');
                healthGradient.addColorStop(1, '#ff0044');
            }

            ctx.fillStyle = healthGradient;
            ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        }
    }
}

// Sistema de Spawn de Inimigos
class EnemySpawner {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;

        // Pooling systems
        this.enemyPoolSize = 300;
        this.enemies = new Array(this.enemyPoolSize).fill(null).map(() => {
            const e = new Enemy(0, 0, 'basic');
            e.active = false;
            return e;
        });

        this.xpPoolSize = 300;
        this.xpOrbs = new Array(this.xpPoolSize).fill(null).map(() => {
            const x = new XPOrb(0, 0, 1);
            x.active = false;
            return x;
        });

        this.spawnTimer = 0;
        this.spawnInterval = 120; // Frames entre spawns
        this.difficulty = 1;
    }

    update(gameTime, player, particleSystem) {
        // Aumentar dificuldade com o tempo
        this.difficulty = 1 + (gameTime / 30); // +1 de dificuldade a cada 30 segundos

        // Reduzir intervalo de spawn com o tempo
        this.spawnInterval = Math.max(30, 120 - Math.floor(gameTime / 10));

        // Spawn de inimigos baseada no tempo
        this.spawnTimer++;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            const type = Math.random() < Math.min(0.8, 0.1 + (gameTime / 600) * 0.1) ? 'runner' : 'basic';
            this.spawnEnemy(type);
        }

        // Spawn de Boss
        if (gameTime > 0 && gameTime % 1800 === 0 && this.spawnTimer === 0) { // 30 segundos
            this.spawnEnemy('boss');
        }

        // Atualizar inimigos (Pool)
        for (let i = 0; i < this.enemyPoolSize; i++) {
            const enemy = this.enemies[i];
            if (!enemy.active) continue;

            const collision = enemy.update(player);
            if (collision) {
                player.takeDamage(enemy.damage);
            }
        }

        // Atualizar orbes de XP (Pool)
        for (let i = 0; i < this.xpPoolSize; i++) {
            const orb = this.xpOrbs[i];
            if (!orb.active) continue;

            const collected = orb.update(player);
            if (collected) {
                player.gainXP(orb.value);
                if (particleSystem) {
                    particleSystem.createExplosion(orb.x, orb.y, '#ffff00', 4);
                }
            }
        }
    }

    spawnEnemy(type = null) {
        // Determinar tipo baseado na dificuldade
        if (!type) {
            const rand = Math.random() * this.difficulty;
            if (rand < 1) {
                type = 'basic';
            } else if (rand < 2) {
                type = Math.random() < 0.5 ? 'basic' : 'fast';
            } else {
                const types = ['basic', 'fast', 'tank'];
                type = types[Math.floor(Math.random() * types.length)];
            }
        }

        // Spawn fora da tela
        let x, y;
        const side = Math.floor(Math.random() * 4);
        const margin = 50;

        switch (side) {
            case 0: // Topo
                x = Math.random() * this.canvasWidth;
                y = -margin;
                break;
            case 1: // Direita
                x = this.canvasWidth + margin;
                y = Math.random() * this.canvasHeight;
                break;
            case 2: // Baixo
                x = Math.random() * this.canvasWidth;
                y = this.canvasHeight + margin;
                break;
            case 3: // Esquerda
                x = -margin;
                y = Math.random() * this.canvasHeight;
                break;
        }

        // Encontrar slot livre no pool de inimigos
        for (let i = 0; i < this.enemyPoolSize; i++) {
            if (!this.enemies[i].active) {
                this.enemies[i].reset(x, y, type);
                return;
            }
        }
    }

    dropXP(x, y, value) {
        // Encontrar slot livre no pool de XP
        for (let i = 0; i < this.xpPoolSize; i++) {
            if (!this.xpOrbs[i].active) {
                this.xpOrbs[i].reset(x, y, value);
                return;
            }
        }
    }

    draw(ctx) {
        // Desenhar orbes de XP
        // Desenhar orbes de XP
        for (let i = 0; i < this.xpPoolSize; i++) {
            if (this.xpOrbs[i].active) this.xpOrbs[i].draw(ctx);
        }

        // Desenhar inimigos
        for (let i = 0; i < this.enemyPoolSize; i++) {
            if (this.enemies[i].active) this.enemies[i].draw(ctx);
        }
    }

    clear() {
        // Limpar pools (desativar todos)
        for (let i = 0; i < this.enemyPoolSize; i++) this.enemies[i].active = false;
        for (let i = 0; i < this.xpPoolSize; i++) this.xpOrbs[i].active = false;
        this.spawnTimer = 0;
        this.difficulty = 1;
    }
}
