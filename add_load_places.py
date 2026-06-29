with open('gas_project/Code.gs', 'r', encoding='utf-8') as f:
    code = f.read()

load_logic = """
function loadPlaces() {
  try {
    var ss = getSpreadsheet_();
    var restSheet = ss.getSheetByName('Restaurants');
    var shopSheet = ss.getSheetByName('Shopping');
    
    if (!restSheet || !shopSheet) {
      initItineraryDB(); // Ensure created
      restSheet = ss.getSheetByName('Restaurants');
      shopSheet = ss.getSheetByName('Shopping');
    }
    
    var rests = [];
    if (restSheet.getLastRow() > 1) {
      var rData = restSheet.getRange(2, 1, restSheet.getLastRow() - 1, 6).getValues();
      for (var i = 0; i < rData.length; i++) {
        rests.push({ id: String(rData[i][0]), name: String(rData[i][1]), type: String(rData[i][2]), rating: String(rData[i][3]), price: String(rData[i][4]), link: String(rData[i][5]) });
      }
    }
    
    var shops = [];
    if (shopSheet.getLastRow() > 1) {
      var sData = shopSheet.getRange(2, 1, shopSheet.getLastRow() - 1, 6).getValues();
      for (var j = 0; j < sData.length; j++) {
        shops.push({ id: String(sData[j][0]), name: String(sData[j][1]), area: String(sData[j][2]), hours: String(sData[j][3]), brands: String(sData[j][4]), link: String(sData[j][5]) });
      }
    }
    
    return { ok: true, restaurants: rests, shopping: shops };
  } catch (e) {
    Logger.log('loadPlaces error: ' + e.stack);
    return { ok: false, error: e.message };
  }
}
"""

code = code + "\n" + load_logic

with open('gas_project/Code.gs', 'w', encoding='utf-8') as f:
    f.write(code)
