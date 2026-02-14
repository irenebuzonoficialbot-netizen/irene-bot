const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./cards.db');
const fs = require('fs');

db.run(`
CREATE TABLE IF NOT EXISTS inventory (
    userId TEXT,
    code TEXT PRIMARY KEY,
    idol TEXT,
    grupo TEXT,
    era TEXT,
    issue INTEGER,
    image TEXT
)
`);

const { 
  Client, 
  GatewayIntentBits, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ComponentType,
  SlashCommandBuilder,
  REST,
  Routes
} = require('discord.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

const token = 'process.env.TOKEN';
const clientId = '1470797723602256035';

// JSON que SE QUEDAN
const cardsFile = './cards.json';
const favoritesFile = './favorites.json';


const cards = fs.existsSync(cardsFile) ? JSON.parse(fs.readFileSync(cardsFile)) : [];
let favorites = fs.existsSync(favoritesFile) ? JSON.parse(fs.readFileSync(favoritesFile)) : {};
const economy = fs.existsSync('./economy.json') ? JSON.parse(fs.readFileSync('./economy.json')) : {};

// Cooldowns
const COOLDOWN = 100000;
const cooldowns = new Map();

const PESCAR_COOLDOWN = 100000;
const pescarcooldowns = new Map();

const MINAR_COOLDOWN = 100000;
const minarcooldowns = new Map();

const DROP_COOLDOWN = 10 * 60 * 1000;
const dropCooldowns = new Map();

const SORTEO_COOLDOWN = 10 * 60 * 1000; // 10 minutos
const sorteoCooldowns = new Map();

// Comandos slash
const commands = [
    new SlashCommandBuilder().setName('trabajo').setDescription('Trabajar para ganar Irenes 💿'),
    new SlashCommandBuilder().setName('pescar').setDescription('Pesca para ganar Irenes 💿'),
    new SlashCommandBuilder().setName('minar').setDescription('Mina para ganar Irenes 💿'),
    new SlashCommandBuilder().setName('balance').setDescription('Ver tu dinero actual'),
     new SlashCommandBuilder().setName('cooldown').setDescription('Ver el tiempo restante de todos los cooldowns'),
    new SlashCommandBuilder().setName('drop').setDescription('Dropear una carta aleatoria'),
        new SlashCommandBuilder().setName('comprar_evento').setDescription('Compra un paquete de cartas de eventos (2000 irenes)'),
    new SlashCommandBuilder()
        .setName('ver')
        .setDescription('Ver una carta por su código')
        .addStringOption(option =>
            option.setName('codigo').setDescription('Código').setRequired(true)),
            new SlashCommandBuilder()
    .setName('lf')
    .setDescription('Configura o mira un LF')
    .addStringOption(option =>
        option.setName('texto')
            .setDescription('Escribe tu LF (opcional)'))
    .addUserOption(option =>
        option.setName('usuario')
            .setDescription('Ver el LF de alguien')),
    new SlashCommandBuilder()
    .setName('checklist')
    .setDescription('Muestra las cartas que te faltan')
    .addStringOption(option =>
        option.setName('grupo')
            .setDescription('Filtrar por grupo')
            .setRequired(false))
    .addStringOption(option =>
        option.setName('era')
            .setDescription('Filtrar por era')
            .setRequired(false))
    .addStringOption(option =>
        option.setName('idol')
            .setDescription('Filtrar por idol')
            .setRequired(false)),
     new SlashCommandBuilder()
        .setName('sorteo')
        .setDescription('Inicia un sorteo (solo administradores)'),
    new SlashCommandBuilder()
        .setName('dar')
        .setDescription('Regala una carta')
        .addUserOption(option =>
            option.setName('usuario').setDescription('Usuario').setRequired(true))
        .addStringOption(option =>
            option.setName('codigo').setDescription('Código').setRequired(true)),
    new SlashCommandBuilder()
        .setName('favorita')
        .setDescription('Elegir carta favorita')
        .addStringOption(option =>
            option.setName('codigo').setDescription('Código').setRequired(true)),
    new SlashCommandBuilder()
        .setName('inventario')
        .setDescription('Ver el inventario de un usuario')
        .addUserOption(option =>
        option.setName('usuario')
            .setDescription('Usuario del que quieres ver el inventario')
            .setRequired(false)
    ),
    new SlashCommandBuilder()
        .setName('topcollectors')
        .setDescription('Muestra el top de coleccionistas por grupo o idol')
        .addStringOption(option =>
            option.setName('tipo')
                .setDescription('Escoje "grupo" o "idol"')
                .setRequired(true)
                .addChoices(
                    { name: 'Grupo', value: 'grupo' },
                    { name: 'Idol', value: 'idol' }
                ))
        .addStringOption(option =>
            option.setName('nombre')
                .setDescription('Nombre del grupo o idol')
                .setRequired(true)),
new SlashCommandBuilder()
    .setName('perfil')
    .setDescription('Ver el perfil de un usuario')
    .addUserOption(option =>
        option.setName('usuario')
            .setDescription('Usuario del que quieres ver el perfil')
            .setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName('transferir')
    .setDescription('Dar dinero a alguien')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('A quién darle')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('cantidad')
        .setDescription('Cantidad de dinero')
        .setRequired(true))



].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(token);
(async () => {
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
})();

client.once('ready', () => {
    console.log(`Bot encendido como ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const userId = interaction.user.id;
    let embed;

// ================= TRABAJO =================
if (interaction.commandName === 'trabajo') {

    if (cooldowns.has(userId)) {
        const tiempo = cooldowns.get(userId) + COOLDOWN;
        if (Date.now() < tiempo) {
            const restante = Math.ceil((tiempo - Date.now()) / 1000);
            return interaction.reply({ content: `⏳ Espera ${restante}s`, ephemeral: true });
        }
    }

    cooldowns.set(userId, Date.now());

    const ganancia = Math.floor(Math.random() * 71) + 50;

    if (!economy[userId]) economy[userId] = { balance: 0 };
    economy[userId].balance += ganancia;
    fs.writeFileSync('./economy.json', JSON.stringify(economy, null, 2));

    return interaction.reply({
        embeds: [new EmbedBuilder()
            .setTitle("💼 Trabajo")
            .setDescription(`¡Ganaste ${ganancia} Irenes!`)
            .setColor("#e6add0")
            .setTimestamp()
        ]
    });

// ================= PESCAR =================
} else if (interaction.commandName === 'pescar') {

    await interaction.deferReply();

    if (pescarcooldowns.has(userId)) {
        const tiempo = pescarcooldowns.get(userId) + PESCAR_COOLDOWN;
        if (Date.now() < tiempo) {
            const restante = Math.ceil((tiempo - Date.now()) / 1000);
            return interaction.editReply({ content: `⏳ Espera ${restante}s`, ephemeral: true });
        }
    }

    pescarcooldowns.set(userId, Date.now());

    const ganancia = Math.floor(Math.random() * 71) + 50;
    if (!economy[userId]) economy[userId] = { balance: 0 };
    economy[userId].balance += ganancia;
    fs.writeFileSync('./economy.json', JSON.stringify(economy, null, 2));

    return interaction.editReply({
        embeds: [new EmbedBuilder()
            .setTitle("🎣 Pescar")
            .setDescription(`¡Ganaste ${ganancia} Irenes!`)
            .setColor("#e6add0")
            .setTimestamp()
        ]
    });

// ================= MINAR =================
} else if (interaction.commandName === 'minar') {

    await interaction.deferReply();

    if (minarcooldowns.has(userId)) {
        const tiempo = minarcooldowns.get(userId) + MINAR_COOLDOWN;
        if (Date.now() < tiempo) {
            const restante = Math.ceil((tiempo - Date.now()) / 1000);
            return interaction.editReply({ content: `⏳ Espera ${restante}s`, ephemeral: true });
        }
    }

    minarcooldowns.set(userId, Date.now());

    const ganancia = Math.floor(Math.random() * 71) + 50;
    if (!economy[userId]) economy[userId] = { balance: 0 };
    economy[userId].balance += ganancia;
    fs.writeFileSync('./economy.json', JSON.stringify(economy, null, 2));

    return interaction.editReply({
        embeds: [new EmbedBuilder()
            .setTitle("⛏️ Minar")
            .setDescription(`¡Ganaste ${ganancia} Irenes!`)
            .setColor("#e6add0")
            .setTimestamp()
        ]
    });
// ================= VER =================
} else if (interaction.commandName === 'ver') {

    await interaction.deferReply();

    const codes = interaction.options.getString('codigo').toUpperCase().split(/\s+/);

    let foundCards = [];

    for (const code of codes) {
        const card = await new Promise(resolve => {
            db.get(`SELECT * FROM inventory WHERE code=?`, [code], (err, row) => resolve(row));
        });
        if (card) foundCards.push(card);
    }

    if (foundCards.length === 0)
        return interaction.editReply("❌ No se encontraron cartas.");

    await interaction.editReply("🔎 Mostrando cartas...");

    for (const card of foundCards) {
        const embed = new EmbedBuilder()
            .setColor("#e6add0")
            .setTitle(card.idol)
            .setDescription(
`**Grupo:** ${card.grupo}
**Era:** ${card.era}
**Issue:** #${card.issue}
**Code:** ${card.code}
**Dueño:** <@${card.userId}>`
            )
            .setImage(card.image)
            .setTimestamp();

        await interaction.followUp({ embeds: [embed] });
        }

// ================= DAR =================
} else if (interaction.commandName === 'dar') {

    await interaction.deferReply();

    const target = interaction.options.getUser('usuario');
    const codes = interaction.options.getString('codigo').toUpperCase().split(/\s+/);

    let entregadas = [];

    for (const code of codes) {
        const card = await new Promise(resolve => {
            db.get(`SELECT * FROM inventory WHERE code=?`, [code], (err, row) => resolve(row));
        });

        if (!card || card.userId !== userId) continue;

        await new Promise(resolve => {
            db.run(`UPDATE inventory SET userId=? WHERE code=?`, [target.id, code], resolve);
        });

        entregadas.push(card);
    }

    if (entregadas.length === 0)
        return interaction.editReply("❌ No tienes esas cartas.");

    await interaction.editReply("✅ Transferencia realizada.");

    for (const card of entregadas) {
        const embed = new EmbedBuilder()
            .setColor("#e6add0")
            .setTitle("🎁 Carta Transferida")
            .setDescription(
`<@${target.id}> recibió una carta

**${card.grupo}**
${card.idol} • ${card.era}
🔖 ${card.code}`
            )
            .setImage(card.image)
            .setTimestamp();
     return interaction.editReply({ embeds: [embed] }); }
        // ================= COOLDOWN =================
         } else if (interaction.commandName === 'cooldown') {
    const userId = interaction.user.id;
    const now = Date.now();

    function formatTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;
        return `${m}m ${s}s`;
    }

    function getCooldown(map, cooldownTime) {
        const lastUse = map.get(userId);

        if (!lastUse) return "✅ Listo para usar";

        const finish = lastUse + cooldownTime;

        if (now >= finish) return "✅ Listo para usar";

        const remaining = finish - now;
        const unix = Math.floor(finish / 1000);

        return `⏳ Falta: ${formatTime(remaining)}
🕒 Se desbloquea: <t:${unix}:F>
⌛ Relativo: <t:${unix}:R>`;
    }

    const embed = new EmbedBuilder()
        .setTitle("⏱️ Cooldowns")
        .setColor("#00AAFF")
        .addFields(
            {
                name: "💼 TRABAJO",
                value: getCooldown(cooldowns, COOLDOWN),
                inline: false
            },
            {
                name: "🎣 PESCAR",
                value: getCooldown(pescarcooldowns, PESCAR_COOLDOWN),
                inline: false
            },
            {
                name: "⛏️ MINAR",
                value: getCooldown(minarcooldowns, MINAR_COOLDOWN),
                inline: false
            },
            {
                name: "🎴 DROP",
                value: getCooldown(dropCooldowns, DROP_COOLDOWN),
                inline: false
            }
        )
        .setTimestamp();
     return interaction.reply({ embeds: [embed] });
// ================= BALANCE =================
} else if (interaction.commandName === 'balance') {

    if (!economy[userId]) economy[userId] = { balance: 0 };

    const embed = new EmbedBuilder()
        .setColor("#e6add0")
        .setTitle(":moneybag: Balance")
        .setDescription(`Tienes **${economy[userId].balance} Irenes**`)
        .setTimestamp();

    return interaction.reply({ embeds: [embed] });


    // ================= DROP =================
    } else if (interaction.commandName === 'drop') {

        await interaction.deferReply();
        const now = Date.now();

        if (dropCooldowns.has(userId)) {
            const tiempo = dropCooldowns.get(userId) + DROP_COOLDOWN;
            if (now < tiempo) {
                const restante = Math.ceil((tiempo - now) / 1000);
                return interaction.editReply(`⏳ Espera ${restante}s antes de usar /drop de nuevo.`);
            }
        }

        dropCooldowns.set(userId, now);

        if (cards.length === 0)
            return interaction.editReply("❌ No hay cartas en cards.json.");

        const template = cards[Math.floor(Math.random() * cards.length)];

        db.get(
            `SELECT COUNT(*) as total FROM inventory WHERE code LIKE ?`,
            [`${template.codePrefix}%`],
            (err, row) => {

                if (err) return interaction.editReply("Error al calcular el issue.");

                const issue = (row?.total || 0) + 1;
                const code = `${template.codePrefix}${String(issue).padStart(4, '0')}`;

                db.run(
                    `INSERT INTO inventory (userId, idol, grupo, era, code, issue, image)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [userId, template.idol, template.grupo, template.era, code, issue, template.image]
                );

                const embed = new EmbedBuilder()
                    .setTitle(`Carta Dropeada: ${template.idol}`)
                    .setDescription(
                        `**Grupo:** ${template.grupo}\n` +
                        `**Era:** ${template.era}\n` +
                        `**Issue:** #${issue}\n` +
                        `**Code:** ${code}`
                    )
                    .setImage(template.image)
                    .setColor('#e6add0')
                    .setFooter({ text: 'Sistema de cartas Irene Bot' })
                    .setTimestamp();

                return interaction.editReply({ embeds: [embed] });
            }
        );

    // ================= INVENTARIO =================
} else if (interaction.commandName === 'inventario') {

    await interaction.deferReply();

    const targetUser = interaction.options.getUser('usuario') || interaction.user;
    const targetId = targetUser.id;

    db.all(
        `SELECT * FROM inventory WHERE userId = ? ORDER BY grupo ASC, idol ASC, era ASC`,
        [targetId],
        async (err, rows) => {

            if (err) return interaction.editReply("Error cargando inventario.");
            if (!rows || rows.length === 0)
                return interaction.editReply("❌ Este usuario no tiene cartas.");

            const itemsPerPage = 15;
            let currentPage = 0;
            const totalPages = Math.ceil(rows.length / itemsPerPage);

            function progressBar(page, total) {
                const size = 8;
                const progress = Math.round(((page + 1) / total) * size);
                return "▰".repeat(progress) + "▱".repeat(size - progress);
            }

            function generateEmbed(page) {
                const start = page * itemsPerPage;
                const end = start + itemsPerPage;
                const currentItems = rows.slice(start, end);

                const description = currentItems.map(c =>
`**${c.grupo}** • ${c.idol} • ${c.era}
└ 🔖 Code: **\`${c.code}\`**`
                ).join('\n\n');

                return new EmbedBuilder()
                    .setTitle(`📦 Inventario de ${targetUser.username}`)
                    .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                    .setColor('#e6add0')
                    .setDescription(description)
                    .addFields({
                        name: "📊 Progreso",
                        value: `${progressBar(page, totalPages)}\nPágina ${page + 1}/${totalPages} • ${rows.length} cartas`,
                    })
                    .setFooter({ text: 'Sistema de cartas Irene Bot' })
                    .setTimestamp();
            }

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('prev')
                    .setLabel('⬅️')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('next')
                    .setLabel('➡️')
                    .setStyle(ButtonStyle.Secondary)
            );

            const message = await interaction.editReply({
                embeds: [generateEmbed(currentPage)],
                components: totalPages > 1 ? [row] : []
            });

            if (totalPages <= 1) return;

            const collector = message.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: 120000
            });

            collector.on('collect', async i => {

                if (i.user.id !== interaction.user.id)
                    return i.reply({ content: "No puedes usar estos botones.", ephemeral: true });

                if (i.customId === 'prev') {
                    currentPage = currentPage > 0 ? currentPage - 1 : totalPages - 1;
                } else if (i.customId === 'next') {
                    currentPage = currentPage + 1 < totalPages ? currentPage + 1 : 0;
                }

                await i.update({
                    embeds: [generateEmbed(currentPage)],
                    components: [row]
                });
            });

            collector.on('end', () => {
                const disabledRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('prev')
                        .setLabel('⬅️')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('next')
                        .setLabel('➡️')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true)
                );

                message.edit({ components: [disabledRow] }).catch(() => {});
            });
        }
    );
// ================= FAVORITA =================
} else if (interaction.commandName === 'favorita') {

    const code = interaction.options.getString('codigo').toUpperCase();

    db.get(`SELECT * FROM inventory WHERE code=?`, [code], (err, card) => {

        if (!card || card.userId !== userId)
            return interaction.reply("❌ No tienes esa carta.");

        favorites[userId] = card;
        fs.writeFileSync(favoritesFile, JSON.stringify(favorites, null, 2));

        const embed = new EmbedBuilder()
            .setColor("#e6add0")
            .setTitle("⭐ Carta favorita actualizada")
            .setDescription(`${card.idol} ahora es tu favorita`)
            .setImage(card.image);

        return interaction.reply({ embeds: [embed] });
    });
// ================= TOP COLLECTORS =================
} else if (interaction.commandName === 'topcollectors') {

    await interaction.deferReply();

    const filtroInput = interaction.options.getString('filtro');
    if (!filtroInput) return interaction.editReply("❌ Debes especificar un **grupo** o **idol**.");

    const filtroLower = filtroInput.toLowerCase();

    // Leer economía
    let economyData = {};
    try {
        economyData = JSON.parse(fs.readFileSync('./economy.json', 'utf8'));
    } catch {
        economyData = {};
    }

    // Leer inventario de todos los usuarios desde SQLite
    db.all(`SELECT userId, grupo, idol FROM inventory`, [], (err, rows) => {

        if (err) return interaction.editReply("❌ Error leyendo inventory en DB.");
        if (!rows || rows.length === 0) return interaction.editReply("❌ No hay cartas registradas en la base de datos.");

        // Contar cartas por usuario según filtro
        const counts = {};

        for (const card of rows) {
            if (!card.grupo || !card.idol) continue;

            const grupoName = card.grupo.toLowerCase();
            const idolName = card.idol.toLowerCase();

            if (grupoName === filtroLower || idolName === filtroLower) {
                if (!counts[card.userId]) counts[card.userId] = 0;
                counts[card.userId]++;
            }
        }

        // Ordenar de mayor a menor y sacar top 20
        const sorted = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20);

        if (sorted.length === 0) return interaction.editReply(`❌ No se encontraron cartas de "${filtroInput}".`);

        // Construir descripción del embed
        let description = "";
        let rank = 1;
        for (const [userId, count] of sorted) {
            const balance = economyData[userId] ? economyData[userId].balance : 0;

            let medal = "";
            if (rank === 1) medal = "🥇";
            else if (rank === 2) medal = "🥈";
            else if (rank === 3) medal = "🥉";

            description += `${medal} **${rank}.** 💿 ${balance} Irenes — 🎴 ${count} cartas — <@${userId}>\n`;
            rank++;
        }

        const embed = new EmbedBuilder()
            .setTitle(`🏆 Top Collectors — ${filtroInput}`)
            .setDescription(description)
            .setColor("#e6add0")
            .setFooter({ text: "Sistema de colección Irene Bot" })
            .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
    });
    
// ================= CHECKLIST PRO =================
} else if (interaction.commandName === 'checklist') {

    await interaction.deferReply();

    const grupoInput = interaction.options.getString('grupo');
    const eraInput = interaction.options.getString('era');
    const idolInput = interaction.options.getString('idol');
    const userId = interaction.user.id;

    let cardsData = [];
    let eventosData = [];

    // Leer cards.json
    try {
        const data = JSON.parse(fs.readFileSync('./cards.json', 'utf8'));
        if (Array.isArray(data)) cardsData = data;
    } catch {}

    // Leer eventos.json
    try {
        const data = JSON.parse(fs.readFileSync('./eventos.json', 'utf8'));
        if (Array.isArray(data)) eventosData = data;
    } catch {}

    // Unir ambas bases
    const allCards = [...cardsData, ...eventosData];

    if (allCards.length === 0) {
        return interaction.editReply("❌ No hay cartas base.");
    }

    // FILTROS
    const filteredCards = allCards.filter(card => {
        const matchGrupo = !grupoInput || card.grupo?.toLowerCase() === grupoInput.toLowerCase();
        const matchEra = !eraInput || card.era?.toLowerCase() === eraInput.toLowerCase();
        const matchIdol = !idolInput || card.idol?.toLowerCase() === idolInput.toLowerCase();
        return matchGrupo && matchEra && matchIdol;
    });

    if (filteredCards.length === 0) {
        return interaction.editReply("❌ No se encontraron cartas con ese filtro.");
    }

    db.all(
        `SELECT idol, grupo, era FROM inventory WHERE userId = ?`,
        [userId],
        (err, rows) => {

            if (err) {
                return interaction.editReply("❌ Error leyendo inventario.");
            }

            const userCards = rows || [];

            let total = filteredCards.length;
            let obtained = 0;

            const eras = {};

            // Agrupar por era
            for (const card of filteredCards) {
                if (!eras[card.era]) eras[card.era] = [];
                eras[card.era].push(card);
            }

            let description = "";
            const sortedEras = Object.keys(eras).sort();

            for (const era of sortedEras) {

                const missing = [];

                const sortedCards = eras[era].sort((a, b) => 
                    a.idol.localeCompare(b.idol)
                );

                for (const baseCard of sortedCards) {

                    const hasCard = userCards.some(inv =>
                        inv.grupo?.toLowerCase() === baseCard.grupo?.toLowerCase() &&
                        inv.era?.toLowerCase() === baseCard.era?.toLowerCase() &&
                        inv.idol?.toLowerCase() === baseCard.idol?.toLowerCase()
                    );

                    if (hasCard) {
                        obtained++;
                    } else {
                        missing.push(baseCard.idol);
                    }
                }

                if (missing.length === 0) {
                    description += `**${era}:** ✅ Completada\n\n`;
                } else {
                    description += `**${era}:** ${missing.join(", ")}\n\n`;
                }
            }

            // Barra progreso
            const percent = Math.floor((obtained / total) * 100);
            const barLength = 14;
            const filled = Math.round((obtained / total) * barLength);
            const bar = "█".repeat(filled) + "░".repeat(barLength - filled);

            const embed = new EmbedBuilder()
                .setTitle(`📔 Checklist`)
                .setDescription(description || "Todo completado")
                .addFields({
                    name: "Progreso total",
                    value: `${bar}\n${obtained}/${total} cartas (${percent}%)`
                })
                .setColor(obtained === total ? "#00ff99" : "#ffffff")
                .setFooter({
                    text: "Sistema de colección Irene Bot"
                })
                .setTimestamp();

            interaction.editReply({ embeds: [embed] });
        }
    );
    } else if (interaction.commandName === 'lf') {

    const texto = interaction.options.getString('texto');
    const usuario = interaction.options.getUser('usuario');
    const userId = interaction.user.id;

    let data = {};
    try {
        data = JSON.parse(fs.readFileSync('./lf.json', 'utf8'));
    } catch {
        data = {};
    }

    // ===============================
    // 1) SI ESCRIBE TEXTO → GUARDA LF
    // ===============================
    if (texto) {

        data[userId] = texto;
        fs.writeFileSync('./lf.json', JSON.stringify(data, null, 2));

        const embed = new EmbedBuilder()
            .setColor("#00AAFF")
            .setTitle("✏️ LF actualizado")
            .setDescription(`Tu LF ahora dice:\n\n**${texto}**`)
            .setFooter({ text: "Usa /lf para verlo cuando quieras" });

        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ===============================
    // 2) VER LF DE OTRO USUARIO
    // ===============================
    if (usuario) {

        const lf = data[usuario.id];

        if (!lf) {
            return interaction.reply({
                content: "❌ Ese usuario no tiene LF.",
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setColor("#00AAFF")
            .setTitle(`🔎 LF de ${usuario.username}`)
            .setDescription(`**${lf}**`)
            .setThumbnail(usuario.displayAvatarURL({ dynamic: true }))
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }

    // ===============================
    // 3) VER TU PROPIO LF
    // (Solo presionas enter)
    // ===============================

    const miLF = data[userId];

    if (!miLF) {
        return interaction.reply({
            content: "❌ No tienes LF aún. Usa `/lf texto: ...` para crear uno.",
            ephemeral: true
        });
    }

    const embed = new EmbedBuilder()
        .setColor("#f3aff0")
        .setTitle("📌 Tu LF")
        .setDescription(`**${miLF}**`)
        .setTimestamp();

    interaction.reply({ embeds: [embed] });
// ================= TRANSFERIR =================
} else if (interaction.commandName === 'transferir') {

    await interaction.deferReply(); // ❌ ya no es ephemeral

    const senderId = interaction.user.id;
    const targetUser = interaction.options.getUser('usuario');
    const amount = interaction.options.getInteger('cantidad');

    // Leer economy.json
    let economy = {};
    try {
        economy = JSON.parse(fs.readFileSync('./economy.json', 'utf8'));
    } catch {
        economy = {};
    }

    // Inicializar balances si no existen
    if (!economy[senderId]) economy[senderId] = { balance: 0 };
    if (!economy[targetUser.id]) economy[targetUser.id] = { balance: 0 };

    // Validaciones
    if (amount <= 0) return interaction.editReply("❌ La cantidad debe ser mayor a 0.");
    if (economy[senderId].balance < amount) 
        return interaction.editReply(`❌ No tienes suficientes Irenes. Tu balance: ${economy[senderId].balance}`);

    // Realizar transferencia
    economy[senderId].balance = Number(economy[senderId].balance) - Number(amount);
    economy[targetUser.id].balance = Number(economy[targetUser.id].balance) + Number(amount);

    // Guardar cambios
    fs.writeFileSync('./economy.json', JSON.stringify(economy, null, 2));

    // Embed profesional rojo
    const embed = new EmbedBuilder()
        .setTitle("💸 Transferencia realizada")
        .setDescription(`${interaction.user} le ha dado **${amount} Irenes** a ${targetUser}`)
        .setColor('#e6add0')
        .addFields(
            { name: '💿 Nuevo balance de ' + interaction.user.username, value: `${economy[senderId].balance}`, inline: true },
            { name: '💿 Balance de ' + targetUser.username, value: `${economy[targetUser.id].balance}`, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: 'Sistema de Irenes Irene Bot' });

    return interaction.editReply({ embeds: [embed] });
    // ================= SORTEO =================
} else if (interaction.commandName === 'sorteo') {

    // Requiere permisos de administrador
    if (!interaction.member.permissions.has('Administrator')) {
        return interaction.reply({ content: '❌ Solo administradores pueden usar este comando.', ephemeral: true });
    }

    await interaction.deferReply();

    const embed = new EmbedBuilder()
        .setTitle('🎉 Sorteo!')
        .setDescription('Reacciona con 🎟️ para participar!\nEl sorteo terminará en 10 minutos.')
        .setColor('#e6add0')
        .setFooter({ text: 'Sistema de Irene Bot' })
        .setTimestamp();

    const message = await interaction.editReply({ embeds: [embed] });

    // Agregar la reacción inicial
    await message.react('🎟️');

    // Collector de reacciones
    const filter = (reaction, user) => {
        return reaction.emoji.name === '🎟️' && !user.bot;
    };

    const collector = message.createReactionCollector({
        filter,
        time: 10 * 60 * 1000 // 10 minutos
    });

    collector.on('end', collected => {
        const users = collected.get('🎟️')?.users.cache.filter(u => !u.bot) || new Map();

        if (users.size === 0) {
            const endEmbed = new EmbedBuilder()
                .setTitle('🎉 Sorteo terminado')
                .setDescription('Nadie participó 😢')
                .setColor('#e6add0')
                .setFooter({ text: 'Sistema de Irene Bot' })
                .setTimestamp();

            return interaction.followUp({ embeds: [endEmbed] });
        }

        // Elegir 3 ganadores al azar
        const winners = Array.from(users.values())
            .sort(() => 0.5 - Math.random())
            .slice(0, 3);

        const winnerMentions = winners.map(u => `<@${u.id}>`).join('\n');

        const endEmbed = new EmbedBuilder()
            .setTitle('🎉 Sorteo terminado!')
            .setDescription(`Ganadores:\n${winnerMentions}`)
            .setColor('#e6add0')
            .setFooter({ text: 'Sistema de Irene Bot' })
            .setTimestamp();

        interaction.followUp({ embeds: [endEmbed] });
    });
    // ================= COMPRAR EVENTO =================
} else if (interaction.commandName === 'comprar_evento') {

    const userId = interaction.user.id;

    // Leer economy
    let economy;
    try {
        economy = JSON.parse(fs.readFileSync('./economy.json', 'utf8'));
    } catch {
        return interaction.reply("❌ Error leyendo economy.json");
    }

    if (!economy[userId]) economy[userId] = { balance: 0 };

    if (economy[userId].balance < 2000) {
        return interaction.reply({
            content: "❌ Necesitas 2000 irenes para comprar este paquete.",
            ephemeral: true
        });
    }

    // Quitar dinero
    economy[userId].balance -= 2000;
    fs.writeFileSync('./economy.json', JSON.stringify(economy, null, 2));

    // Leer cartas de eventos
    let cards;
    try {
        cards = JSON.parse(fs.readFileSync('./eventos.json', 'utf8'));
    } catch {
        return interaction.reply("❌ No se pudo leer eventos.json");
    }

    if (!Array.isArray(cards) || cards.length === 0) {
        return interaction.reply("❌ No hay cartas en eventos.json");
    }

    // Carta aleatoria
    const card = cards[Math.floor(Math.random() * cards.length)];

    // Generar issue y code
    db.get(
        `SELECT COUNT(*) as total FROM inventory WHERE code LIKE ?`,
        [`${card.codePrefix}%`],
        (err, row) => {

            if (err) return interaction.reply("❌ Error generando carta.");

            const issue = (row?.total || 0) + 1;
            const code = `${card.codePrefix}${String(issue).padStart(4, '0')}`;

            // Guardar en cartas.db
            db.run(
                `INSERT INTO inventory (userId, code, idol, grupo, era, issue, image)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    userId,
                    code,
                    card.idol,
                    card.grupo,
                    card.era,
                    issue,
                    card.image
                ]
            );

            const embed = new EmbedBuilder()
                .setTitle("🎟️ Paquete de Evento")
                .setDescription(
                    `Has comprado un paquete por **2000 irenes**\n\n` +
                    `👤 Idol: **${card.idol}**\n` +
                    `👥 Grupo: **${card.grupo}**\n` +
                    `📀 Era: **${card.era}**\n` +
                    `🏷️ Code: ||${code}||\n` +
                    `#️⃣ Issue: **${issue}**`
                )
                .setImage(card.image)
                .setColor("#e6add0")
                .setFooter({ text: `Saldo restante: ${economy[userId].balance} irenes` })
                .setTimestamp();

            interaction.reply({ embeds: [embed] });
        }
    );
        // ================= PERFIL ===========
} else if (interaction.commandName === 'perfil') {

    await interaction.deferReply();

    const targetUser = interaction.options.getUser('usuario') || interaction.user;
    const targetId = targetUser.id;

    const economy = JSON.parse(fs.readFileSync("./economy.json", "utf8"));

    if (!economy[targetId]) economy[targetId] = { balance: 0 };

    db.all(`SELECT * FROM inventory WHERE userId=?`, [targetId], (err, rows) => {

        if (err) return interaction.editReply("Error cargando perfil.");

        const fav = favorites[targetId];

        const embed = new EmbedBuilder()
            .setTitle(`${targetUser.username} - Perfil`)
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .setColor('#e6add0')
            .addFields(
                { name: '💿 Dinero', value: `${economy[targetId].balance}`, inline: true },
                { name: '🎴 Cartas', value: `${rows.length}`, inline: true },
                { name: '⭐ Favorita', value: fav ? fav.code : 'Ninguna' }
            )
            .setTimestamp();

        if (fav) embed.setImage(fav.image);

        return interaction.editReply({ embeds: [embed] });


    }  )
    }});

client.login(process.env.DISCORD_TOKEN);

const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Bot encendido");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Web lista");
});

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});
