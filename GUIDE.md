# Guide de création de plugins Minecraft Paper

Ce guide propose un parcours progressif pour créer des plugins Minecraft avec **Paper**, en Java, depuis la création du projet jusqu'aux commandes Brigadier.

> **Version cible :** Paper moderne (API récente). Les signatures de certaines API peuvent évoluer selon la version de Minecraft/Paper : vérifie toujours la Javadocs de la version ciblée.

## Sommaire

- [1. Bases](#1-bases)
  - [Maven et Gradle](#maven-et-gradle)
  - [Bases du Java](#bases-du-java)
  - [Ajouter des dépendances](#ajouter-des-dépendances-dans-le-projet)
- [2. Plugin](#2-plugin)
  - [Base du plugin](#base-du-plugin)
  - [Events](#events)
  - [Boucles et BukkitRunnable](#boucles-et-bukbitrunnable)
  - [Sauvegarde de données](#sauvegarde-de-données)
  - [Configuration](#configuration)
  - [Gestion des items](#gestion-des-items)
  - [Texte](#texte)
  - [Gestion des entités](#gestion-des-entités)
  - [Gestion des joueurs](#gestion-des-joueurs)
  - [Gestion des blocs](#gestion-des-blocs)
  - [Menus custom](#menus-custom)
  - [Sons](#sons)
  - [Teams](#teams)
  - [Scoreboard](#scoreboard)
  - [BossBar](#bossbar)
  - [Permissions](#permissions)
- [3. Commandes Brigadier](#3-commandes-brigadier)
  - [Bases](#bases-1)
  - [Arguments](#arguments)
  - [Suggestions](#suggestions)
  - [Permissions](#permissions-1)
- [4. Imports utiles](#4-imports-utiles)

---

# 1. Bases

## Maven et Gradle

Les plugins Paper sont généralement construits avec **Maven** ou **Gradle**. Les deux outils gèrent les dépendances, la compilation et la génération du `.jar`.

### Maven

Maven utilise principalement `pom.xml`.

```xml
<properties>
    <maven.compiler.release>21</maven.compiler.release>
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
```

Commandes utiles :

```bash
mvn clean package
```

Le `.jar` est généralement généré dans `target/`.

### Gradle

Gradle utilise généralement `build.gradle` ou `build.gradle.kts`.

Exemple Kotlin DSL :

```kotlin
plugins {
    java
}

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

Puis :

```bash
./gradlew build
```

Le `.jar` se trouve généralement dans `build/libs/`.

### Quel outil choisir ?

- **Maven** : très classique, simple à comprendre et largement documenté.
- **Gradle** : très flexible et particulièrement pratique pour les projets modernes ou complexes.

L'important est surtout de choisir un outil et de comprendre comment il gère les dépendances et le cycle de build.

## Bases du Java

Avant Paper, il faut maîtriser les fondamentaux du Java :

- classes et objets ;
- méthodes ;
- constructeurs ;
- visibilité (`public`, `private`, `protected`) ;
- `static` et `final` ;
- héritage et interfaces ;
- enums ;
- collections (`List`, `Set`, `Map`) ;
- génériques ;
- exceptions ;
- lambdas et interfaces fonctionnelles ;
- `Optional` ;
- packages et imports.

Exemple :

```java
public class PlayerData {
    private final UUID uuid;
    private int coins;

    public PlayerData(UUID uuid) {
        this.uuid = uuid;
    }

    public int getCoins() {
        return coins;
    }

    public void addCoins(int amount) {
        coins += amount;
    }
}
```

Pour un plugin, apprends aussi à séparer ton code en classes : `Main`, listeners, commandes, services, gestionnaires de données, etc. Évite de mettre toute la logique dans la classe principale.

## Ajouter des dépendances dans le projet

Une dépendance est une bibliothèque dont ton plugin a besoin pour compiler ou fonctionner.

Exemple Gradle :

```kotlin
dependencies {
    compileOnly("io.papermc.paper:paper-api:VERSION")
    implementation("com.example:library:VERSION")
}
```

### `compileOnly` vs `implementation`

- `compileOnly` : nécessaire pour compiler, mais fourni par le serveur ou une autre couche.
- `implementation` : embarqué dans ton plugin lors du packaging selon ta configuration.

Pour une API fournie par Paper, utilise normalement `compileOnly`.

> Attention : ajouter une bibliothèque à Gradle ne signifie pas automatiquement qu'elle sera disponible sur le serveur. Vérifie son mode de chargement et, si nécessaire, configure le shading/relocalisation.

---

# 2. Plugin

## Base du plugin

Un plugin Paper possède au minimum une classe principale et un fichier `paper-plugin.yml` (ou, selon le projet et la compatibilité recherchée, `plugin.yml`).

Exemple moderne :

```yaml
name: MonPlugin
version: '1.0.0'
main: fr.example.monplugin.MonPlugin
api-version: '1.21'
```

Classe principale :

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

Utilise `onEnable()` pour initialiser tes systèmes et `onDisable()` pour fermer proprement ce qui doit l'être.

### Organisation recommandée

```text
src/main/java/fr/example/monplugin/
├── MonPlugin.java
├── command/
├── listener/
├── menu/
├── data/
├── service/
└── util/

src/main/resources/
├── paper-plugin.yml
└── config.yml
```

## Events

Les events permettent de réagir aux actions du serveur : connexion d'un joueur, casse d'un bloc, clic, dégâts, interaction avec un inventaire, etc.

Listener :

```java
public class PlayerListener implements Listener {

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

### Bonnes pratiques

- Un listener par domaine quand le projet grandit.
- Vérifier les conditions le plus tôt possible.
- Éviter les traitements lourds dans le thread principal.
- Comprendre si un event est annulable avant d'utiliser `setCancelled(true)`.

## Boucles et BukkitRunnable

Ne fais pas de boucle infinie directement dans `onEnable()` : elle bloquerait le thread principal du serveur.

Pour une tâche répétée, utilise le scheduler Paper/Bukkit.

```java
new BukkitRunnable() {
    @Override
    public void run() {
        Bukkit.broadcast(Component.text("Une seconde est passée !"));
    }
}.runTaskTimer(this, 0L, 20L);
```

20 ticks correspondent approximativement à une seconde lorsque le serveur tourne à 20 TPS.

### Tâches synchrones et asynchrones

```java
runTask(this, runnable);
runTaskLater(this, runnable, 20L);
runTaskTimer(this, runnable, 0L, 20L);
runTaskAsynchronously(this, runnable);
```

Ne manipule pas aveuglément l'API Bukkit/Paper depuis un thread asynchrone : beaucoup d'objets de l'API ne sont pas thread-safe. Utilise l'asynchrone principalement pour des opérations bloquantes comme certaines E/S, puis reviens sur le thread serveur pour modifier le monde.

## Sauvegarde de données

Il existe plusieurs façons de stocker des données.

### PersistentDataContainer

`PersistentDataContainer` permet d'associer des données persistantes à des objets qui implémentent `PersistentDataHolder`.

```java
NamespacedKey key = new NamespacedKey(this, "coins");

player.getPersistentDataContainer().set(
    key,
    PersistentDataType.INTEGER,
    100
);

Integer coins = player.getPersistentDataContainer().get(
    key,
    PersistentDataType.INTEGER
);
```

Avantages : données attachées directement à l'objet et adaptées aux données simples.

### HashMap

```java
private final Map<UUID, Integer> coins = new HashMap<>();
```

Très pratique pour les données temporaires en mémoire. Attention : une `HashMap` seule n'est **pas persistante**. Son contenu disparaît au redémarrage.

### Metadata

La metadata est utile pour des informations temporaires associées à un objet Bukkit :

```java
player.setMetadata("inCombat", new FixedMetadataValue(this, true));
```

Elle ne doit pas être confondue avec une base de données persistante.

### Fichier YAML / JSON / base de données

Pour des données durables :

- YAML : simple pour de petits projets ;
- JSON : pratique pour des structures sérialisées ;
- SQLite : excellent choix pour un plugin local avec beaucoup de données ;
- MySQL/PostgreSQL : intéressant pour un réseau de serveurs ou des données centralisées.

Le principe recommandé est : charger les données au démarrage, les modifier en mémoire, puis sauvegarder de manière contrôlée.

## Configuration

Paper charge automatiquement `config.yml` si tu utilises `saveDefaultConfig()`.

```java
@Override
public void onEnable() {
    saveDefaultConfig();

    String message = getConfig().getString("messages.welcome", "Bienvenue !");
}
```

Exemple :

```yaml
messages:
  welcome: "Bienvenue sur le serveur !"
settings:
  max-coins: 100000
```

Puis :

```java
int maxCoins = getConfig().getInt("settings.max-coins");
```

Pour recharger :

```java
reloadConfig();
```

Évite de lire le fichier à chaque événement : charge les valeurs nécessaires et garde-les en mémoire si le chemin est utilisé très souvent.

## Gestion des items

Créer un item :

```java
ItemStack item = new ItemStack(Material.DIAMOND_SWORD);
ItemMeta meta = item.getItemMeta();

meta.displayName(Component.text("Épée spéciale"));
meta.lore(List.of(Component.text("Une arme rare.")));
item.setItemMeta(meta);
```

Pour identifier de manière fiable un item custom, préfère un `PersistentDataContainer` à la comparaison du nom ou du lore :

```java
NamespacedKey key = new NamespacedKey(this, "special_sword");
meta.getPersistentDataContainer().set(
    key,
    PersistentDataType.BYTE,
    (byte) 1
);
```

Tu peux ensuite tester cette donnée lors d'un clic.

## Texte

Sur les versions modernes de Paper, privilégie les **Adventure Components** :

```java
player.sendMessage(
    Component.text("Bienvenue ")
        .append(Component.text(player.getName()))
);
```

Pour des couleurs simples :

```java
Component.text("Erreur", NamedTextColor.RED);
```

Pour du texte riche, utilise les APIs Adventure plutôt que de construire partout des chaînes avec les anciens codes `§`.

## Gestion des entités

Récupérer des entités dans un monde :

```java
for (Entity entity : world.getEntities()) {
    if (entity instanceof Zombie zombie) {
        zombie.setGlowing(true);
    }
}
```

Créer une entité :

```java
world.spawn(location, Zombie.class, zombie -> {
    zombie.setCustomName("Garde");
    zombie.setCustomNameVisible(true);
});
```

Évite de parcourir toutes les entités très fréquemment sur de grands serveurs. Quand c'est possible, limite ta recherche à une zone ou garde des références appropriées.

## Gestion des joueurs

```java
Player player = Bukkit.getPlayer(uuid);
```

Parcourir les joueurs connectés :

```java
for (Player player : Bukkit.getOnlinePlayers()) {
    player.sendMessage(Component.text("Message global"));
}
```

Vérifier un joueur :

```java
if (player.hasPermission("monplugin.admin")) {
    // ...
}
```

Utilise l'UUID comme identifiant persistant plutôt que le nom du joueur.

## Gestion des blocs

Lire un bloc :

```java
Block block = location.getBlock();
Material material = block.getType();
```

Modifier un bloc :

```java
block.setType(Material.GOLD_BLOCK);
```

Réagir à une casse :

```java
@EventHandler
public void onBreak(BlockBreakEvent event) {
    if (event.getBlock().getType() == Material.DIAMOND_ORE) {
        event.getPlayer().sendMessage(Component.text("Diamant !"));
    }
}
```

Attention aux modifications massives du monde : elles peuvent coûter cher en performances.

## Menus custom

Un menu custom est généralement un inventaire Bukkit contrôlé par un listener.

```java
Inventory inventory = Bukkit.createInventory(
    null,
    27,
    Component.text("Menu")
);

inventory.setItem(13, item);
player.openInventory(inventory);
```

À l'ouverture, tu construis le contenu. À l'événement `InventoryClickEvent`, tu détectes le menu et l'action.

```java
@EventHandler
public void onClick(InventoryClickEvent event) {
    if (!(event.getWhoClicked() instanceof Player player)) return;

    if (event.getView().title().equals(Component.text("Menu"))) {
        event.setCancelled(true);
        // gérer le clic
    }
}
```

Pour des menus robustes, évite de dépendre uniquement du titre : utilise une structure de menu ou une identification interne permettant de distinguer plusieurs interfaces.

## Sons

```java
player.playSound(
    player.getLocation(),
    Sound.ENTITY_PLAYER_LEVELUP,
    1.0f,
    1.0f
);
```

Tu peux également jouer un son au niveau du monde pour les joueurs à proximité avec les APIs appropriées.

## Teams

Les teams sont gérées via le scoreboard :

```java
Scoreboard scoreboard = Bukkit.getScoreboardManager().getMainScoreboard();
Team team = scoreboard.getTeam("red");

if (team == null) {
    team = scoreboard.registerNewTeam("red");
}

team.addPlayer(player);
```

Configure ensuite les options nécessaires : couleur, collisions, nametag, etc.

Évite de créer une nouvelle team à chaque connexion sans vérifier si elle existe déjà.

## Scoreboard

Pour un scoreboard :

```java
Scoreboard scoreboard = Bukkit.getScoreboardManager().getNewScoreboard();
Objective objective = scoreboard.registerNewObjective(
    "stats",
    Criteria.DUMMY,
    Component.text("Mon serveur")
);

objective.setDisplaySlot(DisplaySlot.SIDEBAR);
objective.getScore("§aCoins").setScore(100);

player.setScoreboard(scoreboard);
```

Sur les APIs modernes, préfère les Components et les mécanismes de scoreboard disponibles dans la version Paper ciblée.

## BossBar

```java
BossBar bar = Bukkit.createBossBar(
    Component.text("Boss"),
    BarColor.RED,
    BarStyle.SOLID
);

bar.addPlayer(player);
bar.progress(0.5);
```

Tu peux mettre à jour le titre et la progression au fil du temps.

## Permissions

Teste une permission avec :

```java
if (player.hasPermission("monplugin.admin")) {
    // action réservée
}
```

Déclare les permissions dans la configuration du plugin selon le format supporté par la version Paper ciblée, ou utilise un plugin de permissions comme gestionnaire externe.

Évite de coder des noms de groupes (`admin`, `moderator`, etc.) en dur : utilise des permissions atomiques comme `monplugin.command.reload`.

---

# 3. Commandes Brigadier

Brigadier est le système de commandes utilisé par Minecraft. Paper fournit une API pour construire des commandes modernes avec arguments, suggestions et contrôles de permission.

## Bases

Une commande moderne est généralement structurée comme un arbre :

```text
monplugin
├── reload
├── give
│   └── <joueur>
│       └── <quantité>
└── info
```

Chaque nœud représente une partie de la commande.

> L'API exacte de création/enregistrement des commandes peut évoluer avec les versions de Paper. Consulte la documentation de la version cible plutôt que de copier une implémentation interne de Minecraft.

## Arguments

Les arguments permettent de récupérer des valeurs typées :

```text
/give <joueur> <quantité>
```

Conceptuellement :

```java
RequiredArgumentBuilder<CommandSourceStack, Integer> amount =
    RequiredArgumentBuilder.argument(
        "amount",
        IntegerArgumentType.integer(1, 64)
    );
```

Puis dans l'exécution :

```java
int amount = IntegerArgumentType.getInteger(context, "amount");
```

Types fréquents :

- `StringArgumentType` ;
- `IntegerArgumentType` ;
- `LongArgumentType` ;
- `DoubleArgumentType` ;
- arguments Minecraft pour joueurs, entités, positions, ressources, etc.

## Suggestions

Les suggestions rendent les commandes plus agréables :

```text
/monplugin give <TAB>
```

Tu peux proposer les noms des joueurs connectés, des modes, des sous-commandes, etc.

Exemple conceptuel :

```java
suggests((context, builder) -> {
    Bukkit.getOnlinePlayers().forEach(player ->
        builder.suggest(player.getName())
    );
    return builder.buildFuture();
});
```

Pour des valeurs dynamiques, génère les suggestions à partir de l'état actuel du serveur plutôt que d'une liste figée.

## Permissions

Les commandes doivent vérifier les permissions au niveau approprié.

Exemple conceptuel avec une exigence :

```java
.requires(source -> source.getSender().hasPermission("monplugin.admin"))
```

Pour une commande avec plusieurs branches, tu peux avoir des permissions différentes :

```text
/monplugin info       -> joueurs
/monplugin reload     -> monplugin.admin
/monplugin debug      -> monplugin.debug
```

Cela permet de garder un système de permissions clair et granulaire.

---

# 4. Imports utiles

Les imports exacts dépendent de la version Paper ciblée. Voici une base fréquemment utilisée :

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
import org.bukkit.scoreboard.Scoreboard;
import org.bukkit.scoreboard.Team;

import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.format.NamedTextColor;
import net.kyori.adventure.bossbar.BossBar;
```

Pour les commandes Brigadier, les imports typiques incluent notamment :

```java
import com.mojang.brigadier.arguments.IntegerArgumentType;
import com.mojang.brigadier.arguments.StringArgumentType;
import com.mojang.brigadier.builder.ArgumentBuilder;
import com.mojang.brigadier.builder.LiteralArgumentBuilder;
import com.mojang.brigadier.builder.RequiredArgumentBuilder;
```

## Règle importante sur les imports

N'essaie pas de mémoriser tous les imports. Utilise ton IDE :

1. écris la classe dont tu as besoin ;
2. demande à l'IDE d'ajouter l'import ;
3. vérifie le package ;
4. si la classe n'existe pas, vérifie que la dépendance et la version Paper sont correctes.

---

# Conseils de structure pour un vrai plugin

Quand le projet grandit, une structure comme celle-ci fonctionne bien :

```text
fr.example.monplugin
├── MonPlugin.java
├── command
│   ├── MainCommand.java
│   └── AdminCommand.java
├── listener
│   ├── PlayerListener.java
│   ├── BlockListener.java
│   └── InventoryListener.java
├── menu
│   ├── Menu.java
│   └── MainMenu.java
├── data
│   ├── PlayerData.java
│   └── DataManager.java
├── service
│   ├── EconomyService.java
│   └── CombatService.java
└── util
    └── ItemUtil.java
```

Quelques règles simples :

- `MonPlugin` initialise les composants, mais ne contient pas toute la logique.
- Les listeners réagissent aux events et délèguent la logique à des services.
- Les données persistantes ont un gestionnaire dédié.
- Les tâches planifiées ont un cycle de vie clair.
- Les UUID sont préférés aux noms pour identifier les joueurs.
- Les `PersistentDataContainer` sont préférés aux noms/lore pour identifier des objets custom.
- Les opérations lourdes ne doivent pas bloquer le thread serveur.
- Les APIs internes/NMS doivent être isolées derrière une couche dédiée si elles sont vraiment nécessaires.

## Parcours conseillé

1. Java : classes, interfaces, collections et exceptions.
2. Maven/Gradle : compiler un projet simple.
3. Premier plugin Paper.
4. Events et listeners.
5. Items, blocs, joueurs et entités.
6. Configuration et persistance.
7. Scheduler et tâches répétées.
8. Menus, scoreboards et bossbars.
9. Permissions.
10. Commandes Brigadier.
11. Architecture et optimisation.

Ce parcours permet de passer progressivement d'un plugin de test à une base propre et maintenable.
