require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  Events,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits: P,
  SlashCommandBuilder,
  MessageFlags,
} = require("discord.js");

const TOKEN = process.env.TOKEN;
const GUILD_ID = process.env.GUILD_ID || "1521594932006223872";

if (!TOKEN) {
  console.error("❌ Falta TOKEN en el archivo .env");
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

// ═══════════════════════════════════════════════════════════
//  CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════

const AZUL = 0x5865f2;
const VERDE = 0x2ecc71;

// El orden importa: el primero queda más arriba en la jerarquía.
const ROLES = [
  { key: "dueno", name: "👑 Dueño", color: 0xd4af37, perms: [P.Administrator], hoist: true },
  { key: "miembro", name: "✅ Miembro", color: 0x2ecc71, perms: [], hoist: true },
  // Roles que cada quien se pone con botones
  { key: "gamer", name: "🎮 Gamer", color: 0xe67e22, perms: [], hoist: false, auto: true },
  { key: "estudio", name: "📚 Estudio", color: 0x3498db, perms: [], hoist: false, auto: true },
  { key: "dev", name: "💻 Dev", color: 0x9b59b6, perms: [], hoist: false, auto: true },
];

// acceso: publico_lectura | miembros | miembros_lectura
const ESTRUCTURA = [
  {
    // Lo ÚNICO que ve alguien que acaba de entrar. Al elegir un rol se desbloquea todo lo demás.
    categoria: "━━ 🎭 EMPIEZA AQUÍ ━━",
    acceso: "publico_lectura",
    canales: [
      { id: "roles", name: "🎭┃elige-tu-rol", topic: "Elige un rol para desbloquear el servidor" },
    ],
  },
  {
    categoria: "━━ 📌 INICIO ━━",
    acceso: "miembros_lectura",
    canales: [
      { id: "bienvenida", name: "👋┃bienvenida", topic: "Bienvenido a mi espacio ✨" },
      { id: "avisos", name: "📣┃avisos", topic: "Avisos importantes (entregas, parciales, eventos)" },
    ],
  },
  {
    categoria: "━━ 📚 ESTUDIO ━━",
    acceso: "miembros",
    canales: [
      { name: "📅┃calendario", topic: "Horarios, entregas, parciales y fechas clave" },
      { name: "📝┃apuntes", topic: "Resúmenes, apuntes y fotos de pizarra" },
      { name: "🧮┃matematicas-fisica", topic: "Cálculo, álgebra, física, estadística" },
      { name: "❓┃dudas", topic: "Pregunta lo que no entiendas" },
      { name: "📖┃recursos", topic: "Libros, PDFs, cursos y videos útiles" },
    ],
  },
  {
    categoria: "━━ 💻 PROYECTOS ━━",
    acceso: "miembros",
    canales: [
      { name: "💡┃ideas", topic: "Ideas de proyectos y brainstorming" },
      { name: "💻┃codigo", topic: "Comparte y revisa código" },
      { name: "🐛┃bugs-y-ayuda", topic: "Errores, stack traces y ayuda para depurar" },
      { name: "🗃️┃bases-de-datos", topic: "SQL, modelos ER, normalización" },
      { name: "🧠┃algoritmos", topic: "Estructuras de datos, algoritmos y retos" },
      { name: "🐙┃github-y-links", topic: "Repos, herramientas y enlaces útiles" },
    ],
  },
  {
    categoria: "━━ 🎮 JUEGOS ━━",
    acceso: "miembros",
    canales: [
      { name: "🎮┃juegos", topic: "Habla de tus juegos favoritos" },
      { name: "🔍┃buscar-equipo", topic: "¿Quién se une a jugar?" },
      { name: "🎬┃clips", topic: "Tus mejores jugadas" },
    ],
  },
  {
    categoria: "━━ 💬 GENERAL ━━",
    acceso: "miembros",
    canales: [
      { name: "💬┃chat-general", topic: "Charla de todo un poco" },
      { name: "😂┃memes", topic: "Memes de programación y de la vida" },
      { name: "🤖┃comandos", topic: "Usa los bots aquí" },
    ],
  },
  {
    categoria: "━━ 🔊 VOZ ━━",
    acceso: "miembros",
    canales: [
      { name: "🔊 Lounge", voz: true },
      { name: "📚 Estudio en grupo", voz: true },
      { name: "🤫 Concentración", voz: true },
      { name: "🎮 Gaming", voz: true },
      { name: "😴 AFK", voz: true },
    ],
  },
];

const BIENVENIDA_PASOS =
  "Un espacio para **estudiar, programar y jugar**.\n\n" +
  "📚 Estudio → apuntes, dudas y recursos\n" +
  "💻 Proyectos → ideas, código y ayuda\n" +
  "🎮 Juegos → equipo, clips y charla\n";

// ═══════════════════════════════════════════════════════════
//  COMANDOS
// ═══════════════════════════════════════════════════════════

const comandos = [
  new SlashCommandBuilder()
    .setName("setup")
    .setDescription("👑 Construye todo el servidor (borra lo anterior)")
    .setDefaultMemberPermissions(P.Administrator)
    .addBooleanOption((o) =>
      o.setName("borrar").setDescription("Borrar canales y roles actuales (por defecto: sí)"),
    ),
  new SlashCommandBuilder()
    .setName("aviso")
    .setDescription("📣 Publica un aviso en el canal de avisos")
    .setDefaultMemberPermissions(P.Administrator)
    .addStringOption((o) => o.setName("titulo").setDescription("Título").setRequired(true))
    .addStringOption((o) => o.setName("mensaje").setDescription("Contenido").setRequired(true))
    .addBooleanOption((o) => o.setName("mencionar").setDescription("Mencionar a @everyone")),
  new SlashCommandBuilder()
    .setName("limpiar")
    .setDescription("🧹 Borra mensajes del canal")
    .setDefaultMemberPermissions(P.ManageMessages)
    .addIntegerOption((o) =>
      o.setName("cantidad").setDescription("1 a 100").setMinValue(1).setMaxValue(100).setRequired(true),
    ),
].map((c) => c.toJSON());

// ═══════════════════════════════════════════════════════════
//  AUXILIARES
// ═══════════════════════════════════════════════════════════

const rolPorKey = (guild, key) => {
  const cfg = ROLES.find((r) => r.key === key);
  return guild.roles.cache.find((r) => r.name === cfg.name);
};

const canalTexto = (guild, parte) =>
  guild.channels.cache.find((c) => c.type === ChannelType.GuildText && c.name.includes(parte));

function permisosPara(acceso, roles, guild) {
  const E = guild.roles.everyone.id;
  const ver = [P.ViewChannel, P.ReadMessageHistory];
  const full = [...ver, P.SendMessages, P.AddReactions, P.AttachFiles, P.EmbedLinks, P.Connect, P.Speak, P.Stream];

  switch (acceso) {
    case "publico_lectura":
      return [
        { id: E, allow: ver, deny: [P.SendMessages, P.AddReactions] },
        { id: roles.dueno.id, allow: [...ver, P.SendMessages] },
      ];
    case "miembros":
      return [{ id: E, deny: [P.ViewChannel] }, { id: roles.miembro.id, allow: full }];
    case "miembros_lectura":
      return [
        { id: E, deny: [P.ViewChannel] },
        { id: roles.miembro.id, allow: ver, deny: [P.SendMessages] },
        { id: roles.dueno.id, allow: [...ver, P.SendMessages] },
      ];
  }
}

const botonesRoles = () =>
  new ActionRowBuilder().addComponents(
    ROLES.filter((r) => r.auto).map((r) =>
      new ButtonBuilder().setCustomId(`rol:${r.key}`).setLabel(r.name).setStyle(ButtonStyle.Secondary),
    ),
  );

// ═══════════════════════════════════════════════════════════
//  SETUP
// ═══════════════════════════════════════════════════════════

async function configurarServidor(guild, ejecutor, borrar, log) {
  await guild.roles.fetch();
  await guild.channels.fetch();

  // 1) Limpieza
  if (borrar) {
    for (const [, ch] of guild.channels.cache) await ch.delete().catch(() => {});
    for (const [, r] of guild.roles.cache) {
      if (!r.managed && r.id !== guild.id && r.editable) await r.delete().catch(() => {});
    }
    log("🗑️ Servidor limpiado");
  }

  // 2) Roles
  const roles = {};
  for (const r of ROLES) {
    roles[r.key] = await guild.roles.create({
      name: r.name,
      color: r.color,
      permissions: r.perms,
      hoist: r.hoist,
      mentionable: false,
      reason: "Setup personal",
    });
  }
  log("🎭 Roles creados");

  // 3) Categorías y canales
  const canales = {};
  for (const bloque of ESTRUCTURA) {
    const cat = await guild.channels.create({
      name: bloque.categoria,
      type: ChannelType.GuildCategory,
      permissionOverwrites: permisosPara(bloque.acceso, roles, guild),
    });
    for (const c of bloque.canales) {
      const ch = await guild.channels.create({
        name: c.name,
        type: c.voz ? ChannelType.GuildVoice : ChannelType.GuildText,
        parent: cat.id,
        ...(c.voz ? {} : { topic: c.topic }),
      });
      if (c.id) canales[c.id] = ch;
    }
  }
  log("📁 Categorías y canales creados");

  // 4) Mensajes iniciales
  await canales.bienvenida.send({
    embeds: [
      new EmbedBuilder()
        .setColor(AZUL)
        .setTitle(`✨ Bienvenido a ${guild.name} ✨`)
        .setDescription(BIENVENIDA_PASOS),
    ],
  });

  await canales.roles.send({
    embeds: [
      new EmbedBuilder()
        .setColor(VERDE)
        .setTitle("🎭 Elige tu rol para entrar")
        .setDescription(
          "Pulsa **al menos un botón** y se desbloquea todo el servidor 🔓\n\n" +
            "Puedes cambiar o quitar tus roles cuando quieras.",
        ),
    ],
    components: [botonesRoles()],
  });
  log("💌 Mensajes publicados");

  // 5) Rol Dueño para ti y para el dueño del servidor
  const ids = new Set([ejecutor.id]);
  const dueno = await guild.fetchOwner().catch(() => null);
  if (dueno) ids.add(dueno.id);
  for (const id of ids) {
    const miembro = await guild.members.fetch(id).catch(() => null);
    if (miembro) {
      await miembro.roles
        .add([roles.dueno, roles.miembro])
        .catch((e) => log(`⚠️ No pude darte el rol: ${e.message}`));
    }
  }
  log("👑 Rol Dueño asignado");

  // 6) Invitación permanente que lleva directo al canal de roles
  const invitacion = await canales.roles
    .createInvite({ maxAge: 0, maxUses: 0, unique: true, reason: "Invitación al canal de roles" })
    .catch(() => null);
  if (invitacion) log(`🔗 Invitación (aterriza en #elige-tu-rol): ${invitacion.url}`);
}

// ═══════════════════════════════════════════════════════════
//  EVENTOS
// ═══════════════════════════════════════════════════════════

client.once(Events.ClientReady, async (c) => {
  console.log(`✅ Conectado como ${c.user.tag}`);
  for (const [, g] of c.guilds.cache) {
    if (g.id === GUILD_ID) {
      await g.commands
        .set(comandos)
        .then(() => console.log(`📌 Comandos listos en ${g.name}`))
        .catch(console.error);
    } else {
      await g.commands.set([]).catch(() => {});
      console.log(`⏭️ Ignorando ${g.name}`);
    }
  }
});

client.on(Events.GuildCreate, (g) => {
  if (g.id === GUILD_ID) g.commands.set(comandos).catch(console.error);
});

// Al entrar: solo ven el canal de roles; se les avisa ahí
client.on(Events.GuildMemberAdd, async (member) => {
  if (member.guild.id !== GUILD_ID) return;
  try {
    const canal = canalTexto(member.guild, "elige-tu-rol");
    if (!canal) return;
    const msg = await canal.send(`👋 ¡Bienvenido/a ${member}! Elige un rol con los botones para desbloquear el servidor.`);
    setTimeout(() => msg.delete().catch(() => {}), 60_000);
  } catch (err) {
    console.error("Error en bienvenida:", err);
  }
});

let configurando = false;
const EFIMERO = MessageFlags.Ephemeral;

client.on(Events.InteractionCreate, async (i) => {
  if (i.guildId !== GUILD_ID) return;
  try {
    // ───────────── Comandos ─────────────
    if (i.isChatInputCommand()) {
      if (i.commandName === "setup") {
        if (configurando) return i.reply({ content: "⏳ Ya hay un setup en curso.", flags: EFIMERO });
        configurando = true;
        await i.deferReply({ flags: EFIMERO });

        const registro = [];
        try {
          const borrar = i.options.getBoolean("borrar") ?? true;
          await configurarServidor(i.guild, i.member, borrar, (m) => {
            registro.push(m);
            console.log(m);
          });
          await i.editReply(`👑 **¡Tu servidor está listo!**\n\n${registro.join("\n")}`).catch(() => {});
        } catch (err) {
          console.error(err);
          await i.editReply(`❌ Error: ${err.message}`).catch(() => {});
        } finally {
          configurando = false;
        }
        return;
      }

      if (i.commandName === "aviso") {
        const canal = canalTexto(i.guild, "avisos");
        if (!canal) return i.reply({ content: "❌ No encuentro el canal de avisos. Usa /setup.", flags: EFIMERO });

        await canal.send({
          content: i.options.getBoolean("mencionar") ? "@everyone" : undefined,
          embeds: [
            new EmbedBuilder()
              .setColor(AZUL)
              .setTitle(`📣 ${i.options.getString("titulo")}`)
              .setDescription(i.options.getString("mensaje"))
              .setFooter({ text: `Por ${i.user.username}`, iconURL: i.user.displayAvatarURL() })
              .setTimestamp(),
          ],
        });
        return i.reply({ content: `✅ Aviso publicado en ${canal}`, flags: EFIMERO });
      }

      if (i.commandName === "limpiar") {
        const borrados = await i.channel.bulkDelete(i.options.getInteger("cantidad"), true);
        return i.reply({ content: `🧹 ${borrados.size} mensajes eliminados.`, flags: EFIMERO });
      }
      return;
    }

    // ───────────── Botones ─────────────
    if (!i.isButton()) return;

    if (i.customId.startsWith("rol:")) {
      const rol = rolPorKey(i.guild, i.customId.split(":")[1]);
      if (!rol) return i.reply({ content: "❌ Rol no encontrado.", flags: EFIMERO });
      const miembro = rolPorKey(i.guild, "miembro");
      const loTiene = i.member.roles.cache.has(rol.id);
      if (loTiene) {
        await i.member.roles.remove(rol);
        return i.reply({ content: `➖ Te quité ${rol.name}`, flags: EFIMERO });
      }
      const desbloquea = miembro && !i.member.roles.cache.has(miembro.id);
      await i.member.roles.add(desbloquea ? [rol, miembro] : [rol]);
      return i.reply({
        content: desbloquea
          ? `➕ Te puse ${rol.name}\n🔓 ¡Servidor desbloqueado! Ya puedes ver todos los canales.`
          : `➕ Te puse ${rol.name}`,
        flags: EFIMERO,
      });
    }
  } catch (err) {
    console.error(err);
    const msg = { content: `❌ Error: ${err.message}`, flags: EFIMERO };
    if (i.replied || i.deferred) await i.followUp(msg).catch(() => {});
    else await i.reply(msg).catch(() => {});
  }
});

// ═══════════════════════════════════════════════════════════
//  SERVIDOR HTTP (para que Render detecte un puerto abierto)
// ═══════════════════════════════════════════════════════════

const http = require("http");
http
  .createServer((req, res) => res.end("Bot activo"))
  .listen(process.env.PORT || 3000, () => console.log("🌐 Servidor HTTP activo"));

client.login(TOKEN);