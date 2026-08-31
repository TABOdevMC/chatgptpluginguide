// Couche pédagogique complémentaire : enrichit les cours existants sans changer
// leurs identifiants ni leur progression enregistrée.
(function () {
  'use strict';

  const lessons = {
    java: [
      {
        more: `Une variable possède un type et une valeur. Le type indique au compilateur quelles opérations sont autorisées. Dans un plugin, cette distinction est importante : un nombre de coins n'est pas du texte et un joueur n'est pas un UUID. Utilise des noms explicites, des types adaptés et évite les conversions inutiles.`,
        example: `int coins = 100;\ncoins += 25;\n\nString message = "Coins : " + coins;\nboolean canBuy = coins >= 50;`,
        mistake: `confondre String et int, utiliser une variable avant de l'avoir initialisée ou choisir un type trop général.`
      },
      {
        more: `Une méthode possède une visibilité, un type de retour, un nom et éventuellement des paramètres. Dans Paper, les méthodes deviennent vite nombreuses : séparer par responsabilité te permet de tester et relire chaque morceau de logique. Une méthode qui calcule un prix ne devrait pas aussi ouvrir un inventaire ou envoyer un message.`,
        example: `private int calculatePrice(int base, int multiplier) {\n    return base * multiplier;\n}\n\nint price = calculatePrice(10, 3);`,
        mistake: `faire des méthodes énormes qui mélangent calcul, stockage, affichage et accès à l'API Paper.`
      },
      {
        more: `Une classe est un modèle pour créer des objets. Les champs décrivent l'état et les méthodes décrivent les comportements. Dans un plugin, tu peux avoir PlayerData pour les données, CoinService pour la logique et PlayerListener pour les événements. Cette séparation rend les dépendances visibles et évite de transformer JavaPlugin en classe universelle.`,
        example: `public final class PlayerData {\n    private final UUID uuid;\n    private int coins;\n\n    public PlayerData(UUID uuid) {\n        this.uuid = uuid;\n    }\n\n    public void addCoins(int amount) {\n        coins += amount;\n    }\n}`,
        mistake: `rendre tous les champs public et laisser n'importe quelle classe modifier l'état sans contrôle.`
      },
      {
        more: `Une List représente une suite ordonnée, une Set évite les doublons et une Map associe une clé à une valeur. Pour les joueurs, Map<UUID, PlayerData> permet de retrouver rapidement les données d'un joueur. Apprends aussi à utiliser getOrDefault, computeIfAbsent et merge : ces méthodes rendent les services plus sûrs et plus courts.`,
        example: `Map<UUID, Integer> coins = new HashMap<>();\ncoins.merge(uuid, 10, Integer::sum);\nint current = coins.getOrDefault(uuid, 0);`,
        mistake: `utiliser une List pour rechercher constamment un joueur alors qu'une Map indexée par UUID serait plus adaptée.`
      },
      {
        more: `L'UUID identifie un joueur indépendamment de son nom affiché. C'est particulièrement important pour les données sauvegardées : le pseudo peut changer, mais l'UUID reste la référence logique utilisée par le serveur. Stocke l'UUID dans tes modèles et dans les clés de stockage plutôt que le nom.`,
        example: `UUID uuid = player.getUniqueId();\nPlayerData data = players.computeIfAbsent(\n    uuid, PlayerData::new\n);`,
        mistake: `utiliser player.getName() comme clé permanente de base de données.`
      },
      {
        more: `Une enum est idéale pour un nombre fini d'états : WAITING, PLAYING ou FINISHED. Une interface, elle, définit un contrat que plusieurs classes peuvent respecter. Ensemble, elles permettent de construire des systèmes de jeu plus extensibles qu'une longue suite de if/else.`,
        example: `public enum GameState { WAITING, PLAYING, FINISHED }\n\npublic interface RewardProvider {\n    void give(Player player);\n}`,
        mistake: `créer des chaînes de caractères libres pour représenter des états fixes et multiplier les fautes de frappe.`
      },
      {
        more: `Une stacktrace indique généralement la classe, la méthode et la ligne où l'erreur s'est propagée. Commence par lire la première partie pertinente de ta propre classe, puis remonte la cause. Le logger du plugin doit donner suffisamment de contexte pour comprendre ce qui s'est passé sans masquer l'erreur.`,
        example: `try {\n    repository.load(uuid);\n} catch (IOException exception) {\n    getLogger().log(\n        Level.SEVERE,\n        "Impossible de charger " + uuid,\n        exception\n    );\n}`,
        mistake: `catch (Exception ignored) {} : l'erreur disparaît et tu rends le diagnostic presque impossible.`
      },
      {
        more: `L'architecture sert à limiter les responsabilités. Un event détecte, un service décide, un repository lit ou écrit, et une UI affiche. Cette séparation est particulièrement utile lorsque plusieurs fonctionnalités ont besoin de la même logique. Commence simple, mais garde des frontières claires.`,
        example: `PlayerJoinEvent\n      ↓\nPlayerService\n      ↓\nPlayerDataRepository\n      ↓\nSQLite / YAML`,
        mistake: `accéder directement à la base de données depuis dix listeners différents.`
      }
    ],
    setup: [
      {
        more: `Gradle décrit comment ton projet est compilé. La configuration indique où chercher Paper et quelles bibliothèques sont nécessaires. Comprends la différence entre la dépendance que ton plugin compile avec et celle qu'il doit réellement embarquer.`,
        example: `plugins {\n    java\n}\n\nrepositories {\n    maven("https://repo.papermc.io/repository/maven-public/")\n}\n\ndependencies {\n    compileOnly("io.papermc.paper:paper-api:VERSION")\n}`,
        mistake: `embarquer paper-api dans le JAR sans raison ou mélanger des versions de Paper.`
      },
      {
        more: `JavaPlugin est fourni par Paper. Ta classe principale hérite de cette classe et Paper crée son instance. Tu ne dois donc pas faire new MonPlugin(). Utilise cette instance pour accéder au logger, aux fichiers et aux APIs du plugin.`,
        example: `public final class MonPlugin extends JavaPlugin {\n    @Override\n    public void onEnable() {\n        getLogger().info("Plugin démarré");\n    }\n}`,
        mistake: `créer toi-même une instance de JavaPlugin ou copier une classe principale depuis un ancien tutoriel sans vérifier la version.`
      },
      {
        more: `Le fichier de métadonnées fait le lien entre le serveur et ton code. Le nom du plugin est visible par le serveur, version identifie le build et main indique précisément la classe à instancier. Une faute de package suffit à empêcher le chargement.`,
        example: `name: MyPaperPlugin\nversion: '1.0.0'\nmain: fr.example.MyPaperPlugin\napi-version: '1.21'`,
        mistake: `mettre un main qui ne correspond pas exactement au package de la classe.`
      },
      {
        more: `onEnable est le point central de l'initialisation. Charge d'abord la configuration et les données nécessaires, puis construis les services et enregistre les composants. L'ordre compte lorsque des classes ont des dépendances.`,
        example: `@Override\npublic void onEnable() {\n    saveDefaultConfig();\n    PlayerService players = new PlayerService(this);\n    getServer().getPluginManager().registerEvents(\n        new PlayerListener(players),\n        this\n    );\n}`,
        mistake: `placer toute la logique métier dans onEnable et obtenir une classe principale énorme.`
      },
      {
        more: `onDisable sert à arrêter proprement le plugin. C'est le moment de sauvegarder les données encore en mémoire et de fermer les ressources externes. Un plugin qui ouvre une connexion SQL mais ne la ferme jamais peut laisser des ressources ouvertes.`,
        example: `@Override\npublic void onDisable() {\n    if (database != null) {\n        database.close();\n    }\n}`,
        mistake: `supposer qu'il n'y a jamais besoin de nettoyer parce que le serveur va s'arrêter.`
      },
      {
        more: `Un listener n'existe pas parce que sa classe compile : il doit être enregistré. Le PluginManager associe ensuite ses méthodes @EventHandler aux events correspondants. Une classe peut recevoir plusieurs events si cela reste cohérent, mais évite les listeners fourre-tout.`,
        example: `PluginManager manager = getServer().getPluginManager();\nmanager.registerEvents(new PlayerListener(), this);`,
        mistake: `oublier registerEvents et conclure que @EventHandler ne fonctionne pas.`
      },
      {
        more: `Le passage des dépendances par constructeur rend l'architecture lisible. Si PlayerListener reçoit PlayerService, tu sais immédiatement de quoi il dépend. Cette approche facilite aussi les tests et évite les appels statiques dispersés.`,
        example: `DataManager dataManager = new DataManager(this);\nPlayerService playerService = new PlayerService(dataManager);\nPlayerListener listener = new PlayerListener(playerService);`,
        mistake: `instancier plusieurs fois les mêmes services avec des états différents et créer des bugs difficiles à suivre.`
      },
      {
        more: `Un build propre valide la chaîne entière : compilation, ressources, métadonnées et packaging. Teste toujours le JAR qui va réellement dans plugins/. Lorsqu'un bug apparaît uniquement sur le serveur, regarde d'abord la console et la stacktrace complète.`,
        example: `./gradlew clean build\n\n# JAR final\nbuild/libs/MyPaperPlugin-1.0.0.jar`,
        mistake: `tester une vieille copie du JAR dans plugins/ et penser que le nouveau code est chargé.`
      }
    ],
    events: [
      {
        more: `Un listener est une classe de ton plugin qui observe des événements. @EventHandler indique à Bukkit/Paper quelles méthodes peuvent être appelées. Le nom du listener n'a aucune magie : c'est son enregistrement et sa signature d'event qui comptent.`,
        example: `public final class JoinListener implements Listener {\n    @EventHandler\n    public void onJoin(PlayerJoinEvent event) {\n        // réaction\n    }\n}`,
        mistake: `mettre une mauvaise signature de méthode ou oublier d'enregistrer le listener.`
      },
      {
        more: `PlayerJoinEvent expose le joueur concerné. Une bonne pratique est de récupérer immédiatement l'objet utile puis de déléguer le traitement. Cela évite d'avoir un gros bloc de code directement dans la méthode d'événement.`,
        example: `@EventHandler\npublic void onJoin(PlayerJoinEvent event) {\n    Player player = event.getPlayer();\n    player.sendMessage(Component.text("Bienvenue !"));\n}`,
        mistake: `supposer qu'un event possède toujours un sender ou qu'il est toujours déclenché par la console.`
      },
      {
        more: `Un event annulable permet au plugin d'empêcher l'action prévue. Annuler doit être fait avec une vraie condition métier : protéger une zone, empêcher un clic ou bloquer une mécanique. Il ne faut pas annuler globalement par réflexe.`,
        example: `@EventHandler\npublic void onBreak(BlockBreakEvent event) {\n    if (event.getBlock().getType() == Material.BEDROCK) {\n        event.setCancelled(true);\n    }\n}`,
        mistake: `appeler setCancelled(true) sans vérifier la situation et bloquer toutes les interactions.`
      },
      {
        more: `Les priorités déterminent l'ordre dans lequel les handlers sont appelés. LOWEST intervient tôt et MONITOR sert à observer le résultat final. Si tu dois modifier un event, choisis une priorité cohérente avec ton objectif plutôt que MONITOR.`,
        example: `@EventHandler(priority = EventPriority.HIGH)\npublic void protect(BlockBreakEvent event) {\n    // logique de protection\n}`,
        mistake: `modifier un event dans MONITOR et créer des comportements difficiles à prévoir avec d'autres plugins.`
      },
      {
        more: `PlayerInteractEvent couvre de nombreuses interactions. Il faut filtrer l'action, parfois la main utilisée et l'objet concerné. Plus tu filtres tôt, moins ton plugin fait de travail inutile à chaque clic.`,
        example: `@EventHandler\npublic void onInteract(PlayerInteractEvent event) {\n    if (event.getAction() != Action.RIGHT_CLICK_AIR) return;\n    ItemStack item = event.getItem();\n    if (item == null) return;\n}`,
        mistake: `ne pas filtrer l'action et exécuter la logique pour toutes les interactions.`
      },
      {
        more: `InventoryClickEvent est la base des menus inventaire. Il faut distinguer le slot du menu et l'inventaire du joueur, puis annuler les mouvements si ton interface ne doit pas être modifiée. Dans les interfaces avancées, identifie également précisément quel menu est ouvert.`,
        example: `@EventHandler\npublic void onClick(InventoryClickEvent event) {\n    if (event.getRawSlot() == 13) {\n        event.setCancelled(true);\n    }\n}`,
        mistake: `utiliser seulement getSlot() dans un menu et traiter par erreur un clic de l'inventaire du joueur comme un bouton.`
      },
      {
        more: `Le listener doit rester léger. Quand une action implique plusieurs étapes, récupère le contexte puis appelle un service. Cette séparation permet de réutiliser la même logique depuis une commande ou une tâche.`,
        example: `@EventHandler\npublic void onJoin(PlayerJoinEvent event) {\n    playerService.handleJoin(event.getPlayer());\n}`,
        mistake: `mettre plusieurs centaines de lignes dans les méthodes @EventHandler.`
      },
      {
        more: `Un petit projet d'événements montre le vrai intérêt de l'architecture : plusieurs sources différentes déclenchent la même logique métier. Tu peux alors ajouter une nouvelle source sans recopier tout le comportement.`,
        example: `PlayerListener ─┐\nBlockListener  ─┼→ GameService\nMenuListener   ─┘`,
        mistake: `dupliquer la même règle métier dans trois listeners au lieu de la centraliser.`
      }
    ],
    scheduler: [
      {
        more: `Un tick est l'unité de temps interne du serveur. À 20 TPS, le serveur essaie de produire 20 ticks par seconde. Si le serveur lag et tombe à 10 TPS, une tâche planifiée en ticks s'exécutera toujours selon les ticks réels : le temps réel perçu peut donc augmenter.`,
        example: `20L  // environ 1 seconde à 20 TPS\n100L // environ 5 secondes à 20 TPS`,
        mistake: `penser qu'un délai de 20 ticks garantit exactement une seconde même lorsque le serveur est en retard.`
      },
      {
        more: `runTaskLater exécute une tâche synchronisée une fois après un nombre de ticks. C'est utile pour différer une action après un event : fermer une interface, rendre un effet ou attendre avant une seconde étape.`,
        example: `Bukkit.getScheduler().runTaskLater(plugin, () -> {\n    player.sendMessage(Component.text("2 secondes plus tard"));\n}, 40L);`,
        mistake: `mettre une opération SQL lente dans une tâche synchronisée et faire bloquer le thread principal.`
      },
      {
        more: `runTaskTimer démarre éventuellement immédiatement puis répète une action selon la période choisie. Les tâches périodiques doivent avoir une fréquence adaptée au besoin : un scoreboard n'a pas forcément besoin d'être recalculé à chaque tick.`,
        example: `Bukkit.getScheduler().runTaskTimer(\n    plugin,\n    service::updateAll,\n    0L,\n    20L\n);`,
        mistake: `planifier tout à 1 tick par réflexe et surcharger le thread serveur.`
      },
      {
        more: `BukkitRunnable est pratique lorsqu'une tâche possède un état interne : compteur, durée restante ou condition d'arrêt. Le Runnable peut être annulé depuis lui-même, ce qui simplifie les timers auto-terminants.`,
        example: `new BukkitRunnable() {\n    int remaining = 5;\n\n    @Override\n    public void run() {\n        if (--remaining <= 0) {\n            cancel();\n        }\n    }\n}.runTaskTimer(plugin, 0L, 20L);`,
        mistake: `oublier l'annulation et laisser des milliers de tâches s'accumuler après plusieurs cycles de jeu.`
      },
      {
        more: `L'asynchrone sert surtout à sortir les opérations qui peuvent bloquer : SQL, réseau, certains calculs lourds ou E/S. Il ne rend pas Bukkit thread-safe. La règle simple est : charge/calcul en async si c'est sûr, puis réapplique le résultat sur le thread serveur quand une API Paper l'exige.`,
        example: `Bukkit.getScheduler().runTaskAsynchronously(plugin, () -> {\n    Data data = repository.load(uuid);\n\n    Bukkit.getScheduler().runTask(plugin, () -> {\n        service.apply(player, data);\n    });\n});`,
        mistake: `téléporter un joueur, modifier un bloc ou manipuler l'état du monde depuis un thread arbitraire.`
      },
      {
        more: `Après un traitement asynchrone, le retour au thread principal crée une frontière claire : l'async prépare une donnée et la partie synchrone modifie le serveur. Cette architecture réduit les risques de race condition et d'accès concurrent non supporté.`,
        example: `runTaskAsynchronously(plugin, () -> {\n    String value = repository.loadValue();\n    runTask(plugin, () -> player.sendMessage(Component.text(value)));\n});`,
        mistake: `capturer des objets Bukkit sensibles dans un code async et supposer que tout objet est sûr à lire depuis n'importe quel thread.`
      },
      {
        more: `Conserver la BukkitTask est utile lorsqu'une tâche appartient à une fonctionnalité avec un cycle de vie. Au démarrage, tu crées la tâche ; à l'arrêt, tu l'annules. Cela rend les fonctionnalités temporaires plus propres.`,
        example: `private BukkitTask task;\n\nvoid start() {\n    task = scheduler.runTaskTimer(plugin, this::tick, 0L, 20L);\n}\n\nvoid stop() {\n    if (task != null) task.cancel();\n}`,
        mistake: `lancer une nouvelle tâche à chaque ouverture de menu ou à chaque connexion sans fermer l'ancienne.`
      },
      {
        more: `Un cooldown est un excellent exercice de scheduler : mémoriser l'heure d'expiration par UUID, refuser l'action si le temps restant est positif et nettoyer les entrées expirées. Pour un simple cooldown, une Map suffit souvent.`,
        example: `long endsAt = System.currentTimeMillis() + 5000L;\ncooldowns.put(uuid, endsAt);\n\nlong remaining = endsAt - System.currentTimeMillis();`,
        mistake: `compter uniquement des ticks en mémoire sans réfléchir au redémarrage ou à la persistance si le cooldown doit survivre au serveur.`
      }
    ]
  };

  function apply() {
    Object.entries(lessons).forEach(([courseId, details]) => {
      const course = window.COURSES?.[courseId];
      if (!course || !Array.isArray(course.levels)) return;

      details.forEach((extra, index) => {
        const lesson = course.levels[index];
        if (!lesson || lesson.__depthAdded) return;

        lesson.text = `${lesson.text}\n\n${extra.more}`;
        lesson.code = `${lesson.code}\n\n// Exemple complémentaire\n${extra.example}`;
        lesson.tip = `${lesson.tip}\n\n⚠️ Erreur fréquente : ${extra.mistake}`;
        lesson.__depthAdded = true;
      });
    });
  }

  apply();
})();
