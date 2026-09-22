const pptxgen = require('pptxgenjs');
const p = new pptxgen();
p.layout = 'LAYOUT_WIDE';
p.title = 'Call Com x Orange Tunisie - premiere rencontre';

const W=13.3, H=7.5;
const C = { deep:'16233D', primary:'065A82', teal:'1C7293', surf:'F1F6F9', tint:'E1EDF3',
            ink:'13212B', muted:'5B7180', white:'FFFFFF', light:'D9E9F0',
            green:'1F7A5C', greenT:'E9F4F0', amber:'9A6B15', amberT:'FAF2DF' };
const FH='Cambria', FB='Calibri';

function head(s, t, sub){
  s.background={color:C.white};
  s.addText(t,{x:0.7,y:0.42,w:12.0,h:0.72,isTextBox:true,margin:0,
    fontFace:FH,fontSize:32,bold:true,color:C.primary});
  if(sub) s.addText(sub,{x:0.7,y:1.16,w:12.0,h:0.45,isTextBox:true,margin:0,
    fontFace:FB,fontSize:15,color:C.muted});
}
function card(s,x,y,w,h,fill,line){
  const o={x,y,w,h,fill:{color:fill||C.surf},rectRadius:0.06};
  if(line) o.line={color:line,width:1};
  s.addShape(p.ShapeType.roundRect,o);
}
function circ(s,x,y,d,txt,bg,fg,fs){
  s.addShape(p.ShapeType.ellipse,{x,y,w:d,h:d,fill:{color:bg}});
  s.addText(String(txt),{x,y,w:d,h:d,isTextBox:true,margin:0,align:'center',valign:'middle',
    fontFace:FB,fontSize:fs||16,bold:true,color:fg||C.white});
}
function timer(s,t){
  s.addText(t,{x:11.4,y:0.5,w:1.3,h:0.32,isTextBox:true,margin:0,align:'right',
    fontFace:FB,fontSize:11,color:'A8B6C0'});
}

// ============ 1. TITRE ============
{
  const s=p.addSlide(); s.background={color:C.deep};
  s.addText('PROPOSITION DE PARTENARIAT',{x:0.9,y:1.75,w:11.5,h:0.4,isTextBox:true,margin:0,
    fontFace:FB,fontSize:13,bold:true,color:C.light,charSpacing:2.5});
  s.addText('Monétiser la tonalité d\'attente',{x:0.9,y:2.25,w:11.5,h:0.95,isTextBox:true,margin:0,
    fontFace:FH,fontSize:46,bold:true,color:C.white});
  s.addText('Un inventaire publicitaire qu\'Orange Tunisie possède déjà',
    {x:0.9,y:3.3,w:11.5,h:0.5,isTextBox:true,margin:0,
     fontFace:FB,fontSize:19,color:C.light});
  card(s,0.9,4.35,5.6,1.0,'1E2C4A');
  s.addText('Call Com',{x:1.2,y:4.5,w:5.0,h:0.35,isTextBox:true,margin:0,
    fontFace:FB,fontSize:15,bold:true,color:C.white});
  s.addText('Régie publicitaire audio · Tunisie',{x:1.2,y:4.85,w:5.0,h:0.3,isTextBox:true,margin:0,
    fontFace:FB,fontSize:12,color:C.light});
  s.addText('5 minutes · 2 questions',{x:0.9,y:5.7,w:6,h:0.35,isTextBox:true,margin:0,
    fontFace:FB,fontSize:13,italic:true,color:'8FA3B5'});
  s.addText('22 septembre 2026',{x:0.9,y:6.55,w:6,h:0.3,isTextBox:true,margin:0,
    fontFace:FB,fontSize:11,color:'7A8CA0'});
  s.addNotes('Ouvrir en disant : « Je ne viens pas vous présenter une idée. Je viens vous montrer un produit qu\'un opérateur a déjà exploité avec succès, et vous dire que vous avez déjà la brique technique pour le faire. »');
}

// ============ 2. L'INVENTAIRE QUI DORT ============
{
  const s=p.addSlide(); timer(s,'0:00 — 0:45');
  head(s,'Vos abonnés attendent. Personne n\'en tire rien.',
       'Entre la numérotation et le décrochage, il y a un espace audio que vous possédez');

  const y=2.2;
  const steps=[['L\'appel part',''],['La ligne sonne','5 à 10 secondes'],['Décrochage','conversation']];
  steps.forEach((st,i)=>{
    const x=0.7+i*3.1;
    const isMid = i===1;
    card(s,x,y,2.85,1.55, isMid?C.primary:C.surf, null);
    s.addText(st[0],{x:x+0.15,y:y+0.35,w:2.55,h:0.38,isTextBox:true,margin:0,align:'center',
      fontFace:FB,fontSize:15,bold:true,color:isMid?C.white:C.ink});
    if(st[1]) s.addText(st[1],{x:x+0.15,y:y+0.78,w:2.55,h:0.35,isTextBox:true,margin:0,align:'center',
      fontFace:FB,fontSize:13,color:isMid?C.light:C.muted});
    if(i<2) s.addShape(p.ShapeType.rightArrow,{x:x+2.92,y:y+0.68,w:0.22,h:0.2,fill:{color:'A8BCC9'}});
  });

  card(s,10.3,y,2.3,1.55,C.tint);
  s.addText([{text:'0',options:{fontSize:40,bold:true,color:C.primary,breakLine:true}},
             {text:'revenu aujourd\'hui',options:{fontSize:12,color:C.muted}}],
    {x:10.3,y,w:2.3,h:1.55,isTextBox:true,margin:0,align:'center',valign:'middle',fontFace:FH});

  card(s,0.7,4.25,11.9,1.5,C.surf);
  s.addText('Ce que nous proposons',{x:1.0,y:4.42,w:5,h:0.32,isTextBox:true,margin:0,
    fontFace:FB,fontSize:14,bold:true,color:C.primary});
  s.addText('Remplacer cette attente par une annonce locale de 3 à 4 secondes, pour les abonnés qui l\'acceptent. L\'annonce s\'arrête au décrochage. L\'abonné reçoit une contrepartie. L\'annonceur paie. Vous partagez le revenu.',
    {x:1.0,y:4.78,w:11.3,h:0.85,isTextBox:true,margin:0,
     fontFace:FB,fontSize:14,color:C.ink,lineSpacing:19});
  s.addNotes('Ne pas s\'attarder. 45 secondes maximum. L\'objectif est juste de poser le cadre avant le slide suivant, qui est le vrai argument.');
}

// ============ 3. LE PRECEDENT CHIFFRE  <<< LE SLIDE CLE ============
{
  const s=p.addSlide(); timer(s,'0:45 — 1:45');
  head(s,'Ce n\'est pas une idée. C\'est un produit déjà exploité.',
       'Turkcell « Tone&Win », lancé en mai 2008 — le même modèle, récompense abonné incluse');

  const stats=[['50','marques'],['72','campagnes'],['200 000+','membres'],['~20 min','offertes / abonné / mois']];
  stats.forEach((st,i)=>{
    const x=0.7+i*3.05;
    card(s,x,2.05,2.8,1.55,C.primary);
    s.addText([{text:st[0],options:{fontSize:st[0].length>6?26:34,bold:true,color:C.white,breakLine:true}},
               {text:st[1],options:{fontSize:11.5,color:C.light}}],
      {x:x+0.1,y:2.05,w:2.6,h:1.55,isTextBox:true,margin:0,align:'center',valign:'middle',fontFace:FH});
  });

  card(s,0.7,3.85,7.6,1.35,C.surf);
  s.addText('Les annonceurs',{x:1.0,y:4.0,w:5,h:0.3,isTextBox:true,margin:0,
    fontFace:FB,fontSize:13,bold:true,color:C.primary});
  s.addText('Coca-Cola · Unilever · Procter & Gamble · Nestlé · Warner Bros.\nBurger King · Nivea · Kraft · HSBC · Aviva · marques nationales',
    {x:1.0,y:4.32,w:7.0,h:0.75,isTextBox:true,margin:0,
     fontFace:FB,fontSize:12.5,color:C.ink,lineSpacing:17});

  card(s,8.55,3.85,4.05,1.35,C.greenT,C.green);
  s.addText('Et dans le groupe Orange',{x:8.85,y:4.0,w:3.5,h:0.3,isTextBox:true,margin:0,
    fontFace:FB,fontSize:13,bold:true,color:C.green});
  s.addText('L\'usage commercial a démarré vers 2008 avec Turkcell, RingPlus — et « Yesss! » d\'Orange.',
    {x:8.85,y:4.32,w:3.5,h:0.75,isTextBox:true,margin:0,
     fontFace:FB,fontSize:11.5,color:C.ink,lineSpacing:15});

  card(s,0.7,5.42,11.9,0.95,C.tint);
  s.addText('Le mécanisme de récompense de Turkcell : l\'abonné gagnait du crédit proportionnellement au temps que ses appelants avaient réellement écouté. C\'est exactement le modèle que nous proposons.',
    {x:1.0,y:5.6,w:11.3,h:0.6,isTextBox:true,margin:0,
     fontFace:FB,fontSize:13.5,bold:true,color:C.primary,lineSpacing:18});
  s.addText('Sources : Mobile Marketer / Marketing Dive · MMA Global · MobiAD News',
    {x:0.7,y:6.6,w:11.9,h:0.3,isTextBox:true,margin:0,fontFace:FB,fontSize:9.5,color:'9CADB8'});
  s.addNotes('C\'EST LE SLIDE QUI COMPTE. Prendre son temps. Laisser un silence après avoir cité les marques. Puis enchaîner sur « Yesss! » — le fait que le groupe Orange l\'ait déjà fait désamorce la moitié des objections.');
}

// ============ 4. CE QU'ORANGE A DEJA ============
{
  const s=p.addSlide(); timer(s,'1:45 — 2:45');
  head(s,'Vous avez déjà la brique technique',
       'Nous ne vous demandons pas de construire une plateforme');

  card(s,0.7,2.05,5.85,2.6,C.greenT,C.green);
  s.addShape(p.ShapeType.ellipse,{x:1.0,y:2.42,w:0.26,h:0.26,fill:{color:C.green}});
  s.addText('Ce qui existe chez vous',{x:1.45,y:2.36,w:4.8,h:0.38,isTextBox:true,margin:0,
    fontFace:FB,fontSize:15,bold:true,color:C.green});
  s.addText([
    {text:'Tonalité d\'attente personnalisée',options:{bold:true,breakLine:true}},
    {text:'accessible sur ',options:{}},{text:'*144#',options:{bold:true}},
    {text:', avec abonnement mensuel et catalogue de contenus.',options:{breakLine:true}},
    {text:'\nLa plateforme sait déjà remplacer la tonalité réseau par un contenu choisi, et l\'interrompre au décrochage.',options:{}}
  ],{x:1.0,y:2.88,w:5.25,h:1.62,isTextBox:true,margin:0,
     fontFace:FB,fontSize:13,color:C.ink,lineSpacing:18});

  card(s,6.85,2.05,5.75,2.6,C.amberT,C.amber);
  s.addShape(p.ShapeType.ellipse,{x:7.15,y:2.42,w:0.26,h:0.26,fill:{color:C.amber}});
  s.addText('Ce que nous venons vérifier',{x:7.6,y:2.36,w:4.7,h:0.38,isTextBox:true,margin:0,
    fontFace:FB,fontSize:15,bold:true,color:C.amber});
  s.addText([
    {text:'Cette plateforme peut-elle sélectionner le contenu selon des règles publicitaires',options:{bold:true}},
    {text:' — zone géographique, dates, plages horaires, rotation — plutôt que selon le choix personnel de l\'abonné ?',options:{breakLine:true}},
    {text:'\nSi oui, l\'écart à franchir est faible.',options:{bold:true}}
  ],{x:7.15,y:2.88,w:5.15,h:1.62,isTextBox:true,margin:0,
     fontFace:FB,fontSize:13,color:C.ink,lineSpacing:18});

  card(s,0.7,4.95,11.9,1.5,C.surf);
  s.addText('Notre position',{x:1.0,y:5.12,w:5,h:0.32,isTextBox:true,margin:0,
    fontFace:FB,fontSize:14,bold:true,color:C.primary});
  s.addText('Sur les neuf capacités nécessaires à ce service — variation par appelant, par zone, par date, par plage horaire, rotation, plafonds, consentement, mesure, facturation — une seule constitue un écart réel : l\'origine de la décision. Tout le reste existe déjà ou en est une extension mineure.',
    {x:1.0,y:5.48,w:11.3,h:0.85,isTextBox:true,margin:0,
     fontFace:FB,fontSize:13.5,color:C.ink,lineSpacing:18});
  s.addNotes('Signaler humblement que la capacité d\'affectation par appelant nous vient d\'une description publique du service, et que c\'est précisément ce que nous venons confirmer. Ne PAS affirmer connaître leur architecture.');
}

// ============ 5. CE QUE CALL COM APPORTE ============
{
  const s=p.addSlide(); timer(s,'2:45 — 3:45');
  head(s,'Ce que Call Com apporte, et que vous ne construirez pas',
       'La répartition que nous proposons');

  card(s,0.7,2.05,5.85,3.7,C.tint);
  s.addText('ORANGE GARDE',{x:1.0,y:2.25,w:5,h:0.35,isTextBox:true,margin:0,
    fontFace:FB,fontSize:13,bold:true,color:C.primary,charSpacing:1.5});
  ['Le réseau et la plateforme média','La base d\'abonnés','Le consentement et la facturation',
   'La conformité réglementaire','Les données d\'abonnés — jamais exportées']
   .forEach((t,i)=>{
     const y=2.75+i*0.58;
     s.addShape(p.ShapeType.ellipse,{x:1.0,y:y+0.09,w:0.14,h:0.14,fill:{color:C.primary}});
     s.addText(t,{x:1.3,y,w:5.0,h:0.45,isTextBox:true,margin:0,valign:'middle',
       fontFace:FB,fontSize:13,color:C.ink});
   });

  card(s,6.85,2.05,5.75,3.7,C.primary);
  s.addText('CALL COM APPORTE',{x:7.15,y:2.25,w:5,h:0.35,isTextBox:true,margin:0,
    fontFace:FB,fontSize:13,bold:true,color:C.light,charSpacing:1.5});
  [['La force de vente annonceurs','restaurants, pharmacies, garages, cliniques — des centaines de commerçants locaux'],
   ['La régie et les créatifs',''],
   ['L\'application et les récompenses',''],
   ['Le back-office et le reporting','']]
   .forEach((t,i)=>{
     const y=2.75+i*0.72;
     s.addShape(p.ShapeType.ellipse,{x:7.15,y:y+0.09,w:0.14,h:0.14,fill:{color:C.white}});
     s.addText(t[0],{x:7.45,y,w:4.9,h:0.32,isTextBox:true,margin:0,
       fontFace:FB,fontSize:13,bold:true,color:C.white});
     if(t[1]) s.addText(t[1],{x:7.45,y:y+0.3,w:4.9,h:0.6,isTextBox:true,margin:0,
       fontFace:FB,fontSize:11.5,color:C.light,lineSpacing:15});
   });
  s.addText('Vous ne démarcherez jamais ces annonceurs vous-mêmes. C\'est notre métier.',
    {x:7.15,y:5.25,w:5.15,h:0.4,isTextBox:true,margin:0,
     fontFace:FB,fontSize:12.5,italic:true,bold:true,color:C.white});
  s.addNotes('C\'est le slide qui répond à « pourquoi vous et pas nous ». Insister : Orange n\'a ni l\'envie ni la structure pour démarcher des centaines de petits commerçants. Call Com oui.');
}

// ============ 6. LA DEMANDE ============
{
  const s=p.addSlide(); timer(s,'3:45 — 4:30');
  head(s,'Notre demande est précise, et petite',
       'Un POC, sans développement de votre côté');

  card(s,0.7,2.05,11.9,1.35,C.primary);
  s.addText('Un POC sur 10 à 20 lignes de test, en pré-provisionnement',
    {x:1.0,y:2.35,w:11.3,h:0.45,isTextBox:true,margin:0,
     fontFace:FH,fontSize:24,bold:true,color:C.white});
  s.addText('Nous poussons les contenus et les règles à l\'avance. Votre plateforme décide localement. Vous nous remontez les diffusions.',
    {x:1.0,y:2.85,w:11.3,h:0.4,isTextBox:true,margin:0,
     fontFace:FB,fontSize:13.5,color:C.light});

  const eng=[
    ['Aucune dépendance','Votre réseau ne dépend jamais de nos systèmes. Le repli est votre tonalité normale, déclenché par un délai de garde de votre côté.'],
    ['Le kill-switch est chez vous','Vous pouvez couper le service unilatéralement et immédiatement, sans nous consulter.'],
    ['Aucune donnée personnelle','Nous ne demandons aucune donnée d\'abonné. Un pseudonyme non réversible suffit pour créditer les récompenses.'],
    ['Un critère d\'arrêt que nous proposons','Nous mesurerons le taux de décrochage avec et sans annonce. Si les appelants raccrochent davantage, nous arrêtons.']
  ];
  eng.forEach((e,i)=>{
    const col=i%2, row=Math.floor(i/2);
    const x=0.7+col*6.05, y=3.65+row*1.45;
    card(s,x,y,5.85,1.3,C.surf);
    circ(s,x+0.25,y+0.22,0.38,i+1,C.primary,C.white,13);
    s.addText(e[0],{x:x+0.75,y:y+0.18,w:4.9,h:0.32,isTextBox:true,margin:0,
      fontFace:FB,fontSize:13.5,bold:true,color:C.primary});
    s.addText(e[1],{x:x+0.75,y:y+0.5,w:4.9,h:0.68,isTextBox:true,margin:0,
      fontFace:FB,fontSize:11.5,color:C.ink,lineSpacing:14.5});
  });
  s.addText('Ces quatre engagements sont pris avant que vous ne les demandiez.',
    {x:0.7,y:6.65,w:11.9,h:0.35,isTextBox:true,margin:0,
     fontFace:FB,fontSize:12.5,italic:true,color:C.muted});
  s.addNotes('Énoncer les quatre engagements soi-même, avant qu\'on les demande. C\'est ce qui fait la différence entre un demandeur et un partenaire. Le quatrième — proposer son propre critère d\'arrêt — est celui qui surprend le plus favorablement.');
}

// ============ 7. LES DEUX QUESTIONS ============
{
  const s=p.addSlide(); s.background={color:C.deep}; 
  s.addText('4:30 — 5:00',{x:11.4,y:0.5,w:1.3,h:0.32,isTextBox:true,margin:0,align:'right',
    fontFace:FB,fontSize:11,color:'6B7E92'});
  s.addText('Deux questions pour avancer',{x:0.9,y:0.85,w:11.5,h:0.62,isTextBox:true,margin:0,
    fontFace:FH,fontSize:34,bold:true,color:C.white});
  s.addText('Les réponses déterminent entièrement la suite',{x:0.9,y:1.52,w:11.5,h:0.4,isTextBox:true,margin:0,
    fontFace:FB,fontSize:15,color:C.light});

  const qs=[
    ['1','Êtes-vous en VoLTE / IMS en production ?',
     'Cela détermine si l\'intégration se fait sur un serveur d\'application IMS ou par déclenchement CAMEL. L\'effort n\'est pas du même ordre.'],
    ['2','Vos enregistrements contiennent-ils la durée réellement écoutée ?',
     'C\'est ce qui permet de ne facturer que les annonces effectivement entendues. Sans cela, nous ne pouvons pas vendre un tarif défendable à un annonceur.']
  ];
  qs.forEach((q,i)=>{
    const y=2.25+i*1.85;
    card(s,0.9,y,11.5,1.6,'1E2C4A');
    circ(s,1.25,y+0.5,0.6,q[0],C.light,C.deep,22);
    s.addText(q[1],{x:2.1,y:y+0.28,w:10.0,h:0.45,isTextBox:true,margin:0,
      fontFace:FB,fontSize:18,bold:true,color:C.white});
    s.addText(q[2],{x:2.1,y:y+0.78,w:10.0,h:0.65,isTextBox:true,margin:0,
      fontFace:FB,fontSize:12.5,color:C.light,lineSpacing:16.5});
  });

  s.addText('Et une demande : pouvons-nous avoir une réunion avec votre équipe voix ?',
    {x:0.9,y:6.1,w:11.5,h:0.45,isTextBox:true,margin:0,
     fontFace:FH,fontSize:19,bold:true,color:C.light});
  s.addText('Nous avons préparé 22 questions techniques. Nous ne vous les posons pas aujourd\'hui.',
    {x:0.9,y:6.62,w:11.5,h:0.32,isTextBox:true,margin:0,
     fontFace:FB,fontSize:12,italic:true,color:'8FA3B5'});
  s.addNotes('Finir sur ces deux questions et la demande de réunion technique. Ne PAS dérouler les 22 questions ici : le dire, et s\'arrêter. La vraie demande de cette réunion est la réunion suivante.');
}

// ============ 8. RESERVE — LES DEUX VARIANTES ============
{
  const s=p.addSlide(); timer(s,'réserve');
  head(s,'Réserve — deux variantes possibles',
       'Nous ne savons pas laquelle est la plus simple chez vous. Vous, oui.');

  const rows=[
    ['','Variante A — l\'appelant entend','Variante B — votre abonné entend'],
    ['Qui écoute l\'annonce','La personne qui appelle votre abonné','Votre abonné, quand il appelle'],
    ['Qui a consenti','L\'appelant n\'a rien accepté','L\'auditeur est l\'abonné inscrit'],
    ['Qui est récompensé','L\'abonné appelé','La même personne qui écoute'],
    ['Ciblage par zone','Impossible si l\'appelant est hors réseau','Vous connaissez votre abonné'],
    ['Dépend de l\'interconnexion','Oui','Non'],
    ['Si le correspondant est à l\'étranger','Sans objet','Fonctionne'],
    ['Précédent commercial','Turkcell Tone&Win','Moins documenté']
  ];
  const x0=0.7, cw=[4.3,4.0,3.6], rh=0.48, y0=1.95;
  rows.forEach((r,i)=>{
    const y=y0+i*rh;
    if(i===0) s.addShape(p.ShapeType.rect,{x:x0,y,w:11.9,h:rh,fill:{color:C.primary}});
    else if(i%2===0) s.addShape(p.ShapeType.rect,{x:x0,y,w:11.9,h:rh,fill:{color:C.surf}});
    let cx=x0;
    r.forEach((cell,j)=>{
      s.addText(cell,{x:cx+0.15,y,w:cw[j]-0.25,h:rh,isTextBox:true,margin:0,valign:'middle',
        fontFace:FB,fontSize:11.5,bold:(i===0||j===0),
        color:i===0?C.white:(j===0?C.ink:C.muted)});
      cx+=cw[j];
    });
  });
  s.addText('La variante B résout le consentement, le ciblage et l\'interconnexion d\'un seul coup. Mais c\'est vous qui savez ce qui est le moins coûteux à mettre en œuvre.',
    {x:0.7,y:5.85,w:11.9,h:0.5,isTextBox:true,margin:0,
     fontFace:FB,fontSize:13,bold:true,color:C.primary,lineSpacing:17});
  s.addNotes('Slide de réserve : ne sortir que si la discussion devient technique. Le fait de présenter les deux variantes sans imposer la sienne est ce qui crédibilise le plus.');
}

// ============ 9. RESERVE — ARCHITECTURE ============
{
  const s=p.addSlide(); timer(s,'réserve');
  head(s,'Réserve — l\'architecture que nous proposons',
       'Pré-provisionnement : aucune dépendance de votre réseau à nos systèmes');

  card(s,0.7,2.05,3.4,1.5,C.surf);
  s.addText('Call Com',{x:0.9,y:2.25,w:3.0,h:0.32,isTextBox:true,margin:0,align:'center',
    fontFace:FB,fontSize:14,bold:true,color:C.ink});
  s.addText('campagnes, règles,\nfichiers audio',{x:0.9,y:2.62,w:3.0,h:0.7,isTextBox:true,margin:0,align:'center',
    fontFace:FB,fontSize:12,color:C.muted,lineSpacing:16});

  s.addShape(p.ShapeType.rightArrow,{x:4.22,y:2.68,w:0.5,h:0.25,fill:{color:'A8BCC9'}});
  s.addText('① dépôt\nquotidien',{x:4.0,y:3.0,w:0.95,h:0.6,isTextBox:true,margin:0,align:'center',
    fontFace:FB,fontSize:9.5,color:C.muted,lineSpacing:12});

  card(s,4.85,1.85,4.3,1.9,C.primary);
  s.addText('ORANGE',{x:5.05,y:2.05,w:3.9,h:0.32,isTextBox:true,margin:0,align:'center',
    fontFace:FB,fontSize:13,bold:true,color:C.light,charSpacing:1.5});
  s.addText('Plateforme de tonalité\nd\'attente\n\nsélection LOCALE\naucun appel externe',
    {x:5.05,y:2.4,w:3.9,h:1.25,isTextBox:true,margin:0,align:'center',
     fontFace:FB,fontSize:12,color:C.white,lineSpacing:16});

  s.addShape(p.ShapeType.rightArrow,{x:9.27,y:2.68,w:0.5,h:0.25,fill:{color:'A8BCC9'}});
  s.addText('② appel réel\nannonce jouée',{x:9.0,y:3.0,w:1.1,h:0.6,isTextBox:true,margin:0,align:'center',
    fontFace:FB,fontSize:9.5,color:C.muted,lineSpacing:12});

  card(s,9.9,2.05,2.7,1.5,C.surf);
  s.addText('Vos abonnés',{x:10.05,y:2.25,w:2.4,h:0.32,isTextBox:true,margin:0,align:'center',
    fontFace:FB,fontSize:14,bold:true,color:C.ink});
  s.addText('aucune application\nrequise',{x:10.05,y:2.62,w:2.4,h:0.7,isTextBox:true,margin:0,align:'center',
    fontFace:FB,fontSize:12,color:C.muted,lineSpacing:16});

  card(s,0.7,4.0,11.9,0.95,C.tint);
  s.addText('③ Vous nous remontez les diffusions en différé : identifiant, durée écoutée, motif d\'arrêt, appel décroché ou non. Nous créditons les récompenses et facturons les annonceurs.',
    {x:1.0,y:4.18,w:11.3,h:0.6,isTextBox:true,margin:0,
     fontFace:FB,fontSize:13,color:C.ink,lineSpacing:18});

  const pts=[['Latence ajoutée dans l\'appel','0 ms'],
             ['Développement requis de votre côté','aucun, si l\'ingestion de contenu suffit'],
             ['Si Call Com est indisponible','aucun effet — les règles sont déjà chez vous']];
  pts.forEach((pt,i)=>{
    const y=5.2+i*0.52;
    s.addText(pt[0],{x:0.7,y,w:6.2,h:0.4,isTextBox:true,margin:0,valign:'middle',
      fontFace:FB,fontSize:12.5,color:C.muted});
    s.addText(pt[1],{x:7.0,y,w:5.6,h:0.4,isTextBox:true,margin:0,valign:'middle',
      fontFace:FB,fontSize:12.5,bold:true,color:C.green});
  });
  s.addNotes('Slide de réserve. À sortir si on vous demande « concrètement comment ». Le message central est la ligne « latence ajoutée : 0 ms » — c\'est ce que l\'équipe cœur de réseau veut entendre.');
}

p.writeFile({fileName:'Call_Com_Orange_Premiere_Rencontre_5min.pptx'})
 .then(f=>console.log('écrit :',f));
