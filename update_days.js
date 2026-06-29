const fs = require('fs');
let html = fs.readFileSync('gas_project/index.html', 'utf8');

// The new DAYS array
const newDaysStr = `
    var DAYS=[
      {t:'יום 1 - הגעה והתארגנות',s:'נחיתה, הגעה ל-Comfort Hotel Prague City East, סיבוב קל.',st:['נחיתה בפראג','Comfort Hotel Prague City East','ארוחת ערב רגועה']},
      {t:'יום 2 - העיר העתיקה',s:'כיכר העיר, השעון האסטרונומי וגשר קארל.',st:['נסיעה במטרו למרכז','Old Town Square','Astronomical Clock','Charles Bridge']},
      {t:'יום 3 - טירה ותצפיות',s:'טירת פראג, סמטת הזהב ותצפית שקיעה.',st:['חשמלית לטירת פראג','Prague Castle','Golden Lane','תצפית שקיעה']},
      {t:'יום 4 - ילדים וחוויות',s:'ממלכת הרכבות, צעצועים וקינוח טרדלניק.',st:['Kingdom of Railways','Hamleys','קינוח טרדלניק במרכז']},
      {t:'יום 5 - מים / גשם',s:'פארק המים אקוופאלאס לפעילות מקורה ומהנה.',st:['נסיעה ל-Aquapalace','Aquapalace Prague','ארוחת ערב בקניון']},
      {t:'יום 6 - גן חיות / פארק',s:'יום פתוח ונוח למשפחה בגן החיות ובפארק.',st:['נסיעה לגן החיות','Prague Zoo','פארק Stromovka']},
      {t:'יום 7 - יום קניות',s:'Primark, Palladium, Hamleys ו-LEGO — הכל במרכז.',st:['Primark Wenceslas Square','הליכה דרך כיכר ואצלב','Palladium','ארוחת סיום']},
      {t:'יום 8 - חזרה',s:'אריזה, צ׳ק-אאוט ונסיעה לשדה.',st:['צ׳ק-אאוט מהמלון','נסיעה לשדה התעופה']}
    ];
`;

// Replace old DAYS array. We'll use a regex to replace it robustly.
html = html.replace(/var DAYS=\[[\s\S]*?\];/, newDaysStr.trim());

const newPoisDataStr = `
    var POIS_DATA = {
      // יום 1
      'נחיתה בפראג': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Leti%C5%A1t%C4%9B_V%C3%A1clava_Havla_Praha_-_Termin%C3%A1l_1_%282019%29.jpg/800px-Leti%C5%A1t%C4%9B_V%C3%A1clava_Havla_Praha_-_Termin%C3%A1l_1_%282019%29.jpg', desc: 'ברוכים הבאים לנמל התעופה ואצלב האוול!', tip: 'מומלץ למשוך קצת מזומן בכספומט רגיל (לא של Euronet) להוצאות קטנות ראשוניות.' },
      'Comfort Hotel Prague City East': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Praha_Stra%C5%A1nice_Solidarita.jpg/800px-Praha_Stra%C5%A1nice_Solidarita.jpg', desc: 'מלון משפחתי נעים במזרח העיר. קרוב לתחנת המטרו Strašnická (קו ירוק A) שיקח אתכם תוך דקות למרכז.', tip: 'בדקו איפה הסופרמרקט הקרוב למלון (יש Albert או Billa) כדי לקנות מים ונשנושים לילדים.' },
      'ארוחת ערב רגועה': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Czech_cuisine_-_Smazak.jpg/800px-Czech_cuisine_-_Smazak.jpg', desc: 'התאקלמות רגועה. אפשר למצוא מסעדה צ\\'כית אותנטית באזור המלון או במרכז העיר המואר.', tip: 'נסו את ה-Smažený sýr (גבינה מטוגנת צ\\'כית) - הילדים יעופו על זה!' },
      
      // יום 2
      'נסיעה במטרו למרכז': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Prague_Metro_A_train_at_Depo_Hostiva%C5%99.jpg/800px-Prague_Metro_A_train_at_Depo_Hostiva%C5%99.jpg', desc: 'הליכה קצרה לתחנת Strašnická (קו A הירוק) ומשם ישר לתחנת Staroměstská או Můstek.', tip: 'קנו כרטיסים יומיים/ל-3 ימים כדי לא להתעסק עם קניית כרטיסים בכל פעם. ילדים צעירים נוסעים בחינם או בהנחה (לבדוק גילאים).' },
      'Old Town Square': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Prague_Old_Town_Square.jpg/800px-Prague_Old_Town_Square.jpg', desc: 'כיכר העיר העתיקה היא הלב הפועם של פראג. סביבה מבנים צבעוניים מהממים, כרכרות סוסים והמון מסעדות.', tip: 'מקום מושלם להצטלם עם בועות הסבון הענקיות שיש בדרך כלל בכיכר!' },
      'Astronomical Clock': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Prague_Astronomical_Clock_%2848386348421%29.jpg/800px-Prague_Astronomical_Clock_%2848386348421%29.jpg', desc: 'השעון האסטרונומי המפורסם והעתיק ביותר שעדיין פועל בעולם (משנת 1410).', tip: 'הגיעו כ-10 דקות לפני שעה עגולה כדי לתפוס מקום טוב למופע הבובות הקצר של השעון.' },
      'Charles Bridge': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Charles_Bridge_in_Prague_at_sunset.jpg/800px-Charles_Bridge_in_Prague_at_sunset.jpg', desc: 'גשר אבן עתיק ויפהפה מעל נהר הוולטאבה, מעוטר ב-30 פסלים מרהיבים של קדושים.', tip: 'חפשו את הפסל של יאן נפומוק - מגע בלוחית הנחושת המבריקה שבתחתית נחשב לסגולה למזל טוב!' },

      // יום 3
      'חשמלית לטירת פראג': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Prague_tram_15T_in_Karmelitsk%C3%A1_street.jpg/800px-Prague_tram_15T_in_Karmelitsk%C3%A1_street.jpg', desc: 'הטריק להגעת משפחות: יורדים בתחנת המטרו Malostranská ולוקחים את חשמלית 22 או 23 למעלה עד Pražský hrad. חוסך את העלייה הקשה!', tip: 'החשמלית הזו נחשבת לאחת היפות בפראג כי היא עוברת דרך סמטאות ציוריות.' },
      'Prague Castle': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Prague_Castle_from_Charles_Bridge.jpg/800px-Prague_Castle_from_Charles_Bridge.jpg', desc: 'מתחם הטירה הגדול בעולם! כולל את קתדרלת ויטוס הקדוש המרשימה, ארמונות וגנים.', tip: 'יש טקס חילופי משמרות מרשים בשעה 12:00 בדיוק בחצר הראשונה, כולל תזמורת!' },
      'Golden Lane': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Golden_Lane.jpg/800px-Golden_Lane.jpg', desc: 'סמטת הזהב הקסומה בתוך מתחם הטירה, עם בתים צבעוניים וקטנטנים שבעבר גרו בהם שומרים וצורפים.', tip: 'תנו לילדים לחפש את השריונות הישנים ואת הנשקייה העתיקה שבקומה העליונה של הבתים.' },
      'תצפית שקיעה': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Prague_at_sunset_%283088924151%29.jpg/800px-Prague_at_sunset_%283088924151%29.jpg', desc: 'נוף פנורמי מרהיב של כל פראג של מטה, עם גגות הרעפים האדומים, מתוך גני הטירה.', tip: 'רדו בחזרה לעיר ברגל דרך המדרגות הישנות (Staré zámecké schody) - זה קל והנוף מטריף.' },

      // יום 4
      'Kingdom of Railways': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Kr%C3%A1lovstv%C3%AD_%C5%BEeleznic_%281%29.jpg/800px-Kr%C3%A1lovstv%C3%AD_%C5%BEeleznic_%281%29.jpg', desc: 'ממלכת הרכבות המיניאטוריות הגדולה בצ\\'כיה. עולם שלם בקטן, כולל יום ולילה שמתחלפים.', tip: 'מעולה לילדים ומבוגרים כאחד! יש גם סימולטורים של רכבות ואוטובוסים שאפשר "לנהוג" בהם.' },
      'Hamleys': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Hamleys_Prague_2.jpg/800px-Hamleys_Prague_2.jpg', desc: 'חנות הצעצועים העצומה במרכז העיר, שכוללת הרבה מעבר לקניות - זו ממש חוויה אטרקטיבית.', tip: 'אל תפספסו את מגלשת הענק המפותלת בתוך החנות (חינם) ואת קרוסלת הסוסים בקומה התחתונה!' },
      'קינוח טרדלניק במרכז': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Trdeln%C3%ADk_on_a_spit.jpg/800px-Trdeln%C3%ADk_on_a_spit.jpg', desc: 'הקינוח הלאומי-תיירותי המפורסם (קיורטוש)! מאפה שמרים חרוט, מסובב על גחלים ומצופה סוכר וקינמון.', tip: 'הגרסה המושחתת והאהובה על ילדים מגיעה במילוי גלידה, קצפת ונוטלה.' },

      // יום 5
      'נסיעה ל-Aquapalace': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Opatov_metro_station_in_Prague_%281%29.jpg/800px-Opatov_metro_station_in_Prague_%281%29.jpg', desc: 'המטרו (קו C האדום) עד תחנת Opatov, ומשם אוטובוס ייעודי של הפארק (חינם/זול) ישירות לפארק המים.', tip: 'הנסיעה לוקחת קצת זמן כי הפארק נמצא בפאתי העיר. קחו את זה באיזי והכינו חטיפים לילדים לדרך.' },
      'Aquapalace Prague': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Aquapalace_Praha_-_tobog%C3%A1ny.jpg/800px-Aquapalace_Praha_-_tobog%C3%A1ny.jpg', desc: 'פארק המים המקורה הגדול ביותר במרכז אירופה, עם עולם מים מרתק, מגלשות אקסטרים ובריכות גלים.', tip: 'תביאו איתכם מגבות מהמלון כדי לחסוך עמלות. יש גם מתחם פיראטים מדהים לקטנטנים.' },
      'ארוחת ערב בקניון': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Chodov_shopping_center_interior.jpg/800px-Chodov_shopping_center_interior.jpg', desc: 'אפשר לחזור דרך קניון Westfield Chodov (תחנת Chodov) ולאכול במתחם המזון העצום שלו לפני שחוזרים למלון.', tip: 'בקניון הזה יש מסעדות רבות מכל הסוגים - המבורגרים, פיצות, סושי ועוד.' },

      // יום 6
      'נסיעה לגן החיות': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/N%C3%A1dra%C5%BE%C3%AD_Hole%C5%A1ovice_%28n%C3%A1stupi%C5%A1t%C4%9B_metro_C%29.jpg/800px-N%C3%A1dra%C5%BE%C3%AD_Hole%C5%A1ovice_%28n%C3%A1stupi%C5%A1t%C4%9B_metro_C%29.jpg', desc: 'הדרך הסטנדרטית: מטרו C לתחנת Nádraží Holešovice ומשם אוטובוס 112 שמגיע ישר לשער גן החיות.', tip: 'לאטרקציה יוצאת דופן: אפשר להגיע לגן החיות בשייט על נהר הוולטאבה ממרכז העיר!' },
      'Prague Zoo': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Zoo_Praha_-_hlavn%C3%AD_vchod.jpg/800px-Zoo_Praha_-_hlavn%C3%AD_vchod.jpg', desc: 'נחשב לאחד מגני החיות הטובים והיפים בעולם, ממוקם על צלע הר ומשתרע על שטח ענק.', tip: 'הגן מחולק למפלס תחתון ועליון. מומלץ לעלות ברכבל הכיסאות הקטן לחלק העליון ולרדת ברגל כדי לחסוך עליות קשות.' },
      'פארק Stromovka': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Stromovka_%28Prague%29.jpg/800px-Stromovka_%28Prague%29.jpg', desc: 'הסנטרל פארק של פראג! פארק ירוק, ענק ושקט עם עצים עתיקים ואגמים קטנים (נמצא ליד גן החיות).', tip: 'אחרי ההליכה הרצינית בגן החיות, אפשר לעשות כאן מנוחה על הדשא או לאפשר לילדים לפרוק מרץ באופן חופשי.' },

      // יום 7
      'Primark Wenceslas Square': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Wenceslas_Square_-_Primark_Prague.jpg/800px-Wenceslas_Square_-_Primark_Prague.jpg', desc: 'חנות האופנה הענקית והפופולרית בכיכר ואצלב. 3 קומות של ביגוד במחירים נוחים.', tip: 'הגיעו כמה שיותר קרוב לשעת הפתיחה (09:00 בבוקר), אחרת תתקלו בתורים עצומים למדידות ולקופות.' },
      'הליכה דרך כיכר ואצלב': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Wenceslas_Square_from_NM.jpg/800px-Wenceslas_Square_from_NM.jpg', desc: 'השדרה המרכזית וההומה של פראג. המון חנויות, בתי קפה ואווירה עירונית שוקקת.', tip: 'יש כאן המון חנויות נעליים וספורט. שימו לב לחזיתות הבניינים המעוטרות מעל החנויות המודרניות.' },
      'Palladium': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Palladium_Prague.jpg/800px-Palladium_Prague.jpg', desc: 'קניון ענק ויפהפה במרכז העיר, בנוי בתוך מבנה היסטורי מרשים (לשעבר קסרקטין צבאי).', tip: 'בקומת האוכל למעלה (Food Court) יש מבחר עצום של אפשרויות לכולם במקום אחד, במחירים הוגנים.' },
      'ארוחת סיום': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Restaurant_v_Praze.jpg/800px-Restaurant_v_Praze.jpg', desc: 'סיכום הטיול במסעדה טובה בעיר העתיקה או באזור הקניות.', tip: 'הרימו כוס בירה צ\\'כית (או קופולה לילדים) לכבוד סיום מוצלח של הטיול המשפחתי!' },

      // יום 8
      'צ׳ק-אאוט מהמלון': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Praha_Stra%C5%A1nice_Solidarita.jpg/800px-Praha_Stra%C5%A1nice_Solidarita.jpg', desc: 'אריזות אחרונות, בדיקת חדרים והחזרת מפתחות בדלפק של Comfort Hotel.', tip: 'אם הטיסה מאוחרת, אפשר להשאיר את המזוודות בשמירת חפצים במלון ולחזור להשלמות קטנות בעיר.' },
      'נסיעה לשדה התעופה': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Leti%C5%A1t%C4%9B_V%C3%A1clava_Havla_Praha_-_leti%C5%A1tn%C3%AD_v%C4%9B%C5%BE_%282019%29.jpg/800px-Leti%C5%A1t%C4%9B_V%C3%A1clava_Havla_Praha_-_leti%C5%A1tn%C3%AD_v%C4%9B%C5%BE_%282019%29.jpg', desc: 'נסיעה בחזרה לנמל התעופה. ניתן לקחת אובר, מונית או מטרו A ל-Veleslavín ומשם אוטובוס 119 לשדה.', tip: 'אל תשכחו להגיע כשלוש שעות לפני הטיסה, יש תורים בעמדות הבידוק.' }
    };
`;

html = html.replace(/var POIS_DATA = \{[\s\S]*?\};\n/, newPoisDataStr);

fs.writeFileSync('gas_project/index.html', html, 'utf8');
