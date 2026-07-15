with open('gas_project/Code.gs', 'r', encoding='utf-8') as f:
    code = f.read()

new_logic = """
  var restSheet = ss.getSheetByName('Restaurants');
  if (!restSheet) {
    restSheet = ss.insertSheet('Restaurants');
    restSheet.getRange(1, 1, 1, 6).setValues([['ID', 'Name', 'Type', 'Rating', 'Price', 'Link']]);
    restSheet.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#071a33').setFontColor('#ffffff');
    restSheet.setFrozenRows(1);
    var defaultRest = [
      ['r1', 'Kantýna', 'בשרים', '4.8', '$$', 'https://www.google.com/maps/search/Kantýna+Prague'],
      ['r2', 'V Kolkovně', 'צ\'כי קלאסי', '4.5', '$$', 'https://www.google.com/maps/search/V+Kolkovně+Prague'],
      ['r3', 'Naše maso', 'בשר/נקניקיות', '4.7', '$', 'https://www.google.com/maps/search/Naše+maso+Prague']
    ];
    restSheet.getRange(2, 1, defaultRest.length, 6).setValues(defaultRest);
  }

  var shopSheet = ss.getSheetByName('Shopping');
  if (!shopSheet) {
    shopSheet = ss.insertSheet('Shopping');
    shopSheet.getRange(1, 1, 1, 6).setValues([['ID', 'Name', 'Area', 'Hours', 'TopBrands', 'Link']]);
    shopSheet.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#071a33').setFontColor('#ffffff');
    shopSheet.setFrozenRows(1);
    var defaultShop = [
      ['s1', 'Primark', 'Wenceslas Square', '09:00-21:00', 'Primark', 'https://www.google.com/maps/search/Primark+Prague'],
      ['s2', 'Palladium', 'Náměstí Republiky', '09:00-21:00', 'Zara, H&M, Sephora', 'https://www.google.com/maps/place/Palladium'],
      ['s3', 'Westfield Chodov', 'Chodov (Metro C)', '09:00-21:00', 'Armani, Zara, Cinema', 'https://www.google.com/maps/search/Westfield+Chodov']
    ];
    shopSheet.getRange(2, 1, defaultShop.length, 6).setValues(defaultShop);
  }

  var infoSheet = ss.getSheetByName('Contacts');
  if (!infoSheet) {
    infoSheet = ss.insertSheet('Contacts');
    infoSheet.getRange(1, 1, 1, 3).setValues([['Category', 'Name', 'Details']]);
    infoSheet.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#071a33').setFontColor('#ffffff');
    infoSheet.setFrozenRows(1);
    var defaultInfo = [
      ['חירום', 'משטרה', '158'],
      ['חירום', 'אמבולנס', '155'],
      ['מלון', 'Comfort Hotel Prague City East', 'Strašnice, Prague 10'],
      ['תחבורה', 'PID Lítačka', 'אפליקציה לתחבורה הציבורית']
    ];
    infoSheet.getRange(2, 1, defaultInfo.length, 3).setValues(defaultInfo);
  }
}
"""

code = code.replace("  }\n}\n\nfunction loadItinerary() {", "  }\n\n" + new_logic + "\n\nfunction loadItinerary() {")

with open('gas_project/Code.gs', 'w', encoding='utf-8') as f:
    f.write(code)
