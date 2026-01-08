// Controlador Principal do Jogo
class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        // Configurar tamanho do canvas
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Estados do jogo
        this.state = 'MENU'; // MENU, PLAYING, PAUSED, LEVEL_UP, GAME_OVER
        this.gameTime = 0;
        this.kills = 0;

        // Sistemas
        this.particleSystem = new ParticleSystem();
        this.upgradeSystem = new UpgradeSystem();
        this.progressionSystem = new ProgressionSystem();

        // Entidades
        this.player = null;
        this.enemySpawner = null;

        // Sistema de câmera
        this.cameraShake = 0;
        this.cameraX = 0;
        this.cameraY = 0;
        this.backgroundOffset = 0;

        this.setupControls();

        // UI
        this.setupUI();
        this.updateMenuStats();

        // Iniciar loop
        this.lastTime = 0;
        this.frameCount = 0;
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    setupControls() {
        // Controles de mouse
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.state === 'PLAYING') {
                const rect = this.canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                this.player.setTarget(x, y);
            }
        });

        // Controles de touch
        this.canvas.addEventListener('touchmove', (e) => {
            if (this.state === 'PLAYING') {
                e.preventDefault();
                const rect = this.canvas.getBoundingClientRect();
                const touch = e.touches[0];
                const x = touch.clientX - rect.left;
                const y = touch.clientY - rect.top;
                this.player.setTarget(x, y);
            }
        }, { passive: false });

        this.canvas.addEventListener('touchstart', (e) => {
            if (this.state === 'PLAYING') {
                e.preventDefault();
                const rect = this.canvas.getBoundingClientRect();
                const touch = e.touches[0];
                const x = touch.clientX - rect.left;
                const y = touch.clientY - rect.top;
                this.player.setTarget(x, y);
            }
        }, { passive: false });

        // Pausar com ESC
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.state === 'PLAYING') {
                this.state = 'PAUSED';
            } else if (e.key === 'Escape' && this.state === 'PAUSED') {
                this.state = 'PLAYING';
            }
        });
    }

    setupUI() {
        // Botão Iniciar
        document.getElementById('start-btn').addEventListener('click', () => {
            this.startGame();
        });

        // Botão Upgrades
        document.getElementById('upgrades-btn').addEventListener('click', () => {
            this.showUpgradesScreen();
        });

        // Botão Voltar do Upgrades
        document.getElementById('back-menu-btn').addEventListener('click', () => {
            this.showScreen('menu-screen');
            this.updateMenuStats();
        });

        // Botão Reset
        document.getElementById('reset-btn').addEventListener('click', () => {
            this.handleReset();
        });

        // Tabs de upgrades
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                document.querySelectorAll('.upgrades-list').forEach(list => list.classList.remove('active'));
                document.getElementById(btn.dataset.tab + '-upgrades').classList.add('active');
            });
        });

        // Botão Reiniciar
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.startGame();
        });

        // Botão Menu
        document.getElementById('menu-btn').addEventListener('click', () => {
            this.showScreen('menu-screen');
            this.state = 'MENU';
        });
    }

    startGame() {
        // Resetar estado
        this.gameTime = 0;
        this.kills = 0;
        this.frameCount = 0;
        this.cameraShake = 0;
        this.backgroundOffset = 0;

        // Criar entidades
        this.player = new Player(this.canvas.width / 2, this.canvas.height / 2);

        // Aplicar upgrades permanentes
        this.progressionSystem.applyToPlayer(this.player);

        this.enemySpawner = new EnemySpawner(this.canvas.width, this.canvas.height);
        this.particleSystem.clear();

        // Mudar para tela de jogo
        this.showScreen('game-screen');
        this.state = 'PLAYING';

        // Atualizar HUD
        this.updateHUD();
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }

    updateHUD() {
        // HP
        const hpPercent = (this.player.health / this.player.maxHealth) * 100;
        document.getElementById('hp-bar').style.width = hpPercent + '%';
        document.getElementById('hp-text').textContent =
            `${Math.ceil(this.player.health)} / ${this.player.maxHealth}`;

        // XP
        const xpPercent = (this.player.xp / this.player.xpToNextLevel) * 100;
        document.getElementById('xp-bar').style.width = xpPercent + '%';
        document.getElementById('xp-text').textContent =
            `${this.player.xp} / ${this.player.xpToNextLevel}`;

        // Nível
        document.getElementById('level-text').textContent = this.player.level;

        // Tempo
        const minutes = Math.floor(this.gameTime / 60);
        const seconds = this.gameTime % 60;
        document.getElementById('timer-text').textContent =
            `${minutes}:${seconds.toString().padStart(2, '0')}`;

        // Abates
        document.getElementById('kills-text').textContent = this.kills;
    }

    handleLevelUp() {
        this.state = 'LEVEL_UP';

        // Criar efeito de partículas e shake
        this.particleSystem.createLevelUp(this.player.x, this.player.y);
        this.cameraShake = 20;

        // Mostrar modal de upgrades
        const upgrades = this.upgradeSystem.getRandomUpgrades(this.player, 3);
        this.upgradeSystem.displayUpgrades(upgrades, (upgrade) => {
            this.player.applyUpgrade(upgrade);
            document.getElementById('levelup-modal').classList.add('hidden');
            this.state = 'PLAYING';
        });

        document.getElementById('levelup-modal').classList.remove('hidden');
    }

    handleGameOver() {
        this.state = 'GAME_OVER';

        // Salvar progresso
        this.progressionSystem.addXP(this.player.xp);
        this.progressionSystem.updateStats(this.player.level, this.kills, this.gameTime);

        // Atualizar estatísticas finais
        const minutes = Math.floor(this.gameTime / 60);
        const seconds = this.gameTime % 60;
        document.getElementById('final-time').textContent =
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('final-kills').textContent = this.kills;
        document.getElementById('final-level').textContent = this.player.level;

        // Mostrar tela de game over
        this.showScreen('gameover-screen');
    }

    updateMenuStats() {
        document.getElementById('dna-count').textContent = this.progressionSystem.data.dnaCoins;
        document.getElementById('total-xp').textContent = this.progressionSystem.data.totalXP;
    }

    showUpgradesScreen() {
        this.showScreen('upgrades-screen');
        this.renderUpgrades();
    }

    renderUpgrades() {
        const prog = this.progressionSystem;

        // Atualizar moedas
        document.getElementById('upgrade-xp').textContent = prog.data.totalXP;
        document.getElementById('upgrade-dna').textContent = prog.data.dnaCoins;

        // Upgrades básicos
        const basicContainer = document.getElementById('basic-upgrades');
        basicContainer.innerHTML = '';

        const basicUpgrades = [
            { key: 'startingHealth', name: 'Vida Inicial', desc: '+10 HP ao iniciar', icon: '❤️' },
            { key: 'startingDamage', name: 'Dano Inicial', desc: '+2 de dano ao iniciar', icon: '💪' },
            { key: 'startingSpeed', name: 'Velocidade Inicial', desc: '+0.2 de velocidade', icon: '🏃' },
            { key: 'xpMultiplier', name: 'Ganho de XP', desc: '+10% de XP ganho', icon: '⭐' },
            { key: 'startingWeapon', name: 'Arma Extra', desc: 'Começa com Células T', icon: '🧬', maxLevel: 1 }
        ];

        basicUpgrades.forEach(upgrade => {
            const level = prog.data.permanentUpgrades[upgrade.key] || 0;
            const maxLevel = upgrade.maxLevel || 10;
            const cost = prog.getUpgradeCost(upgrade.key, level);
            const canAfford = prog.canAffordUpgrade(upgrade.key);
            const isMaxed = level >= maxLevel;

            const item = document.createElement('div');
            item.className = 'upgrade-item' + (isMaxed ? ' max-level' : '');
            item.innerHTML = `
                <div class="upgrade-header">
                    <span class="upgrade-title">${upgrade.icon} ${upgrade.name}</span>
                    <span class="upgrade-level">Nível ${level}/${maxLevel}</span>
                </div>
                <div class="upgrade-description">${upgrade.desc}</div>
                <div class="upgrade-footer">
                    <span class="upgrade-cost">${isMaxed ? 'MÁXIMO' : `⭐ ${cost} XP`}</span>
                    <button class="upgrade-buy-btn" ${!canAfford || isMaxed ? 'disabled' : ''}>
                        ${isMaxed ? 'Máximo' : 'Comprar'}
                    </button>
                </div>
            `;

            if (!isMaxed) {
                item.querySelector('.upgrade-buy-btn').addEventListener('click', () => {
                    if (prog.purchaseUpgrade(upgrade.key)) {
                        this.renderUpgrades();
                        this.updateMenuStats();
                    }
                });
            }

            basicContainer.appendChild(item);
        });

        // Upgrades premium
        const premiumContainer = document.getElementById('premium-upgrades');
        premiumContainer.innerHTML = '';

        const premiumUpgrades = [
            { key: 'autoRevive', name: 'Auto-Reviver', desc: 'Revive automático ao morrer', icon: '💚', maxLevel: 3 },
            { key: 'permanentOrbital', name: 'Macrófagos Permanentes', desc: 'Começa com macrófagos orbitais', icon: '⚪', maxLevel: 1 },
            { key: 'doubleXP', name: 'XP Dobrado', desc: 'Ganhe 2x mais XP permanentemente', icon: '✨', maxLevel: 1 },
            { key: 'bossReward', name: 'Recompensa de Boss', desc: '+50% de recompensa de boss', icon: '👑', maxLevel: 1 },
            { key: 'immortalStart', name: 'Início Imortal', desc: '30s de invulnerabilidade no início', icon: '🛡️', maxLevel: 1 }
        ];

        premiumUpgrades.forEach(upgrade => {
            const level = prog.data.premiumUpgrades[upgrade.key] || 0;
            const maxLevel = upgrade.maxLevel;
            const cost = prog.getPremiumCost(upgrade.key, level);
            const canAfford = prog.canAffordPremium(upgrade.key);
            const isMaxed = level >= maxLevel;

            const item = document.createElement('div');
            item.className = 'upgrade-item' + (isMaxed ? ' max-level' : '');
            item.innerHTML = `
                <div class="upgrade-header">
                    <span class="upgrade-title">${upgrade.icon} ${upgrade.name}</span>
                    <span class="upgrade-level">${isMaxed ? 'ATIVO' : 'Nível 0/1'}</span>
                </div>
                <div class="upgrade-description">${upgrade.desc}</div>
                <div class="upgrade-footer">
                    <span class="upgrade-cost">${isMaxed ? 'ATIVO' : `🧬 ${cost} DNA`}</span>
                    <button class="upgrade-buy-btn" ${!canAfford || isMaxed ? 'disabled' : ''}>
                        ${isMaxed ? 'Ativo' : 'Comprar'}
                    </button>
                </div>
            `;

            if (!isMaxed) {
                item.querySelector('.upgrade-buy-btn').addEventListener('click', () => {
                    if (prog.purchasePremium(upgrade.key)) {
                        this.renderUpgrades();
                        this.updateMenuStats();
                    }
                });
            }

            premiumContainer.appendChild(item);
        });
    }

    handleReset() {
        const prog = this.progressionSystem;
        const dnaGain = Math.floor(prog.data.highestLevel / 5) +
            Math.floor(prog.data.totalKills / 100) +
            Math.floor(prog.data.longestTime / 60);

        if (dnaGain < 1) {
            alert('Você precisa progredir mais antes de resetar!\n\nGanhe DNA baseado em:\n- Nível máximo alcançado\n- Total de abates\n- Tempo de sobrevivência');
            return;
        }

        const confirmed = confirm(
            `Resetar seu progresso?\n\n` +
            `Você ganhará: 🧬 ${Math.max(1, dnaGain)} DNA\n\n` +
            `Isso resetará:\n` +
            `- XP Total\n` +
            `- Estatísticas de jogo\n\n` +
            `Você manterá:\n` +
            `- Todos os upgrades comprados\n` +
            `- DNA acumulado`
        );

        if (confirmed) {
            const gained = prog.reset();
            this.renderUpgrades();
            this.updateMenuStats();
            alert(`Reset completo!\n\nVocê ganhou 🧬 ${gained} DNA!`);
        }
    }

    update() {
        if (this.state !== 'PLAYING') return;

        // Incrementar tempo a cada segundo (60 frames)
        this.frameCount++;
        if (this.frameCount >= 60) {
            this.frameCount = 0;
            this.gameTime++;
        }

        // Atualizar jogador
        const result = this.player.update(
            this.canvas.width,
            this.canvas.height,
            this.enemySpawner.enemies,
            this.particleSystem
        );

        // Verificar se matou inimigo
        if (result && result.killed) {
            this.kills++;
            this.enemySpawner.dropXP(result.killed.x, result.killed.y, result.killed.xpValue);
            this.particleSystem.createBlood(result.killed.x, result.killed.y);

            // Shake ao matar boss
            if (result.killed.type === 'boss') {
                this.cameraShake = 30;
            } else {
                this.cameraShake = Math.min(this.cameraShake + 2, 10);
            }
        }

        // Reduzir camera shake
        if (this.cameraShake > 0) {
            this.cameraShake *= 0.9;
            if (this.cameraShake < 0.1) this.cameraShake = 0;
        }

        // Verificar level up
        const oldLevel = this.player.level;
        const leveledUp = this.player.xp >= this.player.xpToNextLevel;
        if (leveledUp) {
            this.handleLevelUp();
        }

        // Atualizar inimigos
        this.enemySpawner.update(this.gameTime, this.player);

        // Atualizar partículas
        this.particleSystem.update();

        // Verificar game over
        if (this.player.health <= 0) {
            this.cameraShake = 40;
            this.handleGameOver();
        }

        // Atualizar HUD
        this.updateHUD();
    }

    draw() {
        // Aplicar camera shake
        if (this.cameraShake > 0) {
            this.cameraX = (Math.random() - 0.5) * this.cameraShake;
            this.cameraY = (Math.random() - 0.5) * this.cameraShake;
        } else {
            this.cameraX = 0;
            this.cameraY = 0;
        }

        this.ctx.save();
        this.ctx.translate(this.cameraX, this.cameraY);

        // Background elaborado
        this.drawBackground();

        if (this.state === 'PLAYING' || this.state === 'LEVEL_UP') {
            // Desenhar entidades
            this.enemySpawner.draw(this.ctx);
            this.player.draw(this.ctx, this.particleSystem);
            this.particleSystem.draw(this.ctx);
        }

        this.ctx.restore();

        // Desenhar pausa
        if (this.state === 'PAUSED') {
            this.ctx.save();
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            this.ctx.fillStyle = '#00f0ff';
            this.ctx.font = 'bold 60px Orbitron';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('PAUSADO', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.font = '20px Inter';
            this.ctx.fillText('Pressione ESC para continuar', this.canvas.width / 2, this.canvas.height / 2 + 60);
            this.ctx.restore();
        }
    }

    drawBackground() {
        // Gradiente de fundo (interior do vaso sanguíneo)
        const bgGradient = this.ctx.createRadialGradient(
            this.canvas.width / 2, this.canvas.height / 2, 0,
            this.canvas.width / 2, this.canvas.height / 2, this.canvas.width
        );
        bgGradient.addColorStop(0, '#4a1a1a');
        bgGradient.addColorStop(0.5, '#3a0a0a');
        bgGradient.addColorStop(1, '#2a0505');
        this.ctx.fillStyle = bgGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.backgroundOffset += 0.3;
        const time = Date.now() * 0.0001;

        // Células vermelhas (hemácias) - REDUZIDO para 8
        this.ctx.save();
        for (let i = 0; i < 8; i++) {
            const x = ((i * 173.5 + this.backgroundOffset * 2) % this.canvas.width);
            const y = ((i * 241.7 + this.backgroundOffset * 1.5) % this.canvas.height);
            const size = 18;
            const rotation = time * 0.5 + i;

            this.ctx.save();
            this.ctx.translate(x, y);
            this.ctx.rotate(rotation);
            this.ctx.globalAlpha = 0.25;

            // Hemácia simplificada
            this.ctx.fillStyle = '#cc4444';
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, size, size * 0.4, 0, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.restore();
        }
        this.ctx.restore();

        // Plaquetas - REDUZIDO para 12
        this.ctx.save();
        for (let i = 0; i < 12; i++) {
            const x = ((i * 137.3 + this.backgroundOffset * 3) % this.canvas.width);
            const y = ((i * 197.1 + this.backgroundOffset * 2.5) % this.canvas.height);
            const size = 4;

            this.ctx.globalAlpha = 0.2;
            this.ctx.fillStyle = '#ffccaa';
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.restore();
    }

    gameLoop(currentTime) {
        // Calcular delta time
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        // Atualizar e desenhar
        this.update();
        this.draw();

        // Próximo frame
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

// Iniciar jogo quando a página carregar
window.addEventListener('load', () => {
    new Game();
});
