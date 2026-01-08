// Sistema de Conquistas
class AchievementSystem {
    constructor() {
        this.achievements = this.defineAchievements();
        this.skins = this.defineSkins();
        this.loadProgress();
        this.loadSkinProgress();

        // Título e skin selecionados
        this.selectedTitle = localStorage.getItem('selectedTitle') || '';
        this.selectedSkin = localStorage.getItem('selectedSkin') || 'default';

        // Rastreamento de sessão atual
        this.sessionStats = {
            timeAlive: 0,
            kills: 0,
            level: 0,
            bossesKilled: 0,
            damageTaken: 0,
            xpCollected: 0,
            shotsHit: 0,
            shotsMissed: 0,
            upgradesChosen: [],
            weaponTypes: new Set(),
            totalDamage: 0,
            weaponSwitches: 0,
            perfectShots: 0,
            startTime: 0,
            killsInLast10Seconds: []
        };
    }

    defineAchievements() {
        return {
            // ========== CONQUISTAS BÁSICAS ==========
            first_win: {
                id: 'first_win',
                name: 'Primeira Vitória',
                description: 'Sobreviva 1 minuto',
                icon: '🎯',
                category: 'basic',
                secret: false,
                unlocked: false,
                progress: 0,
                requirement: { type: 'time', target: 60 },
                reward: { dna: 5, title: 'Sobrevivente', skin: null }
            },
            hunter_100: {
                id: 'hunter_100',
                name: 'Caçador Iniciante',
                description: 'Elimine 100 inimigos',
                icon: '💀',
                category: 'basic',
                secret: false,
                unlocked: false,
                progress: 0,
                requirement: { type: 'kills', target: 100 },
                reward: { dna: 10, title: 'Caçador', skin: null }
            },
            survivor_10min: {
                id: 'survivor_10min',
                name: 'Sobrevivente',
                description: 'Sobreviva 10 minutos',
                icon: '⏱️',
                category: 'basic',
                secret: false,
                unlocked: false,
                progress: 0,
                requirement: { type: 'time', target: 600 },
                reward: { dna: 15, title: 'Resistente', skin: 'bronze' }
            },
            level_10: {
                id: 'level_10',
                name: 'Evoluído',
                description: 'Alcance nível 10',
                icon: '⭐',
                category: 'basic',
                secret: false,
                unlocked: false,
                progress: 0,
                requirement: { type: 'level', target: 10 },
                reward: { dna: 8, title: null, skin: null }
            },
            first_boss: {
                id: 'first_boss',
                name: 'Matador de Boss',
                description: 'Derrote seu primeiro boss',
                icon: '👑',
                category: 'basic',
                secret: false,
                unlocked: false,
                progress: 0,
                requirement: { type: 'bosses', target: 1 },
                reward: { dna: 10, title: 'Caçador de Titãs', skin: null }
            },
            collector: {
                id: 'collector',
                name: 'Colecionador',
                description: 'Colete 1000 XP em uma partida',
                icon: '🧬',
                category: 'basic',
                secret: false,
                unlocked: false,
                progress: 0,
                requirement: { type: 'xp', target: 1000 },
                reward: { dna: 8, title: null, skin: null }
            },
            first_reset: {
                id: 'first_reset',
                name: 'Renascido',
                description: 'Complete seu primeiro reset',
                icon: '🔄',
                category: 'basic',
                secret: false,
                unlocked: false,
                progress: 0,
                requirement: { type: 'resets', target: 1 },
                reward: { dna: 20, title: 'Renascido', skin: null }
            },
            upgraded: {
                id: 'upgraded',
                name: 'Aprimorado',
                description: 'Compre 5 upgrades permanentes',
                icon: '💪',
                category: 'basic',
                secret: false,
                unlocked: false,
                progress: 0,
                requirement: { type: 'upgrades', target: 5 },
                reward: { dna: 10, title: null, skin: null }
            },

            // ========== CONQUISTAS DESAFIADORAS ==========
            untouchable: {
                id: 'untouchable',
                name: 'Intocável',
                description: 'Sobreviva 5 minutos sem levar dano',
                icon: '🛡️',
                category: 'challenging',
                secret: false,
                unlocked: false,
                progress: 0,
                requirement: { type: 'no_damage', target: 300 },
                reward: { dna: 30, title: 'Intocável', skin: 'silver' }
            },
            master: {
                id: 'master',
                name: 'Mestre',
                description: 'Alcance nível 50',
                icon: '🏆',
                category: 'challenging',
                secret: false,
                unlocked: false,
                progress: 0,
                requirement: { type: 'level', target: 50 },
                reward: { dna: 40, title: 'Mestre', skin: null }
            },
            titan_slayer: {
                id: 'titan_slayer',
                name: 'Exterminador de Titãs',
                description: 'Derrote 10 bosses em uma partida',
                icon: '👹',
                category: 'challenging',
                secret: false,
                unlocked: false,
                progress: 0,
                requirement: { type: 'bosses', target: 10 },
                reward: { dna: 35, title: 'Exterminador', skin: null }
            },
            speedrunner: {
                id: 'speedrunner',
                name: 'Velocista',
                description: 'Sobreviva 15 minutos',
                icon: '⚡',
                category: 'challenging',
                secret: false,
                unlocked: false,
                progress: 0,
                requirement: { type: 'time', target: 900 },
                reward: { dna: 30, title: 'Velocista', skin: null }
            },
            genocide: {
                id: 'genocide',
                name: 'Genocida',
                description: 'Elimine 1000 inimigos em uma partida',
                icon: '💀',
                category: 'challenging',
                secret: false,
                unlocked: false,
                progress: 0,
                requirement: { type: 'kills', target: 1000 },
                reward: { dna: 35, title: 'Genocida', skin: null }
            },
            perfectionist: {
                id: 'perfectionist',
                name: 'Perfeccionista',
                description: 'Alcance 95% de precisão com 100+ tiros',
                icon: '🎯',
                category: 'challenging',
                secret: false,
                unlocked: false,
                progress: 0,
                requirement: { type: 'accuracy', target: 95 },
                reward: { dna: 40, title: 'Atirador de Elite', skin: null }
            },
            evolutionist: {
                id: 'evolutionist',
                name: 'Evolucionista',
                description: 'Compre todos os upgrades básicos',
                icon: '🧬',
                category: 'challenging',
                secret: false,
                unlocked: false,
                progress: 0,
                requirement: { type: 'all_upgrades', target: 1 },
                reward: { dna: 50, title: 'Evolucionista', skin: 'golden' }
            },

            // ========== CONQUISTAS SECRETAS ==========
            pacifist: {
                id: 'pacifist',
                name: '???',
                description: '???',
                icon: '🌟',
                category: 'secret',
                secret: true,
                unlocked: false,
                progress: 0,
                requirement: { type: 'pacifist', target: 180 },
                reward: { dna: 25, title: 'Pacifista', skin: null },
                hiddenName: 'Pacifista',
                hiddenDesc: 'Sobreviva 3 minutos sem matar nenhum inimigo'
            },
            lucky: {
                id: 'lucky',
                name: '???',
                description: '???',
                icon: '🎲',
                category: 'secret',
                secret: true,
                unlocked: false,
                progress: 0,
                requirement: { type: 'no_health_upgrades', target: 600 },
                reward: { dna: 30, title: 'Sortudo', skin: null },
                hiddenName: 'Sortudo',
                hiddenDesc: 'Sobreviva 10 minutos sem escolher upgrades de vida'
            },
            minimalist: {
                id: 'minimalist',
                name: '???',
                description: '???',
                icon: '💎',
                category: 'secret',
                secret: true,
                unlocked: false,
                progress: 0,
                requirement: { type: 'one_weapon', target: 20 },
                reward: { dna: 35, title: 'Minimalista', skin: null },
                hiddenName: 'Minimalista',
                hiddenDesc: 'Alcance nível 20 com apenas 1 tipo de arma'
            },
            immortal: {
                id: 'immortal',
                name: '???',
                description: '???',
                icon: '🔥',
                category: 'secret',
                secret: true,
                unlocked: false,
                progress: 0,
                requirement: { type: 'time', target: 1200 },
                reward: { dna: 50, title: 'Imortal', skin: 'neon' },
                hiddenName: 'Imortal',
                hiddenDesc: 'Sobreviva 20 minutos'
            },
            legend: {
                id: 'legend',
                name: '???',
                description: '???',
                icon: '🏅',
                category: 'secret',
                secret: true,
                unlocked: false,
                progress: 0,
                requirement: { type: 'level', target: 100 },
                reward: { dna: 100, title: 'Lenda', skin: 'rainbow' },
                hiddenName: 'Lenda',
                hiddenDesc: 'Alcance nível 100'
            },

            // ========== CONQUISTAS RARAS ADICIONAIS ==========
            perfect_warrior: {
                id: 'perfect_warrior',
                name: '???',
                description: '???',
                icon: '⚔️',
                category: 'secret',
                secret: true,
                unlocked: false,
                progress: 0,
                requirement: { type: 'perfect_accuracy', target: 1 },
                reward: { dna: 50, title: 'Guerreiro Perfeito', skin: null },
                hiddenName: 'Guerreiro Perfeito',
                hiddenDesc: 'Complete uma partida sem errar nenhum tiro'
            },
            tornado: {
                id: 'tornado',
                name: '???',
                description: '???',
                icon: '🌪️',
                category: 'secret',
                secret: true,
                unlocked: false,
                progress: 0,
                requirement: { type: 'kills_in_10s', target: 50 },
                reward: { dna: 40, title: 'Tornado', skin: null },
                hiddenName: 'Tornado',
                hiddenDesc: 'Elimine 50 inimigos em 10 segundos'
            },
            chameleon: {
                id: 'chameleon',
                name: '???',
                description: '???',
                icon: '🎭',
                category: 'secret',
                secret: true,
                unlocked: false,
                progress: 0,
                requirement: { type: 'weapon_switches', target: 20 },
                reward: { dna: 30, title: 'Camaleão', skin: null },
                hiddenName: 'Camaleão',
                hiddenDesc: 'Mude de arma principal 20 vezes em uma partida'
            },
            supreme_collector: {
                id: 'supreme_collector',
                name: '???',
                description: '???',
                icon: '💎',
                category: 'secret',
                secret: true,
                unlocked: false,
                progress: 0,
                requirement: { type: 'xp', target: 10000 },
                reward: { dna: 60, title: 'Colecionador Supremo', skin: null },
                hiddenName: 'Colecionador Supremo',
                hiddenDesc: 'Colete 10.000 XP em uma partida'
            },
            speedrun_master: {
                id: 'speedrun_master',
                name: '???',
                description: '???',
                icon: '⏰',
                category: 'secret',
                secret: true,
                unlocked: false,
                progress: 0,
                requirement: { type: 'speedrun', target: 30 },
                reward: { dna: 50, title: 'Mestre do Speedrun', skin: null },
                hiddenName: 'Mestre do Speedrun',
                hiddenDesc: 'Alcance nível 30 em menos de 10 minutos'
            },
            marathoner: {
                id: 'marathoner',
                name: '???',
                description: '???',
                icon: '🏃',
                category: 'secret',
                secret: true,
                unlocked: false,
                progress: 0,
                requirement: { type: 'time', target: 1800 },
                reward: { dna: 80, title: 'Maratonista', skin: null },
                hiddenName: 'Maratonista',
                hiddenDesc: 'Sobreviva 30 minutos'
            },
            street_fighter: {
                id: 'street_fighter',
                name: '???',
                description: '???',
                icon: '👊',
                category: 'secret',
                secret: true,
                unlocked: false,
                progress: 0,
                requirement: { type: 'bosses_no_magic', target: 5 },
                reward: { dna: 45, title: 'Lutador de Rua', skin: null },
                hiddenName: 'Lutador de Rua',
                hiddenDesc: 'Derrote 5 bosses sem usar armas mágicas'
            },
            elite_pro: {
                id: 'elite_pro',
                name: '???',
                description: '???',
                icon: '🎯',
                category: 'secret',
                secret: true,
                unlocked: false,
                progress: 0,
                requirement: { type: 'perfect_5min', target: 300 },
                reward: { dna: 70, title: 'Atirador de Elite Pro', skin: null },
                hiddenName: 'Atirador de Elite Pro',
                hiddenDesc: 'Mantenha 100% de precisão por 5 minutos'
            },
            destroyer: {
                id: 'destroyer',
                name: '???',
                description: '???',
                icon: '🔥',
                category: 'secret',
                secret: true,
                unlocked: false,
                progress: 0,
                requirement: { type: 'total_damage', target: 100000 },
                reward: { dna: 55, title: 'Destruidor', skin: null },
                hiddenName: 'Destruidor',
                hiddenDesc: 'Cause 100.000 de dano total em uma partida'
            },
            absolute_master: {
                id: 'absolute_master',
                name: '???',
                description: '???',
                icon: '🌟',
                category: 'secret',
                secret: true,
                unlocked: false,
                progress: 0,
                requirement: { type: 'all_achievements', target: 1 },
                reward: { dna: 200, title: 'Mestre Absoluto', skin: null },
                hiddenName: 'Mestre Absoluto',
                hiddenDesc: 'Desbloqueie todas as outras conquistas'
            }
        };
    }

    loadProgress() {
        const saved = localStorage.getItem('achievements');
        if (saved) {
            const data = JSON.parse(saved);
            Object.keys(data).forEach(id => {
                if (this.achievements[id]) {
                    this.achievements[id].unlocked = data[id].unlocked;
                    this.achievements[id].unlockedAt = data[id].unlockedAt;
                }
            });
        }
    }

    saveProgress() {
        const data = {};
        Object.keys(this.achievements).forEach(id => {
            data[id] = {
                unlocked: this.achievements[id].unlocked,
                unlockedAt: this.achievements[id].unlockedAt || null
            };
        });
        localStorage.setItem('achievements', JSON.stringify(data));
    }

    resetSession() {
        this.sessionStats = {
            timeAlive: 0,
            kills: 0,
            level: 0,
            bossesKilled: 0,
            damageTaken: 0,
            xpCollected: 0,
            shotsHit: 0,
            shotsMissed: 0,
            upgradesChosen: [],
            weaponTypes: new Set(),
            // New stats for rare achievements
            killsInLast10Seconds: [],
            weaponSwitches: 0,
            startTime: Date.now(),
            totalDamage: 0
        };
    }

    updateStats(type, value) {
        switch (type) {
            case 'time':
                this.sessionStats.timeAlive = value;
                break;
            case 'kill':
                this.sessionStats.kills++;
                break;
            case 'level':
                this.sessionStats.level = value;
                break;
            case 'boss':
                this.sessionStats.bossesKilled++;
                break;
            case 'damage':
                this.sessionStats.damageTaken += value;
                break;
            case 'xp':
                this.sessionStats.xpCollected += value;
                break;
            case 'shot_hit':
                this.sessionStats.shotsHit++;
                break;
            case 'shot_miss':
                this.sessionStats.shotsMissed++;
                break;
            case 'upgrade':
                this.sessionStats.upgradesChosen.push(value);
                break;
            case 'weapon':
                this.sessionStats.weaponTypes.add(value);
                break;
        }
    }

    checkAchievements() {
        const unlocked = [];

        Object.values(this.achievements).forEach(achievement => {
            if (achievement.unlocked) return;

            let shouldUnlock = false;

            switch (achievement.requirement.type) {
                case 'time':
                    shouldUnlock = this.sessionStats.timeAlive >= achievement.requirement.target;
                    achievement.progress = Math.min(100, (this.sessionStats.timeAlive / achievement.requirement.target) * 100);
                    break;

                case 'kills':
                    shouldUnlock = this.sessionStats.kills >= achievement.requirement.target;
                    achievement.progress = Math.min(100, (this.sessionStats.kills / achievement.requirement.target) * 100);
                    break;

                case 'level':
                    shouldUnlock = this.sessionStats.level >= achievement.requirement.target;
                    achievement.progress = Math.min(100, (this.sessionStats.level / achievement.requirement.target) * 100);
                    break;

                case 'bosses':
                    shouldUnlock = this.sessionStats.bossesKilled >= achievement.requirement.target;
                    achievement.progress = Math.min(100, (this.sessionStats.bossesKilled / achievement.requirement.target) * 100);
                    break;

                case 'xp':
                    shouldUnlock = this.sessionStats.xpCollected >= achievement.requirement.target;
                    achievement.progress = Math.min(100, (this.sessionStats.xpCollected / achievement.requirement.target) * 100);
                    break;

                case 'no_damage':
                    shouldUnlock = this.sessionStats.timeAlive >= achievement.requirement.target && this.sessionStats.damageTaken === 0;
                    achievement.progress = this.sessionStats.damageTaken === 0 ?
                        Math.min(100, (this.sessionStats.timeAlive / achievement.requirement.target) * 100) : 0;
                    break;

                case 'accuracy':
                    const totalShots = this.sessionStats.shotsHit + this.sessionStats.shotsMissed;
                    if (totalShots >= 100) {
                        const accuracy = (this.sessionStats.shotsHit / totalShots) * 100;
                        shouldUnlock = accuracy >= achievement.requirement.target;
                        achievement.progress = Math.min(100, accuracy);
                    }
                    break;

                case 'pacifist':
                    shouldUnlock = this.sessionStats.timeAlive >= achievement.requirement.target && this.sessionStats.kills === 0;
                    achievement.progress = this.sessionStats.kills === 0 ?
                        Math.min(100, (this.sessionStats.timeAlive / achievement.requirement.target) * 100) : 0;
                    break;

                case 'no_health_upgrades':
                    const hasHealthUpgrade = this.sessionStats.upgradesChosen.some(u =>
                        u.includes('health') || u.includes('regen') || u.includes('vida')
                    );
                    shouldUnlock = this.sessionStats.timeAlive >= achievement.requirement.target && !hasHealthUpgrade;
                    achievement.progress = !hasHealthUpgrade ?
                        Math.min(100, (this.sessionStats.timeAlive / achievement.requirement.target) * 100) : 0;
                    break;

                case 'one_weapon':
                    shouldUnlock = this.sessionStats.level >= achievement.requirement.target &&
                        this.sessionStats.weaponTypes.size === 1;
                    achievement.progress = this.sessionStats.weaponTypes.size === 1 ?
                        Math.min(100, (this.sessionStats.level / achievement.requirement.target) * 100) : 0;
                    break;

                // ========== NOVAS CONQUISTAS RARAS ==========

                case 'perfect_accuracy':
                    const totalShots2 = this.sessionStats.shotsHit + this.sessionStats.shotsMissed;
                    shouldUnlock = totalShots2 > 0 && this.sessionStats.shotsMissed === 0 && this.sessionStats.level >= 10;
                    achievement.progress = this.sessionStats.shotsMissed === 0 ? 100 : 0;
                    break;

                case 'kills_in_10s':
                    const now = Date.now();
                    const killsLog = this.sessionStats.killsInLast10Seconds || [];
                    const recentKills = killsLog.filter(t => now - t < 10000);
                    shouldUnlock = recentKills.length >= achievement.requirement.target;
                    achievement.progress = Math.min(100, (recentKills.length / achievement.requirement.target) * 100);
                    break;

                case 'weapon_switches':
                    shouldUnlock = this.sessionStats.weaponSwitches >= achievement.requirement.target;
                    achievement.progress = Math.min(100, (this.sessionStats.weaponSwitches / achievement.requirement.target) * 100);
                    break;

                case 'speedrun':
                    const elapsedMinutes = this.sessionStats.timeAlive / 60;
                    shouldUnlock = this.sessionStats.level >= achievement.requirement.target && elapsedMinutes <= 10;
                    achievement.progress = this.sessionStats.level >= achievement.requirement.target && elapsedMinutes <= 10 ? 100 : 0;
                    break;

                case 'bosses_no_magic':
                    // Esta conquista precisa ser rastreada separadamente no game.js
                    // Por enquanto, apenas verificamos se foi marcada manualmente
                    break;

                case 'perfect_5min':
                    const totalShots3 = this.sessionStats.shotsHit + this.sessionStats.shotsMissed;
                    const isPerfect = totalShots3 > 0 && this.sessionStats.shotsMissed === 0;
                    shouldUnlock = this.sessionStats.timeAlive >= achievement.requirement.target && isPerfect;
                    achievement.progress = isPerfect ? Math.min(100, (this.sessionStats.timeAlive / achievement.requirement.target) * 100) : 0;
                    break;

                case 'total_damage':
                    shouldUnlock = this.sessionStats.totalDamage >= achievement.requirement.target;
                    achievement.progress = Math.min(100, (this.sessionStats.totalDamage / achievement.requirement.target) * 100);
                    break;

                case 'all_achievements':
                    const totalAchievements = Object.keys(this.achievements).length - 1; // Menos esta própria
                    const unlockedCount = Object.values(this.achievements).filter(a => a.unlocked && a.id !== 'absolute_master').length;
                    shouldUnlock = unlockedCount >= totalAchievements;
                    achievement.progress = Math.min(100, (unlockedCount / totalAchievements) * 100);
                    break;
            }

            if (shouldUnlock) {
                this.unlockAchievement(achievement.id);
                unlocked.push(achievement);
            }
        });

        return unlocked;
    }

    checkGlobalAchievements(progressionSystem) {
        const unlocked = [];

        // Verificar conquista de reset
        const resetAchievement = this.achievements.first_reset;
        if (!resetAchievement.unlocked && progressionSystem.data.totalResets >= 1) {
            this.unlockAchievement('first_reset');
            unlocked.push(resetAchievement);
        }

        // Verificar conquista de upgrades
        const upgradeAchievement = this.achievements.upgraded;
        if (!upgradeAchievement.unlocked) {
            const totalUpgrades = Object.values(progressionSystem.data.permanentUpgrades).reduce((a, b) => a + b, 0);
            if (totalUpgrades >= 5) {
                this.unlockAchievement('upgraded');
                unlocked.push(upgradeAchievement);
            }
            upgradeAchievement.progress = Math.min(100, (totalUpgrades / 5) * 100);
        }

        // Verificar conquista de todos os upgrades
        const allUpgradesAchievement = this.achievements.evolutionist;
        if (!allUpgradesAchievement.unlocked) {
            const basicUpgrades = progressionSystem.data.permanentUpgrades;
            const allMaxed = Object.keys(basicUpgrades).every(key => {
                const maxLevel = key === 'startingWeapon' ? 1 : 10;
                return basicUpgrades[key] >= maxLevel;
            });
            if (allMaxed) {
                this.unlockAchievement('evolutionist');
                unlocked.push(allUpgradesAchievement);
            }
        }

        return unlocked;
    }

    unlockAchievement(id) {
        const achievement = this.achievements[id];
        if (!achievement || achievement.unlocked) return null;

        achievement.unlocked = true;
        achievement.unlockedAt = Date.now();
        achievement.progress = 100;

        // Desbloquear skin se houver
        this.checkAndUnlockSkin(achievement);

        this.saveProgress();
        return achievement;
    }

    getAchievementsList() {
        return Object.values(this.achievements);
    }

    getUnlockedCount() {
        return Object.values(this.achievements).filter(a => a.unlocked).length;
    }

    getTotalCount() {
        return Object.keys(this.achievements).length;
    }

    getProgress() {
        return Math.floor((this.getUnlockedCount() / this.getTotalCount()) * 100);
    }

    getDisplayName(achievement) {
        if (achievement.secret && !achievement.unlocked) {
            return '???';
        }
        return achievement.hiddenName || achievement.name;
    }

    getDisplayDescription(achievement) {
        if (achievement.secret && !achievement.unlocked) {
            return 'Conquista secreta - descubra como desbloquear!';
        }
        return achievement.hiddenDesc || achievement.description;
    }

    defineSkins() {
        return {
            default: {
                name: 'Padrão',
                color: '#00f0ff',
                unlocked: true
            },
            bronze: {
                name: 'Bronze',
                color: '#cd7f32',
                unlocked: false
            },
            silver: {
                name: 'Prata',
                color: '#c0c0c0',
                unlocked: false
            },
            golden: {
                name: 'Dourado',
                color: '#ffd700',
                unlocked: false
            },
            neon: {
                name: 'Neon',
                color: '#00ff00',
                glow: true,
                unlocked: false
            },
            rainbow: {
                name: 'Arco-íris',
                gradient: ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#9400d3'],
                unlocked: false
            }
        };
    }

    // ========== SISTEMA DE TÍTULOS ==========

    getUnlockedTitles() {
        const titles = [];
        Object.values(this.achievements).forEach(achievement => {
            if (achievement.unlocked && achievement.reward.title) {
                titles.push(achievement.reward.title);
            }
        });
        return titles;
    }

    selectTitle(title) {
        const unlockedTitles = this.getUnlockedTitles();
        if (title === '' || unlockedTitles.includes(title)) {
            this.selectedTitle = title;
            localStorage.setItem('selectedTitle', title);
            return true;
        }
        return false;
    }

    getSelectedTitle() {
        return this.selectedTitle;
    }

    // ========== SISTEMA DE SKINS ==========

    unlockSkin(skinId) {
        if (this.skins[skinId]) {
            this.skins[skinId].unlocked = true;
            this.saveSkinProgress();
        }
    }

    getUnlockedSkins() {
        const unlocked = [];
        Object.keys(this.skins).forEach(skinId => {
            if (this.skins[skinId].unlocked) {
                unlocked.push(skinId);
            }
        });
        return unlocked;
    }

    selectSkin(skinId) {
        if (this.skins[skinId] && this.skins[skinId].unlocked) {
            this.selectedSkin = skinId;
            localStorage.setItem('selectedSkin', skinId);
            return true;
        }
        return false;
    }

    getSelectedSkin() {
        return this.skins[this.selectedSkin];
    }

    saveSkinProgress() {
        const skinData = {};
        Object.keys(this.skins).forEach(skinId => {
            skinData[skinId] = this.skins[skinId].unlocked;
        });
        localStorage.setItem('unlockedSkins', JSON.stringify(skinData));
    }

    loadSkinProgress() {
        const saved = localStorage.getItem('unlockedSkins');
        if (saved) {
            const skinData = JSON.parse(saved);
            Object.keys(skinData).forEach(skinId => {
                if (this.skins[skinId]) {
                    this.skins[skinId].unlocked = skinData[skinId];
                }
            });
        }
    }

    // Desbloquear skin ao desbloquear conquista
    checkAndUnlockSkin(achievement) {
        if (achievement.reward.skin) {
            this.unlockSkin(achievement.reward.skin);
        }
    }
}
