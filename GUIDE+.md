# Guide+ — Développement de plugins Minecraft Paper

> Guide approfondi pour créer des plugins Paper modernes en Java. Les API Minecraft/Paper évoluent : vérifie toujours les signatures dans la Javadocs de la version ciblée.

## Important : classes des exemples

Dans ce guide, il existe deux types de classes :

- **classes fournies par Java/Paper/Adventure/Brigadier** : `HashMap`, `UUID`, `Player`, `ItemStack`, `JavaPlugin`, `Component`, etc. Tu n'as pas besoin de les créer ; il suffit de les importer.
- **classes créées par ton plugin** : `CoinService`, `PlayerData`, `QuestService`, `PlayerListener`, `Menu`, `DataManager`, etc. Ces classes doivent être créées par toi.

Quand une classe personnalisée apparaît dans un exemple, le guide indique désormais explicitement son fichier et sa déclaration.

---

## Sommaire

1. [Avant de commencer](#1-avant-de-commencer)
2. [Bases Java, Maven et Gradle](#2-bases-java-maven-et-gradle)
3. [Base d'un plugin Paper](#3-base-dun-plugin-paper)
4. [Events](#4-events)
5. [Scheduler, boucles et tâches](#5-scheduler-boucles-et-tâches)
6. [Données persistantes](#6-données-persistantes)
7. [Configuration](#7-configuration)
8. [Items](#8-items)
9. [Texte et Adventure](#9-texte-et-adventure)
10. [UI et communication : Title, ActionBar, BossBar, Toast, Dialogues](#10-ui-et-communication)
11. [Entités](#11-entités)
12. [Joueurs](#12-joueurs)
13. [Blocs](#13-blocs)
14. [Menus custom](#14-menus-custom)
15. [Sons](#15-sons)
16. [Teams](#16-teams)
17. [Scoreboard](#17-scoreboard)
18. [Permissions](#18-permissions)
19. [Commandes Brigadier](#19-commandes-brigadier)
20. [Imports utiles](#20-imports-utiles)
21. [Performances](#21-performances)
22. [Bonnes pratiques](#22-bonnes-pratiques)
23. [Architecture d'un projet](#23-architecture-dun-projet)

---

# 1. Avant de commencer

Installe un JDK compatible avec ta version de Paper, un IDE Java, Git et Maven ou Gradle. Utilise un serveur de développement séparé de la production.

```text
dev-server/
├── paper.jar
├── server.properties
└── plugins/
```

Vérifie Java :

```bash
java -version
javac -version
```

Développe de préférence avec une version précise de Minecraft/Paper plutôt qu'un projet qui change de version en permanence.

---

# 2. Bases Java, Maven et Gradle

## 2.1 Java

À maîtriser : classes, objets, méthodes, constructeurs, interfaces, héritage, enums, exceptions, generics, collections, lambdas et UUID.

`HashMap` et `UUID` sont fournis par Java :

```java
Map<UUID, Integer> coins = new HashMap<>();
coins.merge(player.getUniqueId(), 10, Integer::sum);
```

Pour les joueurs, utilise l'UUID comme identifiant persistant et non le pseudo.

## 2.2 Maven

`pom.xml` :

```xml
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

```bash
mvn clean package
```

## 2.3 Gradle

Exemple `build.gradle.kts` :

```kotlin
plugins { java }

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

```bash
./gradlew build
```

## 2.4 Dépendances

```kotlin
dependencies {
    compileOnly("io.papermc.paper:paper-api:VERSION")
    implementation("com.example:library:VERSION")
}
```

`compileOnly` est adapté lorsqu'une dépendance est fournie par le serveur. `implementation` sert notamment aux bibliothèques que le plugin doit embarquer. Pour ces dernières, étudie le shading et la relocalisation afin d'éviter les conflits.

---

# 3. Base d'un plugin Paper

## 3.1 Classe principale

La classe principale est **ta classe personnalisée**. Ici, le fichier est `MonPlugin.java` :

```java
package fr.example.monplugin;

import org.bukkit.plugin.java.JavaPlugin;

public final class MonPlugin extends JavaPlugin {
    @Override
    public void onEnable() {
        saveDefaultConfig();
        getLogger().info("Plugin activé !");
    }

    @Override
    public void onDisable() {
        getLogger().info("Plugin désactivé !");
    }
}
```

Exemple de métadonnées :

```yaml
name: MonPlugin
version: '1.0.0'
main: fr.example.monplugin.MonPlugin
api-version: '1.21'
```

Dans `onEnable()` : configuration, services, listeners, commandes et tâches. Dans `onDisable()` : sauvegardes, fermeture des ressources et nettoyage.

---

# 4. Events

Un event permet de réagir aux actions du serveur.

## 4.1 Créer son propre listener

`PlayerListener` est une classe **créée par ton plugin**. Fichier : `PlayerListener.java`.

```java
package fr.example.monplugin;

import net.kyori.adventure.text.Component;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerJoinEvent;

public final class PlayerListener implements Listener {
    @EventHandler
    public void onJoin(PlayerJoinEvent event) {
        event.getPlayer().sendMessage(Component.text("Bienvenue !"));
    }
}
```

Enregistrement depuis `MonPlugin` :

```java
getServer().getPluginManager().registerEvents(
    new PlayerListener(), this
);
```

`PlayerJoinEvent`, `Listener` et `Component` sont fournis par Paper/Adventure. `PlayerListener`, lui, est créé par toi.

## 4.2 Event annulable

```java
@EventHandler
public void onBreak(BlockBreakEvent event) {
    if (event.getBlock().getType() == Material.DIAMOND_ORE) {
        event.setCancelled(true);
    }
}
```

Les priorités vont de `LOWEST` à `MONITOR`. `MONITOR` est destinée à observer le résultat final ; évite d'y modifier l'event.

---

# 5. Scheduler, boucles et tâches

Minecraft fonctionne en ticks : 20 ticks correspondent environ à une seconde à 20 TPS.

```java
Bukkit.getScheduler().runTaskLater(this, () -> {
    player.sendMessage(Component.text("Une seconde !"));
}, 20L);
```

Répétition :

```java
Bukkit.getScheduler().runTaskTimer(this, () -> {
    // toutes les secondes
}, 0L, 20L);
```

Avec `BukkitRunnable`, qui est fourni par Bukkit/Paper :

```java
new BukkitRunnable() {
    @Override
    public void run() {
        // travail
    }
}.runTaskTimer(this, 0L, 20L);
```

Les opérations lentes comme certaines requêtes SQL ou opérations réseau peuvent être asynchrones, mais les manipulations Bukkit/Paper non thread-safe doivent rester sur le thread serveur.

---

# 6. Données persistantes

## 6.1 PersistentDataContainer

Très utile pour identifier des objets et stocker de petites données structurées :

```java
NamespacedKey key = new NamespacedKey(this, "item_id");

meta.getPersistentDataContainer().set(
    key,
    PersistentDataType.STRING,
    "magic_sword"
);
```

`NamespacedKey`, `PersistentDataType` et `PersistentDataContainer` sont fournis par Paper/Bukkit.

## 6.2 HashMap

`HashMap` est fourni par Java et ne nécessite pas de classe personnalisée :

```java
Map<UUID, Integer> data = new HashMap<>();
```

Rapide et pratique en mémoire, mais non persistante.

## 6.3 Metadata

```java
player.setMetadata(
    "in-combat",
    new FixedMetadataValue(this, true)
);
```

`FixedMetadataValue` est fourni par Bukkit. À réserver aux informations temporaires du runtime.

## 6.4 Exemple avec une classe personnalisée

Si tu veux regrouper les données d'un joueur, crée `PlayerData.java` :

```java
package fr.example.monplugin.data;

import java.util.UUID;

public final class PlayerData {
    private final UUID uuid;
    private int coins;

    public PlayerData(UUID uuid) {
        this.uuid = uuid;
    }

    public UUID getUuid() {
        return uuid;
    }

    public int getCoins() {
        return coins;
    }

    public void addCoins(int amount) {
        coins += amount;
    }
}
```

Puis ton plugin peut l'utiliser :

```java
Map<UUID, PlayerData> players = new HashMap<>();

PlayerData data = players.computeIfAbsent(
    player.getUniqueId(),
    PlayerData::new
);

data.addCoins(10);
```

Ici `PlayerData` est **ta propre classe**, tandis que `Map`, `HashMap` et `UUID` viennent de Java.

## 6.5 Repository personnalisé

Pour isoler la sauvegarde, tu peux créer `PlayerDataRepository.java` :

```java
public final class PlayerDataRepository {
    public void save(PlayerData data) {
        // Écrire data dans YAML, SQLite, MySQL, etc.
    }

    public PlayerData load(UUID uuid) {
        return new PlayerData(uuid);
    }
}
```

Architecture :

```text
Event / Command
      ↓
Service personnalisé
      ↓
Repository personnalisé
      ↓
Database
```

---

# 7. Configuration

`config.yml` :

```yaml
settings:
  max-coins: 100000
  welcome-enabled: true

messages:
  welcome: "Bienvenue !"
```

`JavaPlugin`, `FileConfiguration` et `saveDefaultConfig()` sont fournis par Paper :

```java
saveDefaultConfig();
int maxCoins = getConfig().getInt("settings.max-coins");
boolean enabled = getConfig().getBoolean("settings.welcome-enabled");
String welcome = getConfig().getString("messages.welcome", "Bienvenue !");
```

Pour un gros plugin, utilise éventuellement `config.yml`, `messages.yml`, `menus.yml`, etc. Évite de sauvegarder sur disque après chaque petite modification.

---

# 8. Items

`ItemStack` et `ItemMeta` sont fournis par Paper/Bukkit :

```java
ItemStack item = new ItemStack(Material.DIAMOND_SWORD);
ItemMeta meta = item.getItemMeta();
meta.displayName(Component.text("Épée magique"));
meta.lore(List.of(Component.text("Une arme rare.")));
item.setItemMeta(meta);
```

Identifie les items custom avec un `PersistentDataContainer`, pas avec leur nom visible ou leur lore.

```java
meta.getPersistentDataContainer().set(
    key,
    PersistentDataType.STRING,
    "magic_sword"
);
```

Centralise la création des items dans des méthodes/classes dédiées.

Exemple : si tu crées `ItemFactory`, c'est une classe personnalisée de ton plugin :

```java
public final class ItemFactory {
    public ItemStack createMagicSword() {
        return new ItemStack(Material.DIAMOND_SWORD);
    }
}
```

---

# 9. Texte et Adventure

Paper moderne utilise Adventure.

```java
player.sendMessage(Component.text("Bonjour !"));
```

`Component` vient d'Adventure :

```java
Component message = Component.text("Bonjour ")
    .append(Component.text(player.getName()))
    .append(Component.text(" !"));
```

Styles :

```java
Component.text("Attention")
    .color(NamedTextColor.GOLD)
    .decorate(TextDecoration.BOLD);
```

MiniMessage est utile pour les messages configurables :

```text
<gold><bold>Attention !</bold></gold>
```

Ne traite pas directement une entrée utilisateur non fiable comme du MiniMessage.

Si tu crées un `MessageService`, il s'agit d'une classe personnalisée :

```java
public final class MessageService {
    public Component welcome(String name) {
        return Component.text("Bienvenue " + name + " !");
    }
}
```

---

# 10. UI et communication

Minecraft propose plusieurs canaux de communication. Le bon choix dépend de la quantité d'information et du contexte.

| Système | Utilisation |
|---|---|
| Chat | détails et messages longs |
| ActionBar | état court, cooldown, combat |
| Title | événement important |
| BossBar | progression, timer, boss |
| Toast | récompense/découverte |
| Dialogue | choix, narration, confirmation |
| Menu inventaire | GUI complexe |
| Son | feedback immédiat |

## 10.1 Titles

Un Title apparaît au centre de l'écran et possède un titre, un sous-titre et des timings.

```java
player.showTitle(Title.title(
    Component.text("Victoire !"),
    Component.text("Tu as remporté la partie")
));
```

Timings personnalisés :

```java
Title.Times times = Title.Times.times(
    Duration.ofMillis(500),
    Duration.ofSeconds(3),
    Duration.ofMillis(500)
);

player.showTitle(Title.title(
    Component.text("Bienvenue"),
    Component.text("Bon jeu !"),
    times
));
```

Effacer :

```java
player.clearTitle();
```

### Bon usage

Les Titles sont très visibles. Utilise-les pour les moments importants : début de partie, victoire, défaite, changement de niveau, annonce majeure. Évite de les envoyer en boucle.

## 10.2 ActionBar

L'ActionBar se trouve au-dessus de la barre d'inventaire.

```java
player.sendActionBar(
    Component.text("Combat : 10 secondes")
);
```

Exemple de compte à rebours :

```java
new BukkitRunnable() {
    int seconds = 10;

    @Override
    public void run() {
        if (!player.isOnline() || seconds <= 0) {
            cancel();
            return;
        }

        player.sendActionBar(
            Component.text("Combat : " + seconds + "s")
        );
        seconds--;
    }
}.runTaskTimer(this, 0L, 20L);
```

## 10.3 BossBar

Une BossBar affiche un titre et une progression.

```java
BossBar bar = Bukkit.createBossBar(
    Component.text("Capture de la zone"),
    BarColor.BLUE,
    BarStyle.SOLID
);

bar.addPlayer(player);
bar.progress(0.5);
```

Mise à jour :

```java
bar.name(Component.text("Capture : 50%"));
bar.progress(0.5);
```

Ne crée pas une nouvelle BossBar à chaque tick. Conserve l'instance et mets-la à jour. Retire les joueurs lorsque l'interface ou l'événement se termine.

## 10.4 Toasts

Les toasts sont les petites notifications qui apparaissent en haut à droite, proches du rendu des advancements.

Ils conviennent à :

- récompense ;
- objet découvert ;
- succès de quête ;
- notification courte.

Le toast est lié au système d'**advancements**. Pour une implémentation moderne, crée/affiche l'advancement temporaire avec l'API disponible dans la version ciblée, puis prévois son nettoyage.

Conceptuellement :

```text
Action du joueur
      ↓
Advancement temporaire
      ↓
Toast affiché
      ↓
Révocation / nettoyage
```

Pour une simple information, l'ActionBar est souvent plus facile.

## 10.5 Dialogues Minecraft

Les versions modernes de Minecraft possèdent un système de **Dialogues** permettant de créer des interfaces natives structurées.

Un dialogue peut contenir notamment :

- un titre ;
- du texte ou du contenu ;
- des boutons ;
- des actions ;
- des choix ;
- des confirmations ;
- des interactions de quête/narration.

### Dialogue vs menu

Menu inventaire :

```text
Inventory
├── slots
├── ItemStack
└── InventoryClickEvent
```

Dialogue :

```text
Dialogue
├── titre
├── contenu
├── boutons
└── actions
```

Un dialogue est donc particulièrement adapté à une conversation avec un PNJ, une confirmation ou un choix narratif.

### Exemple de conception

```text
┌────────────────────────────────────┐
│            Le vieux garde          │
│                                    │
│  « Peux-tu retrouver mon épée     │
│    dans la forêt ? »              │
│                                    │
│    [ Accepter ]   [ Refuser ]     │
└────────────────────────────────────┘
```

Si tu utilises une classe `QuestService` dans cet exemple, cette classe doit être créée par ton plugin. Par exemple, fichier `QuestService.java` :

```java
public final class QuestService {
    public void startQuest(Player player, String questId) {
        // Enregistrer le début de la quête.
    }
}
```

Puis :

```java
QuestService questService = new QuestService();
questService.startQuest(player, "lost_sword");
```

L'architecture devient :

```text
Dialogue
   ↓
QuestService (ta classe)
   ↓
Données de quête
   ↓
Title + Sound + BossBar
```

### API et versions

L'API publique de création et d'envoi des Dialogues dépend de la version de Paper/Minecraft. N'utilise pas automatiquement une classe `net.minecraft.*` trouvée dans un ancien tutoriel : vérifie d'abord l'API Paper de ta version.

Si l'API publique de ta version expose une construction de dialogue, privilégie-la. Si une fonctionnalité nécessite réellement du NMS, isole cette implémentation derrière une classe dédiée.

## 10.6 Combiner les systèmes

```text
Chat       → détails de la quête
Title      → « Nouvelle quête ! »
Sound      → feedback
ActionBar  → objectif actuel
BossBar    → progression
Dialogue   → choix du joueur
Toast      → récompense
Menu       → inventaire/récompenses
```

---

# 11. Entités

Les classes `Entity`, `Zombie`, `Player` et `World` sont fournies par Paper :

```java
for (Entity entity : world.getEntities()) {
    if (entity instanceof Zombie zombie) {
        zombie.setGlowing(true);
    }
}
```

Spawn :

```java
Zombie zombie = world.spawn(location, Zombie.class);
zombie.customName(Component.text("Garde"));
zombie.setCustomNameVisible(true);
```

Suppression :

```java
entity.remove();
```

Si tu veux créer une classe personnalisée pour gérer un boss, par exemple `BossManager`, elle doit être définie par ton plugin :

```java
public final class BossManager {
    public void spawnBoss(Location location) {
        // Créer et configurer le boss.
    }
}
```

Pour les recherches fréquentes, limite la zone et évite de parcourir toutes les entités du serveur.

---

# 12. Joueurs

```java
Player player = event.getPlayer();
UUID uuid = player.getUniqueId();
```

Récupérer un joueur connecté :

```java
Player player = Bukkit.getPlayer(uuid);
```

Tous les joueurs :

```java
for (Player player : Bukkit.getOnlinePlayers()) {
    // ...
}
```

Un joueur peut être déconnecté entre deux opérations : vérifie toujours que ton contexte est encore valide.

Si tu crées un `PlayerService`, il s'agit de ta classe :

```java
public final class PlayerService {
    public boolean isReady(Player player) {
        return player.isOnline();
    }
}
```

---

# 13. Blocs

`Block`, `Location`, `Material` sont fournis par Paper/Bukkit :

```java
Block block = location.getBlock();
Material type = block.getType();
block.setType(Material.GOLD_BLOCK);
```

Event :

```java
@EventHandler
public void onBreak(BlockBreakEvent event) {
    if (event.getBlock().getType() != Material.DIAMOND_ORE) return;
    event.getPlayer().sendMessage(Component.text("Diamant !"));
}
```

Les opérations massives sur le monde doivent être découpées et optimisées.

---

# 14. Menus custom

## 14.1 Menu simple

`Inventory` est fourni par Bukkit/Paper. Pour un menu réutilisable, tu peux créer une classe personnalisée `ShopMenu`.

Fichier `ShopMenu.java` :

```java
public final class ShopMenu {
    public static final String TITLE = "Boutique";

    public Inventory create() {
        Inventory inventory = Bukkit.createInventory(
            null,
            27,
            Component.text(TITLE)
        );

        inventory.setItem(13, new ItemStack(Material.DIAMOND));
        return inventory;
    }
}
```

Utilisation :

```java
ShopMenu menu = new ShopMenu();
player.openInventory(menu.create());
```

## 14.2 Gestion du clic

```java
@EventHandler
public void onClick(InventoryClickEvent event) {
    if (!(event.getWhoClicked() instanceof Player player)) return;
    if (!event.getView().title().equals(Component.text(ShopMenu.TITLE))) return;

    event.setCancelled(true);

    if (event.getRawSlot() == 13) {
        player.sendMessage(Component.text("Achat !"));
    }
}
```

Pour un gros plugin, ne reconnais pas un menu uniquement avec son titre. Crée une abstraction `Menu` ou un identifiant interne. `getRawSlot()` permet de distinguer les slots du menu supérieur de l'inventaire du joueur.

---

# 15. Sons

`Sound` est fourni par Paper/Bukkit :

```java
player.playSound(
    player.getLocation(),
    Sound.ENTITY_PLAYER_LEVELUP,
    1.0f,
    1.0f
);
```

Si tu crées `SoundService`, il s'agit d'une classe personnalisée :

```java
public final class SoundService {
    public void playSuccess(Player player) {
        player.playSound(
            player.getLocation(),
            Sound.ENTITY_PLAYER_LEVELUP,
            1.0f,
            1.0f
        );
    }
}
```

---

# 16. Teams

Les classes `Scoreboard` et `Team` sont fournies par Bukkit/Paper :

```java
Scoreboard scoreboard = Bukkit.getScoreboardManager().getMainScoreboard();
Team team = scoreboard.getTeam("red");

if (team == null) {
    team = scoreboard.registerNewTeam("red");
}

team.addPlayer(player);
```

Les teams peuvent notamment contrôler la couleur, la collision et l'affichage du nametag.

---

# 17. Scoreboard

Les classes utilisées ici sont fournies par Bukkit/Paper :

```java
Scoreboard scoreboard = Bukkit.getScoreboardManager().getNewScoreboard();
Objective objective = scoreboard.registerNewObjective(
    "stats",
    Criteria.DUMMY,
    Component.text("Statistiques")
);
objective.setDisplaySlot(DisplaySlot.SIDEBAR);
player.setScoreboard(scoreboard);
```

Pour un scoreboard dynamique, mets à jour les informations plutôt que de reconstruire inutilement toute l'interface à chaque tick.

---

# 18. Permissions

```java
if (!player.hasPermission("monplugin.admin")) {
    player.sendMessage(Component.text("Accès refusé."));
    return;
}
```

Préférer :

```text
monplugin.command.reload
monplugin.command.give
monplugin.quest.admin
monplugin.debug
```

Évite les vérifications de pseudo codées en dur.

---

# 19. Commandes Brigadier

Brigadier représente une commande comme un arbre :

```text
/monplugin
├── info
├── reload
└── give <joueur> <quantité>
```

Les builders et types Brigadier sont fournis par Brigadier. En revanche, une classe comme `MainCommand` serait une classe personnalisée de ton plugin et doit être déclarée.

Exemple de fichier `MainCommand.java` :

```java
public final class MainCommand {
    public LiteralArgumentBuilder<CommandSourceStack> create() {
        return LiteralArgumentBuilder.literal("monplugin")
            .executes(context -> {
                context.getSource().getSender().sendMessage("Bonjour !");
                return 1;
            });
    }
}
```

Littéral :

```java
LiteralArgumentBuilder<CommandSourceStack> root =
    LiteralArgumentBuilder.literal("monplugin");
```

Argument :

```java
RequiredArgumentBuilder<CommandSourceStack, Integer> amount =
    RequiredArgumentBuilder.argument(
        "amount",
        IntegerArgumentType.integer(1, 64)
    );
```

Récupération :

```java
int amount = IntegerArgumentType.getInteger(context, "amount");
```

Suggestions :

```java
suggests((context, builder) -> {
    Bukkit.getOnlinePlayers().forEach(player ->
        builder.suggest(player.getName())
    );
    return builder.buildFuture();
});
```

Permissions :

```java
.requires(source ->
    source.getSender().hasPermission("monplugin.admin")
)
```

Ne suppose jamais qu'une commande vient d'un joueur : la console peut être la source.

> L'enregistrement exact des commandes Brigadier évolue avec Paper. Utilise l'API publique de ta version et évite de dépendre directement de NMS lorsque ce n'est pas nécessaire.

---

# 20. Imports utiles

Les imports suivants sont ceux de bibliothèques Java/Paper/Adventure/Brigadier : aucune des classes listées ici n'est une classe que tu dois créer toi-même.

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

import net.kyori.adventure.bossbar.BossBar;
import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.format.NamedTextColor;
import net.kyori.adventure.text.format.TextDecoration;
import net.kyori.adventure.title.Title;

import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
```

Brigadier :

```java
import com.mojang.brigadier.arguments.IntegerArgumentType;
import com.mojang.brigadier.arguments.StringArgumentType;
import com.mojang.brigadier.builder.ArgumentBuilder;
import com.mojang.brigadier.builder.LiteralArgumentBuilder;
import com.mojang.brigadier.builder.RequiredArgumentBuilder;
```

---

# 21. Performances

Évite les traitements lourds chaque tick.

```text
Chaque tick
 └── tous les joueurs
      └── toutes les entités
           └── tous les blocs
```

Préférer :

- filtrage précoce ;
- zones limitées ;
- fréquence adaptée ;
- cache ;
- opérations IO asynchrones ;
- retour sur le thread principal pour modifier le monde.

Une tâche toutes les secondes est souvent largement suffisante pour une information qui n'a pas besoin d'être actualisée 20 fois par seconde.

---

# 22. Bonnes pratiques

- Sépare listeners, commandes, services et données.
- Utilise UUID pour les joueurs.
- Utilise PDC pour identifier les objets custom.
- Ne bloque pas le thread principal.
- Ferme les ressources dans `onDisable()`.
- Annule les tâches dont le cycle de vie est terminé.
- N'utilise pas NMS sans nécessité.
- Vérifie la version de Paper avant de copier un tutoriel.
- Ne masque pas les exceptions.
- N'embarque pas une dépendance fournie par Paper inutilement.
- Teste sur un serveur local.

Commits Git lisibles :

```text
feat: add quest dialogue
fix: prevent duplicate reward
refactor: extract player data service
docs: expand UI guide
```

---

# 23. Architecture d'un projet

Toutes les classes ci-dessous sont des **classes personnalisées que tu crées dans ton plugin** :

```text
fr.example.monplugin
├── MonPlugin.java
├── command/
│   ├── MainCommand.java
│   └── AdminCommand.java
├── listener/
│   ├── PlayerListener.java
│   ├── BlockListener.java
│   └── InventoryListener.java
├── service/
│   ├── QuestService.java
│   └── PlayerService.java
├── data/
│   ├── PlayerData.java
│   └── DataManager.java
├── menu/
│   ├── Menu.java
│   └── ShopMenu.java
├── dialogue/
│   ├── DialogueManager.java
│   └── QuestDialogue.java
├── task/
│   └── CombatTask.java
└── util/
    └── ItemUtil.java
```

Exemple minimal de `QuestService.java` :

```java
public final class QuestService {
    public void startQuest(Player player, String id) {
        // Logique de quête.
    }
}
```

Exemple minimal de `Menu.java` :

```java
public interface Menu {
    Inventory create();
}
```

Exemple minimal de `ShopMenu.java` :

```java
public final class ShopMenu implements Menu {
    @Override
    public Inventory create() {
        return Bukkit.createInventory(
            null,
            27,
            Component.text("Boutique")
        );
    }
}
```

Une bonne règle :

```text
Event / Command
      ↓
Service personnalisé
      ↓
Data / World / UI
```

Le but n'est pas seulement que le plugin fonctionne aujourd'hui, mais que son code reste compréhensible après plusieurs mois de développement.

---

# Checklist avant publication

- [ ] Le plugin démarre sans erreur.
- [ ] La version Paper cible est claire.
- [ ] Les dépendances sont correctement configurées.
- [ ] Aucun secret n'est dans Git.
- [ ] Les données importantes sont persistantes.
- [ ] Les tâches ont un cycle de vie correct.
- [ ] Les opérations lourdes ne bloquent pas le serveur.
- [ ] Les permissions sont vérifiées.
- [ ] Les commandes fonctionnent avec la console lorsque nécessaire.
- [ ] Les menus bloquent les interactions non prévues.
- [ ] Les items custom utilisent un identifiant fiable.
- [ ] Les Titles, BossBars, Dialogues et menus sont nettoyés à la fin de leur cycle de vie.
- [ ] Toutes les classes personnalisées utilisées dans les exemples sont créées dans le projet.
- [ ] Le plugin a été testé après un build propre.

## Règle d'or

**Si un nom de classe n'est pas fourni par Java, Paper, Adventure ou une autre dépendance, et qu'il apparaît dans un exemple, crée cette classe dans ton projet avant de l'utiliser.**

**Privilégie l'API publique Paper/Adventure, vérifie la documentation de ta version et isole les parties NMS lorsque leur utilisation est réellement nécessaire.**
