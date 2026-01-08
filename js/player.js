// Jogador
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 20;

        // Stats base
        this.maxHealth = 100;
        this.health = this.maxHealth;
        this.speed = 4;
        this.damage = 10;
        this.attackSpeed = 60; // Frames entre ataques

        // Progressão
        this.level = 1;
        this.xp = 0;
        this.xpToNextLevel = 100;

        // Controles por mouse/touch
        this.targetX = x;
        this.targetY = y;
        this.velocityX = 0;
        this.velocityY = 0;

        // Combate (Otimizado com Object Pooling)
        this.attackTimer = 0;
        this.projectilePoolSize = 200; // Limite de projéteis
        this.projectiles = new Array(this.projectilePoolSize).fill(null).map(() => new Projectile(0, 0, 0, 0, 0, 0, '#000', 0, 'dummy'));
        // Inicializar dummy projectiles como inativos
        this.projectiles.forEach(p => p.active = false);
        this.orbitalWeapons = [];

        // Armas desbloqueadas
        this.weapons = {
            bullet: { unlocked: true, level: 1 },
            magic: { unlocked: false, level: 0 },
            orbital: { unlocked: false, level: 0 },
            lightning: { unlocked: false, level: 0 }
        };

        // Visual e animação
        this.invulnerable = 0;
        this.invulnerableTime = 60;
        this.rotation = 0;
        this.scale = 1;
        this.pulseTimer = 0;
        this.trail = [];
        this.maxTrailLength = 15;

        // Skin
        this.skinColor = '#e8f0ff';
        this.hasGlow = false;
        this.gradient = null;
    }

    updateSkin(achievementSystem) {
        const skin = achievementSystem.getSelectedSkin();
        if (skin) {
            this.skinColor = skin.color || '#e8f0ff';
            this.hasGlow = skin.glow || false;
            this.gradient = skin.gradient || null;
        }
    }

    setTarget(x, y) {
        this.targetX = x;
        this.targetY = y;
    }

    update(canvasWidth, canvasHeight, enemies, particleSystem, achievementSystem, game) {
        // Obter timeScale do jogo ou usar fallback
        const timeScale = game ? game.timeScale : 1;

        // Movimento em direção ao cursor/toque (afetado por timeScale)
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Só se move se estiver longe do alvo
        if (distance > 5) {
            this.velocityX = (dx / distance) * this.speed * timeScale;
            this.velocityY = (dy / distance) * this.speed * timeScale;

            this.x += this.velocityX;
            this.y += this.velocityY;

            // Rotação baseada na direção
            this.rotation = Math.atan2(dy, dx);

            // Adicionar trilha de movimento (Juice)
            if (this.speed > 5 || game.timeScale < 1) { // Só se muito rápido ou em slow mo (Matrix style)
                this.trail.push({ x: this.x, y: this.y, alpha: 1 });
            }
            if (this.trail.length > this.maxTrailLength) {
                this.trail.shift();
            }
        } else {
            this.velocityX = 0;
            this.velocityY = 0;
        }

        // Atualizar trilha
        this.trail.forEach((point, i) => {
            point.alpha -= 0.05 * timeScale;
        });
        this.trail = this.trail.filter(point => point.alpha > 0);

        // Limitar à tela
        this.x = Math.max(this.size, Math.min(canvasWidth - this.size, this.x));
        this.y = Math.max(this.size, Math.min(canvasHeight - this.size, this.y));

        // Animação de pulso
        this.pulseTimer += 0.1 * timeScale;
        this.scale = 1 + Math.sin(this.pulseTimer) * 0.1;

        // Reduzir invulnerabilidade
        if (this.invulnerable > 0) {
            this.invulnerable -= 1 * timeScale;
        }

        // Ataque automático
        this.attackTimer += 1 * timeScale;
        if (this.attackTimer >= this.attackSpeed) {
            this.attackTimer = 0;
            this.attack(enemies);
        }

        // Atualizar projéteis (Usando Pool)
        for (let i = 0; i < this.projectilePoolSize; i++) {
            const proj = this.projectiles[i];
            if (!proj.active) continue;

            proj.update(canvasWidth, canvasHeight); // Projéteis precisam de timeScale? Sim, idealmente.
            // Mas Projectile.update não aceita timeScale. Vamos deixar assim por enquanto ou ajustar.

            if (!proj.active) {
                // Se desativou após update (saiu da tela etc), contabilizar erro
                if (achievementSystem && !proj.hitTarget) {
                    achievementSystem.updateStats('shot_miss', 1);
                }
                continue;
            }

            // Verificar colisão com inimigos
            for (const enemy of enemies) {
                if (!enemy.active) continue;

                if (proj.checkCollision(enemy)) {
                    const damage = proj.damage;
                    const died = enemy.takeDamage(damage);
                    proj.active = false;
                    proj.hitTarget = true;
                    particleSystem.createExplosion(enemy.x, enemy.y, proj.color, 8);

                    // JUICE: Floating Text
                    if (game) {
                        const isCrit = Math.random() < 0.1; // 10% chance crit (simulado)
                        const finalDamage = isCrit ? Math.floor(damage * 1.5) : damage;
                        const color = isCrit ? '#ff0000' : '#ffffff';
                        const size = isCrit ? 30 : 20;
                        game.spawnFloatingText(enemy.x, enemy.y - 20, Math.floor(finalDamage), color, size);
                    }

                    if (achievementSystem) {
                        achievementSystem.updateStats('shot_hit', 1);
                    }

                    if (died) {
                        return { killed: enemy };
                    }
                    break;
                }
            }
        }

        // Atualizar armas orbitais
        this.orbitalWeapons.forEach(weapon => {
            weapon.update();
            const hits = weapon.checkCollisions(enemies, particleSystem);

            hits.forEach(hit => {
                const died = hit.enemy.takeDamage(hit.damage);
                if (died) {
                    return { killed: hit.enemy };
                }
            });
        });

        return null;
    }

    attack(enemies) {
        if (enemies.length === 0) return;

        // Encontrar inimigo mais próximo
        let closest = null;
        let closestDist = Infinity;

        for (const enemy of enemies) {
            if (!enemy.active) continue;

            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < closestDist) {
                closestDist = dist;
                closest = enemy;
            }
        }

        if (!closest) return;

        // Disparar projéteis baseado nas armas desbloqueadas
        if (this.weapons.bullet.unlocked) {
            // Mirar DIRETAMENTE no inimigo
            // Mirar DIRETAMENTE no inimigo
            this.spawnProjectile(
                this.x, this.y, closest.x, closest.y,
                this.damage, 8, this.skinColor, 5, 'bullet'
            );
        }

        if (this.weapons.magic.unlocked) {
            const count = this.weapons.magic.level;
            for (let i = 0; i < count; i++) {
                // Mirar no inimigo com pequena variação
                const spread = 20;
                const targetX = closest.x + (Math.random() - 0.5) * spread;
                const targetY = closest.y + (Math.random() - 0.5) * spread;

                this.spawnProjectile(
                    this.x, this.y, targetX, targetY,
                    this.damage * 1.5, 6, '#ff88cc', 8, 'magic'
                );
            }
        }

        if (this.weapons.lightning.unlocked && Math.random() < 0.3) {
            this.spawnProjectile(
                this.x, this.y, closest.x, closest.y,
                this.damage * 2, 20, '#ffdd88', 15, 'lightning'
            );
        }
    }

    takeDamage(damage) {
        if (this.invulnerable > 0) return;

        this.health -= damage;
        this.invulnerable = this.invulnerableTime;

        if (this.health <= 0) {
            this.health = 0;
            return true; // Morreu
        }

        return false;
    }

    gainXP(amount) {
        this.xp += amount;

        if (this.xp >= this.xpToNextLevel) {
            this.levelUp();
            return true; // Level up
        }

        return false;
    }

    levelUp() {
        this.level++;
        this.xp -= this.xpToNextLevel;
        this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.2);
    }

    draw(ctx, particleSystem) {
        ctx.save();

        // Desenhar trilha de movimento (simplificada)
        if (this.trail.length > 0) {
            const lastPoints = this.trail.slice(-5); // Apenas últimos 5 pontos
            lastPoints.forEach((point, i) => {
                const alpha = point.alpha * 0.3;
                const size = this.size * 0.6;

                // Trilha usa a cor da skin
                ctx.fillStyle = this.gradient ? this.gradient[0] : this.skinColor;
                ctx.globalAlpha = alpha;
                ctx.beginPath();
                ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
                ctx.fill();
            });
        }
        ctx.globalAlpha = 1;

        // Piscar quando invulnerável
        if (this.invulnerable > 0 && Math.floor(this.invulnerable / 5) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        // Aplicar transformações
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);

        // Brilho externo (efeito Glow da skin)
        if (this.hasGlow) {
            const glowGradient = ctx.createRadialGradient(0, 0, this.size, 0, 0, this.size * 2.5);
            glowGradient.addColorStop(0, this.skinColor);
            glowGradient.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = glowGradient;
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.arc(0, 0, this.size * 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        // Corpo principal - círculo simples
        if (this.gradient) {
            const grad = ctx.createLinearGradient(-this.size, -this.size, this.size, this.size);
            this.gradient.forEach((color, i) => {
                grad.addColorStop(i / (this.gradient.length - 1), color);
            });
            ctx.fillStyle = grad;
        } else {
            ctx.fillStyle = this.skinColor;
        }

        ctx.shadowBlur = 15;
        ctx.shadowColor = this.hasGlow ? this.skinColor : '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Membrana celular
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5;
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Núcleo
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Organelas (apenas 2)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(this.size * 0.4, 0, this.size * 0.12, 0, Math.PI * 2);
        ctx.arc(-this.size * 0.4, 0, this.size * 0.12, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Desenhar projéteis
        // Desenhar projéteis
        for (let i = 0; i < this.projectilePoolSize; i++) {
            if (this.projectiles[i].active) {
                this.projectiles[i].draw(ctx);
            }
        }

        // Desenhar armas orbitais
        this.orbitalWeapons.forEach(weapon => weapon.draw(ctx));
    }

    applyUpgrade(upgrade) {
        switch (upgrade.type) {
            case 'weapon_bullet':
                this.weapons.bullet.unlocked = true;
                this.weapons.bullet.level++;
                break;
            case 'weapon_magic':
                this.weapons.magic.unlocked = true;
                this.weapons.magic.level++;
                break;
            case 'weapon_orbital':
                this.weapons.orbital.unlocked = true;
                if (this.weapons.orbital.level === 0) {
                    this.orbitalWeapons.push(new OrbitalWeapon(this, this.damage * 0.8, 0.05, '#ffd700', 3));
                } else {
                    this.orbitalWeapons[0].addOrb();
                }
                this.weapons.orbital.level++;
                break;
            case 'weapon_lightning':
                this.weapons.lightning.unlocked = true;
                this.weapons.lightning.level++;
                break;
            case 'stat_health':
                this.maxHealth += 20;
                this.health = Math.min(this.health + 20, this.maxHealth);
                break;
            case 'stat_damage':
                this.damage += 5;
                break;
            case 'stat_speed':
                this.speed += 0.5;
                break;
            case 'stat_attackspeed':
                this.attackSpeed = Math.max(10, this.attackSpeed - 5);
                break;
        }
    }

    spawnProjectile(x, y, tx, ty, dmg, spd, color, size, type) {
        // Encontrar slot livre no pool
        for (let i = 0; i < this.projectilePoolSize; i++) {
            if (!this.projectiles[i].active) {
                this.projectiles[i].reset(x, y, tx, ty, dmg, spd, color, size, type);
                return;
            }
        }
    }
}
