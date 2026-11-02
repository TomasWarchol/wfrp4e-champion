/**
 * Legenda Szampierza – treści generatorów (Echo Sławy, przydomki, tytuły).
 * Polski i angielski; inne języki dostają angielski.
 */

const PL = {
  epithets: {
    protector: ["Tarcza Ubogich", "Obrońca Wdów", "Mur z Gościńca"],
    slayer: ["Pogromca Bestii", "Ten, Co Nie Ustępuje", "Rzeźnik Zwierzoludzi"],
    rebel: ["Chłopski Młot", "Kosa na Panów", "Ten, Co Nie Klęka"],
    honorable: ["Prawy", "Słowo i Stal", "Szampierz Sądu Bożego"],
    brute: ["Krwawy", "Rzeźnik", "Łamignat"],
    rogue: ["Lis", "Szuler", "Piach w Oczy"]
  },
  petitions: {
    commons: [
      { petitioner: "Wdowa Hanna z młyna", request: "Poborca hrabiego zabrał jej jedyną krowę „na podatek”, którego nikt nie ogłosił. Prosi, by ktoś się za nią ujął.", stake: 2, reward: "Ciepła strawa i wdzięczność całej wsi" },
      { petitioner: "Sołtys Ulrich Brandt", request: "Coś porywa owce z pastwiska pod lasem. Pasterze boją się wyjść po zmroku.", stake: 2, reward: "Kilka szylingów zebranych po chałupach" },
      { petitioner: "Parobek Jost", request: "Syn karczmarza pobił go do krwi i grozi, że następnym razem zabije. Prosi, by szampierz nauczył go, jak się bronić.", stake: 1, reward: "Dozgonna wdzięczność i ucho przy każdej plotce" },
      { petitioner: "Rodzina Webberów", request: "Ich córka została oskarżona o czary przez sąsiada, który chce ich ziemi. Grozi jej sąd łowcy czarownic.", stake: 3, reward: "Wszystko, co mają, czyli niewiele" }
    ],
    nobility: [
      { petitioner: "Młody Reinhard von Aschenberg", request: "Ojciec wyzwał go na sąd boży o dziedzictwo. Szuka szampierza, który stanie za niego w szranki.", stake: 3, reward: "Sakiewka złotych koron i protekcja rodu" },
      { petitioner: "Frau Liesl Haufen, dama dworu", request: "Ktoś szantażuje ją listami sprzed lat. Potrzebuje kogoś, kto odzyska listy bez rozgłosu.", stake: 2, reward: "Zaproszenie na salony i jedna przysługa" },
      { petitioner: "Kasztelan Odo Kessler", request: "Banda rabusiów nęka jego trakt. Chce widowiskowej kary, żeby inni się bali.", stake: 2, reward: "Żołd i list polecający" },
      { petitioner: "Hrabianka Ilse", request: "Chce, by szampierz towarzyszył jej na balu i odstraszył natrętnego zalotnika.", stake: 1, reward: "Wdzięczność i plotki o szampierzu na salonach" }
    ],
    temples: [
      { petitioner: "Siostra Margarethe od Shallyi", request: "Ktoś napada na wozy z lekami dla przytułku. Bez nich zimy nie przetrwa kilkunastu chorych.", stake: 3, reward: "Błogosławieństwo i opieka przytułku" },
      { petitioner: "Brat Kaspar, kapłan Sigmara", request: "W kapliczce przy gościńcu ktoś zbezcześcił ołtarz. Prosi o odnalezienie sprawców, zanim zrobi to łowca czarownic.", stake: 2, reward: "Dobre słowo w świątyni" },
      { petitioner: "Kapłan Morra Eckhart", request: "Ktoś rozkopuje świeże groby na cmentarzu. Straż śmieje się z jego obaw.", stake: 2, reward: "Spokój zmarłych i przysługa" },
      { petitioner: "Pielgrzymi do Middenheim", request: "Proszą o eskortę przez las, w którym zniknęła poprzednia grupa.", stake: 2, reward: "Datki od pielgrzymów" }
    ],
    underworld: [
      { petitioner: "Szczurza Greta, paserka", request: "Konkurencyjna banda zabiera jej haracz. Chce, żeby ktoś głośny pokazał, pod czyją jest opieką.", stake: 2, reward: "Towar po kosztach i wieści z półświatka" },
      { petitioner: "Ślepy Matthias", request: "Jego chłopak przegrał w kości więcej, niż ma, i trafi do rzeki. Prosi o wstawiennictwo u lichwiarza.", stake: 2, reward: "Dług wdzięczności półświatka" },
      { petitioner: "Lisica, złodziejka", request: "Chce, by szampierz przegrał ustawioną walkę na jarmarku. Mówi, że od tego zależy jej życie.", stake: 3, reward: "Udział w zakładach i milczenie" },
      { petitioner: "Przemytnik Bruno", request: "Ktoś wydał jego ludzi straży. Prosi o pomoc w znalezieniu kapusia.", stake: 1, reward: "Przysługa z nabrzeża" }
    ],
    soldiery: [
      { petitioner: "Weteran Klaus Bergmann", request: "Oficer okradł jego oddział z żołdu i przegrał go w kości. Żołnierze chcą sprawiedliwości, nie buntu.", stake: 2, reward: "Szacunek koszar" },
      { petitioner: "Sierżant Agnes Kohl", request: "Jej rekruci boją się walczyć. Prosi o pokaz, który doda im ducha przed wymarszem.", stake: 1, reward: "Kufel w każdej kantynie" },
      { petitioner: "Dezerter Lukas", request: "Uciekł z rzezi, w której dowódca poświęcił chłopów. Prosi o wstawiennictwo, zanim go powieszą.", stake: 3, reward: "Prawda o rzezi i wdzięczność rodziny" },
      { petitioner: "Kapitan straży miejskiej", request: "W dzielnicy grasuje zabijaka, który wyzywa strażników na pojedynki i wygrywa.", stake: 2, reward: "Przymknięte oko straży" }
    ]
  },
  challengers: [
    { name: "Dieter „Młot” Haas", title: "Mistrz zapasów z jarmarku", notes: "Silny jak wół, wolny jak wół. Walczy dla tłumu." },
    { name: "Lothar von Kriegsau", title: "Szermierz z akademii w Nuln", notes: "Elegancki, pogardliwy, nie przegrał od trzech lat." },
    { name: "Wilhelmina Stroh", title: "Najemniczka z Tilei", notes: "Walczy dwiema klingami. Przyjęła zlecenie na szampierza." },
    { name: "Brat Gottfried", title: "Flagellant z młotem", notes: "Uważa, że sława szampierza to pycha, którą trzeba ukarać." },
    { name: "Rudy Karl", title: "Syn kowala z sąsiedniej wsi", notes: "Młody, głodny sławy, nie zna jeszcze strachu." },
    { name: "Edda Schwarz", title: "Szampierka cechu rzeźników", notes: "Twarda, wierna cechowi. Walczy brudno, gdy przegrywa." },
    { name: "Sir Aldric z Bretonii", title: "Błędny rycerz", notes: "Szuka godnego przeciwnika, by wypełnić ślub." },
    { name: "Gustav „Żmija” Ritter", title: "Zabijaka z półświatka", notes: "Ostrze bywa zatrute. Nikt tego nie udowodnił." }
  ],
  darkRumors: [
    { title: "Sprzedał walkę", text: "W karczmach mówią, że ostatnie zwycięstwo kupiono, a przeciwnik położył się za trzy korony.", face: "rogue" },
    { title: "Zabił bezbronnego", text: "Ktoś opowiada, że szampierz dobił leżącego, który błagał o litość.", face: "brute" },
    { title: "Sługa hrabiego", text: "Mówią, że szampierz bierze złoto od panów i bije chłopów, kiedy nikt nie patrzy.", face: "rogue" },
    { title: "Znak na skórze", text: "Szepcze się o dziwnym znamieniu, które szampierz ukrywa pod koszulą.", face: "brute" },
    { title: "Uciekł z pola bitwy", text: "Weteran przysięga, że widział szampierza uciekającego przed zielonoskórymi.", face: "rogue" },
    { title: "Pił krew pokonanych", text: "Najbardziej nieprawdopodobna plotka jest zawsze tą, którą ludzie lubią powtarzać najbardziej.", face: "brute" }
  ],
  impostors: [
    "Ktoś w sąsiednim mieście przedstawia się imieniem szampierza i zbiera pieniądze „na sprawiedliwość”.",
    "Samozwaniec w podobnym płaszczu wyzywa ludzi na pojedynki i bije słabszych w imieniu szampierza.",
    "Banda rabusiów zostawia na miejscu napadów znak, który ludzie kojarzą z szampierzem.",
    "Młody naśladowca nosi znak szampierza i wpakował się w kłopoty, z których sam nie wyjdzie."
  ],
  offers: [
    { from: "Kupiec z gildii z Altdorfu", offer: "Hojny mecenat, jeśli szampierz będzie walczył w barwach gildii i nosił jej herb.", price: "Gildia oczekuje posłuszeństwa, również wtedy, gdy rozkaz jest podły." },
    { from: "Nieznany dobroczyńca", offer: "Sakiewka złota za przegraną w najbliższym pojedynku.", price: "Jeśli wyjdzie na jaw, legenda zgnije." },
    { from: "Hrabina z Middenheim", offer: "Miejsce przy jej stole i tytuł obrońcy domu.", price: "Jej wrogowie staną się wrogami szampierza." },
    { from: "Wędrowny mistrz fechtunku", offer: "Nauka sekretnej techniki, która zmienia losy pojedynków.", price: "Chce, by uczeń zabił dla niego jednego człowieka." },
    { from: "Kapłan Ulryka", offer: "Błogosławieństwo i poparcie świątyni w Middenheim.", price: "Szampierz ma publicznie upokorzyć sygmarytę." }
  ],
  notices: [
    "Zakapturzony człowiek z fioletowym pierścieniem wypytuje w karczmie, gdzie szampierz nocuje.",
    "Łowca czarownic zapisał imię szampierza w swojej księdze. Na razie tylko zapisał.",
    "Szpieg z dworu szkicuje twarz szampierza podczas pojedynku.",
    "Ktoś przekupił stajennego, żeby donosił, dokąd szampierz wyrusza.",
    "Ulotki z podobizną szampierza pojawiły się w mieście. Nikt nie wie, kto je drukuje.",
    "Ranny posłaniec przynosi list bez podpisu: „Wiemy, skąd pochodzisz”."
  ],
  rivalMoves: {
    thugs: [
      "{rival} wynajął zbirów. Czekają w ciemnej uliczce, którą szampierz zwykle wraca na kwaterę.",
      "Trzech osiłków w barwach cechu zaczepia szampierza w karczmie. Ktoś im zapłacił. Wiadomo kto: {rival}.",
      "Na gościńcu stoi zasadzka. Przywódca bandy chwali się, że {rival} płaci za każdy palec szampierza."
    ],
    insult: [
      "{rival} publicznie nazywa szampierza tchórzem, który chowa się za chłopskimi spódnicami. Ludzie czekają na odpowiedź.",
      "Na rynku wisi karykatura szampierza z podpisem. Wszyscy wiedzą, kto ją zamówił: {rival}.",
      "{rival} wznosi w karczmie toast „za szampierza, który bije tylko słabszych”. Śmiech niesie się po ulicy."
    ],
    bribe: [
      "{rival} przekupił sędziego najbliższych szranków. W następnym pojedynku z nim ma dodatkowy Atut."
    ]
  },
  ballads: [
    "Wędrowny grajek ułożył o tym pieśń i śpiewa ją w każdej karczmie.",
    "Dzieci bawią się na ulicy w tę historię.",
    "Pijany bard dorzucił do opowieści smoka. Nikt go nie poprawia."
  ]
};

const EN = {
  epithets: {
    protector: ["Shield of the Poor", "Widows' Warden", "The Wall on the Road"],
    slayer: ["Beastbane", "The One Who Does Not Yield", "Butcher of Beastmen"],
    rebel: ["The Peasant's Hammer", "Scythe for the Lords", "The One Who Does Not Kneel"],
    honorable: ["The Just", "Word and Steel", "Champion of the Trial"],
    brute: ["The Bloody", "The Butcher", "Bonebreaker"],
    rogue: ["The Fox", "The Cardsharp", "Sand-in-the-Eyes"]
  },
  petitions: {
    commons: [
      { petitioner: "Widow Hanna from the mill", request: "The count's collector took her only cow for a tax nobody announced. She asks for someone to stand up for her.", stake: 2, reward: "Warm meals and the whole village's thanks" },
      { petitioner: "Reeve Ulrich Brandt", request: "Something is taking sheep from the pasture by the forest. The shepherds won't go out after dark.", stake: 2, reward: "A few shillings collected from the cottages" },
      { petitioner: "Farmhand Jost", request: "The innkeeper's son beat him bloody and swears he'll kill him next time. He asks the champion to teach him to defend himself.", stake: 1, reward: "Lifelong gratitude and an ear for every rumour" },
      { petitioner: "The Webber family", request: "A neighbour who wants their land accused their daughter of witchcraft. A witch hunter's court awaits her.", stake: 3, reward: "Everything they have, which is little" }
    ],
    nobility: [
      { petitioner: "Young Reinhard von Aschenberg", request: "His father has called a trial by combat over the inheritance. He seeks a champion to fight in his place.", stake: 3, reward: "A purse of gold crowns and the house's protection" },
      { petitioner: "Frau Liesl Haufen, lady of the court", request: "Someone is blackmailing her with old letters. She needs them recovered quietly.", stake: 2, reward: "An invitation to the salons and one favour" },
      { petitioner: "Castellan Odo Kessler", request: "Bandits harass his road. He wants a spectacular punishment so others fear.", stake: 2, reward: "Pay and a letter of recommendation" },
      { petitioner: "Countess Ilse", request: "She wants the champion to escort her to a ball and scare off a persistent suitor.", stake: 1, reward: "Gratitude and talk of the champion in the salons" }
    ],
    temples: [
      { petitioner: "Sister Margarethe of Shallya", request: "Someone raids the wagons with medicine for the hospice. Without them a dozen sick won't survive the winter.", stake: 3, reward: "A blessing and the hospice's care" },
      { petitioner: "Brother Kaspar, priest of Sigmar", request: "Someone desecrated the roadside shrine. He asks for the culprits to be found before a witch hunter does it.", stake: 2, reward: "A good word in the temple" },
      { petitioner: "Eckhart, priest of Morr", request: "Someone digs up fresh graves in the cemetery. The watch laughs at his fears.", stake: 2, reward: "Peace for the dead and a favour" },
      { petitioner: "Pilgrims bound for Middenheim", request: "They ask for an escort through the forest where the last group vanished.", stake: 2, reward: "The pilgrims' donations" }
    ],
    underworld: [
      { petitioner: "Rat Greta, a fence", request: "A rival gang takes her protection money. She wants someone famous to show whose protection she's under.", stake: 2, reward: "Goods at cost and underworld news" },
      { petitioner: "Blind Matthias", request: "His boy lost more at dice than he owns and will end up in the river. He begs the champion to speak to the moneylender.", stake: 2, reward: "The underworld owes a debt" },
      { petitioner: "The Vixen, a thief", request: "She wants the champion to lose a rigged fight at the fair. She says her life depends on it.", stake: 3, reward: "A share of the bets and silence" },
      { petitioner: "Bruno the smuggler", request: "Someone sold his men to the watch. He wants help finding the informer.", stake: 1, reward: "A favour from the docks" }
    ],
    soldiery: [
      { petitioner: "Veteran Klaus Bergmann", request: "An officer stole his unit's pay and lost it at dice. The soldiers want justice, not mutiny.", stake: 2, reward: "The barracks' respect" },
      { petitioner: "Sergeant Agnes Kohl", request: "Her recruits are afraid to fight. She asks for a display that lifts their spirits before they march.", stake: 1, reward: "A tankard in every canteen" },
      { petitioner: "Lukas the deserter", request: "He fled a slaughter where the commander sacrificed peasants. He begs for someone to speak for him before he hangs.", stake: 3, reward: "The truth about the slaughter and his family's thanks" },
      { petitioner: "Captain of the city watch", request: "A bravo roams the district, challenging watchmen to duels and winning.", stake: 2, reward: "The watch looks the other way" }
    ]
  },
  challengers: [
    { name: "Dieter \"Hammer\" Haas", title: "Fairground wrestling champion", notes: "Strong as an ox, slow as an ox. Fights for the crowd." },
    { name: "Lothar von Kriegsau", title: "Fencer from the Nuln academy", notes: "Elegant, scornful, unbeaten for three years." },
    { name: "Wilhelmina Stroh", title: "Tilean mercenary", notes: "Fights with two blades. She has taken a contract on the champion." },
    { name: "Brother Gottfried", title: "Flagellant with a hammer", notes: "Believes the champion's fame is pride that must be punished." },
    { name: "Red Karl", title: "Smith's son from the next village", notes: "Young, hungry for fame, not yet afraid." },
    { name: "Edda Schwarz", title: "Champion of the butchers' guild", notes: "Hard, loyal to the guild. Fights dirty when losing." },
    { name: "Sir Aldric of Bretonnia", title: "Knight errant", notes: "Seeks a worthy opponent to fulfil a vow." },
    { name: "Gustav \"Viper\" Ritter", title: "Underworld bravo", notes: "His blade is sometimes poisoned. Nobody has proved it." }
  ],
  darkRumors: [
    { title: "He sold the fight", text: "Taverns say the last victory was bought and the opponent lay down for three crowns.", face: "rogue" },
    { title: "He killed a helpless man", text: "Someone tells how the champion finished off a fallen man who begged for mercy.", face: "brute" },
    { title: "The count's lackey", text: "They say the champion takes gold from the lords and beats peasants when nobody is looking.", face: "rogue" },
    { title: "A mark on the skin", text: "There are whispers of a strange birthmark the champion hides under his shirt.", face: "brute" },
    { title: "He fled the battlefield", text: "A veteran swears he saw the champion running from greenskins.", face: "rogue" },
    { title: "He drank the blood of the fallen", text: "The least likely rumour is always the one people love to repeat.", face: "brute" }
  ],
  impostors: [
    "Someone in the next town uses the champion's name and collects money \"for justice\".",
    "An impostor in a similar cloak challenges people to duels and beats weaker folk in the champion's name.",
    "A band of robbers leaves a sign at their crimes that people link to the champion.",
    "A young imitator wears the champion's sign and has landed in trouble he can't get out of alone."
  ],
  offers: [
    { from: "A merchant of an Altdorf guild", offer: "Generous patronage if the champion fights in the guild's colours and wears its crest.", price: "The guild expects obedience, even when the order is vile." },
    { from: "An unknown benefactor", offer: "A purse of gold for losing the next duel.", price: "If it comes out, the legend rots." },
    { from: "A countess of Middenheim", offer: "A place at her table and the title of the house's defender.", price: "Her enemies become the champion's enemies." },
    { from: "A wandering fencing master", offer: "A secret technique that turns duels.", price: "He wants the pupil to kill one man for him." },
    { from: "A priest of Ulric", offer: "The blessing and backing of the temple in Middenheim.", price: "The champion must publicly humiliate a Sigmarite." }
  ],
  notices: [
    "A hooded man with a purple ring asks at the inn where the champion sleeps.",
    "A witch hunter has written the champion's name in his book. For now he has only written it.",
    "A court spy sketches the champion's face during a duel.",
    "Someone bribed a stable boy to report where the champion rides.",
    "Broadsheets with the champion's likeness have appeared in town. Nobody knows who prints them.",
    "A wounded messenger brings an unsigned letter: \"We know where you come from.\""
  ],
  rivalMoves: {
    thugs: [
      "{rival} has hired thugs. They wait in the dark alley the champion usually takes back to his lodgings.",
      "Three bruisers in guild colours pick a fight with the champion at the inn. Someone paid them. Everyone knows who: {rival}.",
      "An ambush waits on the road. The gang leader boasts that {rival} pays for every finger of the champion's."
    ],
    insult: [
      "{rival} publicly calls the champion a coward hiding behind peasant skirts. People wait for an answer.",
      "A caricature of the champion hangs in the market with a caption. Everyone knows who ordered it: {rival}.",
      "{rival} raises a toast in the tavern \"to the champion who only beats the weak\". The laughter carries down the street."
    ],
    bribe: [
      "{rival} has bribed the judge of the next lists. In the next duel with him he has an extra edge."
    ]
  },
  ballads: [
    "A wandering minstrel made a song of it and sings it in every tavern.",
    "Children play the story in the street.",
    "A drunken bard added a dragon to the tale. Nobody corrects him."
  ]
};

/** Treści w języku świata (pl albo en). */
export function content(lang) {
  return lang === "pl" ? PL : EN;
}

export function pick(list, rng = Math.random) {
  if (!list?.length) return null;
  return list[Math.floor(rng() * list.length)];
}
