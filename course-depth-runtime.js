// Enrichissement runtime appliqué à tous les cours Paper.
// Il ne modifie ni les IDs de cours ni les clés de progression.
(function () {
  'use strict';

  if (typeof COURSES === 'undefined') return;

  const courseAdvice = {
    java: {
      intro: 'Ici, l’objectif est de relier la notion Java au code d’un plugin Paper. Comprends d’abord le fonctionnement du langage, puis regarde comment cette notion intervient dans un service, un listener ou une commande.',
      practice: 'Après avoir lu l’exemple, modifie-le : change une valeur, ajoute une condition et vérifie que tu peux expliquer chaque ligne sans la recopier mécaniquement.'
    },
    setup: {
      intro: 'Un plugin Paper est un petit programme chargé par le serveur. Il possède un point d’entrée, des métadonnées, des ressources et des composants initialisés pendant son cycle de vie.',
      practice: 'Fais l’exercice sur un serveur local : compile le JAR, installe-le, démarre le serveur et lis la console. Le but est de relier le code à ce qui se passe réellement dans Minecraft.'
    },
    events: {
      intro: 'Un event est un signal envoyé par le serveur lorsqu’une action arrive. Le listener décide s’il doit réagir et appelle ensuite ta logique métier. La qualité d’un plugin dépend beaucoup de la précision de ces filtres.',
      practice: 'Pour chaque event, demande-toi : qui déclenche l’event, quelle donnée je peux récupérer, puis-je l’annuler, et quelles conditions doivent être vérifiées avant d’agir ?'
    },
    scheduler: {
      intro: 'Le scheduler permet de faire quelque chose plus tard ou régulièrement sans bloquer directement le code appelant. La distinction entre synchronisé et asynchrone est essentielle pour ne pas casser le thread serveur.',
      practice: 'Construis un petit timer puis mesure le résultat sur ton serveur. Ensuite, transforme-le en cooldown joueur avec une Map<UUID, Long>.'
    },
    data: {
      intro: 'La gestion des données repose sur le cycle de vie : charger, modifier en mémoire, sauvegarder. Le bon stockage dépend de ce que tu conserves, de sa taille et de son besoin de persistance.',
      practice: 'Écris d’abord un modèle PlayerData simple, puis ajoute une couche de stockage. Le but est de pouvoir changer YAML pour SQLite sans réécrire tes listeners.'
    },
    items: {
      intro: 'Un item custom possède une apparence et une identité technique. L’apparence est visible par le joueur ; l’identité doit rester fiable même si le nom ou le lore change.',
      practice: 'Crée un item, ajoute-lui un identifiant PDC, puis écris un listener capable de reconnaître l’item sans regarder son nom.'
    },
    ui: {
      intro: 'Une bonne interface Minecraft choisit le canal adapté à l’information : chat pour le détail, ActionBar pour l’état court, Title pour un moment important, BossBar pour une progression et Dialogue pour un choix structuré.',
      practice: 'Prends une seule fonctionnalité de plugin et décide volontairement où placer chaque information avant d’écrire le code.'
    },
    commands: {
      intro: 'Brigadier décrit la syntaxe de la commande sous forme d’arbre. Cela permet de valider les arguments, de proposer des suggestions et d’appliquer des permissions directement sur certaines branches.',
      practice: 'Dessine d’abord l’arbre de la commande sur papier, puis construis-le en Java. Cette étape évite énormément de logique conditionnelle inutile.'
    },
    quality: {
      intro: 'La qualité d’un plugin ne se limite pas à son fonctionnement nominal. Il faut aussi gérer les erreurs, les performances, les permissions, la configuration, les redémarrages et les interactions avec d’autres plugins.',
      practice: 'Après chaque fonctionnalité, imagine le pire cas : joueur hors ligne, inventaire plein, mauvaise valeur de configuration, spam, redémarrage ou serveur sous charge.'
    }
  };

  function buildExample(course, lesson, index) {
    const title = lesson.title.toLowerCase();

    if (course.id === 'java') {
      if (title.includes('variable')) return `final int reward = 25;\nint total = 100;\ntotal += reward;\n\nSystem.out.println("Total = " + total);`;
      if (title.includes('méthode')) return `private boolean canAfford(int coins, int price) {\n    return coins >= price;\n}`;
      if (title.includes('classe')) return `public final class PlayerData {\n    private int coins;\n\n    public void addCoins(int amount) {\n        coins += amount;\n    }\n}`;
      if (title.includes('collection')) return `Map<UUID, Integer> coins = new HashMap<>();\ncoins.merge(uuid, 10, Integer::sum);\n\nfor (Map.Entry<UUID, Integer> entry : coins.entrySet()) {\n    System.out.println(entry.getValue());\n}`;
      if (title.includes('uuid')) return `UUID uuid = player.getUniqueId();\nPlayerData data = players.computeIfAbsent(\n    uuid, PlayerData::new\n);`;
    }

    if (course.id === 'setup') {
      if (index === 0) return `plugins {\n    java\n}\n\nrepositories {\n    mavenCentral()\n    maven("https://repo.papermc.io/repository/maven-public/")\n}\n\ndependencies {\n    compileOnly("io.papermc.paper:paper-api:VERSION")\n}`;
      if (index === 1) return `public final class MonPlugin extends JavaPlugin {\n    @Override\n    public void onEnable() {\n        getLogger().info("PaperDev démarre !");\n    }\n}`;
      if (index === 5) return `getServer().getPluginManager().registerEvents(\n    new PlayerListener(),\n    this\n);`;
    }

    if (course.id === 'events') {
      if (index === 0) return `public final class PlayerListener implements Listener {\n    @EventHandler\n    public void onJoin(PlayerJoinEvent event) {\n        Player player = event.getPlayer();\n        player.sendMessage(Component.text("Bienvenue !"));\n    }\n}`;
      if (index === 2) return `@EventHandler\npublic void onBreak(BlockBreakEvent event) {\n    if (event.getBlock().getType() == Material.BEDROCK) {\n        event.setCancelled(true);\n    }\n}`;
      if (index === 5) return `@EventHandler\npublic void onClick(InventoryClickEvent event) {\n    if (event.getRawSlot() < event.getView().getTopInventory().getSize()) {\n        event.setCancelled(true);\n    }\n}`;
    }

    if (course.id === 'scheduler') {
      if (index === 0) return `// 20 ticks ≈ 1 seconde à 20 TPS\nlong delay = 20L;`;
      if (index === 1) return `Bukkit.getScheduler().runTaskLater(plugin, () -> {\n    player.sendMessage(Component.text("Terminé !"));\n}, 40L);`;
      if (index === 7) return `Map<UUID, Long> cooldowns = new HashMap<>();\nlong expiresAt = System.currentTimeMillis() + 5000L;\ncooldowns.put(player.getUniqueId(), expiresAt);`;
    }

    if (course.id === 'data') return `NamespacedKey key = new NamespacedKey(plugin, "example");\ncontainer.set(key, PersistentDataType.INTEGER, 42);\n\nInteger value = container.get(key, PersistentDataType.INTEGER);`;
    if (course.id === 'items') return `ItemStack item = new ItemStack(Material.DIAMOND);\nItemMeta meta = item.getItemMeta();\n\nmeta.displayName(Component.text("Objet custom"));\nitem.setItemMeta(meta);`;
    if (course.id === 'ui') return `player.sendActionBar(Component.text("Capacité prête"));\n\nplayer.showTitle(Title.title(\n    Component.text("Victoire !"),\n    Component.text("Récompense débloquée")\n));`;
    if (course.id === 'commands') return `LiteralArgumentBuilder<CommandSourceStack> root =\n    LiteralArgumentBuilder.literal("monplugin");\n\nroot.then(LiteralArgumentBuilder.literal("info"));`;
    if (course.id === 'quality') return `if (!player.hasPermission("monplugin.admin")) {\n    player.sendMessage(Component.text("Accès refusé."));\n    return;\n}`;

    return `// Exemple pratique lié à : ${lesson.title}\n// 1. Récupérer le contexte\n// 2. Vérifier les préconditions\n// 3. Exécuter la logique\n// 4. Nettoyer les ressources si nécessaire`;
  }

  function enrich() {
    Object.values(COURSES).forEach((course) => {
      const advice = courseAdvice[course.id] || {
        intro: `Cette leçon explique une notion importante du parcours « ${course.name} ». Comprends le principe avant de mémoriser l’API : demande-toi toujours ce que fait le serveur, ce que fait ton plugin et quelles données circulent entre les deux.`,
        practice: 'Après l’exemple, modifie volontairement le code et observe ce qui change. Apprendre en expérimentant est plus solide que copier-coller.'
      };

      course.levels.forEach((lesson, index) => {
        if (lesson.__runtimeDepth) return;

        const example = buildExample(course, lesson, index);
        lesson.text = `${lesson.text}\n\n${advice.intro}\n\n🧪 ${advice.practice}`;
        lesson.code = `${lesson.code}\n\n// Exemple approfondi\n${example}`;
        lesson.tip = `${lesson.tip}\n\n📌 Réflexe de développeur : avant de valider ton code, explique ce qui se passe si la donnée attendue n’existe pas, si le joueur se déconnecte ou si l’action est exécutée très souvent.`;
        lesson.__runtimeDepth = true;
      });
    });
  }

  enrich();
})();
