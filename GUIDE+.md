# Guide+ — Développement de plugins Minecraft Paper

> Guide approfondi destiné à quelqu'un qui veut passer de « je sais écrire un peu de Java » à « je peux construire et maintenir un vrai plugin Paper ».
>
> **Important :** Paper et Minecraft évoluent rapidement. Les exemples sont volontairement orientés API Paper/Bukkit publique. Les signatures peuvent changer entre versions : vérifie toujours la Javadocs de la version de Paper que tu cibles.

---

## Table des matières

1. [Avant de commencer](#1-avant-de-commencer)
2. [Bases](#2-bases)
   - [Java](#21-bases-du-java)
   - [Maven](#22-maven)
   - [Gradle](#23-gradle)
   - [Dépendances](#24-ajouter-des-dépendances)
   - [Architecture](#25-architecture-dun-projet)
3. [Créer le plugin](#3-créer-le-plugin)
   - [Entrée du plugin](#31-classe-principale)
   - [paper-plugin.yml](#32-paper-pluginyml)
   - [Cycle de vie](#33-cycle-de-vie)
   - [Events](#34-events)
   - [Scheduler](#35-bukkitrunnable-et-scheduler)
   - [Thread principal](#36-thread-principal-et-asynchrone)
4. [Données](#4-données)
   - [PersistentDataContainer](#41-persistentdatacontainer)
   - [HashMap](#42-hashmap)
   - [Metadata](#43-metadata)
   - [YAML](#44-yaml)
   - [Base de données](#45-base-de-données)
5. [Configuration](#5-configuration)
6. [Items](#6-gestion-des-items)
7. [Texte et Adventure](#7-texte-et-adventure)
8. [Entités](#8-gestion-des-entités)
9. [Joueurs](#9-gestion-des-joueurs)
10. [Blocs](#10-gestion-des-blocs)
11. [Menus](#11-menus-custom)
12. [Sons](#12-sons)
13. [Teams](#13-teams)
14. [Scoreboard](#14-scoreboard)
15. [BossBar](#15-bossbar)
16. [Permissions](#16-permissions)
17. [Commandes Brigadier](#17-commandes-brigadier)
18. [Imports utiles](#18-imports-utiles)
19. [Performances](#19-performances)
20. [Bonnes pratiques](#20-bonnes-pratiques)
21. [Projet complet d'exemple](#21-projet-complet-dexemple)

---

# 1. Avant de commencer

## Prérequis

Pour suivre ce guide, installe :

- un JDK compatible avec la version de Minecraft/Paper ciblée ;
- IntelliJ IDEA, Eclipse ou VS Code avec support Java ;
- Git ;
- Maven ou Gradle ;
- un serveur Paper de développement ;
- un terminal.

### Vérifier Java

```bash
java -version
javac -version
```

Le JDK est nécessaire pour compiler le plugin. Le serveur doit également tourner avec une version Java compatible avec la version de Paper utilisée.

## Serveur de développement

Ne développe pas directement sur ton serveur de production.

Crée un serveur local dédié :

```text
dev-server/
├── paper.jar
├── eula.txt
├── server.properties
└── plugins/
```

Le plugin compilé est placé dans `plugins/`.

---

# 2. Bases

# 2.1 Bases du Java

## Variables

```java
String name = "Steve";
int coins = 100;
boolean enabled = true;
double multiplier = 1.5;
```

## Conditions

```java
if (player.hasPermission("example.admin")) {
    player.sendMessage(Component.text("Tu es admin."));
} else {
    player.sendMessage(Component.text("Accès refusé."));
}
```

## Boucles

```java
for (Player player : Bukkit.getOnlinePlayers()) {
    player.sendMessage(Component.text("Bonjour !"));
}
```

```java
for (int i = 0; i < 10; i++) {
    System.out.println(i);
}
```

## Méthodes

```java
public void giveCoins(Player player, int amount) {
    // ...
}
```

Une méthode devrait idéalement faire une chose identifiable.

## Classes

```java
public final class CoinService {

    public void add(Player player, int amount) {
        // ...
    }
}
```

## Interfaces

Paper utilise énormément d'interfaces, notamment pour les listeners.

```java
public final class PlayerListener implements Listener {
}
```

## Collections

```java
List<String> names = new ArrayList<>();
Set<UUID> muted = new HashSet<>();
Map<UUID, Integer> coins = new HashMap<>();
```

Pour les joueurs, `UUID` est généralement un meilleur identifiant persistant que le pseudo.

## `final`

```java
private final CoinService coinService;
```

`final` signifie ici que la référence ne peut pas être remplacée après son initialisation.

## Exceptions

```java
try {
    // opération susceptible d'échouer
} catch (IOException exception) {
    getLogger().log(Level.SEVERE, "Impossible de lire le fichier", exception);
}
```

N'attrape pas toutes les exceptions avec un `catch (Exception ignored)`. Cela masque les vrais problèmes.

---

# 2.2 Maven

Maven décrit le projet dans `pom.xml`.

Structure :

```text
src/
└── main/
    ├── java/
    └── resources/
        ├── paper-plugin.yml
        └── config.yml
pom.xml
```

Exemple :

```xml
<project>
    <modelVersion>4.0.0</modelVersion>

    <groupId>fr.example</groupId>
    <artifactId>monplugin</artifactId>
    <version>1.0.0</version>

    <properties>
        <maven.compiler.release>21</maven.compiler.release>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>

    <repositories>
        <repository>
            <id>papermc</id>
            <url>https://repo.papermc.io/repository/maven-public/</url>
        </repository>
    </repositories>

    <dependencies>
        <dependency>
            <groupId>io.papermc.paper</groupId>
            <artifactId>paper-api</artifactId>
            <version>VERSION</version>
            <scope>provided</scope>
        </dependency>
    </dependencies>
</project>
```

Compiler :

```bash
mvn clean package
```

---

# 2.3 Gradle

Exemple `build.gradle.kts` :

```kotlin
plugins {
    java
}

group = "fr.example"
version = "1.0.0"

repositories {
    mavenCentral()
    maven("https://repo.papermc.io/repository/maven-public/")
}

dependencies {
    compileOnly("io.papermc.paper:paper-api:VERSION")
}

java {
    toolchain.languageVersion.set(JavaLanguageVersion.of(21))
}
```

Compiler :

```bash
./gradlew build
```

### Pourquoi `compileOnly` pour Paper ?

L'API Paper est déjà fournie par le serveur. Tu ne veux normalement pas embarquer l'API entière dans ton plugin.

---

# 2.4 Ajouter des dépendances

Exemple :

```kotlin
dependencies {
    compileOnly("io.papermc.paper:paper-api:VERSION")
    implementation("com.example:library:VERSION")
}
```

### Trois questions à se poser

1. La bibliothèque est-elle nécessaire uniquement à la compilation ?
2. Le serveur fournit-il déjà cette bibliothèque ?
3. Dois-je l'embarquer et éventuellement la relocaliser ?

Le shading d'une bibliothèque peut être nécessaire pour éviter les conflits de versions entre plugins.

---

# 2.5 Architecture d'un projet

Une mauvaise architecture ressemble à :

```text
Main.java
└── 4000 lignes
```

Préférer :

```text
fr.example.plugin
├── Plugin.java
├── command/
├── listener/
├── service/
├── data/
├── menu/
├── task/
└── util/
```

## Principe

- `listener` : reçoit les événements.
- `command` : reçoit les commandes.
- `service` : contient la logique métier.
- `data` : chargement/sauvegarde.
- `menu` : interfaces inventaire.
- `task` : tâches planifiées.
- `util` : petites fonctions génériques.

Le listener ne devrait pas contenir toute la logique métier.

---

# 3. Créer le plugin

# 3.1 Classe principale

```java
public final class MonPlugin extends JavaPlugin {

    @Override
    public void onEnable() {
        getLogger().info("MonPlugin activé !");
    }

    @Override
    public void onDisable() {
        getLogger().info("MonPlugin désactivé !");
    }
}
```

## Injection simple des services

```java
public final class MonPlugin extends JavaPlugin {

    private CoinService coinService;

    @Override
    public void onEnable() {
        coinService = new CoinService();
    }

    public CoinService getCoinService() {
        return coinService;
    }
}
```

Évite de créer partout des `new MonPlugin()` : Paper crée et gère l'instance du plugin.

---

# 3.2 `paper-plugin.yml`

Exemple :

```yaml
name: MonPlugin
version: '1.0.0'
main: fr.example.monplugin.MonPlugin
api-version: '1.21'
```

Le champ `main` doit correspondre au chemin complet de ta classe Java.

```text
fr.example.monplugin.MonPlugin
```

correspond à :

```text
src/main/java/fr/example/monplugin/MonPlugin.java
```

---

# 3.3 Cycle de vie

```text
Serveur démarre
      ↓
Plugin chargé
      ↓
onLoad / initialisation éventuelle
      ↓
onEnable
      ↓
Plugin actif
      ↓
onDisable
      ↓
Serveur arrêté / plugin désactivé
```

Dans `onEnable()` :

- charger la configuration ;
- initialiser les services ;
- enregistrer les listeners ;
- enregistrer les commandes ;
- lancer les tâches nécessaires.

Dans `onDisable()` :

- sauvegarder les données ;
- annuler/fermer les ressources si nécessaire ;
- fermer les connexions externes.

---

# 3.4 Events

Un event est déclenché lorsqu'une action particulière arrive.

## Exemple : connexion

```java
public final class PlayerListener implements Listener {

    @EventHandler
    public void onJoin(PlayerJoinEvent event) {
        Player player = event.getPlayer();
        player.sendMessage(Component.text("Bienvenue !"));
    }
}
```

Enregistrement :

```java
getServer().getPluginManager().registerEvents(
    new PlayerListener(),
    this
);
```

## Event annulable

```java
@EventHandler
public void onBreak(BlockBreakEvent event) {
    if (event.getBlock().getType() == Material.DIAMOND_ORE) {
        event.setCancelled(true);
    }
}
```

## Priorités

```java
@EventHandler(priority = EventPriority.HIGH)
public void onJoin(PlayerJoinEvent event) {
}
```

Les priorités servent à contrôler l'ordre de traitement lorsque plusieurs listeners réagissent au même event.

Évite d'utiliser `MONITOR` pour modifier l'état de l'event : cette priorité sert normalement à observer le résultat final.

---

# 3.5 BukkitRunnable et Scheduler

Minecraft fonctionne en ticks.

```text
20 ticks ≈ 1 seconde à 20 TPS
```

## Exécution différée

```java
Bukkit.getScheduler().runTaskLater(this, () -> {
    player.sendMessage(Component.text("Après 1 seconde"));
}, 20L);
```

## Exécution répétée

```java
Bukkit.getScheduler().runTaskTimer(this, () -> {
    // toutes les 20 ticks
}, 0L, 20L);
```

## BukkitRunnable

```java
new BukkitRunnable() {
    @Override
    public void run() {
        // tâche
    }
}.runTaskTimer(this, 0L, 20L);
```

## Annuler une tâche

```java
BukkitTask task = Bukkit.getScheduler().runTaskTimer(
    this,
    () -> {},
    0L,
    20L
);

task.cancel();
```

Garde la référence lorsqu'une tâche doit pouvoir être arrêtée.

---

# 3.6 Thread principal et asynchrone

La plupart des opérations du monde doivent rester sur le thread serveur.

Mauvais réflexe :

```java
Bukkit.getScheduler().runTaskAsynchronously(this, () -> {
    player.teleport(location);
});
```

Pour une opération bloquante :

```java
Bukkit.getScheduler().runTaskAsynchronously(this, () -> {
    Data data = database.load(uuid);

    Bukkit.getScheduler().runTask(this, () -> {
        // appliquer les résultats côté serveur
    });
});
```

Le but est de ne pas bloquer le tick serveur avec des opérations lentes comme réseau, fichiers volumineux ou requêtes SQL.

---

# 4. Données

# 4.1 PersistentDataContainer

Le PDC permet de stocker des valeurs structurées sur des objets compatibles.

```java
NamespacedKey key = new NamespacedKey(this, "coins");

player.getPersistentDataContainer().set(
    key,
    PersistentDataType.INTEGER,
    250
);
```

Lecture :

```java
Integer coins = player.getPersistentDataContainer().get(
    key,
    PersistentDataType.INTEGER
);
```

Suppression :

```java
player.getPersistentDataContainer().remove(key);
```

## Identifier un item custom

```java
NamespacedKey key = new NamespacedKey(this, "custom_item");

meta.getPersistentDataContainer().set(
    key,
    PersistentDataType.STRING,
    "magic_sword"
);
```

Puis :

```java
String id = meta.getPersistentDataContainer().get(
    key,
    PersistentDataType.STRING
);

if ("magic_sword".equals(id)) {
    // item custom
}
```

Ne base pas l'identification d'un item sur son nom visible : le joueur ou une autre mécanique pourrait modifier le texte.

---

# 4.2 HashMap

```java
private final Map<UUID, Integer> coins = new HashMap<>();
```

Ajouter :

```java
coins.merge(player.getUniqueId(), 10, Integer::sum);
```

Lire :

```java
int value = coins.getOrDefault(player.getUniqueId(), 0);
```

Une `HashMap` est en mémoire uniquement.

```text
Serveur lancé → données présentes
Serveur redémarré → données perdues
```

Pour la persistance, combine-la avec YAML, JSON ou une base de données.

---

# 4.3 Metadata

```java
player.setMetadata(
    "in-combat",
    new FixedMetadataValue(this, true)
);
```

Lecture :

```java
if (player.hasMetadata("in-combat")) {
    // joueur en combat
}
```

La metadata est adaptée à des informations temporaires liées au runtime. Ce n'est pas une solution de sauvegarde à long terme.

---

# 4.4 YAML

```java
FileConfiguration config = getConfig();
config.set("players." + uuid + ".coins", 500);
saveConfig();
```

Pour un vrai gestionnaire de données, crée plutôt ton propre fichier :

```java
File file = new File(getDataFolder(), "players.yml");
```

Puis charge-le avec `YamlConfiguration`.

Évite de faire `saveConfig()` après chaque petit changement : regroupe les sauvegardes ou utilise un système de sauvegarde périodique.

---

# 4.5 Base de données

Pour beaucoup de données, une base de données devient plus adaptée.

### SQLite

Avantages :

- fichier local ;
- pas de serveur DB séparé ;
- pratique pour un plugin sur un seul serveur.

### MySQL/PostgreSQL

Plus adaptés lorsque plusieurs serveurs doivent partager les données.

Architecture recommandée :

```text
Commande / Event
      ↓
Service
      ↓
Repository
      ↓
Base de données
```

Ne mets pas les requêtes SQL directement dans chaque listener.

---

# 5. Configuration

`config.yml` :

```yaml
settings:
  max-coins: 100000
  welcome-enabled: true

messages:
  welcome: "Bienvenue sur le serveur !"
```

Charger :

```java
saveDefaultConfig();

int maxCoins = getConfig().getInt("settings.max-coins");
boolean enabled = getConfig().getBoolean("settings.welcome-enabled");
String message = getConfig().getString("messages.welcome");
```

Valeur par défaut :

```java
String message = getConfig().getString(
    "messages.welcome",
    "Bienvenue !"
);
```

## Fichier de configuration séparé

Utilise des fichiers séparés lorsque le projet grandit :

```text
config.yml
messages.yml
menus.yml
players.yml
```

Cela rend le projet beaucoup plus facile à maintenir.

---

# 6. Gestion des items

## Item simple

```java
ItemStack item = new ItemStack(Material.DIAMOND);
```

## ItemMeta

```java
ItemMeta meta = item.getItemMeta();
meta.displayName(Component.text("Diamant magique"));
item.setItemMeta(meta);
```

## Lore

```java
meta.lore(List.of(
    Component.text("Objet rare"),
    Component.text("Clic droit pour utiliser")
));
```

## Quantité

```java
item.setAmount(16);
```

## Vérifier un item

```java
if (event.getItem() == null) return;

ItemStack item = event.getItem();
if (item.getType() != Material.DIAMOND) return;
```

## Vérifier un PDC

```java
ItemMeta meta = item.getItemMeta();
if (meta == null) return;

if (!meta.getPersistentDataContainer().has(
        key,
        PersistentDataType.STRING
)) {
    return;
}
```

### Conseil

Crée des méthodes utilitaires :

```java
public ItemStack createMagicSword() {
    // construction centralisée
}
```

Cela évite de dupliquer 30 lignes de code dans plusieurs endroits.

---

# 7. Texte et Adventure

Paper moderne utilise Adventure pour les composants texte.

```java
Component message = Component.text("Bonjour !");
player.sendMessage(message);
```

Couleur :

```java
Component.text("Erreur", NamedTextColor.RED);
```

Style :

```java
Component.text("Important")
    .color(NamedTextColor.GOLD)
    .decorate(TextDecoration.BOLD);
```

Composition :

```java
Component message = Component.text("Bonjour ")
    .append(Component.text(player.getName()))
    .append(Component.text(" !"));
```

## MiniMessage

Pour des messages configurables, MiniMessage peut être très pratique.

```text
<red>Erreur</red>
<gold><bold>Attention</bold></gold>
```

L'idée est de séparer le contenu configurable de la logique Java.

Attention à ne pas laisser des entrées utilisateur non fiables être interprétées comme du formatage MiniMessage.

---

# 8. Gestion des entités

## Parcourir les entités

```java
for (Entity entity : world.getEntities()) {
    if (entity instanceof Zombie zombie) {
        zombie.setGlowing(true);
    }
}
```

## Spawn

```java
Zombie zombie = world.spawn(
    location,
    Zombie.class
);
```

Personnalisation :

```java
zombie.customName(Component.text("Garde"));
zombie.setCustomNameVisible(true);
zombie.setGlowing(true);
```

## Tuer une entité

```java
entity.remove();
```

## Filtrer par distance

Évite de parcourir toutes les entités du serveur si tu cherches seulement les entités proches d'un joueur.

---

# 9. Gestion des joueurs

## Joueur courant dans un event

```java
Player player = event.getPlayer();
```

## UUID

```java
UUID uuid = player.getUniqueId();
```

Utilise l'UUID pour les données persistantes.

## Joueur en ligne

```java
Player player = Bukkit.getPlayer(uuid);
```

Le résultat peut être `null` si le joueur n'est pas connecté.

## Tous les joueurs

```java
for (Player player : Bukkit.getOnlinePlayers()) {
    // ...
}
```

## Téléportation

```java
player.teleport(location);
```

## Inventaire

```java
player.getInventory().addItem(item);
```

Toujours réfléchir au cas où l'inventaire est plein. `addItem` peut laisser des objets non placés que ton plugin doit éventuellement gérer.

---

# 10. Gestion des blocs

## Lire un bloc

```java
Block block = location.getBlock();
Material material = block.getType();
```

## Modifier

```java
block.setType(Material.GOLD_BLOCK);
```

## Casser un bloc via event

```java
@EventHandler
public void onBreak(BlockBreakEvent event) {
    if (event.getBlock().getType() != Material.DIAMOND_ORE) {
        return;
    }

    event.getPlayer().sendMessage(
        Component.text("Tu as trouvé du diamant !")
    );
}
```

## Éviter les traitements excessifs

Une boucle qui modifie des milliers de blocs chaque tick peut faire chuter les TPS.

Pour les grosses opérations, découpe le travail sur plusieurs ticks ou réfléchis à une stratégie plus efficace.

---

# 11. Menus custom

## Créer un inventaire

```java
Inventory inventory = Bukkit.createInventory(
    null,
    27,
    Component.text("Menu principal")
);
```

## Ajouter un bouton

```java
inventory.setItem(13, createButton());
```

Puis :

```java
player.openInventory(inventory);
```

## Gérer les clics

```java
@EventHandler
public void onClick(InventoryClickEvent event) {
    if (!(event.getWhoClicked() instanceof Player player)) {
        return;
    }

    if (!event.getView().title().equals(Component.text("Menu principal"))) {
        return;
    }

    event.setCancelled(true);

    if (event.getRawSlot() == 13) {
        player.sendMessage(Component.text("Bouton !"));
    }
}
```

### Pourquoi `getRawSlot()` ?

Dans un inventaire de joueur, les slots de l'inventaire du joueur et ceux du menu sont différents. `getRawSlot()` permet de déterminer si le clic se situe dans la partie supérieure du menu.

## Architecture de menu

Pour un gros plugin, crée une classe abstraite ou une interface :

```text
Menu
├── MainMenu
├── ShopMenu
├── SettingsMenu
└── ConfirmationMenu
```

Le listener devient alors un routeur plutôt qu'un fichier énorme rempli de conditions.

---

# 12. Sons

```java
player.playSound(
    player.getLocation(),
    Sound.ENTITY_PLAYER_LEVELUP,
    1.0f,
    1.0f
);
```

Paramètres :

- volume : intensité du son ;
- pitch : hauteur du son.

Pour une expérience cohérente, centralise les sons utilisés par ton plugin dans une configuration ou une classe dédiée.

---

# 13. Teams

Les teams appartiennent au système de scoreboard.

```java
Scoreboard scoreboard = Bukkit
    .getScoreboardManager()
    .getMainScoreboard();

Team team = scoreboard.getTeam("red");

if (team == null) {
    team = scoreboard.registerNewTeam("red");
}

team.addPlayer(player);
```

Tu peux configurer notamment :

- couleur ;
- collision ;
- affichage du nametag ;
- options de visibilité.

Attention à ne pas créer plusieurs teams identiques à chaque redémarrage.

---

# 14. Scoreboard

Créer un scoreboard :

```java
Scoreboard scoreboard = Bukkit
    .getScoreboardManager()
    .getNewScoreboard();

Objective objective = scoreboard.registerNewObjective(
    "stats",
    Criteria.DUMMY,
    Component.text("Statistiques")
);

objective.setDisplaySlot(DisplaySlot.SIDEBAR);
```

Afficher des lignes :

```java
objective.getScore("Coins: 100").setScore(2);
objective.getScore("Niveau: 5").setScore(1);
```

### Attention

Les scoreboards utilisent un système de scores et d'entries qui a des contraintes particulières. Pour un affichage complexe, planifie ton système de lignes au lieu de reconstruire inutilement le scoreboard à chaque tick.

---

# 15. BossBar

Créer :

```java
BossBar bossBar = Bukkit.createBossBar(
    Component.text("Boss"),
    BarColor.RED,
    BarStyle.SOLID
);
```

Ajouter un joueur :

```java
bossBar.addPlayer(player);
```

Modifier :

```java
bossBar.name(Component.text("Boss — 50%"));
bossBar.progress(0.5);
```

Retirer :

```java
bossBar.removePlayer(player);
```

Détruis/réutilise correctement les bossbars quand leur cycle de vie est terminé.

---

# 16. Permissions

Tester :

```java
if (!player.hasPermission("monplugin.admin")) {
    player.sendMessage(Component.text("Accès refusé."));
    return;
}
```

Préférer des permissions précises :

```text
monplugin.command.reload
monplugin.command.give
monplugin.admin
monplugin.debug
```

Cela permet à un gestionnaire de permissions de composer des rôles propres.

Ne fais pas :

```java
if (player.getName().equals("MonAdmin")) {
}
```

Les permissions sont faites pour cela.

---

# 17. Commandes Brigadier

Brigadier représente une commande comme un arbre.

Exemple :

```text
/monplugin
    ├── info
    ├── reload
    └── give <joueur> <quantité>
```

## 17.1 Littéral

Un nœud littéral représente un mot fixe :

```java
LiteralArgumentBuilder<CommandSourceStack> root =
    LiteralArgumentBuilder.literal("monplugin");
```

## 17.2 Argument

```java
RequiredArgumentBuilder<CommandSourceStack, Integer> amount =
    RequiredArgumentBuilder.argument(
        "amount",
        IntegerArgumentType.integer(1, 64)
    );
```

## 17.3 Arguments typés

```java
StringArgumentType.word()
StringArgumentType.string()
StringArgumentType.greedyString()

IntegerArgumentType.integer()
IntegerArgumentType.integer(1, 64)

LongArgumentType.longArg()
DoubleArgumentType.doubleArg()
```

La contrainte dans `integer(1, 64)` empêche directement les valeurs invalides.

## 17.4 Récupérer un argument

```java
int amount = IntegerArgumentType.getInteger(
    context,
    "amount"
);
```

Pour une chaîne :

```java
String name = StringArgumentType.getString(
    context,
    "name"
);
```

## 17.5 Suggestions

```java
suggests((context, builder) -> {
    Bukkit.getOnlinePlayers().forEach(player ->
        builder.suggest(player.getName())
    );

    return builder.buildFuture();
});
```

## 17.6 Permissions

```java
.requires(source ->
    source.getSender().hasPermission("monplugin.admin")
)
```

Cela évite d'exécuter inutilement une commande si la source n'a pas accès au nœud.

## 17.7 Source de commande

Une commande peut être exécutée par différentes sources. Ne suppose donc pas systématiquement que :

```java
context.getSource().getSender()
```

est un `Player`.

Si la commande doit obligatoirement être exécutée par un joueur :

```java
if (!(context.getSource().getSender() instanceof Player player)) {
    return 0;
}
```

Cela permet également de gérer proprement la console.

## 17.8 Organisation

Pour une commande importante :

```text
MainCommand
├── InfoCommand
├── ReloadCommand
└── GiveCommand
```

Le but est d'éviter une seule méthode `register()` de plusieurs centaines de lignes.

> **Note Paper :** l'enregistrement exact des commandes Brigadier peut différer selon la version et les API Paper exposées. Préfère l'API de commandes publique de la version ciblée plutôt que des classes NMS internes trouvées dans un ancien tutoriel.

---

# 18. Imports utiles

Imports Bukkit/Paper courants :

```java
import org.bukkit.Bukkit;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.World;
import org.bukkit.block.Block;
import org.bukkit.entity.Entity;
import org.bukkit.entity.Player;
import org.bukkit.entity.Zombie;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.block.BlockBreakEvent;
import org.bukkit.event.inventory.InventoryClickEvent;
import org.bukkit.event.player.PlayerJoinEvent;
import org.bukkit.inventory.Inventory;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.ItemMeta;
import org.bukkit.persistence.PersistentDataType;
import org.bukkit.plugin.java.JavaPlugin;
import org.bukkit.scheduler.BukkitRunnable;
import org.bukkit.scheduler.BukkitTask;
import org.bukkit.scoreboard.Criteria;
import org.bukkit.scoreboard.DisplaySlot;
import org.bukkit.scoreboard.Objective;
import org.bukkit.scoreboard.Scoreboard;
import org.bukkit.scoreboard.Team;
```

Adventure :

```java
import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.format.NamedTextColor;
import net.kyori.adventure.text.format.TextDecoration;
import net.kyori.adventure.bossbar.BossBar;
```

Brigadier :

```java
import com.mojang.brigadier.arguments.IntegerArgumentType;
import com.mojang.brigadier.arguments.StringArgumentType;
import com.mojang.brigadier.builder.ArgumentBuilder;
import com.mojang.brigadier.builder.LiteralArgumentBuilder;
import com.mojang.brigadier.builder.RequiredArgumentBuilder;
```

Java :

```java
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
```

---

# 19. Performances

Le serveur Minecraft doit traiter régulièrement ses ticks. Ton plugin partage donc le temps CPU avec le reste du serveur.

## À éviter

```java
new BukkitRunnable() {
    @Override
    public void run() {
        for (Player player : Bukkit.getOnlinePlayers()) {
            for (Entity entity : Bukkit.getWorlds().get(0).getEntities()) {
                // énorme quantité de travail
            }
        }
    }
}.runTaskTimer(this, 0L, 1L);
```

Une tâche chaque tick peut être parfaitement légitime, mais seulement si son coût est très faible.

## Préférer

- filtrer tôt ;
- limiter les zones ;
- limiter la fréquence ;
- mettre les calculs lourds hors du thread principal ;
- éviter de recréer inutilement des objets ;
- mettre en cache les données souvent utilisées ;
- utiliser des structures adaptées.

### Exemple

Mauvais : rechercher un joueur dans une liste complète plusieurs milliers de fois.

Meilleur :

```java
Map<UUID, PlayerData> data = new HashMap<>();
```

Puis accès direct par UUID.

---

# 20. Bonnes pratiques

## 20.1 Ne pas tout mettre dans `Main`

La classe principale doit orchestrer le plugin, pas devenir un énorme gestionnaire universel.

## 20.2 Éviter les Singletons partout

Le pattern singleton peut être pratique dans certains cas, mais une architecture avec dépendances explicites est généralement plus facile à tester et maintenir.

## 20.3 Ne pas utiliser les noms comme identifiants

Mauvais :

```java
Map<String, PlayerData> data;
```

Préférer :

```java
Map<UUID, PlayerData> data;
```

## 20.4 Ne pas utiliser le nom d'un item pour l'identifier

Mauvais :

```java
if (item.getItemMeta().displayName().equals(...)) {
}
```

Préférer un PDC.

## 20.5 Ne pas bloquer le thread principal

Évite les opérations longues dans les events et tâches synchrones.

## 20.6 Vérifier `null`

Certaines APIs peuvent renvoyer `null` : joueur hors ligne, `ItemMeta`, configuration absente, monde inexistant, etc.

## 20.7 Nettoyer les ressources

Si ton plugin ouvre :

- connexion SQL ;
- pool de threads ;
- fichiers ;
- connexions réseau ;
- tâches ;

prévois leur fermeture ou annulation lors de l'arrêt du plugin.

## 20.8 Éviter les dépendances inutiles

Chaque dépendance ajoute de la maintenance et potentiellement des conflits.

## 20.9 Utiliser Git

Fais des commits petits et explicites :

```text
feat: add custom shop menu
fix: prevent duplicated rewards
refactor: extract player data service
docs: update command guide
```

---

# 21. Projet complet d'exemple

Voici une architecture simple pour un plugin qui donne des pièces aux joueurs et possède une commande d'administration.

```text
src/main/java/fr/example/coins/
├── CoinsPlugin.java
├── command/
│   └── CoinsCommand.java
├── data/
│   └── PlayerData.java
├── listener/
│   └── PlayerListener.java
└── service/
    └── CoinService.java
```

## `CoinsPlugin.java`

```java
public final class CoinsPlugin extends JavaPlugin {

    private CoinService coinService;

    @Override
    public void onEnable() {
        saveDefaultConfig();

        coinService = new CoinService();

        getServer().getPluginManager().registerEvents(
            new PlayerListener(coinService),
            this
        );

        // Enregistrer ici les commandes selon l'API Paper ciblée.
    }

    @Override
    public void onDisable() {
        // Sauvegarde / fermeture des ressources.
    }

    public CoinService getCoinService() {
        return coinService;
    }
}
```

## `CoinService.java`

```java
public final class CoinService {

    private final Map<UUID, Integer> coins = new HashMap<>();

    public int get(UUID uuid) {
        return coins.getOrDefault(uuid, 0);
    }

    public void add(UUID uuid, int amount) {
        coins.merge(uuid, amount, Integer::sum);
    }

    public boolean remove(UUID uuid, int amount) {
        int current = get(uuid);

        if (current < amount) {
            return false;
        }

        coins.put(uuid, current - amount);
        return true;
    }
}
```

## `PlayerListener.java`

```java
public final class PlayerListener implements Listener {

    private final CoinService coinService;

    public PlayerListener(CoinService coinService) {
        this.coinService = coinService;
    }

    @EventHandler
    public void onJoin(PlayerJoinEvent event) {
        Player player = event.getPlayer();

        int coins = coinService.get(player.getUniqueId());

        player.sendMessage(
            Component.text("Tu as " + coins + " coins.")
        );
    }
}
```

Cette architecture est déjà meilleure que de mettre la `HashMap`, le listener et les commandes dans une seule classe.

---

# Checklist avant de publier un plugin

- [ ] Le plugin démarre sans erreur.
- [ ] `api-version` correspond à la cible prévue.
- [ ] Les dépendances sont correctement déclarées.
- [ ] Aucun secret/API key n'est dans le repository.
- [ ] Les données importantes sont sauvegardées.
- [ ] Les tâches sont annulées ou arrêtées correctement.
- [ ] Les opérations lourdes ne bloquent pas le thread serveur.
- [ ] Les permissions sont correctement vérifiées.
- [ ] Les commandes fonctionnent depuis la console lorsqu'elles sont censées le faire.
- [ ] Les menus empêchent les interactions indésirables.
- [ ] Les items custom utilisent des identifiants fiables.
- [ ] Les logs sont utiles et pas excessifs.
- [ ] Le plugin a été testé sur un serveur de développement.
- [ ] Le `.jar` final a été testé après un build propre.

---

# Ressources à consulter

Pour chaque version, privilégie la documentation correspondant exactement à ta version de Paper. Les anciens tutoriels Bukkit/Spigot peuvent contenir des APIs dépréciées ou des pratiques qui ne sont plus adaptées.

En cas de doute, cherche toujours :

```text
Paper API + nom de la classe + version Minecraft
```

et vérifie la Javadocs officielle avant d'utiliser une API interne/NMS.

---

# Résumé mental

Un plugin Paper peut être vu comme :

```text
                  ┌───────────────┐
                  │  Minecraft    │
                  └───────┬───────┘
                          │
              ┌───────────▼───────────┐
              │       Paper API       │
              └───────────┬───────────┘
                          │
          ┌───────────────┼────────────────┐
          │               │                │
       Events         Commands          Tasks
          │               │                │
          └───────────────┼────────────────┘
                          │
                    Services / Logic
                          │
                 ┌────────┴────────┐
                 │                 │
               Data             Menus
                 │
          YAML / PDC / DB
```

L'objectif n'est pas seulement de faire fonctionner le plugin : il faut pouvoir **le modifier six mois plus tard sans avoir peur de toucher au code**.
