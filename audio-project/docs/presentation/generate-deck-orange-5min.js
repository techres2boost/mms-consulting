const pptxgen = require('pptxgenjs');
const p = new pptxgen();
p.layout = 'LAYOUT_WIDE';
p.title = 'Call Com x Orange Tunisie - premiere rencontre';

const C = { deep:'16233D', primary:'065A82', teal:'1C7293', surf:'F1F6F9', tint:'E1EDF3',
            ink:'13212B', muted:'5B7180', white:'FFFFFF', light:'D9E9F0',
            green:'1F7A5C', greenT:'E9F4F0', amber:'9A6B15', amberT:'FAF2DF',
            grey:'6B7C89', greyT:'EEF1F3' };
const FH='Cambria', FB='Calibri';

function head(s,t,sub){
  s.background={color:C.white};
  s.addText(t,{x:0.7,y:0.42,w:11.0,h:0.72,isTextBox:true,margin:0,
    fontFace:FH,fontSize:31,bold:true,color:C.primary});
  if(sub) s.addText(sub,{x:0.7,y:1.16,w:11.9,h:0.45,isTextBox:true,margin:0,
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

// ═════════ 1. TITRE ═════════
{
  const s=p.addSlide(); s.background={color:C.deep};
  s.addText('VALIDATION DE FAISABILITÉ',{x:0.9,y:1.75,w:11.5,h:0.4,isTextBox:true,margin:0,
    fontFace:FB,fontSize:13,bold:true,color:C.light,charSpacing:2.5});
  s.addText('Monétiser la tonalité d\'attente',{x:0.9,y:2.25,w:11.5,h:0.95,isTextBox:true,margin:0,
    fontFace:FH,fontSize:46,bold:true,color:C.white});
  s.addText('Un inventaire publicitaire qu\'Orange Tunisie possède déjà',
    {x:0.9,y:3.3,w:11.5,h:0.5,isTextBox:true,margin:0,fontFace:FB,fontSize:19,color:C.light});
  card(s,0.9,4.35,5.6,1.0,'1E2C4A');
  s.addText('Call Com',{x:1.2,y:4.5,w:5.0,h:0.35,isTextBox:true,margin:0,
    fontFace:FB,fontSize:15,bold:true,color:C.white});
  s.addText('Régie publicitaire audio · Tunisie',{x:1.2,y:4.85,w:5.0,h:0.3,isTextBox:true,margin:0,
    fontFace:FB,fontSize:12,color:C.light});
  s.addText('5 minutes · 3 questions · 1 demande',{x:0.9,y:5.7,w:6.5,h:0.35,isTextBox:true,margin:0,
    fontFace:FB,fontSize:13,italic:true,color:'8FA3B5'});
  s.addText('22 septembre 2026',{x:0.9,y:6.55,w:6,h:0.3,isTextBox:true,margin:0,
    fontFace:FB,fontSize:11,color:'7A8CA0'});
  s.addNotes('Ouvrir ainsi : « Nous ne venons pas vous présenter une architecture. Nous venons valider une faisabilité de principe, parce que nous ne connaissons pas votre réseau. En 5 minutes : pourquoi c\'est intéressant, ce qu\'un opérateur a déjà fait, et trois questions. »');
}

// ═════════ 2. L'INVENTAIRE QUI DORT ═════════
{
  const s=p.addSlide(); timer(s,'0:00 — 0:45');
  head(s,'Vos abonnés attendent. Personne n\'en tire rien.',
       'Entre la numérotation et le décrochage, il y a un espace audio que vous possédez');
  const y=2.2;
  [['L\'appel part',''],['La ligne sonne','5 à 10 secondes'],['Décrochage','conversation']]
  .forEach((st,i)=>{
    const x=0.7+i*3.1, mid=i===1;
    card(s,x,y,2.85,1.55, mid?C.primary:C.surf);
    s.addText(st[0],{x:x+0.15,y:y+0.35,w:2.55,h:0.38,isTextBox:true,margin:0,align:'center',
      fontFace:FB,fontSize:15,bold:true,color:mid?C.white:C.ink});
    if(st[1]) s.addText(st[1],{x:x+0.15,y:y+0.78,w:2.55,h:0.35,isTextBox:true,margin:0,align:'center',
      fontFace:FB,fontSize:13,color:mid?C.light:C.muted});
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
    {x:1.0,y:4.78,w:11.3,h:0.85,isTextBox:true,margin:0,fontFace:FB,fontSize:14,color:C.ink,lineSpacing:19});
  s.addNotes('45 secondes maximum. On pose le cadre, on ne s\'attarde pas : le vrai argument est au slide suivant.');
}

// ═════════ 3. LE PRÉCÉDENT CHIFFRÉ ═════════
{
  const s=p.addSlide(); timer(s,'0:45 — 1:45');
  head(s,'Ce n\'est pas une idée. C\'est un produit déjà exploité.',
       'Turkcell « Tone&Win », lancé en mai 2008 — le même modèle, récompense abonné incluse');
  [['50','marques'],['72','campagnes'],['200 000+','membres'],['~20 min','offertes / abonné / mois']]
  .forEach((st,i)=>{
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
    {x:1.0,y:4.32,w:7.0,h:0.75,isTextBox:true,margin:0,fontFace:FB,fontSize:12.5,color:C.ink,lineSpacing:17});
  card(s,8.55,3.85,4.05,1.35,C.greenT,C.green);
  s.addText('Et dans le groupe Orange',{x:8.85,y:4.0,w:3.5,h:0.3,isTextBox:true,margin:0,
    fontFace:FB,fontSize:13,bold:true,color:C.green});
  s.addText('L\'usage commercial a démarré vers 2008 avec Turkcell, RingPlus — et « Yesss! » d\'Orange.',
    {x:8.85,y:4.32,w:3.5,h:0.75,isTextBox:true,margin:0,fontFace:FB,fontSize:11.5,color:C.ink,lineSpacing:15});
  card(s,0.7,5.42,11.9,0.95,C.tint);
  s.addText('Le mécanisme de récompense de Turkcell : l\'abonné gagnait du crédit proportionnellement au temps que ses appelants avaient réellement écouté. C\'est exactement le modèle que nous proposons.',
    {x:1.0,y:5.6,w:11.3,h:0.6,isTextBox:true,margin:0,fontFace:FB,fontSize:13.5,bold:true,color:C.primary,lineSpacing:18});
  s.addText('Sources : Mobile Marketer / Marketing Dive · MMA Global · MobiAD News',
    {x:0.7,y:6.6,w:11.9,h:0.3,isTextBox:true,margin:0,fontFace:FB,fontSize:9.5,color:'9CADB8'});
  s.addNotes('LE SLIDE QUI COMPTE. Prendre son temps, laisser un silence après la liste des marques, puis enchaîner sur « Yesss! » : le fait que le groupe Orange l\'ait déjà fait désamorce la moitié des objections.');
}

// ═════════ 4. CE QUE NOUS SAVONS / NE SAVONS PAS  ←  LA SLIDE DE CRÉDIBILITÉ ═════════
{
  const s=p.addSlide(); timer(s,'1:45 — 2:45');
  head(s,'Ce que nous affirmons, et ce que nous ne savons pas',
       'Nous ne connaissons pas votre réseau, et nous ne ferons pas semblant');

  const cols=[
    [C.green,C.greenT,'CE QUE NOUS AFFIRMONS','établi et sourcé',
     ['Une application mobile ne peut pas diffuser dans un appel — sur aucun système',
      'Ce que l\'appelant entend avant le décrochage est produit par le réseau',
      'Donc l\'insertion se fait dans le réseau, pas ailleurs',
      'Un opérateur pair l\'a exploité commercialement avec succès']],
    [C.amber,C.amberT,'CE QUE NOUS SUPPOSONS','à confirmer par vous',
     ['Que vous exploitez une plateforme de tonalité d\'attente',
      'Qu\'elle sait varier le contenu selon l\'appelant',
      'Qu\'elle enregistre la durée pendant laquelle le contenu a été joué',
      'Que vous refuserez une dépendance externe dans le chemin d\'appel']],
    [C.grey,C.greyT,'CE QUE NOUS IGNORONS','et c\'est pourquoi nous sommes là',
     ['Sur quels équipements votre service repose',
      'Qui l\'exploite — vous, ou un éditeur',
      'Quelles données de diffusion vous pouvez produire',
      'Quelles contraintes réglementaires vous voyez']],
  ];
  cols.forEach((col,i)=>{
    const [c,ct,titre,st,items]=col;
    const x=0.7+i*4.0;
    card(s,x,1.95,3.7,4.3,ct,c);
    s.addShape(p.ShapeType.ellipse,{x:x+0.25,y:2.2,w:0.22,h:0.22,fill:{color:c}});
    s.addText(titre,{x:x+0.6,y:2.13,w:3.0,h:0.34,isTextBox:true,margin:0,
      fontFace:FB,fontSize:11.5,bold:true,color:c,charSpacing:0.5});
    s.addText(st,{x:x+0.25,y:2.5,w:3.2,h:0.28,isTextBox:true,margin:0,
      fontFace:FB,fontSize:10,italic:true,color:C.muted});
    items.forEach((it,k)=>{
      const y=2.9+k*0.82;
      s.addShape(p.ShapeType.ellipse,{x:x+0.28,y:y+0.09,w:0.12,h:0.12,fill:{color:c}});
      s.addText(it,{x:x+0.55,y,w:2.95,h:0.78,isTextBox:true,margin:0,
        fontFace:FB,fontSize:10.5,color:C.ink,lineSpacing:13.5});
    });
  });
  s.addText('Notre dossier technique marque chaque affirmation selon ces trois catégories. Nous pouvons vous le laisser.',
    {x:0.7,y:6.45,w:11.9,h:0.4,isTextBox:true,margin:0,
     fontFace:FB,fontSize:12.5,bold:true,color:C.primary});
  s.addNotes('C\'est la slide qui établit la crédibilité devant des ingénieurs. Le message : nous avons fait le travail, et nous savons où s\'arrête notre connaissance. Ne JAMAIS affirmer connaître leur architecture — la troisième colonne est ce qui rend les deux premières crédibles.');
}

// ═════════ 5. CE QUE CALL COM APPORTE ═════════
{
  const s=p.addSlide(); timer(s,'2:45 — 3:45');
  head(s,'La répartition que nous proposons',
       'Ce que Call Com apporte, et que vous ne construirez pas');
  card(s,0.7,2.05,5.85,3.7,C.tint);
  s.addText('ORANGE GARDE',{x:1.0,y:2.25,w:5,h:0.35,isTextBox:true,margin:0,
    fontFace:FB,fontSize:13,bold:true,color:C.primary,charSpacing:1.5});
  ['Le réseau et le composant média','La base d\'abonnés','Le consentement et la facturation',
   'La conformité réglementaire','Les données d\'abonnés — jamais exportées',
   'La décision de quoi diffuser']
   .forEach((t,i)=>{
     const y=2.75+i*0.48;
     s.addShape(p.ShapeType.ellipse,{x:1.0,y:y+0.08,w:0.13,h:0.13,fill:{color:C.primary}});
     s.addText(t,{x:1.3,y,w:5.0,h:0.4,isTextBox:true,margin:0,valign:'middle',
       fontFace:FB,fontSize:12.5,color:C.ink});
   });
  card(s,6.85,2.05,5.75,3.7,C.primary);
  s.addText('CALL COM APPORTE',{x:7.15,y:2.25,w:5,h:0.35,isTextBox:true,margin:0,
    fontFace:FB,fontSize:13,bold:true,color:C.light,charSpacing:1.5});
  [['La force de vente annonceurs','restaurants, pharmacies, garages, cliniques — des centaines de commerçants locaux'],
   ['La régie et les créatifs',''],['L\'application et les récompenses',''],
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
  s.addNotes('Répond à « pourquoi vous et pas nous ». Noter que la décision de quoi diffuser reste chez Orange dans le scénario que nous proposons : c\'est un point qui rassure beaucoup l\'équipe réseau.');
}

// ═════════ 6. NOTRE DEMANDE ═════════
{
  const s=p.addSlide(); timer(s,'3:45 — 4:30');
  head(s,'Notre demande aujourd\'hui est petite',
       'Nous ne demandons pas un projet. Nous demandons une validation de principe.');

  card(s,0.7,1.95,11.9,1.25,C.primary);
  s.addText('Une réunion avec votre équipe voix, et trois réponses',
    {x:1.0,y:2.2,w:11.3,h:0.45,isTextBox:true,margin:0,
     fontFace:FH,fontSize:24,bold:true,color:C.white});
  s.addText('C\'est tout ce dont nous avons besoin pour savoir si ce projet a un avenir chez vous.',
    {x:1.0,y:2.68,w:11.3,h:0.4,isTextBox:true,margin:0,fontFace:FB,fontSize:13.5,color:C.light});

  s.addText('Et quatre engagements que nous prenons dès maintenant',
    {x:0.7,y:3.42,w:11.9,h:0.35,isTextBox:true,margin:0,
     fontFace:FB,fontSize:14,bold:true,color:C.primary});
  [['Aucune dépendance','Votre réseau ne dépendra jamais de nos systèmes. Le repli est votre tonalité normale, déclenché par un délai de garde de votre côté.'],
   ['Le kill-switch est chez vous','Vous pourrez couper le service unilatéralement et immédiatement, sans nous consulter.'],
   ['Aucune donnée personnelle','Nous ne demandons aucune donnée d\'abonné. Un pseudonyme non réversible suffit pour créditer les récompenses.'],
   ['Un critère d\'arrêt que nous proposons','Nous mesurerons le taux de décrochage avec et sans annonce. Si les appelants raccrochent davantage, nous arrêtons.']]
  .forEach((e,i)=>{
    const col=i%2, row=Math.floor(i/2);
    const x=0.7+col*6.05, y=3.85+row*1.35;
    card(s,x,y,5.85,1.2,C.surf);
    circ(s,x+0.25,y+0.2,0.36,i+1,C.primary,C.white,13);
    s.addText(e[0],{x:x+0.72,y:y+0.15,w:4.95,h:0.3,isTextBox:true,margin:0,
      fontFace:FB,fontSize:13,bold:true,color:C.primary});
    s.addText(e[1],{x:x+0.72,y:y+0.44,w:4.95,h:0.68,isTextBox:true,margin:0,
      fontFace:FB,fontSize:11,color:C.ink,lineSpacing:14});
  });
  s.addText('Un POC sur quelques lignes de test viendra ensuite — pas aujourd\'hui.',
    {x:0.7,y:6.6,w:11.9,h:0.35,isTextBox:true,margin:0,
     fontFace:FB,fontSize:12,italic:true,color:C.muted});
  s.addNotes('Le changement de posture par rapport à une première version : on NE demande PAS un POC en première réunion. On demande une réunion technique et trois réponses. Le POC est la suite, pas la demande. Énoncer les quatre engagements soi-même, avant qu\'on les demande.');
}

// ═════════ 7. LES TROIS QUESTIONS ═════════
{
  const s=p.addSlide(); s.background={color:C.deep};
  s.addText('4:30 — 5:00',{x:11.4,y:0.5,w:1.3,h:0.32,isTextBox:true,margin:0,align:'right',
    fontFace:FB,fontSize:11,color:'6B7E92'});
  s.addText('Trois questions',{x:0.9,y:0.8,w:11.5,h:0.62,isTextBox:true,margin:0,
    fontFace:FH,fontSize:34,bold:true,color:C.white});
  s.addText('Les réponses déterminent s\'il y a un projet, et lequel',
    {x:0.9,y:1.47,w:11.5,h:0.4,isTextBox:true,margin:0,fontFace:FB,fontSize:15,color:C.light});

  [['1','Votre plateforme peut-elle varier le contenu selon l\'appelant et selon la zone ?',
    'C\'est ce qui rend le ciblage publicitaire possible. Si la réponse est non, nous partons sur une campagne nationale — le projet existe toujours.'],
   ['2','Pouvez-vous diffuser à votre propre abonné pendant qu\'il attend ?',
    'Et pas seulement à ses appelants. Cette variante résout d\'un coup le consentement, le ciblage et la dépendance à l\'interconnexion.'],
   ['3','Vos enregistrements contiennent-ils la durée réellement écoutée ?',
    'C\'est ce qui permet de ne facturer que les annonces entendues. Sans cela, nous ne pouvons pas vendre un tarif défendable à un annonceur.']]
  .forEach((q,i)=>{
    const y=2.15+i*1.42;
    card(s,0.9,y,11.5,1.28,'1E2C4A');
    circ(s,1.22,y+0.36,0.55,q[0],C.light,C.deep,20);
    s.addText(q[1],{x:2.02,y:y+0.2,w:10.1,h:0.4,isTextBox:true,margin:0,
      fontFace:FB,fontSize:16.5,bold:true,color:C.white});
    s.addText(q[2],{x:2.02,y:y+0.62,w:10.1,h:0.55,isTextBox:true,margin:0,
      fontFace:FB,fontSize:11.5,color:C.light,lineSpacing:15});
  });
  s.addText('Et une demande : une réunion avec votre équipe voix.',
    {x:0.9,y:6.45,w:11.5,h:0.42,isTextBox:true,margin:0,
     fontFace:FH,fontSize:19,bold:true,color:C.light});
  s.addNotes('Finir là et s\'arrêter. Ne PAS dérouler la liste longue de questions techniques : la mentionner comme préparée pour la réunion suivante. La vraie demande de ce rendez-vous est le rendez-vous suivant.');
}

// ═════════ 8. RÉSERVE — LES DEUX VARIANTES ═════════
{
  const s=p.addSlide(); timer(s,'réserve');
  head(s,'Réserve — deux moments possibles pour l\'annonce',
       'Nous ne savons pas lequel est le plus simple chez vous. Vous, oui.');
  const rows=[
    ['','Variante A — l\'appelant entend','Variante B — votre abonné entend'],
    ['Qui écoute l\'annonce','La personne qui appelle votre abonné','Votre abonné, quand il appelle'],
    ['Qui a consenti','L\'appelant n\'a rien accepté','L\'auditeur est l\'abonné inscrit'],
    ['Qui est récompensé','L\'abonné appelé','La même personne qui écoute'],
    ['Ciblage par zone','Seulement si l\'appelant est chez vous','Vous connaissez votre abonné'],
    ['Dépend du réseau d\'en face','Oui','Non'],
    ['Si le correspondant est à l\'étranger','Sans objet','Fonctionne'],
    ['Précédent commercial','Turkcell Tone&Win','Moins documenté'],
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
  s.addNotes('Slide de réserve, à sortir si la discussion devient technique. Présenter les deux variantes sans imposer la sienne est ce qui crédibilise le plus.');
}

// ═════════ 9. RÉSERVE — LES TROIS SCÉNARIOS ═════════
{
  const s=p.addSlide(); timer(s,'réserve');
  head(s,'Réserve — trois scénarios d\'intégration possibles',
       'Nous proposons le premier. Les deux autres n\'existent que si vous les préférez.');

  const sc=[
    [C.green,C.greenT,'1','Pré-provisionnement','CE QUE NOUS PROPOSONS',
     'Nous déposons contenus et règles à l\'avance. Votre plateforme décide localement. Vous nous remontez les diffusions en différé.',
     ['Latence ajoutée : aucune','Dépendance externe : aucune','Développement chez vous : probablement aucun']],
    [C.muted,C.surf,'2','Consultation en temps réel','SI VOUS LE PRÉFÉREZ',
     'Vous nous interrogez pendant l\'établissement de l\'appel. Les fichiers restent chez vous : seule une référence circule.',
     ['Plus souple','Mais crée une dépendance externe','Nous ne le demandons pas']],
    [C.muted,C.surf,'3','Composant hébergé chez vous','SI VOUS LE PRÉFÉREZ',
     'Nous fournissons un composant déployé dans votre périmètre. Il fonctionne même si le lien vers nous est coupé.',
     ['Temps réel sans dépendance','Mais validation sécurité longue','À envisager plus tard']],
  ];
  sc.forEach((x,i)=>{
    const [c,ct,num,titre,tag,desc,pts]=x;
    const px=0.7+i*4.0;
    card(s,px,1.95,3.7,4.35,ct,i===0?c:null);
    circ(s,px+0.25,2.18,0.44,num,c,C.white,16);
    s.addText(tag,{x:px+0.8,y:2.2,w:2.8,h:0.24,isTextBox:true,margin:0,
      fontFace:FB,fontSize:9,bold:true,color:c,charSpacing:1});
    s.addText(titre,{x:px+0.8,y:2.42,w:2.8,h:0.3,isTextBox:true,margin:0,
      fontFace:FH,fontSize:14,bold:true,color:i===0?c:C.ink});
    s.addText(desc,{x:px+0.25,y:2.85,w:3.2,h:1.1,isTextBox:true,margin:0,
      fontFace:FB,fontSize:10.5,color:C.ink,lineSpacing:14});
    pts.forEach((pt,k)=>{
      const y=4.05+k*0.62;
      s.addShape(p.ShapeType.ellipse,{x:px+0.28,y:y+0.08,w:0.11,h:0.11,fill:{color:c}});
      s.addText(pt,{x:px+0.53,y,w:2.95,h:0.58,isTextBox:true,margin:0,
        fontFace:FB,fontSize:10,color:C.muted,lineSpacing:13});
    });
  });
  s.addText('Dans le scénario 1, la décision de quoi diffuser reste entièrement chez vous. C\'est celui que nous recommandons pour commencer.',
    {x:0.7,y:6.5,w:11.9,h:0.4,isTextBox:true,margin:0,
     fontFace:FB,fontSize:12.5,bold:true,color:C.primary});
  s.addNotes('Le message central : nous proposons le scénario le moins intrusif pour vous, pas le plus élégant pour nous. « Latence ajoutée : aucune » est ce que l\'équipe cœur de réseau veut entendre.');
}

p.writeFile({fileName:'Call_Com_Orange_Premiere_Rencontre_5min.pptx'})
 .then(f=>console.log('écrit :',f));
