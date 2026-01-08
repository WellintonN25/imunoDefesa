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
        this.upgradeSystem = new UpgradeSystem();
        this.progressionSystem = new ProgressionSystem();
        this.achievementSystem = new AchievementSystem();
        this.audioManager = new AudioManager();

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

        // Fila de notificações de conquistas
        this.achievementQueue = [];

        // Iniciar loop
        this.lastTime = 0;
        this.frameCount = 0;
        requestAnimationFrame((time) => this.gameLoop(time));

        // Inicializar com música de menu se áudio estiver ativo
        if (this.audioManager) {
            this.audioManager.playMusic('MENU');
        }
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
            this.audioManager.init(); // Inicia o contexto de áudio
            this.audioManager.resume();
            this.startGame();
        });

        // Botão Upgrades
        document.getElementById('upgrades-btn').addEventListener('click', () => {
            this.showUpgradesScreen();
        });

        // Botão Conquistas
        document.getElementById('achievements-btn').addEventListener('click', () => {
            this.showAchievementsScreen();
        });

        document.getElementById('stats-btn').addEventListener('click', () => {
            this.showStatsScreen();
        });

        document.getElementById('settings-btn').addEventListener('click', () => {
            this.audioManager.init(); // Garante init se entrar configs primeiro
            this.showSettingsScreen();
        });

        document.getElementById('save-settings-btn').addEventListener('click', () => {
            this.audioManager.saveSettings();
            this.showScreen('menu-screen');
        });

        // Sliders de Áudio
        const sliders = ['master', 'music', 'sfx', 'voice'];
        sliders.forEach(key => {
            document.getElementById(`vol-${key}`).addEventListener('input', (e) => {
                this.audioManager.volumes[key] = parseFloat(e.target.value);
                this.audioManager.updateVolumes();
            });
        });

        document.getElementById('back-stats-btn').addEventListener('click', () => {
            this.showScreen('menu-screen');
        });

        // Seletor de Título
        const titleSelect = document.getElementById('title-select');
        if (titleSelect) {
            titleSelect.addEventListener('change', (e) => {
                this.achievementSystem.selectTitle(e.target.value);
                this.updateMenuStats();
            });
        }

        // Botão Voltar do Upgrades
        document.getElementById('back-menu-btn').addEventListener('click', () => {
            this.showScreen('menu-screen');
            this.updateMenuStats();
        });

        // Botão Voltar das Conquistas
        document.getElementById('back-achievements-btn').addEventListener('click', () => {
            this.showScreen('menu-screen');
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
        this.cameraShakeIntensity = 0;
        this.backgroundOffset = 0;
        this.timeScale = 1;
        this.slowMotionTimer = 0;

        // Floating Text System (Pooling)
        this.textPoolSize = 50;
        this.floatingTexts = new Array(this.textPoolSize).fill(null).map(() => ({
            x: 0, y: 0, text: '', color: '#fff', size: 20, life: 0, active: false, velocityY: 0
        }));

        // Criar entidades
        this.player = new Player(this.canvas.width / 2, this.canvas.height / 2);

        // Aplicar upgrades permanentes
        this.progressionSystem.applyToPlayer(this.player);

        // Aplicar Skin
        this.player.updateSkin(this.achievementSystem);

        this.enemySpawner = new EnemySpawner(this.canvas.width, this.canvas.height);
        this.particleSystem.clear();

        // Resetar sessão de conquistas
        this.achievementSystem.resetSession();

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

    showSettingsScreen() {
        this.showScreen('settings-screen');
    }

    showAchievementsScreen() {
        this.showScreen('achievements-screen');
        this.achievementSystem.renderAchievements('achievements-grid');
    }

    showUpgradesScreen() {
        this.showScreen('upgrades-screen');
        this.renderUpgrades();
    }

    showStatsScreen() {
        this.showScreen('stats-screen');
        this.renderStats();
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
        // Iniciar música
        this.audioManager.playMusic('GAME');
        this.audioManager.speak('System Initialize. Defender ready.');
    }

    handleGameOver() {
        this.state = 'GAME_OVER';

        if (this.audioManager) {
            this.audioManager.stopMusic();
            this.audioManager.playSFX('HIT');
            this.audioManager.speak('System Critical. Mission Failed.');
        }

        // Salvar progresso
        this.progressionSystem.addXP(this.player.xp);
        this.progressionSystem.updateStats(this.player.level, this.kills, this.gameTime);

        // Salvar no histórico
        this.progressionSystem.saveRun({
            date: Date.now(),
            time: this.gameTime,
            kills: this.kills,
            level: this.player.level,
            xp: this.player.xp,
            // Identificar arma principal (a de maior nível)
            weapon: Object.entries(this.player.weapons)
                .sort((a, b) => b[1].level - a[1].level)[0][0]
        });

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

        // Atualizar Título no Menu
        const title = this.achievementSystem.getSelectedTitle();
        const titleElement = document.getElementById('player-title');
        if (titleElement) {
            titleElement.textContent = title ? `"${title}"` : '';
            titleElement.style.display = title ? 'block' : 'none';
        }
    }

    showUpgradesScreen() {
        this.showScreen('upgrades-screen');
        this.renderUpgrades();
    }

    showAchievementsScreen() {
        this.showScreen('achievements-screen');
        this.renderAchievements();
    }

    showStatsScreen() {
        this.showScreen('stats-screen');
        this.renderStats();
    }

    renderStats() {
        const data = this.progressionSystem.data;

        // Renderizar Cards de Resumo
        document.getElementById('stat-total-kills').textContent = data.totalKills.toLocaleString();
        document.getElementById('stat-highest-level').textContent = data.highestLevel;
        document.getElementById('stat-total-resets').textContent = data.totalResets;

        const minutes = Math.floor(data.longestTime / 60);
        const seconds = data.longestTime % 60;
        document.getElementById('stat-longest-time').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        // Renderizar Histórico
        const historyList = document.getElementById('run-history-list');
        historyList.innerHTML = '';

        if (!data.runHistory || data.runHistory.length === 0) {
            historyList.innerHTML = '<div style="text-align:center; padding: 2rem;">Nenhuma partida registrada ainda.</div>';
            return;
        }

        const fragment = document.createDocumentFragment();

        data.runHistory.forEach(run => {
            const date = new Date(run.date);
            const formattedDate = `${date.getDate()}/${date.getMonth() + 1} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;

            const runMinutes = Math.floor(run.time / 60);
            const runSeconds = run.time % 60;
            const timeStr = `${runMinutes}:${runSeconds.toString().padStart(2, '0')}`;

            const item = document.createElement('div');
            item.className = 'history-item';
            item.innerHTML = `
                <span>${formattedDate}</span>
                <span>${timeStr}</span>
                <span>Nv. ${run.level}</span>
                <span>💀 ${run.kills}</span>
                <span>${run.weapon || '-'}</span>
            `;
            fragment.appendChild(item);
        });
        historyList.appendChild(fragment);
    }

    renderAchievements() {
        const achievements = this.achievementSystem.getAchievementsList();
        const grid = document.getElementById('achievements-grid');
        grid.innerHTML = '';

        // Atualizar estatísticas
        document.getElementById('unlocked-count').textContent = this.achievementSystem.getUnlockedCount();
        document.getElementById('total-count').textContent = this.achievementSystem.getTotalCount();
        document.getElementById('achievement-progress').textContent = this.achievementSystem.getProgress() + '%';

        // Renderizar customização (Títulos e Skins)
        this.renderCustomization();

        const fragment = document.createDocumentFragment();

        // Renderizar conquistas
        achievements.forEach(achievement => {
            const card = document.createElement('div');
            card.className = 'achievement-card' + (achievement.unlocked ? ' unlocked' : ' locked');
            card.dataset.category = achievement.category;
            card.dataset.unlocked = achievement.unlocked;

            const name = this.achievementSystem.getDisplayName(achievement);
            const desc = this.achievementSystem.getDisplayDescription(achievement);

            let rewardText = '';
            if (achievement.reward.dna) rewardText += `🧬 ${achievement.reward.dna} DNA `;
            if (achievement.reward.title) rewardText += `🏆 Título: "${achievement.reward.title}" `;
            if (achievement.reward.skin) rewardText += `🎨 Skin: ${achievement.reward.skin} `;

            card.innerHTML = `
                <div class="achievement-card-icon">${achievement.icon}</div>
                <div class="achievement-card-content">
                    <div class="achievement-card-name">${name}</div>
                    <div class="achievement-card-desc">${desc}</div>
                    ${!achievement.unlocked && !achievement.secret && achievement.progress > 0 ?
                    `<div class="achievement-progress-bar">
                            <div class="achievement-progress-fill" style="width: ${achievement.progress}%"></div>
                            <span class="achievement-progress-text">${Math.floor(achievement.progress)}%</span>
                        </div>` : ''}
                    <div class="achievement-card-reward">${rewardText || 'Sem recompensa'}</div>
                </div>
                ${achievement.unlocked ? '<div class="achievement-unlocked-badge">✓</div>' : ''}
            `;

            fragment.appendChild(card);
        });
        grid.appendChild(fragment);

        // Configurar filtros
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const filter = btn.dataset.filter;
                document.querySelectorAll('.achievement-card').forEach(card => {
                    if (filter === 'all') {
                        card.style.display = 'flex';
                    } else if (filter === 'unlocked') {
                        card.style.display = card.dataset.unlocked === 'true' ? 'flex' : 'none';
                    } else {
                        card.style.display = card.dataset.category === filter ? 'flex' : 'none';
                    }
                });
            });
        });
    }

    renderCustomization() {
        // --- Títulos ---
        const titleSelect = document.getElementById('title-select');
        if (titleSelect) {
            const unlockedTitles = this.achievementSystem.getUnlockedTitles();
            const selectedTitle = this.achievementSystem.getSelectedTitle();

            titleSelect.innerHTML = '<option value="">Nenhum</option>';
            unlockedTitles.forEach(title => {
                const option = document.createElement('option');
                option.value = title;
                option.textContent = title;
                if (title === selectedTitle) option.selected = true;
                titleSelect.appendChild(option);
            });
        }

        // --- Skins ---
        const skinGrid = document.getElementById('skin-grid');
        if (skinGrid) {
            skinGrid.innerHTML = '';
            const skins = this.achievementSystem.skins;
            const selectedSkin = this.achievementSystem.getSelectedSkin();

            Object.entries(skins).forEach(([id, skin]) => {
                const isUnlocked = skin.unlocked;
                const card = document.createElement('div');
                card.className = 'skin-card' + (isUnlocked ? '' : ' locked') + (id === selectedSkin ? ' selected' : '');

                if (isUnlocked) {
                    card.onclick = () => {
                        this.achievementSystem.selectSkin(id);
                        this.renderCustomization();
                        // Atualizar preview do jogador no menu se possível (opcional)
                    };
                }

                const colorStyle = skin.gradient ?
                    `background: linear-gradient(135deg, ${skin.gradient[0]}, ${skin.gradient[1]})` :
                    `background-color: ${skin.color}`;

                const glowStyle = skin.glow ? `box-shadow: 0 0 10px ${skin.color}` : '';

                card.innerHTML = `
                    <div class="skin-preview" style="${colorStyle}; ${glowStyle}"></div>
                    <div class="skin-name">${skin.name}</div>
                    ${!isUnlocked ? '<div style="font-size: 1.2rem; margin-top:5px">🔒</div>' : ''}
                `;
                skinGrid.appendChild(card);
            });
        }
    }

    showAchievementNotification(achievement) {
        const notification = document.getElementById('achievement-notification');
        const icon = notification.querySelector('.achievement-icon');
        const name = notification.querySelector('.achievement-name');
        const reward = notification.querySelector('.achievement-reward');

        icon.textContent = achievement.icon;
        name.textContent = this.achievementSystem.getDisplayName(achievement);

        let rewardText = '';
        if (achievement.reward.dna) rewardText += `+${achievement.reward.dna} DNA `;
        if (achievement.reward.title) rewardText += `Título: "${achievement.reward.title}" `;
        if (achievement.reward.skin) rewardText += `Skin: ${achievement.reward.skin}`;
        reward.textContent = rewardText;

        // Aplicar recompensas
        if (achievement.reward.dna) {
            this.progressionSystem.data.dnaCoins += achievement.reward.dna;
            this.progressionSystem.save();
            this.updateMenuStats();
        }

        // Mostrar notificação
        notification.classList.remove('hidden');

        // Tocar som
        const isRare = achievement.category === 'challenging' || achievement.category === 'secret';
        this.playAchievementSound(isRare);

        // Auto-hide após 5 segundos
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 5000);
    }

    playAchievementSound(isRare = false) {
        // Usa o AudioManager centralizado se disponível
        if (this.audioManager) {
            this.audioManager.playSFX('LEVEL_UP');
            return;
        }

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;

            const audioContext = new AudioContext();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            // Som diferente para conquistas raras
            if (isRare) {
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.2);
                oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.4);
            } else {
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(900, audioContext.currentTime + 0.15);
            }

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            console.log('Áudio não disponível', e);
        }
    }


    renderUpgrades() {
        const prog = this.progressionSystem;

        // Verifica se audioManager existe antes de tocar som
        if (this.audioManager) {
            this.audioManager.playSFX('LEVEL_UP');
        }

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

            // Verificar conquistas globais
            const unlockedAchievements = this.achievementSystem.checkGlobalAchievements(this.progressionSystem);
            unlockedAchievements.forEach(achievement => {
                this.showAchievementNotification(achievement);
            });

            alert(`Reset completo!\n\nVocê ganhou 🧬 ${gained} DNA!`);
        }
    }

    update() {
        if (this.state !== 'PLAYING' && this.state !== 'LEVEL_UP') return;

        // --- JUICE: Slow Motion & Camera Shake ---
        if (this.slowMotionTimer > 0) {
            this.slowMotionTimer--;
            this.timeScale = 0.2;
        } else {
            this.timeScale = 1;
        }

        if (this.cameraShake > 0) {
            this.cameraShakeIntensity *= 0.9;
            this.cameraShake--;
            this.cameraX = (Math.random() - 0.5) * this.cameraShakeIntensity;
            this.cameraY = (Math.random() - 0.5) * this.cameraShakeIntensity;
        } else {
            this.cameraX = 0;
            this.cameraY = 0;
        }

        // --- JUICE: Floating Texts ---
        for (let i = 0; i < this.textPoolSize; i++) {
            const ft = this.floatingTexts[i];
            if (!ft.active) continue;
            ft.y += ft.velocityY * this.timeScale;
            ft.life--;
            if (ft.life <= 0) ft.active = false;
        }

        // --- Entidades ---
        this.particleSystem.update(); // Sempre atualiza visual

        if (this.state === 'PLAYING') {
            // Game Loop com chance baseada em TimeScale (Simula Slow Motion)
            if (Math.random() < this.timeScale) {

                // Atualizar Tempo
                this.frameCount++;
                if (this.frameCount >= 60) {
                    this.frameCount = 0;
                    this.gameTime++;
                    this.achievementSystem.updateStats('time', this.gameTime);
                }

                // Atualizar Jogador e receber resultado (kills)
                const oldLevel = this.player.level; // Guardar level antes do update

                const result = this.player.update(
                    this.canvas.width,
                    this.canvas.height,
                    this.enemySpawner.enemies,
                    this.particleSystem,
                    this.achievementSystem,
                    this // Passa referência do Game para Juice
                );

                // Atualizar Inimigos
                this.enemySpawner.update(this.gameTime, this.player);

                // Verificar Level Up (se mudou durante update de orbes)
                if (this.player.level > oldLevel) {
                    this.achievementSystem.updateStats('level', this.player.level);
                    this.triggerSlowMotion(60); // Slow motion ao upar (Juice!)
                    // Não chamamos handleLevelUp aqui pois queremos o slow motion primeiro, 
                    // mas s handleLevelUp pausa o jogo, então ok.
                    // Vamos chamar handleLevelUp no próximo frame ou agora?
                    // Se pausar, o slow motion não será visto. 
                    // Ideal: Slow motion por 1 seg, DEPOIS pausa.
                    // Mas isso requer estado de transição. Vamos manter simples: só chama handleLevelUp.
                    this.handleLevelUp();
                }

                // Lógica de Kill
                if (result && result.killed) {
                    this.kills++;
                    this.enemiesKilledSession++; // Para achievements
                    this.enemySpawner.dropXP(result.killed.x, result.killed.y, result.killed.xpValue);
                    this.particleSystem.createBlood(result.killed.x, result.killed.y);

                    this.handleKillAudio();

                    // Achievements de Kill
                    this.achievementSystem.updateStats('kill', 1);
                    if (result.killed.type === 'boss') {
                        this.achievementSystem.updateStats('boss', 1);
                        this.shakeCamera(30, 10); // Shake forte no boss
                    }
                    if (result.killed.maxHealth) {
                        this.achievementSystem.updateStats('total_damage', result.killed.maxHealth);
                    }
                    this.achievementSystem.sessionStats.killsInLast10Seconds.push(Date.now());
                }

                // (Level Up e Kill Logic já tratados acima)
            }
        }

        // Verificar Conquistas
        const unlockedAchievements = this.achievementSystem.checkAchievements();
        unlockedAchievements.forEach(achievement => {
            this.showAchievementNotification(achievement);
        });

        // Verificar Game Over
        if (this.player.health <= 0) {
            this.cameraShake = 40;
            this.handleGameOver();
        }

        this.updateHUD(); // Atualiza barras e textos
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

            // Draw Floating Texts
            this.ctx.textAlign = 'center';
            this.ctx.save();
            // Texto flutuante não deve ser afetado pelo shake da câmera se for UI, mas se for in-world deve.
            // Como já demos translate na câmera, está ok.
            for (let i = 0; i < this.textPoolSize; i++) {
                const ft = this.floatingTexts[i];
                if (!ft.active) continue;

                this.ctx.globalAlpha = Math.min(1, ft.life / 20);
                this.ctx.fillStyle = ft.color;
                this.ctx.font = `bold ${ft.size}px Orbitron`;
                this.ctx.strokeStyle = 'black';
                this.ctx.lineWidth = 2;
                this.ctx.strokeText(ft.text, ft.x, ft.y);
                this.ctx.fillText(ft.text, ft.x, ft.y);
            }
            this.ctx.restore();
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

    // JUICE HELPERS
    spawnFloatingText(x, y, text, color, size = 20) {
        // Encontrar slot livre
        for (let i = 0; i < this.textPoolSize; i++) {
            if (!this.floatingTexts[i].active) {
                this.floatingTexts[i].x = x + (Math.random() * 20 - 10);
                this.floatingTexts[i].y = y;
                this.floatingTexts[i].text = text;
                this.floatingTexts[i].color = color;
                this.floatingTexts[i].size = size;
                this.floatingTexts[i].life = 40; // frames
                this.floatingTexts[i].active = true;
                this.floatingTexts[i].velocityY = -2; // Resetar velocidade
                return;
            }
        }
    }

    shakeCamera(duration, intensity) {
        this.cameraShake = duration;
        this.cameraShakeIntensity = intensity;
    }

    triggerSlowMotion(duration) {
        this.slowMotionTimer = duration;
    }
}

// Iniciar jogo quando a página carregar
window.addEventListener('load', () => {
    new Game();
});
