// Sistema de Upgrades
const UPGRADES = {
    // Armas
    weapon_bullet: {
        name: 'Anticorpos',
        description: 'Dispara mais anticorpos',
        icon: '🔬',
        maxLevel: 5,
        type: 'weapon_bullet'
    },
    weapon_magic: {
        name: 'Células T',
        description: 'Libera células T assassinas',
        icon: '🧬',
        maxLevel: 4,
        type: 'weapon_magic'
    },
    weapon_orbital: {
        name: 'Macrófagos',
        description: 'Macrófagos orbitam ao redor',
        icon: '⚪',
        maxLevel: 3,
        type: 'weapon_orbital'
    },
    weapon_lightning: {
        name: 'Interferon',
        description: 'Rajadas de interferon',
        icon: '⚡',
        maxLevel: 3,
        type: 'weapon_lightning'
    },

    // Stats
    stat_health: {
        name: 'Membrana Celular',
        description: '+20 HP e regeneração',
        icon: '🛡️',
        maxLevel: 10,
        type: 'stat_health'
    },
    stat_damage: {
        name: 'Potência Imune',
        description: '+5 de dano',
        icon: '💪',
        maxLevel: 10,
        type: 'stat_damage'
    },
    stat_speed: {
        name: 'Mobilidade Celular',
        description: 'Movimento mais rápido',
        icon: '🏃',
        maxLevel: 5,
        type: 'stat_speed'
    },
    stat_attackspeed: {
        name: 'Resposta Imune',
        description: 'Ataque mais rápido',
        icon: '⚡',
        maxLevel: 8,
        type: 'stat_attackspeed'
    }
};

class UpgradeSystem {
    constructor() {
        this.availableUpgrades = Object.keys(UPGRADES);
    }

    getRandomUpgrades(player, count = 3) {
        const options = [];
        const available = this.availableUpgrades.filter(key => {
            const upgrade = UPGRADES[key];
            const playerWeapon = player.weapons[key.replace('weapon_', '')];

            // Verificar se é arma e se já atingiu nível máximo
            if (key.startsWith('weapon_')) {
                if (playerWeapon && playerWeapon.level >= upgrade.maxLevel) {
                    return false;
                }
            }

            return true;
        });

        // Selecionar upgrades aleatórios
        const shuffled = available.sort(() => Math.random() - 0.5);
        for (let i = 0; i < Math.min(count, shuffled.length); i++) {
            const key = shuffled[i];
            const upgrade = UPGRADES[key];

            // Adicionar nível atual se for arma
            let displayName = upgrade.name;
            if (key.startsWith('weapon_')) {
                const weaponKey = key.replace('weapon_', '');
                const currentLevel = player.weapons[weaponKey]?.level || 0;
                displayName += ` (Nv. ${currentLevel + 1})`;
            }

            options.push({
                ...upgrade,
                key: key,
                displayName: displayName
            });
        }

        return options;
    }

    displayUpgrades(upgrades, onSelect) {
        const container = document.getElementById('upgrades-container');
        container.innerHTML = '';

        upgrades.forEach(upgrade => {
            const card = document.createElement('div');
            card.className = 'upgrade-card';
            card.innerHTML = `
                <div class="upgrade-icon">${upgrade.icon}</div>
                <div class="upgrade-name">${upgrade.displayName}</div>
                <div class="upgrade-desc">${upgrade.description}</div>
            `;

            card.addEventListener('click', () => {
                onSelect(upgrade);
            });

            container.appendChild(card);
        });
    }
}
