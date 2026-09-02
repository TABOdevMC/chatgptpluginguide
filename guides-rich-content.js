(() => {
  const LEVELS = { beginner:['Débutant','beginner','🟢'], intermediate:['Intermédiaire','intermediate','🔵'], advanced:['Avancé','advanced','🟡'], expert:['Expert','expert','🟣'] };
  const IMPORTS = {
    Java:['java.util.*'],
    'Gradle & Maven':[],
    'Paper Core':['org.bukkit.plugin.java.JavaPlugin','org.bukkit.Bukkit','org.bukkit.plugin.PluginManager'],
    Events:['org.bukkit.event.EventHandler','org.bukkit.event.Listener','org.bukkit.event.EventPriority','org.bukkit.event.player.PlayerJoinEvent','org.bukkit.entity.Player'],
    Scheduler:['org.bukkit.Bukkit','org.bukkit.scheduler.BukkitTask','org.bukkit.scheduler.BukkitRunnable'],
    Données:['java.util.UUID','java.util.Map','java.util.HashMap','org.bukkit.NamespacedKey','org.bukkit.persistence.PersistentDataType'],
    Configuration:['org.bukkit.configuration.file.FileConfiguration','org.bukkit.configuration.file.YamlConfiguration'],
    Items:['org.bukkit.Material','org.bukkit.inventory.ItemStack','org.bukkit.inventory.meta.ItemMeta','org.bukkit.NamespacedKey','org.bukkit.persistence.PersistentDataType'],
    'Adventure & UI':['net.kyori.adventure.text.Component','net.kyori.adventure.title.Title','net.kyori.adventure.bossbar.BossBar'],
    'Monde & blocs':['org.bukkit.Location','org.bukkit.World','org.bukkit.block.Block','org.bukkit.entity.Player'],
    'Entités & joueurs':['org.bukkit.entity.Entity','org.bukkit.entity.Player'],
    'Inventaires & menus':['org.bukkit.Bukkit','org.bukkit.inventory.Inventory','org.bukkit.event.inventory.InventoryClickEvent','org.bukkit.event.inventory.InventoryCloseEvent'],
    'Brigadier & commandes':['com.mojang.brigadier.builder.LiteralArgumentBuilder','com.mojang.brigadier.builder.RequiredArgumentBuilder','com.mojang.brigadier.arguments.StringArgumentType'],
    Permissions:['org.bukkit.entity.Player'],
    'Teams & Scoreboards':['org.bukkit.scoreboard.Scoreboard','org.bukkit.scoreboard.Team','org.bukkit.Bukkit'],
    Performance:['org.bukkit.Bukkit','org.bukkit.scheduler.BukkitTask'],
    Tests:['org.junit.jupiter.api.Test','org.junit.jupiter.api.Assertions'],
    'SQL & bases de données':['java.sql.Connection','java.sql.PreparedStatement','java.sql.ResultSet'],
    NMS:['org.bukkit.entity.Player'],
    'Build & publication':['org.bukkit.plugin.java.JavaPlugin']
  };
  const EXTRA = {
    Java:['Types primitifs vs objets','Portée des variables','Valeur vs référence','Décomposition en méthodes','Encapsulation','Collections','Exceptions','Immutabilité'],
    'Gradle & Maven':['Dépendances','Scope compileOnly','Ressources','Build reproductible','Shading','Relocation','Versionnement'],
    'Paper Core':['Cycle de vie','Enregistrement des listeners','Services','Dépendances optionnelles','Arrêt propre'],
    Events:['EventHandler','Cancellable','Priorités','Filtrage précoce','État métier','Nettoyage'],
    Scheduler:['Ticks','Thread principal','Async','Annulation','Cooldowns','Back-pressure'],
    Données:['Clé stable','Cache runtime','PDC','Sérialisation','Persistance','Migration'],
    Configuration:['Valeurs par défaut','Validation','Messages','Reload','Configuration typée'],
    Items:['ItemStack','ItemMeta','PDC','Identification','Interactions','Lore','Enchantements'],
    'Adventure & UI':['Components','MiniMessage','ActionBar','Title','BossBar','Dialogues','ClickEvent','HoverEvent'],
    'Monde & blocs':['Location','Chunk','Raytrace','Protection','Modification','Performance'],
    'Entités & joueurs':['Entity','Player','Spawn','Attributs','Equipment','Raycast','Nettoyage'],
    'Inventaires & menus':['Slots','ClickEvent','DragEvent','Navigation','Pagination','Confirmation'],
    'Brigadier & commandes':['Arbre','Arguments','Suggestions','Context','Permissions','Console'],
    Permissions:['Nodes','Commandes','Fonctionnalités','Deny by default','Intégrations'],
    'Teams & Scoreboards':['Scoreboard','Team','Objectifs','Entries','Nametag','Collision'],
    Performance:['Coût par tick','Allocations','Cache','IO','Chunks','Profiling'],
    Tests:['Arrange','Act','Assert','Mocks','Régression','Intégration'],
    'SQL & bases de données':['Connection','PreparedStatement','Transactions','Index','Pool','Async'],
    NMS:['API publique','Isolation','Compatibilité','Adaptateurs','Versioning'],
    'Build & publication':['Version','Artifact','CI','Release','Changelog','Rollback']
  };
  const escape = (s) => String(s).replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const importsFor = g => (g.imports?.length ? g.imports : (IMPORTS[g.category] || [])).map(x => x.startsWith('import ') || x.startsWith('//') ? x : `import ${x};`);
  const codeFor = g => {
    if (g.code) return g.code;
    switch (g.category) {
      case 'Events': return `public final class JoinListener implements Listener {\n    private final MyPlugin plugin;\n\n    public JoinListener(MyPlugin plugin) {\n        this.plugin = plugin;\n    }\n\n    @EventHandler\n    public void onJoin(PlayerJoinEvent event) {\n        Player player = event.getPlayer();\n        player.sendMessage(Component.text(\"Bienvenue !\"));\n    }\n}`;
      case 'Scheduler': return `BukkitTask task = Bukkit.getScheduler().runTaskTimer(plugin, () -> {\n    // Travail léger et synchronisé\n}, 0L, 20L);\n\n// À l'arrêt du plugin :\ntask.cancel();`;
      case 'Données': return `NamespacedKey key = new NamespacedKey(plugin, \"coins\");\nPersistentDataContainer pdc = player.getPersistentDataContainer();\npdc.set(key, PersistentDataType.INTEGER, 100);\n\nInteger coins = pdc.get(key, PersistentDataType.INTEGER);`;
      case 'Items': return `ItemStack item = new ItemStack(Material.DIAMOND);\nItemMeta meta = item.getItemMeta();\nmeta.displayName(Component.text(\"Cristal ancien\"));\n\nNamespacedKey key = new NamespacedKey(plugin, \"crystal\");\nmeta.getPersistentDataContainer().set(key, PersistentDataType.BYTE, (byte) 1);\nitem.setItemMeta(meta);`;
      case 'Adventure & UI': return `player.sendMessage(Component.text(\"Bonjour !\"));\nplayer.showTitle(Title.title(\n    Component.text(\"Bienvenue\"),\n    Component.text(\"Bon jeu !\"),\n    Title.Times.times(Duration.ofMillis(500), Duration.ofSeconds(3), Duration.ofMillis(500))\n));`;
      case 'Monde & blocs': return `Location center = player.getLocation();\nWorld world = center.getWorld();\nif (world != null) {\n    Block block = world.getBlockAt(center.getBlockX(), center.getBlockY(), center.getBlockZ());\n    player.sendMessage(Component.text(\"Bloc : \" + block.getType()));\n}`;
      case 'Entités & joueurs': return `for (Entity entity : player.getNearbyEntities(8, 4, 8)) {\n    if (entity instanceof Player target && target != player) {\n        target.sendMessage(Component.text(\"Tu es proche de \" + player.getName()));\n    }\n}`;
      case 'Inventaires & menus': return `Inventory menu = Bukkit.createInventory(player, 27, Component.text(\"Menu\"));\nmenu.setItem(13, new ItemStack(Material.DIAMOND));\nplayer.openInventory(menu);`;
      case 'Paper Core': return `public final class MyPlugin extends JavaPlugin {\n    @Override\n    public void onEnable() {\n        getServer().getPluginManager().registerEvents(\n            new JoinListener(this), this\n        );\n    }\n\n    @Override\n    public void onDisable() {\n        // Annuler les tâches et fermer les ressources\n    }\n}`;
      case 'Brigadier & commandes': return `LiteralArgumentBuilder<CommandSourceStack> root =\n    LiteralArgumentBuilder.<CommandSourceStack>literal(\"monplugin\")\n        .requires(source -> source.getSender().hasPermission(\"monplugin.use\"));`;
      default: return `// Point de départ pour « ${g.title} »\n// Place la logique métier dans une classe dédiée.\n// Valide toujours les entrées avant d'appeler l'API Paper.`;
    }
  };
  const related = g => (EXTRA[g.category] || []).filter(x => x.toLowerCase() !== g.title.toLowerCase()).slice(0, 5);
  const content = g => {
    const imports = importsFor(g);
    return `<div class="rich-kicker">${escape(g.category)} · ${LEVELS[g.level]?.[2] || ''} ${LEVELS[g.level]?.[0] || g.level}</div>
      <h1>${escape(g.title)}</h1>
      <p class="rich-lead">${escape(g.description)}</p>
      <div class="rich-grid">
        <div class="rich-callout"><strong>🎯 Objectif</strong><p>À la fin de ce guide, tu dois pouvoir expliquer le mécanisme, identifier ses contraintes et l'intégrer à un plugin Paper sans déplacer la logique métier au mauvais endroit.</p></div>
        <div class="rich-callout"><strong>🧭 Pré-requis</strong><p>Connais au minimum Java, la structure d'un plugin Paper et les conventions de la catégorie. Les sujets avancés supposent aussi que tu sais déjà isoler tes services et tes données.</p></div>
      </div>
      <h2>1. Le concept en profondeur</h2>
      <p>Ne retiens pas seulement la méthode à appeler. Comprends <strong>pourquoi</strong> ce mécanisme existe, à quel moment il s'exécute, quelles données il consomme et quelles responsabilités doivent rester en dehors de lui.</p>
      <p>Dans un plugin réel, la classe qui reçoit l'action (listener, commande ou scheduler) devrait rester courte. Elle valide le contexte, puis délègue à une classe métier comme <code>CoinService</code>, <code>QuestService</code> ou <code>PlayerDataRepository</code>.</p>
      <div class="rich-tags">${related(g).map(x=>`<span>${escape(x)}</span>`).join('')}</div>
      <h2>2. Imports utiles</h2>
      <pre><code>${imports.length ? imports.map(escape).join('\\n') : '// Aucun import spécifique requis.'}</code></pre>
      <div class="rich-callout warning"><strong>📌 Classes personnalisées</strong><p><code>MyPlugin</code>, <code>JoinListener</code>, <code>CoinService</code>, <code>Menu</code>, <code>QuestService</code> ou <code>PlayerData</code> ne sont pas fournis par Paper : elles doivent être créées dans ton projet avec leur package et leur constructeur.</p></div>
      <h2>3. Exemple complet</h2>
      <pre><code>${escape(codeFor(g))}</code></pre>
      <h2>4. Comment lire cet exemple</h2>
      <ol><li><strong>Entrée :</strong> identifie l'objet qui déclenche le traitement.</li><li><strong>Validation :</strong> vérifie permissions, nullabilité, état du serveur et données disponibles.</li><li><strong>Logique :</strong> garde les règles métier dans un service dédié.</li><li><strong>Sortie :</strong> mets à jour le monde, le joueur ou la persistance de façon explicite.</li></ol>
      <h2>5. Cas limites à prévoir</h2>
      <ul><li>Le joueur se déconnecte pendant l'opération.</li><li>Une donnée attendue n'existe pas encore.</li><li>Une tâche continue alors que le plugin s'arrête.</li><li>L'action est déclenchée plusieurs fois de suite.</li><li>Une autre configuration ou un autre plugin modifie le même état.</li></ul>
      <h2>6. Erreurs fréquentes</h2>
      <div class="rich-check">❌ Mettre toute la fonctionnalité dans <code>JavaPlugin</code>.</div>
      <div class="rich-check">❌ Identifier un item custom uniquement avec son nom ou son lore.</div>
      <div class="rich-check">❌ Faire du SQL, de l'I/O ou un calcul lourd sur le thread principal.</div>
      <div class="rich-check">❌ Utiliser une API NMS alors que l'API Paper suffit.</div>
      <div class="rich-check">❌ Oublier l'annulation des tâches et le nettoyage des ressources.</div>
      <h2>7. Bonnes pratiques</h2>
      <ul><li>Privilégie les APIs publiques Paper et Adventure.</li><li>Utilise des clés stables pour les données techniques.</li><li>Valide tôt et retourne tôt en cas de contexte invalide.</li><li>Garde les accès aux données derrière un service ou un repository.</li><li>Documente la version de Paper ciblée et les dépendances.</li></ul>
      <h2>8. Mini-défi</h2>
      <div class="rich-callout challenge"><strong>🧠 Exercice</strong><p>Reproduis la fonctionnalité du guide, puis ajoute <strong>deux cas limites</strong>, une permission et une valeur configurable. Enfin, déplace la logique métier dans une classe personnalisée distincte de ton listener ou de ta commande.</p></div>
      <h2>9. Checklist avant de passer à la suite</h2>
      <div class="checklist">${['Je peux expliquer le cycle de vie du mécanisme.','Je connais les imports nécessaires.','Je sais identifier les classes personnalisées.','Je gère les cas limites principaux.','Je sais où placer la logique dans mon architecture.','Je sais comment arrêter ou nettoyer le système.'].map(x=>`<label><input type="checkbox"> <span>${escape(x)}</span></label>`).join('')}</div>`;
  };
  function resolveGuide(button) {
    const raw = button.dataset.id;
    if (raw) { const found = GUIDE_LIBRARY.find(g => String(g.id) === String(raw)); if (found) return found; }
    const index = button.dataset.guide;
    if (index !== undefined) return GUIDE_LIBRARY[Number(index)] || null;
    const card = button.closest('.card'); const title = card?.querySelector('h3')?.textContent?.trim();
    return title ? GUIDE_LIBRARY.find(g => g.title === title) || null : null;
  }
  function show(g) {
    if (!g) return;
    const reader = document.getElementById('reader'), library = document.getElementById('library'), article = document.getElementById('article');
    if (!reader || !article || !library) return;
    article.innerHTML = content(g);
    const badge = document.getElementById('rlevel');
    if (badge) { badge.className=`tag ${g.level||''}`; badge.textContent=`${LEVELS[g.level]?.[2]||''} ${LEVELS[g.level]?.[0]||''}`; }
    library.style.display='none'; reader.classList.add('open'); document.documentElement.style.overflowY='scroll'; document.body.style.overflowY='scroll'; window.scrollTo({top:0,behavior:'instant'});
  }
  window.openRichGuide = show;
  document.addEventListener('click', event => {
    const button = event.target.closest?.('[data-id], [data-guide], .read'); if(!button)return;
    const g=resolveGuide(button); if(!g)return;
    event.preventDefault(); event.stopImmediatePropagation(); show(g);
  }, true);
  document.getElementById('back')?.addEventListener('click', event=>{event.preventDefault();document.getElementById('reader')?.classList.remove('open');const lib=document.getElementById('library');if(lib)lib.style.display='block';window.scrollTo({top:0,behavior:'instant'});},true);
  const style=document.createElement('style'); style.textContent=`.rich-kicker{font-size:.78rem;letter-spacing:.14em;text-transform:uppercase;font-weight:900;color:#7d9cff}.rich-lead{font-size:1.08rem;line-height:1.8}.rich-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.rich-callout{background:#17243a;border:1px solid #293954;border-left:4px solid #7d9cff;padding:16px;border-radius:0 14px 14px 0;margin:14px 0}.rich-callout.warning{border-left-color:#ffd65a}.rich-callout.challenge{border-left-color:#62dfa5}.rich-callout p{margin:7px 0 0}.rich-tags{display:flex;gap:8px;flex-wrap:wrap;margin:15px 0}.rich-tags span{border:1px solid #293954;background:#101a2a;border-radius:999px;padding:6px 9px;color:#9aaac2;font-size:.82rem}.rich-check{background:#17243a;border:1px solid #293954;padding:11px 14px;border-radius:10px;margin:7px 0}.checklist{display:grid;gap:9px}.checklist label{display:flex;gap:9px;align-items:flex-start;background:#17243a;border:1px solid #293954;padding:10px 12px;border-radius:10px}.checklist input{margin-top:5px}@media(max-width:720px){.rich-grid{grid-template-columns:1fr}}`; document.head.appendChild(style);
})();
