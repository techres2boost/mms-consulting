const pptxgen = require('pptxgenjs');
const p = new pptxgen();
p.layout = 'LAYOUT_WIDE';            // 13.3 x 7.5
p.author = 'Conseil technique indépendant';
p.title  = 'Call Com - Etude de faisabilite technique';

const W = 13.3, H = 7.5;
const C = {
  deep:'12193F', navy:'1E2761', ice:'CADCFC', white:'FFFFFF',
  ink:'1A1F36', muted:'5A6480', tint:'F2F5FA', tint2:'E7EDF7',
  ramp1:'6F93C2', ramp2:'3A5F94', ramp3:'1E2761',
  red:'C0392B', redTint:'FBEEEC', green:'1F7A5C', greenTint:'EAF4F0',
  amber:'B8860B', amberTint:'FBF4E4'
};
const FH = 'Cambria', FB = 'Calibri';
const sh = () => ({ type:'outer', color:'8899BB', blur:10, offset:2, angle:90, opacity:0.18 });

// ---------- helpers ----------
function titleSlide(s, kicker, title, sub){
  s.background = { color: C.deep };
  if (kicker) s.addText(kicker, { x:0.9, y:1.5, w:11.5, h:0.4, isTextBox:true, margin:0,
    fontFace:FB, fontSize:14, color:C.ice, charSpacing:2, bold:true });
  s.addText(title, { x:0.9, y:2.0, w:11.5, h:1.9, isTextBox:true, margin:0,
    fontFace:FH, fontSize:44, bold:true, color:C.white, lineSpacing:52 });
  if (sub) s.addText(sub, { x:0.9, y:4.1, w:10.5, h:1.2, isTextBox:true, margin:0,
    fontFace:FB, fontSize:16, color:C.ice, lineSpacing:26 });
}
function head(s, title, sub){
  s.background = { color: C.white };
  s.addText(title, { x:0.7, y:0.45, w:12.0, h:0.7, isTextBox:true, margin:0,
    fontFace:FH, fontSize:32, bold:true, color:C.navy });
  if (sub) s.addText(sub, { x:0.7, y:1.18, w:12.0, h:0.45, isTextBox:true, margin:0,
    fontFace:FB, fontSize:15, color:C.muted });
}
function numCircle(s, x, y, n, d, bg, fg){
  d = d || 0.46;
  s.addShape(p.ShapeType.ellipse, { x, y, w:d, h:d, fill:{color: bg||C.navy} });
  s.addText(String(n), { x, y, w:d, h:d, isTextBox:true, margin:0, align:'center', valign:'middle',
    fontFace:FB, fontSize:d>0.5?16:13, bold:true, color: fg||C.white });
}
function card(s, x, y, w, h, fill, line){
  const o = { x, y, w, h, fill:{color:fill||C.tint} };
  if (line) o.line = { color:line, width:1 };
  s.addShape(p.ShapeType.roundRect, Object.assign(o, { rectRadius:0.06 }));
}
function foot(s, t){
  s.addText(t, { x:0.7, y:H-0.52, w:12.0, h:0.3, isTextBox:true, margin:0,
    fontFace:FB, fontSize:9.5, color:'95A0B8' });
}

// ===================== 1. TITRE =====================
{
  const s = p.addSlide();
  titleSlide(s, 'ÉTUDE DE FAISABILITÉ TECHNIQUE',
    'Call Com — ce qui est réalisable,\net à quelles conditions',
    'Analyse des Spécifications Fonctionnelles V1.0 (septembre 2026)\nRéponse aux §18 « Point technique critique » et §24 « Prototype technique préalable »');
  s.addShape(p.ShapeType.ellipse, { x:11.2, y:5.3, w:1.5, h:1.5, fill:{color:C.navy} });
  s.addText('V1.0', { x:11.2, y:5.3, w:1.5, h:1.5, isTextBox:true, margin:0, align:'center', valign:'middle',
    fontFace:FH, fontSize:22, bold:true, color:C.ice });
  s.addText('20 septembre 2026', { x:0.9, y:6.5, w:6, h:0.3, isTextBox:true, margin:0,
    fontFace:FB, fontSize:12, color:'8A96B4' });
  s.addNotes('Objectif : répondre précisément au §18 de la spécification, qui demande d\'étudier la compatibilité du scénario cible avec Android, les appels GSM, les réseaux opérateurs et les solutions VoIP. Le §24 exige un prototype avant tout développement complet : cette présentation dit quoi prototyper.');
}

// ===================== 2. LE SCENARIO DEMANDE =====================
{
  const s = p.addSlide();
  head(s, 'Le scénario demandé par la spécification',
    '§6 — Fonction principale : publicité sur appel entrant');
  const steps = [
    ['Un tiers appelle', 'l\'utilisateur Call Com'],
    ['Première tonalité', 'la ligne commence à sonner'],
    ['Call Com prend le relais', 'diffusion d\'une annonce de 3 s'],
    ['L\'utilisateur décroche', 'la publicité s\'arrête aussitôt'],
    ['Conversation normale', 'puis attribution des unités']
  ];
  const cw = 2.26, gap = 0.28, x0 = 0.7;
  steps.forEach((st, i) => {
    const x = x0 + i*(cw+gap);
    card(s, x, 2.15, cw, 2.7, i===2 ? C.tint2 : C.tint, i===2 ? C.navy : null);
    numCircle(s, x+0.22, 2.4, i+1, 0.42, i===2 ? C.navy : C.ramp1);
    s.addText(st[0], { x:x+0.22, y:3.05, w:cw-0.44, h:0.8, isTextBox:true, margin:0,
      fontFace:FB, fontSize:13.5, bold:true, color:C.ink, lineSpacing:17 });
    s.addText(st[1], { x:x+0.22, y:3.9, w:cw-0.44, h:0.75, isTextBox:true, margin:0,
      fontFace:FB, fontSize:11, color:C.muted, lineSpacing:14 });
    if (i < steps.length-1) s.addShape(p.ShapeType.rightArrow,
      { x:x+cw+0.04, y:3.4, w:0.2, h:0.2, fill:{color:'AEBCD4'} });
  });
  card(s, 0.7, 5.25, 11.9, 1.2, C.tint2);
  s.addText([
    { text:'Le point à retenir : ', options:{ bold:true, color:C.navy } },
    { text:'la personne qui entend la publicité est ', options:{} },
    { text:'l\'appelant', options:{ bold:true } },
    { text:' — et l\'appelant n\'a pas l\'application. Celui qui reçoit les unités est le propriétaire de la ligne appelée. Ce sont deux personnes différentes.', options:{} }
  ], { x:1.0, y:5.45, w:11.3, h:0.8, isTextBox:true, margin:0,
       fontFace:FB, fontSize:14, color:C.ink, lineSpacing:19 });
  foot(s, 'Source : Call Com — Spécifications Fonctionnelles V1.0, §4 et §6');
  s.addNotes('Cette inversion (appel entrant, pas sortant) est la donnée qui structure toute l\'analyse. Elle n\'était pas dans le brief initial.');
}

// ===================== 3. LE VERDICT =====================
{
  const s = p.addSlide();
  head(s, 'Le verdict', 'Réponse directe au §18 de la spécification');

  card(s, 0.7, 1.85, 5.75, 2.1, C.redTint, C.red);
  s.addText('NON', { x:1.0, y:2.05, w:2.2, h:0.85, isTextBox:true, margin:0,
    fontFace:FH, fontSize:44, bold:true, color:C.red });
  s.addText('Le scénario du §6 n\'est réalisable par aucune application mobile, sur aucun système.',
    { x:1.0, y:2.95, w:5.15, h:0.85, isTextBox:true, margin:0,
      fontFace:FB, fontSize:14, color:C.ink, lineSpacing:19 });

  card(s, 6.85, 1.85, 5.75, 2.1, C.greenTint, C.green);
  s.addText('OUI', { x:7.15, y:2.05, w:2.2, h:0.85, isTextBox:true, margin:0,
    fontFace:FH, fontSize:44, bold:true, color:C.green });
  s.addText('Le produit est réalisable — par deux voies, dont une seule ne dépend pas d\'un accord opérateur.',
    { x:7.15, y:2.95, w:5.15, h:0.85, isTextBox:true, margin:0,
      fontFace:FB, fontSize:14, color:C.ink, lineSpacing:19 });

  s.addText('Trois précisions importantes', { x:0.7, y:4.25, w:6, h:0.4, isTextBox:true, margin:0,
    fontFace:FB, fontSize:15, bold:true, color:C.navy });
  const pts = [
    ['1', 'Ce n\'est pas une question de technologie choisie.', 'Ni Android natif, ni Flutter, ni React Native ne changent quoi que ce soit. La limite vient du réseau téléphonique et des systèmes d\'exploitation.'],
    ['2', 'Il n\'existe aucune version dégradée côté application.', 'Puisque le son doit atteindre l\'appelant, qui n\'a pas l\'application, on ne peut rien diffuser depuis le téléphone.'],
    ['3', 'La spécification l\'avait anticipé.', 'Le §18 ne présume aucune méthode et le §24 exige un prototype préalable. La démarche du document est la bonne.']
  ];
  pts.forEach((pt, i) => {
    const y = 4.75 + i*0.68;
    numCircle(s, 0.7, y, pt[0], 0.36, C.navy);
    s.addText([
      { text: pt[1]+'  ', options:{ bold:true, color:C.ink } },
      { text: pt[2], options:{ color:C.muted } }
    ], { x:1.22, y:y-0.04, w:11.4, h:0.62, isTextBox:true, margin:0,
         fontFace:FB, fontSize:12, lineSpacing:15.5 });
  });
  s.addNotes('Insister sur le point 1 : la question « et si on prenait une autre techno ? » est déjà répondue. Et sur le point 3 : la spécification est bien écrite, elle demandait justement cette vérification.');
}

// ===================== 4. POURQUOI =====================
{
  const s = p.addSlide();
  head(s, 'Pourquoi : qui contrôle ce que l\'appelant entend',
    'La tonalité d\'attente est produite par le réseau, pas par le téléphone appelé');

  const y0 = 2.3, bh = 1.6;
  card(s, 0.7, y0, 2.9, bh, C.tint);
  s.addText('L\'appelant', { x:0.9, y:y0+0.3, w:2.5, h:0.4, isTextBox:true, margin:0,
    fontFace:FB, fontSize:16, bold:true, color:C.ink, align:'center' });
  s.addText('entend la tonalité', { x:0.9, y:y0+0.75, w:2.5, h:0.4, isTextBox:true, margin:0,
    fontFace:FB, fontSize:12, color:C.muted, align:'center' });

  card(s, 4.25, y0-0.28, 4.8, bh+0.56, C.navy);
  s.addText('RÉSEAU DE L\'OPÉRATEUR', { x:4.45, y:y0-0.02, w:4.4, h:0.4, isTextBox:true, margin:0,
    fontFace:FB, fontSize:13, bold:true, color:C.ice, align:'center', charSpacing:1 });
  s.addText('C\'est ici, et seulement ici,\nque la tonalité est générée\net peut être remplacée',
    { x:4.45, y:y0+0.42, w:4.4, h:1.0, isTextBox:true, margin:0,
      fontFace:FB, fontSize:13.5, color:C.white, align:'center', lineSpacing:18 });

  card(s, 9.7, y0, 2.9, bh, C.tint);
  s.addText('La ligne appelée', { x:9.9, y:y0+0.22, w:2.5, h:0.4, isTextBox:true, margin:0,
    fontFace:FB, fontSize:16, bold:true, color:C.ink, align:'center' });
  s.addText('+ l\'application\nCall Com', { x:9.9, y:y0+0.64, w:2.5, h:0.65, isTextBox:true, margin:0,
    fontFace:FB, fontSize:12, color:C.muted, align:'center', lineSpacing:15 });

  s.addShape(p.ShapeType.rightArrow, { x:3.72, y:y0+0.62, w:0.4, h:0.26, fill:{color:'AEBCD4'} });
  s.addShape(p.ShapeType.rightArrow, { x:9.17, y:y0+0.62, w:0.4, h:0.26, fill:{color:'AEBCD4'} });

  card(s, 0.7, 4.55, 5.9, 2.1, C.redTint, C.red);
  s.addText('Ce que l\'application ne peut pas faire', { x:1.0, y:4.78, w:5.3, h:0.38, isTextBox:true, margin:0,
    fontFace:FB, fontSize:14, bold:true, color:C.red });
  s.addText([
    { text:'Le téléphone appelé ne produit pas la tonalité que l\'appelant entend : il la reçoit. Une application installée sur ce téléphone n\'a donc aucun point d\'accès sur ce que l\'appelant écoute avant le décrochage.', options:{} }
  ], { x:1.0, y:5.22, w:5.3, h:1.3, isTextBox:true, margin:0,
       fontFace:FB, fontSize:12.5, color:C.ink, lineSpacing:16.5 });

  card(s, 6.85, 4.55, 5.75, 2.1, C.greenTint, C.green);
  s.addText('Ce que cela implique', { x:7.15, y:4.78, w:5.15, h:0.38, isTextBox:true, margin:0,
    fontFace:FB, fontSize:14, bold:true, color:C.green });
  s.addText('Pour diffuser une annonce pendant l\'attente, il faut se placer dans le réseau — avec l\'opérateur — ou faire passer l\'appel par une plateforme Call Com avant qu\'il n\'atteigne l\'utilisateur.',
    { x:7.15, y:5.22, w:5.15, h:1.3, isTextBox:true, margin:0,
      fontFace:FB, fontSize:12.5, color:C.ink, lineSpacing:16.5 });
  s.addNotes('Analogie utile en réunion : la sonnerie que l\'appelant entend est diffusée par le central téléphonique, pas par le téléphone d\'en face. Le téléphone appelé ne l\'entend même pas.');
}

// ===================== 5. CE QUI EST IMPOSSIBLE =====================
{
  const s = p.addSlide();
  head(s, 'Les pistes applicatives, une par une',
    'Chacune a été examinée puis écartée — §18 de la spécification');
  const rows = [
    ['Filtrer ou afficher l\'appel entrant', 'Android permet d\'identifier, filtrer ou rejeter un appel entrant. Aucun de ces mécanismes n\'ouvre de canal sonore vers l\'appelant.'],
    ['Répondre automatiquement puis diffuser', 'Répondre met fin à la sonnerie : l\'utilisateur ne peut alors plus « décrocher ». Et le son d\'un appel en cours reste inaccessible à toute application.'],
    ['Diffuser sur l\'appel en cours', 'Le son d\'un appel téléphonique classique est géré par le composant radio du téléphone, hors de portée des applications. Vrai sur Android comme sur iPhone.'],
    ['Utiliser le répondeur ou un renvoi simple', 'Un renvoi sur non-réponse fait d\'abord sonner le téléphone sans publicité, puis basculer. L\'utilisateur ne peut plus décrocher : le scénario du §6 n\'est pas respecté.']
  ];
  rows.forEach((r, i) => {
    const y = 1.85 + i*1.18;
    card(s, 0.7, y, 11.9, 1.0, i%2 ? C.white : C.tint, i%2 ? 'DCE4F0' : null);
    s.addShape(p.ShapeType.ellipse, { x:1.0, y:y+0.28, w:0.44, h:0.44, fill:{color:C.red} });
    s.addText('X', { x:1.0, y:y+0.28, w:0.44, h:0.44, isTextBox:true, margin:0, align:'center', valign:'middle',
      fontFace:FB, fontSize:15, bold:true, color:C.white });
    s.addText(r[0], { x:1.65, y:y+0.13, w:3.7, h:0.75, isTextBox:true, margin:0, valign:'middle',
      fontFace:FB, fontSize:13.5, bold:true, color:C.ink, lineSpacing:17 });
    s.addText(r[1], { x:5.5, y:y+0.13, w:6.85, h:0.75, isTextBox:true, margin:0, valign:'middle',
      fontFace:FB, fontSize:11.5, color:C.muted, lineSpacing:15 });
  });
  s.addText('Conclusion : aucune de ces pistes ne permet de diffuser un son à l\'appelant avant qu\'il ne soit décroché.',
    { x:0.7, y:6.6, w:11.9, h:0.4, isTextBox:true, margin:0,
      fontFace:FB, fontSize:13, bold:true, color:C.navy });
  s.addNotes('Cette page sert à clore le débat technique. Recommandation : produire une note de 2 pages avec captures d\'écran sur 4 à 6 téléphones, pour que la question ne revienne pas dans six mois.');
}

// ===================== 6. DEUX VOIES =====================
{
  const s = p.addSlide();
  head(s, 'Deux voies restent ouvertes', 'Elles ne s\'excluent pas : la seconde peut préparer la première');

  card(s, 0.7, 1.8, 5.85, 4.45, C.tint, C.navy);
  s.addShape(p.ShapeType.ellipse, { x:1.0, y:2.05, w:0.62, h:0.62, fill:{color:C.navy} });
  s.addText('A', { x:1.0, y:2.05, w:0.62, h:0.62, isTextBox:true, margin:0, align:'center', valign:'middle',
    fontFace:FH, fontSize:20, bold:true, color:C.white });
  s.addText('Partenariat opérateur', { x:1.8, y:2.08, w:4.4, h:0.4, isTextBox:true, margin:0,
    fontFace:FH, fontSize:21, bold:true, color:C.navy });
  s.addText('La voie native du produit', { x:1.8, y:2.5, w:4.4, h:0.3, isTextBox:true, margin:0,
    fontFace:FB, fontSize:12, color:C.muted });
  s.addText([
    { text:'Ce que décrit la spécification existe déjà comme service télécom : la tonalité d\'attente personnalisée, vendue par les opérateurs. Call Com y apporterait les annonceurs et les récompenses.', options:{ breakLine:true } }
  ], { x:1.0, y:3.0, w:5.25, h:1.3, isTextBox:true, margin:0,
       fontFace:FB, fontSize:12.5, color:C.ink, lineSpacing:17 });
  [['Conformité au §6','Totale'],['Qualité d\'appel','Intacte'],['Délai réaliste','6 à 18 mois'],['Maîtrise','Dépend d\'un tiers']]
    .forEach((kv,i)=>{
      const y = 4.35 + i*0.46;
      s.addText(kv[0], { x:1.0, y, w:2.6, h:0.36, isTextBox:true, margin:0, fontFace:FB, fontSize:11.5, color:C.muted });
      s.addText(kv[1], { x:3.7, y, w:2.55, h:0.36, isTextBox:true, margin:0, fontFace:FB, fontSize:11.5, bold:true, color:C.ink });
    });

  card(s, 6.75, 1.8, 5.85, 4.45, C.white, 'DCE4F0');
  s.addShape(p.ShapeType.ellipse, { x:7.05, y:2.05, w:0.62, h:0.62, fill:{color:C.ramp2} });
  s.addText('B', { x:7.05, y:2.05, w:0.62, h:0.62, isTextBox:true, margin:0, align:'center', valign:'middle',
    fontFace:FH, fontSize:20, bold:true, color:C.white });
  s.addText('Plateforme Call Com', { x:7.85, y:2.08, w:4.4, h:0.4, isTextBox:true, margin:0,
    fontFace:FH, fontSize:21, bold:true, color:C.ramp2 });
  s.addText('Sans accord opérateur, mais sous conditions', { x:7.85, y:2.5, w:4.5, h:0.3, isTextBox:true, margin:0,
    fontFace:FB, fontSize:12, color:C.muted });
  s.addText('Les appels de l\'utilisateur sont d\'abord dirigés vers une plateforme Call Com, qui diffuse l\'annonce à l\'appelant puis met les deux personnes en relation.',
    { x:7.05, y:3.0, w:5.25, h:1.3, isTextBox:true, margin:0,
      fontFace:FB, fontSize:12.5, color:C.ink, lineSpacing:17 });
  [['Conformité au §6','Bonne'],['Qualité d\'appel','À vérifier'],['Délai réaliste','3 à 5 mois'],['Maîtrise','Complète']]
    .forEach((kv,i)=>{
      const y = 4.35 + i*0.46;
      s.addText(kv[0], { x:7.05, y, w:2.6, h:0.36, isTextBox:true, margin:0, fontFace:FB, fontSize:11.5, color:C.muted });
      s.addText(kv[1], { x:9.75, y, w:2.55, h:0.36, isTextBox:true, margin:0, fontFace:FB, fontSize:11.5, bold:true, color:C.ink });
    });
  s.addNotes('Voie A = le produit rêvé, mais le calendrier n\'est pas maîtrisé. Voie B = maîtrisée mais avec trois vrais points durs, détaillés deux pages plus loin.');
}

// ===================== 7. VOIE A =====================
{
  const s = p.addSlide();
  head(s, 'Voie A — ce qu\'il faut demander à l\'opérateur',
    'Il n\'existe pas de service en libre-service : c\'est un partenariat commercial');

  s.addText('Ce que l\'opérateur possède déjà', { x:0.7, y:1.8, w:5.6, h:0.35, isTextBox:true, margin:0,
    fontFace:FB, fontSize:15, bold:true, color:C.navy });
  s.addText('Les opérateurs exploitent généralement déjà une plateforme de tonalités personnalisées, fournie par un éditeur spécialisé. C\'est cette plateforme qui remplace la sonnerie par un contenu choisi. Call Com n\'aurait donc rien à inventer techniquement — il faut être autorisé à y diffuser de la publicité.',
    { x:0.7, y:2.2, w:5.6, h:1.7, isTextBox:true, margin:0,
      fontFace:FB, fontSize:12.5, color:C.ink, lineSpacing:17 });

  card(s, 0.7, 4.05, 5.6, 2.05, C.amberTint, C.amber);
  s.addText('Ce qu\'il ne faut pas attendre', { x:1.0, y:4.25, w:5.0, h:0.35, isTextBox:true, margin:0,
    fontFace:FB, fontSize:13.5, bold:true, color:'8A6508' });
  s.addText('Aucun opérateur ne publie d\'interface technique ouverte pour cela. Les échanges se font le plus souvent par dépôts de fichiers quotidiens, pas en temps réel. Le système Call Com doit être conçu pour cela dès le départ.',
    { x:1.0, y:4.65, w:5.0, h:1.3, isTextBox:true, margin:0,
      fontFace:FB, fontSize:12, color:C.ink, lineSpacing:16 });

  s.addText('Le chemin, étape par étape', { x:6.75, y:1.8, w:5.85, h:0.35, isTextBox:true, margin:0,
    fontFace:FB, fontSize:15, bold:true, color:C.navy });
  const steps = [
    'Contacter la direction des services à valeur ajoutée de chaque opérateur — un sujet commercial, pas technique',
    'Présenter le revenu nouveau apporté et la clé de partage proposée',
    'Accord de principe, puis mise en relation avec l\'éditeur de la plateforme',
    'Spécification des échanges : format des annonces, remontée des diffusions',
    'Validation réglementaire, portée par l\'opérateur car c\'est son service',
    'Pilote sur un périmètre restreint, puis généralisation'
  ];
  steps.forEach((t,i)=>{
    const y = 2.22 + i*0.68;
    numCircle(s, 6.75, y, i+1, 0.38, i<2 ? C.navy : C.ramp1);
    s.addText(t, { x:7.3, y:y-0.05, w:5.3, h:0.6, isTextBox:true, margin:0, valign:'middle',
      fontFace:FB, fontSize:11.5, color:C.ink, lineSpacing:15 });
  });
  card(s, 6.75, 6.35, 5.85, 0.62, C.tint2);
  s.addText('Les deux premières étapes relèvent de Call Com, pas du prestataire technique.',
    { x:7.0, y:6.48, w:5.4, h:0.36, isTextBox:true, margin:0,
      fontFace:FB, fontSize:11.5, bold:true, color:C.navy });
  s.addNotes('Message clé : le blocage n\'est pas technique, il est commercial. Et Call Com apporte ce que l\'opérateur n\'a pas : une force de vente annonceurs locale.');
}

// ===================== 8. VOIE B =====================
{
  const s = p.addSlide();
  head(s, 'Voie B — réalisable, mais trois points durs',
    'À trancher par un prototype avant tout développement');

  s.addText('Comment cela fonctionne', { x:0.7, y:1.75, w:11.9, h:0.35, isTextBox:true, margin:0,
    fontFace:FB, fontSize:15, bold:true, color:C.navy });
  const flow = ['L\'appel arrive\nsur la plateforme','La plateforme diffuse\nl\'annonce à l\'appelant',
                'L\'application sonne\nchez l\'utilisateur','Il décroche : l\'annonce\ns\'arrête, mise en relation'];
  flow.forEach((t,i)=>{
    const x = 0.7 + i*3.05;
    card(s, x, 2.18, 2.75, 0.95, C.tint);
    s.addText(t, { x:x+0.12, y:2.26, w:2.51, h:0.8, isTextBox:true, margin:0, align:'center', valign:'middle',
      fontFace:FB, fontSize:11.5, color:C.ink, lineSpacing:15 });
    if (i<3) s.addShape(p.ShapeType.rightArrow, { x:x+2.82, y:2.56, w:0.18, h:0.2, fill:{color:'AEBCD4'} });
  });

  s.addText('Les trois points à lever', { x:0.7, y:3.35, w:11.9, h:0.35, isTextBox:true, margin:0,
    fontFace:FB, fontSize:15, bold:true, color:C.red });
  const blk = [
    ['1','Sans Internet, l\'utilisateur ne reçoit plus ses appels','C\'est le risque le plus grave. Un utilisateur qui rate des appels désinstalle immédiatement et le dit autour de lui. Aucune solution de contournement n\'est pleinement satisfaisante à ce jour.'],
    ['2','Les conversations passeraient par Internet','La qualité dépendrait de la couverture data de l\'utilisateur. Une dégradation serait attribuée à Call Com — ce qui heurte le principe de « non-perturbation » du §22.'],
    ['3','Qui paie le réacheminement ?','Selon les usages du marché, ce coût est souvent supporté par l\'abonné qui met en place le renvoi. Inacceptable s\'il pèse sur l\'utilisateur : à négocier avec les opérateurs.']
  ];
  blk.forEach((b,i)=>{
    const x = 0.7 + i*4.0;
    card(s, x, 3.78, 3.7, 2.35, C.redTint);
    numCircle(s, x+0.25, 3.98, b[0], 0.4, C.red);
    s.addText(b[1], { x:x+0.25, y:4.5, w:3.2, h:0.72, isTextBox:true, margin:0,
      fontFace:FB, fontSize:12.5, bold:true, color:C.ink, lineSpacing:16 });
    s.addText(b[2], { x:x+0.25, y:5.14, w:3.2, h:0.95, isTextBox:true, margin:0,
      fontFace:FB, fontSize:10, color:'6A5148', lineSpacing:13 });
  });
  s.addText('Bonne nouvelle : cette voie fonctionne aussi bien sur iPhone que sur Android, et la mesure des diffusions y est exacte et infalsifiable.',
    { x:0.7, y:6.35, w:11.9, h:0.4, isTextBox:true, margin:0,
      fontFace:FB, fontSize:12.5, bold:true, color:C.green });
  s.addNotes('Le point 1 est celui qui peut tuer la voie B. Il doit être le premier test du prototype : couper la data du téléphone et observer ce qui arrive à l\'appel.');
}

// ===================== 9. COMPARAISON =====================
{
  const s = p.addSlide();
  head(s, 'Comparaison des deux voies', 'Lecture par caractéristiques, sans préférence a priori');
  const rows = [
    ['Critère','Voie A — Opérateur','Voie B — Plateforme Call Com'],
    ['Conformité au scénario du §6','Totale','Bonne — annonce avant la sonnerie'],
    ['L\'appelant a besoin de l\'application','Non','Non'],
    ['Fonctionne sur Android','Oui','Oui'],
    ['Fonctionne sur iPhone','Oui','Oui'],
    ['Qualité des appels de l\'utilisateur','Inchangée','Dépend de sa connexion Internet'],
    ['L\'utilisateur peut-il rater des appels ?','Non','Oui, sans Internet — point dur n° 1'],
    ['Mesure des diffusions','Exacte (opérateur)','Exacte (plateforme Call Com)'],
    ['Accord opérateur nécessaire','Indispensable','Pas technique, mais tarifaire'],
    ['Coût par appel','Quasi nul','Non nul — un acheminement par appel'],
    ['Encadrement réglementaire','Porté par l\'opérateur','À porter par Call Com'],
    ['Délai avant mise en service','6 à 18 mois','3 à 5 mois'],
    ['Maîtrise du calendrier','Faible','Complète']
  ];
  const x0=0.7, wTot=11.9, cw=[4.5,3.4,4.0], rh=0.355, y0=1.75;
  rows.forEach((r,i)=>{
    const y = y0 + i*rh;
    if (i===0){
      s.addShape(p.ShapeType.rect, { x:x0, y, w:wTot, h:rh, fill:{color:C.navy} });
    } else if (i%2===0){
      s.addShape(p.ShapeType.rect, { x:x0, y, w:wTot, h:rh, fill:{color:C.tint} });
    }
    let cx = x0;
    r.forEach((cell,j)=>{
      s.addText(cell, { x:cx+0.14, y, w:cw[j]-0.24, h:rh, isTextBox:true, margin:0, valign:'middle',
        fontFace:FB, fontSize:11, bold: i===0 || j===0,
        color: i===0 ? C.white : (j===0 ? C.ink : C.muted) });
      cx += cw[j];
    });
  });
  foot(s, 'Les deux voies sont compatibles : la voie B peut servir de démonstrateur commercial pour négocier la voie A.');
  s.addNotes('Ne pas présenter A comme meilleure que B : présenter le choix comme un arbitrage entre maîtrise du calendrier (B) et qualité du produit final (A).');
}

// ===================== 10. LA BONNE NOUVELLE =====================
{
  const s = p.addSlide();
  head(s, 'L\'essentiel du produit est constructible dès maintenant',
    'Bonne nouvelle : le mécanisme de diffusion ne représente qu\'environ un cinquième du travail');

  s.addShape(p.ShapeType.ellipse, { x:0.8, y:1.95, w:2.5, h:2.5, fill:{color:C.navy} });
  s.addText([{ text:'80', options:{ fontSize:52, bold:true, color:C.white, breakLine:true } },
             { text:'% du produit', options:{ fontSize:14, color:C.ice } }],
    { x:0.8, y:1.95, w:2.5, h:2.5, isTextBox:true, margin:0, align:'center', valign:'middle', fontFace:FH });
  s.addText('ne dépend pas du choix de la voie A ou B', { x:0.52, y:4.62, w:3.06, h:0.6, isTextBox:true, margin:0,
    fontFace:FB, fontSize:12, color:C.muted, align:'center', lineSpacing:15 });

  const items = [
    ['Application mobile','Inscription, code de vérification, consentement, activation, solde, historique, récompenses, notifications — §5, §9, §16'],
    ['Gestion des unités','Attribution, plafonds, barème paramétrable, journal complet de chaque mouvement — §8, §12'],
    ['Récompenses','Catalogue data, crédit, minutes ; demande, traitement, suivi des statuts — §8.3, §8.5'],
    ['Dashboard','Utilisateurs, annonceurs, campagnes, validation des annonces, planification, statistiques — §10'],
    ['Facturation annonceur','Coût par diffusion, forfait, coût pour mille, budget prépayé — §11'],
    ['Anti-fraude et traçabilité','Détection des comptes multiples, activité anormale, journal d\'événements — §13']
  ];
  items.forEach((it,i)=>{
    const col = i%2, row = Math.floor(i/2);
    const x = 3.9 + col*4.4, y = 1.95 + row*1.55;
    card(s, x, y, 4.1, 1.35, col===0 ? C.tint : C.white, col===0 ? null : 'DCE4F0');
    s.addText(it[0], { x:x+0.22, y:y+0.14, w:3.66, h:0.32, isTextBox:true, margin:0,
      fontFace:FB, fontSize:13, bold:true, color:C.navy });
    s.addText(it[1], { x:x+0.22, y:y+0.48, w:3.66, h:0.75, isTextBox:true, margin:0,
      fontFace:FB, fontSize:10.5, color:C.muted, lineSpacing:13.5 });
  });
  s.addText('Recommandation : construire cette partie derrière une interface qui isole le mécanisme de diffusion. Le jour où un accord opérateur aboutit, il s\'ajoute sans rien réécrire.',
    { x:0.7, y:6.5, w:11.9, h:0.45, isTextBox:true, margin:0,
      fontFace:FB, fontSize:12.5, bold:true, color:C.navy, lineSpacing:16 });
  s.addNotes('C\'est le message le plus important pour débloquer la décision : il n\'y a pas à attendre l\'opérateur pour commencer.');
}

// ===================== 11. RISQUE BUSINESS =====================
{
  const s = p.addSlide();
  head(s, 'Risque business identifié', 'Ce point relève de Call Com — il est signalé car il dimensionne la technique');

  card(s, 0.7, 1.8, 11.9, 1.3, C.amberTint, C.amber);
  s.addShape(p.ShapeType.ellipse, { x:1.0, y:2.18, w:0.52, h:0.52, fill:{color:C.amber} });
  s.addText('!', { x:1.0, y:2.18, w:0.52, h:0.52, isTextBox:true, margin:0, align:'center', valign:'middle',
    fontFace:FB, fontSize:20, bold:true, color:C.white });
  s.addText('Des précédents internationaux de modèles télécom financés par la publicité montrent que la viabilité économique dépend fortement de la capacité à vendre suffisamment d\'inventaire publicitaire. Ce point doit être validé par Call Com auprès d\'annonceurs réels.',
    { x:1.75, y:1.98, w:10.6, h:0.95, isTextBox:true, margin:0,
      fontFace:FB, fontSize:13.5, color:C.ink, lineSpacing:18 });

  const cases = [
    ['Blyk','Royaume-Uni','Appels et SMS gratuits financés par la publicité. Service arrêté. Le diagnostic public pointe un manque de couverture pour intéresser les annonceurs, et des annonceurs davantage attirés par l\'étude de marché que par la campagne de marque.'],
    ['RingPlus','États-Unis','Diffusait des annonces après la numérotation et avant la connexion, pour financer des forfaits gratuits — un mécanisme très proche. Offres gratuites réduites puis supprimées ; fermeture en 2017, faute d\'annonceurs suffisants par zone.']
  ];
  cases.forEach((c,i)=>{
    const x = 0.7 + i*6.05;
    card(s, x, 3.35, 5.85, 2.1, C.white, 'DCE4F0');
    s.addText(c[0], { x:x+0.28, y:3.52, w:3.5, h:0.4, isTextBox:true, margin:0,
      fontFace:FH, fontSize:19, bold:true, color:C.navy });
    s.addText(c[1], { x:x+0.28, y:3.92, w:3.5, h:0.28, isTextBox:true, margin:0,
      fontFace:FB, fontSize:11, color:C.muted });
    s.addText(c[2], { x:x+0.28, y:4.28, w:5.3, h:1.05, isTextBox:true, margin:0,
      fontFace:FB, fontSize:11, color:C.ink, lineSpacing:14.5 });
  });

  card(s, 0.7, 5.68, 11.9, 1.25, C.tint2);
  s.addText('Ce que cela implique concrètement', { x:1.0, y:5.82, w:5, h:0.3, isTextBox:true, margin:0,
    fontFace:FB, fontSize:13, bold:true, color:C.navy });
  s.addText('Ni Blyk ni RingPlus n\'ont échoué pour des raisons techniques. Avant d\'investir dans le développement, il serait prudent d\'obtenir de quelques annonceurs tunisiens un prix écrit qu\'ils accepteraient de payer. C\'est le paramètre dont dépend tout le reste — y compris le barème du §8.4.',
    { x:1.0, y:6.12, w:11.3, h:0.72, isTextBox:true, margin:0,
      fontFace:FB, fontSize:11.5, color:C.ink, lineSpacing:15 });
  foot(s, 'Sources : Telecoms.com (Blyk) · Clark.com et Android Headlines (RingPlus)');
  s.addNotes('Formuler comme une information, pas comme un jugement sur le projet. La décision appartient à Call Com.');
}

// ===================== 12. GRAPHIQUE BAREME =====================
{
  const s = p.addSlide();
  head(s, 'Le barème du §8.4, chiffré', 'Marge dégagée selon le prix payé par l\'annonceur — hypothèse de coût de gros à confirmer');

  const chartData = [
    { name:'Annonceur à 5 TND pour mille diffusions',  labels:['500 u → 100 Mo','2 000 u → 500 Mo','5 000 u → 1 DT de crédit'], values:[-20,-50,60] },
    { name:'Annonceur à 12 TND pour mille diffusions', labels:['500 u → 100 Mo','2 000 u → 500 Mo','5 000 u → 1 DT de crédit'], values:[50,38,83] },
    { name:'Annonceur à 15 TND pour mille diffusions', labels:['500 u → 100 Mo','2 000 u → 500 Mo','5 000 u → 1 DT de crédit'], values:[60,50,87] }
  ];
  s.addChart(p.ChartType.bar, chartData, {
    x:0.7, y:1.75, w:7.9, h:4.15,
    barDir:'col', barGapWidthPct:60, barGrouping:'clustered',
    chartColors:[C.ramp1, C.ramp2, C.ramp3],
    showTitle:true, title:'Marge sur les récompenses, en % du revenu publicitaire',
    titleFontFace:FB, titleFontSize:13, titleColor:C.ink,
    showValue:true, dataLabelPosition:'outEnd', dataLabelFormatCode:'0"%"',
    dataLabelFontFace:FB, dataLabelFontSize:9, dataLabelColor:C.ink,
    showLegend:true, legendPos:'b', legendFontFace:FB, legendFontSize:10, legendColor:C.muted,
    catAxisLabelFontFace:FB, catAxisLabelFontSize:10, catAxisLabelColor:C.ink,
    valAxisLabelFontFace:FB, valAxisLabelFontSize:9, valAxisLabelColor:C.muted,
    valAxisMinVal:-60, valAxisMaxVal:100, valAxisLabelFormatCode:'0"%"',
    valGridLine:{ color:'E6EAF2', size:1 }, catGridLine:{ style:'none' },
    valAxisLineShow:false, catAxisLineShow:true, catAxisLineColor:'C9D3E4'
  });

  card(s, 8.85, 1.75, 3.75, 4.15, C.tint);
  s.addText('Comment le lire', { x:9.1, y:1.95, w:3.25, h:0.32, isTextBox:true, margin:0,
    fontFace:FB, fontSize:14, bold:true, color:C.navy });
  const notes = [
    'Le barème de la spécification est prudent et défendable : il devient rentable dès 12 TND pour mille diffusions sur les paliers en gigaoctets.',
    'Le palier en crédit téléphonique est le plus robuste : il reste rentable même à 5 TND. Le §8.3 prévoit déjà cette option.',
    'Si le prix réellement accepté par les annonceurs s\'avère bas, privilégier le crédit et les minutes plutôt que la data.'
  ];
  notes.forEach((t,i)=>{
    const y = 2.4 + i*1.13;
    s.addShape(p.ShapeType.ellipse, { x:9.1, y:y+0.08, w:0.16, h:0.16, fill:{color:C.ramp2} });
    s.addText(t, { x:9.4, y, w:2.95, h:1.05, isTextBox:true, margin:0,
      fontFace:FB, fontSize:10.5, color:C.ink, lineSpacing:14 });
  });
  foot(s, 'Hypothèse : coût de gros de la data à 3 millimes par mégaoctet, et coût des récompenses limité à la moitié du revenu publicitaire. Les deux valeurs doivent être confirmées par Call Com.');
  s.addNotes('Message : le barème du §8.4 n\'est pas un problème. Le paramètre inconnu est le prix payé par l\'annonceur, et c\'est ce qu\'il faut aller mesurer.');
}

// ===================== 13. CONTRAINTES =====================
{
  const s = p.addSlide();
  head(s, 'Trois contraintes à anticiper', 'Elles ne bloquent pas le projet, mais elles prennent du temps');
  const items = [
    ['Données personnelles','Le service traite des numéros de téléphone. Une déclaration auprès de l\'instance nationale de protection des données est requise. Et comme l\'hébergement envisagé est à l\'étranger, une autorisation préalable de transfert est également nécessaire.','À engager dès maintenant — le délai est administratif'],
    ['Le consentement de l\'appelant','Le §14 prévoit à juste titre le consentement de l\'utilisateur. Mais la personne qui entend la publicité est l\'appelant, qui n\'a rien accepté et ne reçoit aucune unité. Ce point n\'est pas traité par la spécification.','Voie A : porté par l\'opérateur. Voie B : à faire qualifier'],
    ['Exploitation d\'un service téléphonique','Dans la voie B, Call Com exploiterait de fait une plateforme de traitement d\'appels. La qualification réglementaire doit être établie avant la mise en service.','Sans objet dans la voie A']
  ];
  items.forEach((it,i)=>{
    const x = 0.7 + i*4.0;
    card(s, x, 1.85, 3.7, 4.0, i===0 ? C.tint : C.white, i===0 ? null : 'DCE4F0');
    numCircle(s, x+0.28, 2.1, i+1, 0.5, C.navy);
    s.addText(it[0], { x:x+0.28, y:2.75, w:3.14, h:0.7, isTextBox:true, margin:0,
      fontFace:FH, fontSize:16, bold:true, color:C.navy, lineSpacing:20 });
    s.addText(it[1], { x:x+0.28, y:3.5, w:3.14, h:1.6, isTextBox:true, margin:0,
      fontFace:FB, fontSize:11, color:C.ink, lineSpacing:14.5 });
    card(s, x+0.28, 5.1, 3.14, 0.6, C.tint2);
    s.addText(it[2], { x:x+0.42, y:5.18, w:2.86, h:0.45, isTextBox:true, margin:0, valign:'middle',
      fontFace:FB, fontSize:9.5, bold:true, color:C.navy, lineSpacing:12 });
  });
  s.addText('Un accompagnement juridique local est nécessaire sur ces trois sujets. Ce n\'est pas un travail d\'ingénierie.',
    { x:0.7, y:6.15, w:11.9, h:0.4, isTextBox:true, margin:0,
      fontFace:FB, fontSize:12.5, bold:true, color:C.navy });
  s.addNotes('Le point 2 est celui que le client n\'a pas vu. Le présenter comme une question ouverte à faire qualifier, pas comme un obstacle rédhibitoire.');
}

// ===================== 14. RECOMMANDATION =====================
{
  const s = p.addSlide();
  head(s, 'Ce que nous recommandons', 'Réponse au §24 — le prototype technique préalable');
  const ph = [
    ['Étape 1','Clore la question applicative','3 à 5 jours',
      'Démontrer et documenter, sur plusieurs téléphones, qu\'aucune application ne peut diffuser une annonce à l\'appelant. Livrable : une note courte avec captures d\'écran.',
      'Objectif : que la question ne revienne pas dans six mois.'],
    ['Étape 2','Prototyper la voie B','2 à 3 semaines',
      'Un appel de test réacheminé vers une plateforme, une annonce diffusée à l\'appelant, une mise en relation. Puis mesurer les trois points durs, sur les trois opérateurs.',
      'Critère d\'arrêt : que se passe-t-il si le téléphone n\'a plus Internet ?'],
    ['Étape 3','Ouvrir la voie A en parallèle','Dès maintenant',
      'Premiers contacts avec les trois opérateurs et dépôt du dossier de protection des données. Ces démarches sont longues et ne dépendent pas du développement.',
      'À lancer sans attendre : c\'est le chemin le plus long.']
  ];
  ph.forEach((f,i)=>{
    const y = 1.8 + i*1.62;
    card(s, 0.7, y, 11.9, 1.45, i===1 ? C.tint2 : C.tint, i===1 ? C.navy : null);
    numCircle(s, 1.0, y+0.48, i+1, 0.5, i===1 ? C.navy : C.ramp2);
    s.addText(f[1], { x:1.68, y:y+0.18, w:4.0, h:0.38, isTextBox:true, margin:0,
      fontFace:FH, fontSize:17, bold:true, color:C.navy });
    s.addText(f[2], { x:1.68, y:y+0.58, w:4.0, h:0.3, isTextBox:true, margin:0,
      fontFace:FB, fontSize:11.5, bold:true, color:C.ramp2 });
    s.addText(f[3], { x:5.9, y:y+0.18, w:4.35, h:1.1, isTextBox:true, margin:0,
      fontFace:FB, fontSize:11, color:C.ink, lineSpacing:14.5 });
    s.addText(f[4], { x:10.5, y:y+0.18, w:1.9, h:1.1, isTextBox:true, margin:0,
      fontFace:FB, fontSize:10, italic:true, color:C.muted, lineSpacing:13 });
  });
  card(s, 0.7, 6.55, 11.9, 0.55, C.navy);
  s.addText('Aucun développement de plateforme avant la fin de l\'étape 2. C\'est ce que demande le §24 de la spécification.',
    { x:1.0, y:6.62, w:11.3, h:0.4, isTextBox:true, margin:0, valign:'middle',
      fontFace:FB, fontSize:12.5, bold:true, color:C.white });
  s.addNotes('Les étapes 1 et 2 représentent environ un mois. C\'est court au regard du risque évité : un développement complet sur un mécanisme non validé.');
}

// ===================== 15. DECISION =====================
{
  const s = p.addSlide();
  s.background = { color: C.deep };
  s.addText('Ce qui est attendu de Call Com', { x:0.9, y:0.75, w:11.5, h:0.6, isTextBox:true, margin:0,
    fontFace:FH, fontSize:32, bold:true, color:C.white });
  s.addText('Quatre décisions, indépendantes du développement', { x:0.9, y:1.4, w:11.5, h:0.4, isTextBox:true, margin:0,
    fontFace:FB, fontSize:15, color:C.ice });
  const dec = [
    ['Valider la demande annonceur','Obtenir de quelques annonceurs tunisiens un prix écrit qu\'ils accepteraient de payer par diffusion.'],
    ['Autoriser le prototype','Environ un mois, avant tout développement de plateforme, comme le prévoit le §24.'],
    ['Engager les démarches longues','Contacts opérateurs et dossier de protection des données : à lancer dès maintenant, en parallèle.'],
    ['Arbitrer le périmètre V1','Android seul comme le prévoit le §23, et privilégier ou non le crédit téléphonique dans le catalogue.']
  ];
  dec.forEach((d,i)=>{
    const col = i%2, row = Math.floor(i/2);
    const x = 0.9 + col*5.9, y = 2.2 + row*1.7;
    s.addShape(p.ShapeType.roundRect, { x, y, w:5.5, h:1.45, rectRadius:0.06, fill:{color:'1C2550'} });
    numCircle(s, x+0.28, y+0.26, i+1, 0.44, C.ice, C.deep);
    s.addText(d[0], { x:x+0.88, y:y+0.24, w:4.4, h:0.4, isTextBox:true, margin:0,
      fontFace:FB, fontSize:14.5, bold:true, color:C.white });
    s.addText(d[1], { x:x+0.88, y:y+0.68, w:4.4, h:0.65, isTextBox:true, margin:0,
      fontFace:FB, fontSize:11, color:C.ice, lineSpacing:14.5 });
  });
  s.addText('Le mécanisme de diffusion est la seule inconnue du projet. Tout le reste est constructible dès aujourd\'hui.',
    { x:0.9, y:5.95, w:11.5, h:0.5, isTextBox:true, margin:0,
      fontFace:FH, fontSize:17, bold:true, color:C.ice, lineSpacing:22 });
  s.addText('Analyse détaillée et schéma technique complet : dossier joint, sections 01 et 23.',
    { x:0.9, y:6.6, w:11.5, h:0.35, isTextBox:true, margin:0,
      fontFace:FB, fontSize:11, color:'8A96B4' });
  s.addNotes('Clore sur le fait que le projet n\'est pas bloqué : une seule inconnue, et un mois pour la lever.');
}

p.writeFile({ fileName: 'Call_Com_Faisabilite_Technique.pptx' })
 .then(f => console.log('écrit :', f));
