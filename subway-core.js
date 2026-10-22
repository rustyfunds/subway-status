// Loads MTA service alerts and real-time train times for any subway station.
// Shared by subway-status.html (live refresh in the browser) and sync-subway.js (Node snapshot).
// CATALOG is every station complex from the MTA's station list (data.ny.gov 39hk-dx4f):
// [complex ID, borough, [[GTFS stop ID, stop name, lines, north label, south label], ...]].
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.SubwayCore = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const API = "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/";
  const ALERTS_URL = API + "camsys%2Fsubway-alerts.json";
  // Every feed is loaded so rerouted trains still show up at stations they don't normally serve.
  const TRAIN_FEEDS = [
    { url: API + "nyct%2Fgtfs", lines: "1 2 3 4 5 6 7 S" },
    { url: API + "nyct%2Fgtfs-ace", lines: "A C E" },
    { url: API + "nyct%2Fgtfs-bdfm", lines: "B D F M" },
    { url: API + "nyct%2Fgtfs-g", lines: "G" },
    { url: API + "nyct%2Fgtfs-jz", lines: "J Z" },
    { url: API + "nyct%2Fgtfs-nqrw", lines: "N Q R W" },
    { url: API + "nyct%2Fgtfs-l", lines: "L" },
    { url: API + "nyct%2Fgtfs-si", lines: "SIR" },
  ];

  const CATALOG = [["37","Bk",[["R43","77 St","R","Manhattan","Bay Ridge"]]],["611","M",[["127","Times Sq-42 St","1 2 3","Uptown","Downtown"],["725","Times Sq-42 St","7","Queens","Hudson Yards"],["R16","Times Sq-42 St","N Q R W","Uptown","Downtown"],["902","Times Sq-42 St","GS","","Grand Central"],["A27","42 St-Port Authority Bus Terminal","A C E","Uptown","Downtown"]]],["515","SI",[["S17","Annadale","SI","Ferry","South Shore"]]],["627","Bk",[["S01","Franklin Av","FS","","Prospect Park"],["A45","Franklin Av","C","Manhattan","Outbound"]]],["349","Bk",[["254","Junius St","3","Manhattan","New Lots"]]],["108","Q",[["M01","Middle Village-Metropolitan Av","M","Inbound",""]]],["471","M",[["726","34 St-Hudson Yards","7","","Queens"]]],["457","Q",[["713","52 St","7","Outbound","Manhattan"]]],["373","Bx",[["615","E 149 St","6","Northbound","Manhattan"]]],["97","Bk",[["M11","Myrtle Av","M J Z","Outbound","Manhattan"]]],["234","M",[["F16","East Broadway","F","Uptown","Brooklyn"]]],["248","Bk",[["F33","Avenue N","F","Manhattan","Southbound"]]],["336","Bk",[["233","Hoyt St","2 3","Manhattan","Outbound"]]],["110","Q",[["M05","Forest Av","M","Inbound","Middle Village"]]],["502","SI",[["S30","Tompkinsville","SI","Ferry","South Shore"]]],["624","M",[["A36","Chambers St","A C","Uptown","Brooklyn"],["R25","Cortlandt St","R W","Uptown","Downtown"],["E01","World Trade Center","E","Uptown",""],["228","Park Place","2 3","Uptown","Brooklyn"]]],["363","Bx",[["604","Westchester Sq-E Tremont Av","6","Pelham Bay","Manhattan"]]],["217","Bx",[["D09","170 St","B D","Northbound","Manhattan"]]],["613","M",[["629","59 St","4 5 6","Uptown","Downtown"],["R11","Lexington Av/59 St","N R W","Queens","Downtown"]]],["432","Bx",[["219","Prospect Av","2 5","Northbound","Manhattan"]]],["253","Bk",[["F39","Neptune Av","F","Manhattan","Coney Island"]]],["78","Bk",[["N09","Avenue U","N","Manhattan","Coney Island"]]],["368","Bx",[["610","Morrison Av-Soundview","6","Northbound","Manhattan"]]],["247","Bk",[["F32","Bay Pkwy","F","Manhattan","Southbound"]]],["8","M",[["R13","5 Av/59 St","N R W","Queens","Downtown"]]],["69","Bk",[["B22","25 Av","D","Manhattan","Coney Island"]]],["393","M",[["622","116 St","6","The Bronx","Downtown"]]],["202","Q",[["H14","Beach 105 St","A H","Inbound","Rockaway Park"]]],["258","Q",[["F05","Briarwood","E F","Jamaica","Manhattan"]]],["14","M",[["R19","23 St","R W","Uptown","Downtown"]]],["13","M",[["R18","28 St","R W","Uptown","Downtown"]]],["304","M",[["114","145 St","1","Uptown","Downtown"]]],["144","M",[["A03","Dyckman St","A","Uptown","Downtown"]]],["101","Bk",[["M16","Marcy Av","M J Z","Outbound","Manhattan"]]],["463","Q",[["720","Hunters Point Av","7","Outbound","Manhattan"]]],["154","M",[["A16","116 St","C B","Uptown","Downtown"]]],["636","Bk",[["A41","Jay St-MetroTech","A C F","Manhattan","Outbound"],["R29","Jay St-MetroTech","R","Manhattan","Southbound"]]],["33","Bk",[["R39","45 St","R","Manhattan","Southbound"]]],["185","Bk",[["A52","Liberty Av","C","Manhattan","Outbound"]]],["290","Bk",[["G34","Classon Av","G","Queens","Southbound"]]],["46","Bk",[["D30","Cortelyou Rd","Q","Manhattan","Southbound"]]],["272","Q",[["G20","36 St","M R","Outbound","Manhattan"]]],["628","M",[["418","Fulton St","4 5","Uptown","Downtown"],["229","Fulton St","2 3","Uptown","Brooklyn"],["A38","Fulton St","A C","Uptown","Brooklyn"],["M22","Fulton St","J Z","Brooklyn","Downtown"]]],["425","Bx",[["212","Bronx Park East","2 5","Northbound","Manhattan"]]],["444","Bx",[["503","Gun Hill Rd","5","Eastchester","Manhattan"]]],["65","Bk",[["B18","79 St","D","Manhattan","Southbound"]]],["629","Bk",[["G29","Metropolitan Av","G","Queens","Southbound"],["L10","Lorimer St","L","Manhattan","Outbound"]]],["273","Q",[["G21","Queens Plaza","E F R","Outbound","Manhattan"]]],["381","Bx",[["406","Kingsbridge Rd","4","Northbound","Manhattan"]]],["623","M",[["R23","Canal St","R W","Uptown","Downtown"],["M20","Canal St","J Z","Brooklyn","Downtown"],["639","Canal St","6","Uptown","Downtown"],["Q01","Canal St","N Q","Uptown","Downtown"]]],["300","M",[["110","191 St","1","The Bronx","Downtown"]]],["262","Q",[["G09","67 Av","M R","Outbound","Manhattan"]]],["621","Bk",[["A51","Broadway Junction","A C","Manhattan","Outbound"],["J27","Broadway Junction","J Z","Outbound","Manhattan"],["L22","Broadway Junction","L","Manhattan","Outbound"]]],["1","Q",[["R01","Astoria-Ditmars Blvd","N W","","Manhattan"]]],["358","Bk",[["246","Newkirk Av-Little Haiti","2 5","Manhattan","Flatbush"]]],["126","Bk",[["L15","Jefferson St","L","Manhattan","Outbound"]]],["507","SI",[["S25","Dongan Hills","SI","Ferry","South Shore"]]],["196","Q",[["H01","Aqueduct Racetrack","A","Manhattan","Rockaways"]]],["89","Bk",[["J22","Cleveland St","J","Outbound","Manhattan"]]],["158","M",[["A20","86 St","C B","Uptown","Downtown"]]],["189","Bk",[["A57","Grant Av","A","Manhattan","Queens"]]],["268","Q",[["G15","65 St","M R","Outbound","Manhattan"]]],["50","Bk",[["D34","Avenue M","Q","Manhattan","Southbound"]]],["294","Bx",[["103","238 St","1","Van Cortlandt","Manhattan"]]],["341","Bk",[["238","Eastern Pkwy-Brooklyn Museum","2 3","Manhattan","Outbound"]]],["619","M",[["637","Bleecker St","6","Uptown","Downtown"],["D21","Broadway-Lafayette St","B D F M","Uptown","Downtown"]]],["45","Bk",[["D29","Beverley Rd","Q","Manhattan","Southbound"]]],["449","Q",[["705","111 St","7","Outbound","Manhattan"]]],["153","M",[["A15","125 St","A C B D","Uptown","Downtown"]]],["228","M",[["D18","23 St","F M","Uptown","Downtown"]]],["413","M",[["419","Wall St","4 5","Uptown","Downtown"]]],["77","Bk",[["N08","Kings Hwy","N","Manhattan","Coney Island"]]],["305","M",[["115","137 St-City College","1","Uptown","Downtown"]]],["440","M",[["226","116 St","2 3","Uptown","Downtown"]]],["326","M",[["136","Franklin St","1","Uptown","Downtown"]]],["385","Bx",[["410","176 St","4","Northbound","Manhattan"]]],["277","M",[["D14","7 Av","E B D","Outbound","Downtown"]]],["216","Bx",[["D08","174-175 Sts","B D","Northbound","Manhattan"]]],["165","M",[["A30","23 St","C E","Uptown","Downtown"]]],["179","Bk",[["A46","Nostrand Av","A C","Manhattan","Outbound"]]],["72","Bk",[["N03","Fort Hamilton Pkwy","N","Manhattan","Coney Island"]]],["445","Bx",[["504","Pelham Pkwy","5","Eastchester","Manhattan"]]],["5","Q",[["R06","36 Av","N W","Astoria","Manhattan"]]],["211","Bx",[["D03","Bedford Park Blvd","B D","Northbound","Manhattan"]]],["377","Bx",[["619","3 Av-138 St","6","Northbound","Manhattan"]]],["114","Bk",[["M10","Central Av","M","Inbound","Middle Village"]]],["354","Bk",[["242","Sterling St","2 5","Manhattan","Flatbush"]]],["238","Bk",[["F22","Smith-9 Sts","F G","Northbound","Southbound"]]],["369","Bx",[["611","Elder Av","6","Northbound","Manhattan"]]],["475","M",[["Q05","96 St","Q","","Downtown"]]],["503","SI",[["S29","Stapleton","SI","Ferry","South Shore"]]],["109","Q",[["M04","Fresh Pond Rd","M","Inbound","Middle Village"]]],["149","M",[["A10","163 St-Amsterdam Av","C","Uptown","Downtown"]]],["26","Bk",[["R30","DeKalb Av","B Q R","Manhattan","Southbound"]]],["404","M",[["633","28 St","6","Uptown","Downtown"]]],["309","M",[["119","103 St","1","Uptown","Downtown"]]],["221","Q",[["B04","21 St-Queensbridge","M","Outbound","Manhattan"]]],["417","Bx",[["204","Nereid Av","2 5","Northbound","Manhattan"]]],["82","Q",[["J14","104 St","J Z","Jamaica","Manhattan"]]],["133","Bk",[["L24","Atlantic Av","L","Manhattan","Canarsie"]]],["337","Bk",[["234","Nevins St","2 3 4 5","Manhattan","Outbound"]]],["134","Bk",[["L25","Sutter Av","L","Manhattan","Canarsie"]]],["617","Bk",[["D24","Atlantic Av-Barclays Ctr","B Q","Manhattan","Southbound"],["R31","Atlantic Av-Barclays Ctr","D N R","Manhattan","Southbound"],["235","Atlantic Av-Barclays Ctr","2 3 4 5","Manhattan","Outbound"]]],["364","Bx",[["606","Zerega Av","6","Pelham Bay","Manhattan"]]],["243","Bk",[["F27","Church Av","F G","Northbound","Southbound"]]],["57","Bk",[["D42","W 8 St-NY Aquarium","F Q","Manhattan","Coney Island"]]],["249","Bk",[["F34","Avenue P","F","Manhattan","Southbound"]]],["604","Bx",[["414","161 St-Yankee Stadium","4","Northbound","Manhattan"],["D11","161 St-Yankee Stadium","B D","Northbound","Manhattan"]]],["436","M",[["301","Harlem-148 St","3","","Downtown"]]],["601","M",[["132","14 St","1 2 3","Uptown","Downtown"],["D19","14 St","F M","Uptown","Downtown"],["L02","6 Av","L","West Side","Brooklyn"]]],["206","Q",[["H08","Beach 44 St","A","Manhattan","Far Rockaway"]]],["431","Bx",[["218","Intervale Av","2 5","Northbound","Manhattan"]]],["416","Bx",[["201","Wakefield-241 St","2","","Manhattan"]]],["625","M",[["F15","Delancey St-Essex St","F","Uptown","Brooklyn"],["M18","Delancey St-Essex St","M J Z","Brooklyn","Inbound"]]],["81","Q",[["J13","111 St","J","Jamaica","Manhattan"]]],["254","Q",[["F01","Jamaica-179 St","F","","Manhattan"]]],["372","Bx",[["614","Longwood Av","6","Northbound","Manhattan"]]],["308","M",[["118","Cathedral Pkwy (110 St)","1","Uptown","Downtown"]]],["9","M",[["R14","57 St-7 Av","N Q R W","Uptown","Downtown"]]],["365","Bx",[["607","Castle Hill Av","6","Pelham Bay","Manhattan"]]],["68","Bk",[["B21","Bay Pkwy","D","Manhattan","Southbound"]]],["394","M",[["623","110 St","6","The Bronx","Downtown"]]],["333","M",[["230","Wall St","2 3","Uptown","Brooklyn"]]],["201","Q",[["H13","Beach 98 St","A H","Inbound","Rockaway Park"]]],["10","M",[["R15","49 St","N R W","Uptown","Downtown"]]],["220","M",[["D12","155 St","B D","The Bronx","Downtown"]]],["516","SI",[["S16","Huguenot","SI","Ferry","South Shore"]]],["350","Bk",[["255","Pennsylvania Av","3","Manhattan","New Lots"]]],["458","Q",[["714","46 St-Bliss St","7","Outbound","Manhattan"]]],["426","Bx",[["213","E 180 St","2 5","Northbound","Manhattan"]]],["384","Bx",[["409","Burnside Av","4","Northbound","Manhattan"]]],["476","M",[["Q04","86 St","Q","Uptown","Downtown"]]],["276","M",[["F12","5 Av/53 St","E F","Queens","Downtown"]]],["286","Bk",[["G30","Broadway","G","Queens","Southbound"]]],["614","M",[["A24","59 St-Columbus Circle","A C B D","Uptown","Downtown"],["125","59 St-Columbus Circle","1","Uptown","Downtown"]]],["421","Bx",[["208","Gun Hill Rd","2 5","Northbound","Manhattan"]]],["318","M",[["128","34 St-Penn Station","1 2 3","Uptown","Downtown"]]],["53","Bk",[["D38","Neck Rd","Q","Manhattan","Southbound"]]],["192","Q",[["A61","Rockaway Blvd","A","Manhattan","Outbound"]]],["36","Bk",[["R42","Bay Ridge Av","R","Manhattan","Bay Ridge"]]],["58","Bk",[["D43","Coney Island-Stillwell Av","D F N Q","Manhattan",""]]],["399","M",[["628","68 St-Hunter College","6","Uptown","Downtown"]]],["269","Q",[["G16","Northern Blvd","M R","Outbound","Manhattan"]]],["138","Bk",[["L29","Canarsie-Rockaway Pkwy","L","Manhattan",""]]],["618","M",[["A31","14 St","A C E","Uptown","Downtown"],["L01","8 Av","L","","Brooklyn"]]],["606","Q",[["G22","Court Sq","G","","Brooklyn"],["719","Court Sq","7","Outbound","Manhattan"],["F09","Court Sq-23 St","E F","Outbound","Manhattan"]]],["340","Bk",[["237","Grand Army Plaza","2 3","Manhattan","Outbound"]]],["96","Bk",[["J31","Kosciuszko St","J","Outbound","Manhattan"]]],["113","Bk",[["M09","Knickerbocker Av","M","Inbound","Middle Village"]]],["376","Bx",[["618","Brook Av","6","Northbound","Manhattan"]]],["197","Q",[["H02","Aqueduct-N Conduit Av","A","Manhattan","Rockaways"]]],["511","SI",[["S21","Oakwood Heights","SI","Ferry","South Shore"]]],["313","M",[["123","72 St","1 2 3","Uptown","Downtown"]]],["64","Bk",[["B17","71 St","D","Manhattan","Southbound"]]],["345","Bk",[["250","Crown Hts-Utica Av","3 4","Manhattan","Outbound"]]],["453","Q",[["709","82 St-Jackson Hts","7","Outbound","Manhattan"]]],["90","Bk",[["J23","Van Siclen Av","J Z","Outbound","Manhattan"]]],["122","Bk",[["L11","Graham Av","L","Manhattan","Outbound"]]],["85","Q",[["J17","75 St-Elderts Ln","J Z","Jamaica","Manhattan"]]],["448","Q",[["702","Mets-Willets Point","7","Outbound","Manhattan"]]],["409","M",[["638","Spring St","6","Uptown","Downtown"]]],["224","M",[["B10","57 St","M","Uptown","Downtown"]]],["441","M",[["227","110 St-Malcolm X Plaza","2 3","Uptown","Downtown"]]],["157","M",[["A19","96 St","C B","Uptown","Downtown"]]],["32","Bk",[["R36","36 St","D N R","Manhattan","Southbound"]]],["257","Q",[["F04","Sutphin Blvd","F","Jamaica","Manhattan"]]],["188","Bk",[["A55","Euclid Av","A C","Manhattan","Queens"]]],["17","M",[["R22","Prince St","R W","Uptown","Downtown"]]],["301","M",[["111","181 St","1","The Bronx","Downtown"]]],["506","SI",[["S26","Old Town","SI","Ferry","South Shore"]]],["169","M",[["A34","Canal St","A C E","Uptown","Downtown"]]],["143","M",[["A02","Inwood-207 St","A","","Downtown"]]],["49","Bk",[["D33","Avenue J","Q","Manhattan","Southbound"]]],["357","Bk",[["245","Beverly Rd","2 5","Manhattan","Flatbush"]]],["452","Q",[["708","90 St-Elmhurst Av","7","Outbound","Manhattan"]]],["100","Bk",[["M14","Hewes St","M J","Outbound","Manhattan"]]],["380","Bx",[["405","Bedford Park Blvd-Lehman College","4","Northbound","Manhattan"]]],["602","M",[["L03","14 St-Union Sq","L","West Side","Brooklyn"],["635","14 St-Union Sq","4 5 6","Uptown","Downtown"],["R20","14 St-Union Sq","N Q R W","Uptown","Downtown"]]],["125","Bk",[["L14","Morgan Av","L","Manhattan","Outbound"]]],["225","M",[["D15","47-50 Sts-Rockefeller Ctr","B D F M","Uptown","Downtown"]]],["325","M",[["135","Canal St","1","Uptown","Downtown"]]],["193","Q",[["A63","104 St","A","Manhattan","Ozone Park"]]],["622","M",[["M21","Chambers St","J Z","Brooklyn","Downtown"],["640","Brooklyn Bridge-City Hall","4 5 6","Uptown","Downtown"]]],["118","M",[["L05","3 Av","L","West Side","Brooklyn"]]],["212","Bx",[["D04","Kingsbridge Rd","B D","Northbound","Manhattan"]]],["344","Bk",[["249","Kingston Av","3","Manhattan","Outbound"]]],["22","M",[["R26","Rector St","R W","Uptown","Downtown"]]],["86","Bk",[["J19","Cypress Hills","J","Queens","Manhattan"]]],["173","Bk",[["A40","High St","A C","Manhattan","Outbound"]]],["261","Q",[["G08","Forest Hills-71 Av","E F M R","Outbound","Manhattan"]]],["130","Bk",[["L20","Wilson Av","L","Manhattan","Outbound"]]],["289","Bk",[["G33","Bedford-Nostrand Avs","G","Queens","Southbound"]]],["523","SI",[["S11","Arthur Kill","SI","Ferry","Tottenville"]]],["135","Bk",[["L26","Livonia Av","L","Manhattan","Canarsie"]]],["321","M",[["131","18 St","1","Uptown","Downtown"]]],["129","Q",[["L19","Halsey St","L","Manhattan","Outbound"]]],["609","M",[["724","5 Av","7","Queens","Hudson Yards"],["D16","42 St-Bryant Pk","B D F M","Uptown","Downtown"]]],["237","Bk",[["F21","Carroll St","F G","Northbound","Southbound"]]],["353","Bk",[["241","President St-Medgar Evers College","2 5","Manhattan","Flatbush"]]],["244","Bk",[["F29","Ditmas Av","F","Manhattan","Southbound"]]],["250","Bk",[["F35","Kings Hwy","F","Manhattan","Southbound"]]],["603","Bx",[["415","149 St-Hostos","4","Northbound","Manhattan"],["222","149 St-Hostos","2 5","Northbound","Manhattan"]]],["510","SI",[["S22","New Dorp","SI","Ferry","South Shore"]]],["205","Q",[["H07","Beach 60 St","A","Manhattan","Far Rockaway"]]],["422","Bx",[["209","Burke Av","2 5","Northbound","Manhattan"]]],["41","Bk",[["D25","7 Av","B Q","Manhattan","Southbound"]]],["54","Bk",[["D39","Sheepshead Bay","B Q","Manhattan","Southbound"]]],["59","Bk",[["B12","9 Av","D","Manhattan","Southbound"]]],["167","M",[["A32","W 4 St-Wash Sq","A C E","Uptown","Downtown"],["D20","W 4 St-Wash Sq","B D F M","Uptown","Downtown"]]],["280","Q",[["G07","Jamaica-Van Wyck","E","Jamaica","Manhattan"]]],["282","Q",[["G24","21 St","G","Court Square","Brooklyn"]]],["150","M",[["A11","155 St","C","Uptown","Downtown"]]],["388","Bx",[["413","167 St","4","Northbound","Manhattan"]]],["293","Bx",[["101","Van Cortlandt Park-242 St","1","","Manhattan"]]],["162","M",[["A25","50 St","C E","Uptown","Downtown"]]],["403","M",[["632","33 St","6","Uptown","Downtown"]]],["312","M",[["122","79 St","1","Uptown","Downtown"]]],["180","Bk",[["A47","Kingston-Throop Avs","C","Manhattan","Outbound"]]],["420","Bx",[["207","219 St","2 5","Northbound","Manhattan"]]],["265","Q",[["G12","Grand Av-Newtown","M R","Outbound","Manhattan"]]],["615","Bk",[["N04","New Utrecht Av","N","Manhattan","Coney Island"],["B16","62 St","D","Manhattan","Southbound"]]],["151","M",[["A12","145 St","A C","Uptown","Downtown"],["D13","145 St","B D","Uptown","Downtown"]]],["4","Q",[["R05","Broadway","N W","Astoria","Manhattan"]]],["176","Bk",[["A43","Lafayette Av","C","Manhattan","Outbound"]]],["52","Bk",[["D37","Avenue U","Q","Manhattan","Southbound"]]],["191","Q",[["A60","88 St","A","Manhattan","Outbound"]]],["31","Bk",[["R35","25 St","R","Manhattan","Southbound"]]],["270","Q",[["G18","46 St","M R","Outbound","Manhattan"]]],["292","Bk",[["G36","Fulton St","G","Queens","Southbound"]]],["620","Bk",[["423","Borough Hall","4 5","Manhattan","Outbound"],["232","Borough Hall","2 3","Manhattan","Outbound"],["R28","Court St","R","Manhattan","Southbound"]]],["307","M",[["117","116 St-Columbia University","1","Uptown","Downtown"]]],["366","Bx",[["608","Parkchester","6","Northbound","Manhattan"]]],["405","M",[["634","23 St-Baruch College","6","Uptown","Downtown"]]],["204","Q",[["H06","Beach 67 St","A","Manhattan","Far Rockaway"]]],["383","Bx",[["408","183 St","4","Northbound","Manhattan"]]],["612","M",[["F11","Lexington Av/53 St","E F","Queens","Downtown"],["630","51 St","6","Uptown","Downtown"]]],["42","Bk",[["D26","Prospect Park","B Q FS","Northbound","Southbound"]]],["319","M",[["129","28 St","1","Uptown","Downtown"]]],["20","M",[["R24","City Hall","R W","Uptown","Downtown"]]],["260","Q",[["F07","75 Av","E F","Jamaica","Manhattan"]]],["74","Bk",[["N05","18 Av","N","Manhattan","Coney Island"]]],["605","M",[["112","168 St-Washington Hts","1","Uptown","Downtown"],["A09","168 St","A C","Uptown","Downtown"]]],["437","M",[["302","145 St","3","Harlem","Downtown"]]],["146","M",[["A06","181 St","A","Uptown","Downtown"]]],["297","M",[["107","215 St","1","The Bronx","Downtown"]]],["95","Bk",[["J30","Gates Av","J Z","Outbound","Manhattan"]]],["459","Q",[["715","40 St-Lowery St","7","Outbound","Manhattan"]]],["236","Bk",[["F20","Bergen St","F G","Northbound","Southbound"]]],["181","Bk",[["A48","Utica Av","A C","Manhattan","Outbound"]]],["477","M",[["Q03","72 St","Q","Uptown","Downtown"]]],["334","Bk",[["231","Clark St","2 3","Manhattan","Outbound"]]],["160","M",[["A22","72 St","C B","Uptown","Downtown"]]],["187","Bk",[["A54","Shepherd Av","C","Manhattan","Outbound"]]],["35","Bk",[["R41","59 St","N R","Manhattan","Southbound"]]],["361","Bx",[["602","Buhre Av","6","Pelham Bay","Manhattan"]]],["398","M",[["627","77 St","6","Uptown","Downtown"]]],["48","Bk",[["D32","Avenue H","Q","Manhattan","Southbound"]]],["329","M",[["139","Rector St","1","Uptown","Downtown"]]],["6","Q",[["R08","39 Av-Dutch Kills","N W","Astoria","Manhattan"]]],["512","SI",[["S20","Bay Terrace","SI","Ferry","South Shore"]]],["80","Q",[["J12","121 St","J Z","Jamaica","Manhattan"]]],["324","M",[["134","Houston St","1","Uptown","Downtown"]]],["255","Q",[["F02","169 St","F","Jamaica","Manhattan"]]],["245","Bk",[["F30","18 Av","F","Manhattan","Southbound"]]],["442","Bx",[["501","Eastchester-Dyre Av","5","","Manhattan"]]],["287","Bk",[["G31","Flushing Av","G","Queens","Southbound"]]],["346","Bk",[["251","Sutter Av-Rutland Rd","3","Manhattan","New Lots"]]],["427","Bx",[["214","West Farms Sq-E Tremont Av","2 5","Northbound","Manhattan"]]],["395","M",[["624","103 St","6","The Bronx","Downtown"]]],["208","Q",[["H10","Beach 25 St","A","Manhattan","Far Rockaway"]]],["16","M",[["R21","8 St-NYU","R W","Uptown","Downtown"]]],["123","Bk",[["L12","Grand St","L","Manhattan","Outbound"]]],["517","SI",[["S15","Prince's Bay","SI","Ferry","South Shore"]]],["351","Bk",[["256","Van Siclen Av","3","Manhattan","New Lots"]]],["447","Q",[["701","Flushing-Main St","7","","Manhattan"]]],["626","Bk",[["S04","Botanic Garden","FS","Franklin Av","Prospect Park"],["239","Franklin Av-Medgar Evers College","2 3 4 5","Manhattan","Outbound"]]],["213","Bx",[["D05","Fordham Rd","B D","Northbound","Manhattan"]]],["339","Bk",[["236","Bergen St","2 3","Manhattan","Outbound"]]],["630","Bk",[["M08","Myrtle-Wyckoff Avs","M","Inbound","Middle Village"],["L17","Myrtle-Wyckoff Avs","L","Manhattan","Outbound"]]],["314","M",[["124","66 St-Lincoln Center","1","Uptown","Downtown"]]],["240","Bk",[["F24","7 Av","F G","Northbound","Southbound"]]],["375","Bx",[["617","Cypress Av","6","Northbound","Manhattan"]]],["156","M",[["A18","103 St","C B","Uptown","Downtown"]]],["198","Q",[["H03","Howard Beach-JFK Airport","A","Manhattan","Rockaways"]]],["356","Bk",[["244","Church Av","2 5","Manhattan","Flatbush"]]],["616","Q",[["710","74 St-Broadway","7","Outbound","Manhattan"],["G14","Jackson Hts-Roosevelt Av","E F M R","Outbound","Manhattan"]]],["91","Bk",[["J24","Alabama Av","J Z","Outbound","Manhattan"]]],["131","Bk",[["L21","Bushwick Av-Aberdeen St","L","Manhattan","Outbound"]]],["28","Bk",[["R32","Union St","R","Manhattan","Southbound"]]],["610","M",[["631","Grand Central-42 St","4 5 6","Uptown","Downtown"],["723","Grand Central-42 St","7","Queens","Hudson Yards"],["901","Grand Central-42 St","GS","Times Square",""]]],["84","Q",[["J16","85 St-Forest Pkwy","J","Jamaica","Manhattan"]]],["223","M",[["B08","Lexington Av/63 St","M Q","Uptown & Queens","Downtown"]]],["635","M",[["R27","Whitehall St-South Ferry","R W","Uptown","Downtown"],["142","South Ferry","1","Uptown",""]]],["430","Bx",[["217","Simpson St","2 5","Northbound","Manhattan"]]],["136","Bk",[["L27","New Lots Av","L","Manhattan","Canarsie"]]],["423","Bx",[["210","Allerton Av","2 5","Northbound","Manhattan"]]],["251","Bk",[["F36","Avenue U","F","Manhattan","Coney Island"]]],["391","Bx",[["416","138 St-Grand Concourse","4 5","Northbound","Manhattan"]]],["67","Bk",[["B20","20 Av","D","Manhattan","Southbound"]]],["60","Bk",[["B13","Fort Hamilton Pkwy","D","Manhattan","Southbound"]]],["241","Bk",[["F25","15 St-Prospect Park","F G","Northbound","Southbound"]]],["328","M",[["138","WTC Cortlandt","1","Uptown","Downtown"]]],["283","Bk",[["G26","Greenpoint Av","G","Queens","Southbound"]]],["119","M",[["L06","1 Av","L","West Side","Brooklyn"]]],["55","Bk",[["D40","Brighton Beach","B Q","Manhattan","Southbound"]]],["3","Q",[["R04","30 Av","N W","Astoria","Manhattan"]]],["379","Bx",[["402","Mosholu Pkwy","4","Woodlawn","Manhattan"]]],["209","Q",[["H11","Far Rockaway-Mott Av","A","Manhattan",""]]],["360","Bx",[["601","Pelham Bay Park","6","","Manhattan"]]],["371","Bx",[["613","Hunts Point Av","6","Northbound","Manhattan"]]],["505","SI",[["S27","Grasmere","SI","Ferry","South Shore"]]],["87","Bk",[["J20","Crescent St","J Z","Outbound","Manhattan"]]],["194","Q",[["A64","111 St","A","Manhattan","Ozone Park"]]],["147","M",[["A07","175 St","A","Uptown","Downtown"]]],["296","M",[["106","Marble Hill-225 St","1","The Bronx","Downtown"]]],["311","M",[["121","86 St","1","Uptown","Downtown"]]],["419","Bx",[["206","225 St","2 5","Northbound","Manhattan"]]],["266","Q",[["G13","Elmhurst Av","M R","Outbound","Manhattan"]]],["43","Bk",[["D27","Parkside Av","Q","Manhattan","Southbound"]]],["343","Bk",[["248","Nostrand Av","3","Manhattan","Outbound"]]],["451","Q",[["707","Junction Blvd","7","Outbound","Manhattan"]]],["38","Bk",[["R44","86 St","R","Manhattan","Bay Ridge"]]],["387","Bx",[["412","170 St","4","Northbound","Manhattan"]]],["434","Bx",[["221","3 Av-149 St","2 5","Northbound","Manhattan"]]],["298","M",[["108","207 St","1","The Bronx","Downtown"]]],["199","Q",[["H04","Broad Channel","A H","Inbound","Rockaways"]]],["177","Bk",[["A44","Clinton-Washington Avs","C","Manhattan","Outbound"]]],["182","Bk",[["A49","Ralph Av","C","Manhattan","Outbound"]]],["455","Q",[["711","69 St","7","Outbound","Manhattan"]]],["70","Bk",[["B23","Bay 50 St","D","Manhattan","Coney Island"]]],["264","Q",[["G11","Woodhaven Blvd","M R","Outbound","Manhattan"]]],["522","SI",[["S09","Tottenville","SI","Ferry",""]]],["461","Q",[["R09","Queensboro Plaza","N W","Astoria","Manhattan"],["718","Queensboro Plaza","7","Outbound","Manhattan"]]],["99","Bk",[["M13","Lorimer St","M J","Outbound","Manhattan"]]],["509","SI",[["S23","Grant City","SI","Ferry","South Shore"]]],["279","Q",[["G06","Sutphin Blvd-Archer Av-JFK Airport","E J Z","Jamaica","Manhattan"]]],["460","Q",[["716","33 St-Rawson St","7","Outbound","Manhattan"]]],["155","M",[["A17","Cathedral Pkwy (110 St)","C B","Uptown","Downtown"]]],["259","Q",[["F06","Kew Gardens-Union Tpke","E F","Jamaica","Manhattan"]]],["320","M",[["130","23 St","1","Uptown","Downtown"]]],["175","Bk",[["A42","Hoyt-Schermerhorn Sts","A C G","Westbound","Queens"]]],["438","M",[["224","135 St","2 3","Uptown","Downtown"]]],["75","Bk",[["N06","20 Av","N","Manhattan","Coney Island"]]],["145","M",[["A05","190 St","A","Uptown","Downtown"]]],["291","Bk",[["G35","Clinton-Washington Avs","G","Queens","Southbound"]]],["374","Bx",[["616","E 143 St-St Mary's St","6","Northbound","Manhattan"]]],["94","Bk",[["J29","Halsey St","J","Outbound","Manhattan"]]],["231","M",[["D22","Grand St","B D","Uptown","Brooklyn"]]],["79","Bk",[["N10","86 St","N","Manhattan","Coney Island"]]],["347","Bk",[["252","Saratoga Av","3","Manhattan","New Lots"]]],["513","SI",[["S19","Great Kills","SI","Ferry","South Shore"]]],["111","Q",[["M06","Seneca Av","M","Inbound","Middle Village"]]],["203","Q",[["H15","Rockaway Park-Beach 116 St","A H","Inbound",""]]],["124","Bk",[["L13","Montrose Av","L","Manhattan","Outbound"]]],["218","Bx",[["D10","167 St","B D","Northbound","Manhattan"]]],["352","Bk",[["257","New Lots Av","3","Manhattan",""]]],["518","SI",[["S14","Pleasant Plains","SI","Ferry","South Shore"]]],["443","Bx",[["502","Baychester Av","5","Eastchester","Manhattan"]]],["288","Bk",[["G32","Myrtle-Willoughby Avs","G","Queens","Southbound"]]],["428","Bx",[["215","174 St","2 5","Northbound","Manhattan"]]],["382","Bx",[["407","Fordham Rd","4","Northbound","Manhattan"]]],["159","M",[["A21","81 St-Museum of Natural History","C B","Uptown","Downtown"]]],["501","SI",[["S31","St George","SI","","South Shore"]]],["186","Bk",[["A53","Van Siclen Av","C","Manhattan","Outbound"]]],["303","M",[["113","157 St","1","Uptown","Downtown"]]],["362","Bx",[["603","Middletown Rd","6","Pelham Bay","Manhattan"]]],["30","Bk",[["R34","Prospect Av","R","Manhattan","Southbound"]]],["141","Bk",[["S03","Park Pl","FS","Franklin Av","Prospect Park"]]],["47","Bk",[["D31","Newkirk Plaza","B Q","Manhattan","Southbound"]]],["271","Q",[["G19","Steinway St","M R","Outbound","Manhattan"]]],["256","Q",[["F03","Parsons Blvd","F","Jamaica","Manhattan"]]],["323","M",[["133","Christopher St-Stonewall","1","Uptown","Downtown"]]],["414","M",[["420","Bowling Green","4 5","Uptown","Downtown"]]],["367","Bx",[["609","St Lawrence Av","6","Northbound","Manhattan"]]],["306","M",[["116","125 St","1","Uptown","Downtown"]]],["235","Bk",[["F18","York St","F","Manhattan","Southbound"]]],["246","Bk",[["F31","Avenue I","F","Manhattan","Southbound"]]],["62","Bk",[["B15","55 St","D","Manhattan","Southbound"]]],["207","Q",[["H09","Beach 36 St","A","Manhattan","Far Rockaway"]]],["107","M",[["M23","Broad St","J Z","Brooklyn",""]]],["396","M",[["625","96 St","6","The Bronx","Downtown"]]],["607","M",[["R17","34 St-Herald Sq","N Q R W","Uptown","Downtown"],["D17","34 St-Herald Sq","B D F M","Uptown","Downtown"]]],["214","Bx",[["D06","182-183 Sts","B D","Northbound","Manhattan"]]],["152","M",[["A14","135 St","C B","Uptown","Downtown"]]],["424","Bx",[["211","Pelham Pkwy","2 5","Northbound","Manhattan"]]],["76","Bk",[["N07","Bay Pkwy","N","Manhattan","Coney Island"]]],["439","M",[["225","125 St","2 3","Uptown","Downtown"]]],["61","Bk",[["B14","50 St","D","Manhattan","Southbound"]]],["39","Bk",[["R45","Bay Ridge-95 St","R","Manhattan",""]]],["284","Bk",[["G28","Nassau Av","G","Queens","Southbound"]]],["168","M",[["A33","Spring St","C E","Uptown","Downtown"]]],["386","Bx",[["411","Mt Eden Av","4","Northbound","Manhattan"]]],["278","Q",[["G05","Jamaica Center-Parsons/Archer","E J Z","","Manhattan"]]],["299","M",[["109","Dyckman St","1","The Bronx","Downtown"]]],["34","Bk",[["R40","53 St","R","Manhattan","Southbound"]]],["190","Q",[["A59","80 St","A","Manhattan","Outbound"]]],["183","Bk",[["A50","Rockaway Av","C","Manhattan","Outbound"]]],["51","Bk",[["D35","Kings Hwy","B Q","Manhattan","Southbound"]]],["397","M",[["626","86 St","4 5 6","Uptown","Downtown"]]],["2","Q",[["R03","Astoria Blvd","N W","Astoria","Manhattan"]]],["429","Bx",[["216","Freeman St","2 5","Northbound","Manhattan"]]],["210","Bx",[["D01","Norwood-205 St","D","","Manhattan"]]],["450","Q",[["706","103 St-Corona Plaza","7","Outbound","Manhattan"]]],["355","Bk",[["243","Winthrop St","2 5","Manhattan","Flatbush"]]],["608","Bk",[["F23","4 Av-9 St","F G","Northbound","Southbound"],["R33","4 Av-9 St","R","Manhattan","Southbound"]]],["242","Bk",[["F26","Fort Hamilton Pkwy","F G","Northbound","Southbound"]]],["252","Bk",[["F38","Avenue X","F","Manhattan","Coney Island"]]],["418","Bx",[["205","233 St","2 5","Northbound","Manhattan"]]],["127","Bk",[["L16","DeKalb Av","L","Manhattan","Outbound"]]],["137","Bk",[["L28","East 105 St","L","Manhattan","Canarsie"]]],["464","Q",[["721","Vernon Blvd-Jackson Av","7","Outbound","Manhattan"]]],["392","M",[["621","125 St","4 5 6","The Bronx","Downtown"]]],["508","SI",[["S24","Jefferson Av","SI","Ferry","South Shore"]]],["327","M",[["137","Chambers St","1 2 3","Uptown","Downtown"]]],["195","Q",[["A65","Ozone Park-Lefferts Blvd","A","Manhattan",""]]],["66","Bk",[["B19","18 Av","D","Manhattan","Southbound"]]],["103","M",[["M19","Bowery","J Z","Brooklyn","Downtown"]]],["407","M",[["636","Astor Pl","6","Uptown","Downtown"]]],["44","Bk",[["D28","Church Av","B Q","Manhattan","Southbound"]]],["93","Bk",[["J28","Chauncey St","J Z","Outbound","Manhattan"]]],["456","Q",[["712","61 St-Woodside","7","Outbound","Manhattan"]]],["56","Bk",[["D41","Ocean Pkwy","Q","Manhattan","Coney Island"]]],["88","Bk",[["J21","Norwood Av","J Z","Outbound","Manhattan"]]],["295","Bx",[["104","231 St","1","Van Cortlandt","Manhattan"]]],["263","Q",[["G10","63 Dr-Rego Park","M R","Outbound","Manhattan"]]],["164","M",[["A28","34 St-Penn Station","A C E","Uptown","Downtown"]]],["200","Q",[["H12","Beach 90 St","A H","Inbound","Rockaway Park"]]],["316","M",[["126","50 St","1","Uptown","Downtown"]]],["310","M",[["120","96 St","1 2 3","Uptown","Downtown"]]],["71","Bk",[["N02","8 Av","N","Manhattan","Coney Island"]]],["519","SI",[["S13","Richmond Valley","SI","Ferry","Tottenville"]]],["359","Bk",[["247","Flatbush Av-Brooklyn College","2 5","Manhattan",""]]],["378","Bx",[["401","Woodlawn","4","","Manhattan"]]],["446","Bx",[["505","Morris Park","5","Eastchester","Manhattan"]]],["370","Bx",[["612","Whitlock Av","6","Northbound","Manhattan"]]],["98","Bk",[["M12","Flushing Av","M J","Outbound","Manhattan"]]],["504","SI",[["S28","Clifton","SI","Ferry","South Shore"]]],["433","Bx",[["220","Jackson Av","2 5","Northbound","Manhattan"]]],["215","Bx",[["D07","Tremont Av","B D","Northbound","Manhattan"]]],["120","Bk",[["L08","Bedford Av","L","Manhattan","Outbound"]]],["222","M",[["B06","Roosevelt Island","M","Queens","Downtown"]]],["83","Q",[["J15","Woodhaven Blvd","J Z","Jamaica","Manhattan"]]],["514","SI",[["S18","Eltingville","SI","Ferry","South Shore"]]],["232","M",[["F14","2 Av","F","Uptown","Downtown"]]],["348","Bk",[["253","Rockaway Av","3","Manhattan","New Lots"]]]];
  const BOROUGHS = { M: "Manhattan", Bk: "Brooklyn", Q: "Queens", Bx: "The Bronx", SI: "Staten Island" };
  const LINE_ORDER = ["1", "2", "3", "4", "5", "6", "7", "A", "C", "E", "B", "D", "F", "M", "G", "J", "Z", "L", "N", "Q", "R", "W", "GS", "FS", "H", "SI"];
  // Feed and alert route IDs for express variants, mapped to the line on station signs.
  const LINE_ALIASES = { "6X": "6", "7X": "7", FX: "F" };
  const DEFAULT_STATION_IDS = ["628", "617", "610", "447"];

  const ALERT_KEEP_DAYS = 14;
  const ALERT_MAX_PERIODS = 40;
  const ARRIVAL_WINDOW = 90 * 60;
  const ARRIVALS_PER_LINE = 4;

  const lineRank = (l) => {
    const i = LINE_ORDER.indexOf(l);
    return i < 0 ? LINE_ORDER.length : i;
  };

  const STATIONS = CATALOG.map(([id, borough, stops]) => {
    const platforms = stops
      .map(([stop, name, lines, north, south]) => {
        const p = { stop, name, lines: lines.split(" ") };
        if (north) p.N = north;
        if (south) p.S = south;
        return p;
      })
      .sort((a, b) => lineRank(a.lines[0]) - lineRank(b.lines[0]));
    return {
      id,
      name: [...new Set(platforms.map((p) => p.name))].join(" / "),
      borough: BOROUGHS[borough] || borough,
      lines: [...new Set(platforms.flatMap((p) => p.lines))].sort((a, b) => lineRank(a) - lineRank(b)),
      platforms,
      stops: platforms.map((p) => p.stop),
    };
  });
  const STATION_BY_ID = new Map(STATIONS.map((s) => [s.id, s]));
  const STOP_NAMES = Object.fromEntries(STATIONS.flatMap((s) => s.platforms.map((p) => [p.stop, p.name])));
  const utf8 = new TextDecoder();

  // Minimal protobuf reader for GTFS-realtime: calls visit(field, varint) or
  // visit(field, null, start, end) for length-delimited fields.
  function fields(buf, start, end, visit) {
    let pos = start;
    const varint = () => {
      let value = 0;
      let scale = 1;
      let byte;
      do {
        byte = buf[pos++];
        value += (byte & 0x7f) * scale;
        scale *= 128;
      } while (byte & 0x80);
      return value;
    };
    while (pos < end) {
      const key = varint();
      const field = Math.floor(key / 8);
      const wire = key % 8;
      if (wire === 0) visit(field, varint());
      else if (wire === 2) {
        const len = varint();
        visit(field, null, pos, pos + len);
        pos += len;
      } else if (wire === 1) pos += 8;
      else if (wire === 5) pos += 4;
      else throw new Error(`Unsupported protobuf wire type ${wire}`);
    }
  }

  function text(buf, start, end) {
    return utf8.decode(buf.subarray(start, end));
  }

  function parseTripUpdate(buf, start, end) {
    const trip = { routeId: "", assigned: false, stops: [] };
    fields(buf, start, end, (f, _v, s, e) => {
      if (s == null) return;
      if (f === 1) {
        fields(buf, s, e, (tf, _tv, ts, te) => {
          if (ts == null) return;
          if (tf === 5) trip.routeId = text(buf, ts, te);
          else if (tf === 1001) fields(buf, ts, te, (nf, nv) => {
            if (nf === 2) trip.assigned = nv === 1;
          });
        });
      } else if (f === 2) {
        const stop = { stopId: "", arrival: 0, departure: 0 };
        fields(buf, s, e, (sf, _sv, ss, se) => {
          if (ss == null) return;
          if (sf === 4) stop.stopId = text(buf, ss, se);
          else if (sf === 2 || sf === 3) {
            let time = 0;
            fields(buf, ss, se, (xf, xv) => {
              if (xf === 2) time = xv;
            });
            if (sf === 2) stop.arrival = time;
            else stop.departure = time;
          }
        });
        trip.stops.push(stop);
      }
    });
    return trip;
  }

  function parseFeed(buf) {
    const trips = [];
    fields(buf, 0, buf.length, (f, _v, s, e) => {
      if (f !== 2 || s == null) return;
      fields(buf, s, e, (ef, _ev, es, ee) => {
        if (ef === 3 && es != null) trips.push(parseTripUpdate(buf, es, ee));
      });
    });
    return trips;
  }

  // Next trains for the given stop IDs: { stop: { N: [...], S: [...] } }, soonest first,
  // keeping up to ARRIVALS_PER_LINE per line so a busy platform still shows its rarer lines.
  function buildArrivals(tripLists, stops, nowSec) {
    const wanted = new Set(stops);
    const out = {};
    for (const trips of tripLists) {
      for (const trip of trips) {
        const n = trip.stops.length;
        if (n < 2) continue;
        // Some trips end at internal track IDs with no station name; use the last named stop.
        let dest = "";
        for (let k = n - 1; k >= 0 && !dest; k--) dest = STOP_NAMES[trip.stops[k].stopId.slice(0, -1)] || "";
        // The last stop is skipped: a train ending its trip there can't be boarded.
        for (let i = 0; i < n - 1; i++) {
          const stop = trip.stops[i];
          const parent = stop.stopId.slice(0, -1);
          const dir = stop.stopId.slice(-1);
          if (!wanted.has(parent) || (dir !== "N" && dir !== "S")) continue;
          const t = i === 0 ? stop.departure || stop.arrival : stop.arrival || stop.departure;
          if (!t || t < nowSec - 30 || t > nowSec + ARRIVAL_WINDOW) continue;
          const entry = { line: trip.routeId, dest, t };
          if (!trip.assigned) entry.scheduled = true;
          ((out[parent] ||= {})[dir] ||= []).push(entry);
        }
      }
    }
    for (const byDir of Object.values(out)) {
      for (const dir of Object.keys(byDir)) {
        const perLine = {};
        byDir[dir] = byDir[dir]
          .sort((a, b) => a.t - b.t)
          .filter((x) => (perLine[x.line] = (perLine[x.line] || 0) + 1) <= ARRIVALS_PER_LINE);
      }
    }
    return out;
  }

  function english(field) {
    const t = ((field && field.translation) || []).find((x) => x.language === "en");
    return t ? t.text.trim() : "";
  }

  // Every subway alert in effect now or within ALERT_KEEP_DAYS, for all lines and stops.
  function buildAlerts(feed, fetchedAt) {
    const alerts = [];
    const horizon = fetchedAt + ALERT_KEEP_DAYS * 86400;
    for (const ent of feed.entity || []) {
      const a = ent.alert;
      if (!a) continue;
      const lines = new Set();
      const stopsByLine = {};
      for (const ie of a.informed_entity || []) {
        const line = LINE_ALIASES[ie.route_id] || ie.route_id;
        if (!line) continue;
        lines.add(line);
        if (ie.stop_id) (stopsByLine[line] ||= new Set()).add(ie.stop_id);
      }
      if (!lines.size) continue;

      const periods = (a.active_period || [])
        .map((p) => [Number(p.start || 0), p.end ? Number(p.end) : null])
        .filter(([s, e]) => (e === null || e > fetchedAt) && s < horizon)
        .sort((x, y) => x[0] - y[0])
        .slice(0, ALERT_MAX_PERIODS);
      if (!periods.length) continue;

      const meta = a["transit_realtime.mercury_alert"] || {};
      alerts.push({
        id: ent.id,
        kind: ent.id.startsWith("lmm:planned_work") ? "planned" : "live",
        type: meta.alert_type || "Service change",
        lines: [...lines],
        wholeLine: [...lines].filter((l) => !stopsByLine[l]),
        stopsByLine: Object.fromEntries(Object.entries(stopsByLine).map(([l, s]) => [l, [...s]])),
        header: english(a.header_text),
        description: english(a.description_text),
        when: english(meta.human_readable_active_period),
        updated: Number(meta.updated_at || meta.created_at || fetchedAt),
        periods,
      });
    }
    return alerts;
  }

  async function get(fetchFn, url, kind) {
    const opts = {};
    if (typeof AbortSignal !== "undefined" && AbortSignal.timeout) opts.signal = AbortSignal.timeout(20000);
    if (typeof window !== "undefined") opts.cache = "no-store";
    const res = await fetchFn(url, opts);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return kind === "json" ? res.json() : new Uint8Array(await res.arrayBuffer());
  }

  function arrivalsFor(cache, stops, nowSec) {
    return buildArrivals(Object.values(cache.trips || {}), stops, nowSec);
  }

  // `cache` carries the last good result of each source between calls, so one
  // failed feed keeps its previous data instead of blanking part of the page.
  async function loadData(fetchFn, cache, stops) {
    cache.trips ||= {};
    cache.tripsAt ||= {};
    const now = Math.floor(Date.now() / 1000);
    const [alertsResult, ...feedResults] = await Promise.allSettled([
      get(fetchFn, ALERTS_URL, "json"),
      ...TRAIN_FEEDS.map((f) => get(fetchFn, f.url, "bytes")),
    ]);

    const reason = (r) => String((r.reason && r.reason.message) || r.reason);
    const failed = [];
    if (alertsResult.status === "fulfilled") {
      cache.alerts = buildAlerts(alertsResult.value, now);
      cache.alertsAt = now;
    } else {
      failed.push({ source: "service alerts", error: reason(alertsResult) });
    }
    feedResults.forEach((r, i) => {
      const feed = TRAIN_FEEDS[i];
      if (r.status === "fulfilled") {
        cache.trips[feed.url] = parseFeed(r.value);
        cache.tripsAt[feed.url] = now;
      } else {
        failed.push({ source: `${feed.lines} train times`, error: reason(r) });
      }
    });

    const tripTimes = TRAIN_FEEDS.map((f) => cache.tripsAt[f.url]).filter(Boolean);
    return {
      ok: failed.length < TRAIN_FEEDS.length + 1,
      fetchedAt: now,
      alertsAt: cache.alertsAt || 0,
      arrivalsAt: tripTimes.length ? Math.min(...tripTimes) : 0,
      failed,
      alerts: cache.alerts || [],
      arrivals: arrivalsFor(cache, stops, now),
      arrivalStops: [...stops],
    };
  }

  return {
    STATIONS,
    STATION_BY_ID,
    DEFAULT_STATION_IDS,
    LINE_ALIASES,
    parseFeed,
    buildAlerts,
    buildArrivals,
    arrivalsFor,
    loadData,
  };
});
