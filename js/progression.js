// Sistema de Progressão Permanente
class ProgressionSystem {
    constructor() {
        this.data = {
            totalXP: 0,
            dnaCoins: 0,
            highestLevel: 0,
            totalKills: 0,
            longestTime: 0,
            totalResets: 0,

            // Upgrades permanentes básicos (comprados com XP acumulado)
            permanentUpgrades: {
                startingHealth: 0,      // +10 HP inicial por nível
                startingDamage: 0,      // +2 dano inicial por nível
                startingSpeed: 0,       // +0.2 velocidade por nível
                xpMultiplier: 0,        // +10% XP por nível
                startingWeapon: 0       // Começa com arma extra desbloqueada
            },

            // Upgrades premium (comprados com DNA)
            premiumUpgrades: {
                autoRevive: 0,          // Revive automático (máx 3)
                permanentOrbital: 0,    // Começa com macrófagos orbitais
                doubleXP: 0,            // XP dobrado permanente
                bossReward: 0,          // +50% recompensa de boss
                immortalStart: 0        // 30s de invulnerabilidade no início
            }
        };

        this.load();
    }

    load() {
        const saved = localStorage.getItem('immunoDefesaProgress');
        if (saved) {
            const loaded = JSON.parse(saved);
            // Merge com dados padrão para compatibilidade
            this.data = { ...this.data, ...loaded };
        }
    }

    save() {
        localStorage.setItem('immunoDefesaProgress', JSON.stringify(this.data));
    }

    addXP(amount) {
        this.data.totalXP += amount;
        this.save();
    }

    updateStats(level, kills, time) {
        if (level > this.data.highestLevel) {
            this.data.highestLevel = level;
        }
        this.data.totalKills += kills;
        if (time > this.data.longestTime) {
            this.data.longestTime = time;
        }
        this.save();
    }

    reset() {
        // Calcular DNA ganho baseado no progresso
        const dnaGained = Math.floor(this.data.highestLevel / 5) +
            Math.floor(this.data.totalKills / 100) +
            Math.floor(this.data.longestTime / 60);

        this.data.dnaCoins += Math.max(1, dnaGained);

        // Resetar stats mas manter upgrades e DNA
        this.data.totalXP = 0;
        this.data.highestLevel = 0;
        this.data.totalKills = 0;
        this.data.longestTime = 0;
        this.data.totalResets++;

        this.save();
        return dnaGained;
    }

    // Custos de upgrades básicos (XP)
    getUpgradeCost(upgradeType, currentLevel) {
        const baseCosts = {
            startingHealth: 100,
            startingDamage: 150,
            startingSpeed: 200,
            xpMultiplier: 300,
            startingWeapon: 500
        };

        const base = baseCosts[upgradeType] || 100;
        return Math.floor(base * Math.pow(1.5, currentLevel));
    }

    // Custos de upgrades premium (DNA)
    getPremiumCost(upgradeType, currentLevel) {
        const costs = {
            autoRevive: 5,
            permanentOrbital: 10,
            doubleXP: 15,
            bossReward: 8,
            immortalStart: 12
        };

        return costs[upgradeType] || 5;
    }

    canAffordUpgrade(upgradeType) {
        const currentLevel = this.data.permanentUpgrades[upgradeType] || 0;
        const cost = this.getUpgradeCost(upgradeType, currentLevel);
        return this.data.totalXP >= cost;
    }

    canAffordPremium(upgradeType) {
        const currentLevel = this.data.premiumUpgrades[upgradeType] || 0;
        const maxLevels = { autoRevive: 3, permanentOrbital: 1, doubleXP: 1, bossReward: 1, immortalStart: 1 };

        if (currentLevel >= (maxLevels[upgradeType] || 1)) return false;

        const cost = this.getPremiumCost(upgradeType, currentLevel);
        return this.data.dnaCoins >= cost;
    }

    purchaseUpgrade(upgradeType) {
        if (!this.canAffordUpgrade(upgradeType)) return false;

        const currentLevel = this.data.permanentUpgrades[upgradeType] || 0;
        const cost = this.getUpgradeCost(upgradeType, currentLevel);

        this.data.totalXP -= cost;
        this.data.permanentUpgrades[upgradeType] = currentLevel + 1;
        this.save();
        return true;
    }

    purchasePremium(upgradeType) {
        if (!this.canAffordPremium(upgradeType)) return false;

        const currentLevel = this.data.premiumUpgrades[upgradeType] || 0;
        const cost = this.getPremiumCost(upgradeType, currentLevel);

        this.data.dnaCoins -= cost;
        this.data.premiumUpgrades[upgradeType] = currentLevel + 1;
        this.save();
        return true;
    }

    // Aplicar upgrades ao jogador
    applyToPlayer(player) {
        const perm = this.data.permanentUpgrades;
        const prem = this.data.premiumUpgrades;

        // Upgrades básicos
        player.maxHealth += perm.startingHealth * 10;
        player.health = player.maxHealth;
        player.damage += perm.startingDamage * 2;
        player.speed += perm.startingSpeed * 0.2;

        // Arma inicial extra
        if (perm.startingWeapon > 0) {
            player.weapons.magic.unlocked = true;
            player.weapons.magic.level = 1;
        }

        // Upgrades premium
        if (prem.permanentOrbital > 0) {
            player.weapons.orbital.unlocked = true;
            player.weapons.orbital.level = 1;
            player.orbitalWeapons.push(new OrbitalWeapon(player, player.damage * 0.8, 0.05, '#ffd700', 3));
        }

        if (prem.immortalStart > 0) {
            player.invulnerable = 60 * 30; // 30 segundos
        }

        // Armazenar multiplicadores para uso posterior
        player.xpMultiplier = 1 + (perm.xpMultiplier * 0.1) + (prem.doubleXP * 1);
        player.bossRewardMultiplier = 1 + (prem.bossReward * 0.5);
        player.autoRevives = prem.autoRevive;
    }
}
