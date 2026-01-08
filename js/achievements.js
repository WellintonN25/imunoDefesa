// Sistema de Conquistas
class AchievementSystem {
    constructor() {
        this.achievements = this.defineAchievements();
        this.loadProgress();

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
            weaponTypes: new Set()
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
            weaponTypes: new Set()
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
}
