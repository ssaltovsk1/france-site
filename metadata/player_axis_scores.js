window.REVOLUTION_PLAYER_AXIS_SCORES = {
  axes: {
    power: {
      title: "Власть",
      left: "Корона / старый порядок",
      center: "Конституция / компромисс",
      right: "Нация / республика",
      scale: {
        "-2": "абсолютная корона",
        "-1": "ограниченная монархия",
        "0": "компромисс или прагматика",
        "1": "нация выше короны",
        "2": "республика / народная власть"
      }
    },
    bread: {
      title: "Хлеб и цены",
      top: "Свободный рынок",
      center: "смешанная позиция",
      bottom: "Контроль цен / право на хлеб",
      scale: {
        "-2": "свободный рынок",
        "-1": "рынок с надзором",
        "0": "прагматика или тема не главная",
        "1": "регулирование и снабжение",
        "2": "жёсткий контроль / право на хлеб"
      }
    }
  },
  source: "Оценки вручную сняты с блока `Для мастера: убеждения по осям` в загрузах. Шкала: -2..+2.",
  scores: {
    actrice: { power: 1, bread: 2, powerLabel: "конституция и свобода печати", breadLabel: "контроль цен" },
    avocat: { power: 0, bread: 1, powerLabel: "король ограничен законом и нацией", breadLabel: "надзор за снабжением" },
    boulanger: { power: 0, bread: 1, powerLabel: "власть как справедливая такса", breadLabel: "разумная такса" },
    cafetier: { power: 0, bread: 1, powerLabel: "открытое собрание вместо закрытых решений", breadLabel: "вмешательство при кризисе" },
    chirurgien: { power: 1, bread: 2, powerLabel: "власть должна решать", breadLabel: "дешёвый хлеб важнее всего" },
    cure: { power: -1, bread: 2, powerLabel: "монархия с голосом низшего духовенства", breadLabel: "обязанность кормить бедных" },
    imprimeur: { power: 1, bread: 0, powerLabel: "закон против цензуры", breadLabel: "разумные цены без простых запретов" },
    invalide: { power: -1, bread: 1, powerLabel: "верность короне, но уважение за заслугу", breadLabel: "государство кормит служивших" },
    journalier: { power: 1, bread: 2, powerLabel: "если король не кормит, зачем он нужен", breadLabel: "хлеб по карману работнику" },
    lavandiere: { power: 0, bread: 2, powerLabel: "кто защищает бедных, тот и власть", breadLabel: "цены ради выживания" },
    menuisier: { power: 1, bread: 1, powerLabel: "голос ремесленников и конституция", breadLabel: "хлеб не комод" },
    mercier: { power: -1, bread: 1, powerLabel: "король с Генеральными штатами", breadLabel: "разумный контроль хлеба" },
    poissarde: { power: -1, bread: 2, powerLabel: "король должен слушать рынок", breadLabel: "вмешательство ради еды" },
    servante: { power: 0, bread: 1, powerLabel: "власть как хозяева и защита", breadLabel: "цена хлеба как риск падения" },
    vinier: { power: -1, bread: -1, powerLabel: "налоговый порядок через закон и договор", breadLabel: "снижение произвола без обвала сборов" },

    bailly: { power: -1, bread: 1, powerLabel: "конституционная монархия и процедура", breadLabel: "умеренное вмешательство" },
    barnave: { power: -1, bread: 1, powerLabel: "конституционная монархия", breadLabel: "умеренное регулирование" },
    lafayette: { power: -1, bread: -2, powerLabel: "король ограничен конституцией", breadLabel: "свободная торговля" },
    louis_xvi: { power: -2, bread: 1, powerLabel: "корона как обязанность перед Богом", breadLabel: "государство предотвращает голод" },
    marat: { power: 2, bread: 2, powerLabel: "монархия как угнетение", breadLabel: "государство кормит народ" },
    mirabeau: { power: -1, bread: -2, powerLabel: "английская конституционная монархия", breadLabel: "физиократическая свобода торговли" },
    necker: { power: -1, bread: 1, powerLabel: "король через министров и собрание", breadLabel: "резервы против голода" },
    robespierre: { power: 1, bread: 2, powerLabel: "нация как источник власти", breadLabel: "право на жизнь выше рынка" },
    sieyes: { power: 1, bread: -2, powerLabel: "нация как единственный источник власти", breadLabel: "свободный рынок" },

    brissot: { power: 2, bread: -1, powerLabel: "республика как рабочая форма", breadLabel: "свободный рынок с реакцией на голод" },
    charlotte_corday: { power: 2, bread: 0, powerLabel: "народ, закон и добродетель", breadLabel: "справедливость важнее экономической доктрины" },
    danton: { power: 0, bread: 1, powerLabel: "конституция против произвола", breadLabel: "вмешательство, если рынок не справляется" },
    dumouriez: { power: 0, bread: -1, powerLabel: "работающая система важнее формы", breadLabel: "рыночная логика, реквизиции в крайнем случае" },
    hebert: { power: 2, bread: 2, powerLabel: "республика против давящей системы", breadLabel: "твёрдые цены" },
    manon_roland: { power: 2, bread: 1, powerLabel: "республика как достойная форма", breadLabel: "свободный рынок с защитой от голода" },
    roland: { power: 1, bread: 0, powerLabel: "порядок должен служить делу, а не двору", breadLabel: "рынок как принцип, надзор при сбоях" },
    saint_just: { power: 2, bread: 2, powerLabel: "республика и добродетель", breadLabel: "свобода торговли не должна морить голодом" },
    vergniaud: { power: 0, bread: -1, powerLabel: "закон выше короны, конституция нужна", breadLabel: "свободная торговля с поправкой на голод" },

    barere: { power: -1, bread: 0, powerLabel: "монархист-реформатор", breadLabel: "готовность обосновать вмешательство" },
    barras: { power: 0, bread: 0, powerLabel: "быть при любой власти", breadLabel: "сытая толпа управляемее" },
    carnot: { power: 0, bread: 0, powerLabel: "разумная система заслуг", breadLabel: "расчёт снабжения без доктрины" },
    carrier: { power: 1, bread: 2, powerLabel: "менять порядок, если король не может", breadLabel: "контроль ради бедняков" },
    couthon: { power: -1, bread: 1, powerLabel: "король по равному закону", breadLabel: "защита тех, у кого нет запаса" },
    desmoulins: { power: 1, bread: 0, powerLabel: "республика в голове, нация выше трона", breadLabel: "сочувствие без экономической программы" },
    fouche: { power: 0, bread: 1, powerLabel: "прагматичная изменяемая власть", breadLabel: "цены как часть порядка" },
    fouquier_tinville: { power: 0, bread: 0, powerLabel: "реформа или новая система по заслугам", breadLabel: "личная нужда, не доктрина" },

    babeuf: { power: 2, bread: 2, powerLabel: "республика плюс власть бедных", breadLabel: "распределение по потребности" },
    buonarroti: { power: 2, bread: 2, powerLabel: "республика как инструмент равенства", breadLabel: "общинное распределение" },
    jourdan: { power: 1, bread: 0, powerLabel: "народ может управлять собой", breadLabel: "голод как опасность для порядка" },
    larevelliere: { power: 1, bread: -2, powerLabel: "закон выше короля", breadLabel: "либеральный естественный порядок" },
    moreau: { power: 1, bread: 0, powerLabel: "власть способным, не рождённым", breadLabel: "цены как факт обстановки" },
    napoleon: { power: 0, bread: 0, powerLabel: "порядок и сильная рука важнее формы", breadLabel: "сытая армия и народ без бунта" },
    pichegru: { power: -1, bread: 0, powerLabel: "присяга королю, но интерес к новым правилам", breadLabel: "накормлена ли рота" },
    talleyrand: { power: -1, bread: -2, powerLabel: "конституционная монархия как порядок", breadLabel: "свободный рынок и собственность" },
    tallien: { power: 1, bread: 1, powerLabel: "власть людям, знающим простой народ", breadLabel: "вмешательство при голоде" },

    artois: { power: -2, bread: -2, powerLabel: "абсолютный монарх", breadLabel: "цены как дело торговцев" },
    bouille: { power: -2, bread: 1, powerLabel: "король как верховный командующий", breadLabel: "снабжение важнее доктрин" },
    breteuil: { power: -2, bread: 0, powerLabel: "порядок сверху вниз", breadLabel: "казна важнее рыночных свобод" },
    cazales: { power: -1, bread: -1, powerLabel: "ограниченная монархия и парламенты", breadLabel: "порядок в финансах, не раздачи" },
    fersen: { power: -1, bread: 0, powerLabel: "король как порядок, но республика возможна", breadLabel: "снабжение солдат без доктрины" },
    lamballe: { power: -2, bread: 0, powerLabel: "король как естественный центр", breadLabel: "голод реален, решения нет" },
    marie_antoinette: { power: -2, bread: 1, powerLabel: "монархия не обсуждается", breadLabel: "государство должно что-то делать" },
    maury: { power: -2, bread: -1, powerLabel: "король как помазанник Божий", breadLabel: "благотворительность вместо контроля" },
    polignac: { power: -2, bread: 0, powerLabel: "мир двора держится на короле", breadLabel: "хлеб не её повседневная забота" },
    provence: { power: -1, bread: 1, powerLabel: "король с советом знати и парламентов", breadLabel: "контроль цен как временное успокоение" }
  }
};
