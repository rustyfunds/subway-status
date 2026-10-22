// Loads MTA service alerts and real-time train times for any subway station.
// Shared by subway-status.html (live refresh in the browser) and sync-subway.js (Node snapshot).
// CATALOG is every station complex from the MTA's station list (data.ny.gov 39hk-dx4f):
// [complex ID, borough, [lat, lon], [[GTFS stop ID, stop name, lines, north label, south label], ...]].
// EQUIPMENT_STATIONS maps elevator/escalator IDs to complex IDs (from nyct_ene_equipments.json),
// since the outage feed names stations only in words.
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.SubwayCore = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const API = "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/";
  const ALERTS_URL = API + "camsys%2Fsubway-alerts.json";
  const OUTAGES_URL = API + "nyct%2Fnyct_ene.json";
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

  const CATALOG = [["37","Bk",[40.62974,-74.02551],[["R43","77 St","R","Manhattan","Bay Ridge"]]],["611","M",[40.75575,-73.98758],[["127","Times Sq-42 St","1 2 3","Uptown","Downtown"],["725","Times Sq-42 St","7","Queens","Hudson Yards"],["R16","Times Sq-42 St","N Q R W","Uptown","Downtown"],["902","Times Sq-42 St","GS","","Grand Central"],["A27","42 St-Port Authority Bus Terminal","A C E","Uptown","Downtown"]]],["515","SI",[40.54046,-74.17822],[["S17","Annadale","SI","Ferry","South Shore"]]],["627","Bk",[40.68099,-73.95634],[["S01","Franklin Av","FS","","Prospect Park"],["A45","Franklin Av","C","Manhattan","Outbound"]]],["349","Bk",[40.66351,-73.90245],[["254","Junius St","3","Manhattan","New Lots"]]],["108","Q",[40.7114,-73.8896],[["M01","Middle Village-Metropolitan Av","M","Inbound",""]]],["471","M",[40.75588,-74.00191],[["726","34 St-Hudson Yards","7","","Queens"]]],["457","Q",[40.74415,-73.91255],[["713","52 St","7","Outbound","Manhattan"]]],["373","Bx",[40.81212,-73.9041],[["615","E 149 St","6","Northbound","Manhattan"]]],["97","Bk",[40.69721,-73.93566],[["M11","Myrtle Av","M J Z","Outbound","Manhattan"]]],["234","M",[40.71372,-73.99017],[["F16","East Broadway","F","Uptown","Brooklyn"]]],["248","Bk",[40.61514,-73.9742],[["F33","Avenue N","F","Manhattan","Southbound"]]],["336","Bk",[40.69055,-73.98507],[["233","Hoyt St","2 3","Manhattan","Outbound"]]],["110","Q",[40.70442,-73.90308],[["M05","Forest Av","M","Inbound","Middle Village"]]],["502","SI",[40.63695,-74.07483],[["S30","Tompkinsville","SI","Ferry","South Shore"]]],["624","M",[40.7126,-74.00955],[["A36","Chambers St","A C","Uptown","Brooklyn"],["R25","Cortlandt St","R W","Uptown","Downtown"],["E01","World Trade Center","E","Uptown",""],["228","Park Place","2 3","Uptown","Brooklyn"]]],["363","Bx",[40.83989,-73.84295],[["604","Westchester Sq-E Tremont Av","6","Pelham Bay","Manhattan"]]],["217","Bx",[40.83931,-73.9134],[["D09","170 St","B D","Northbound","Manhattan"]]],["613","M",[40.76259,-73.96761],[["629","59 St","4 5 6","Uptown","Downtown"],["R11","Lexington Av/59 St","N R W","Queens","Downtown"]]],["432","Bx",[40.81958,-73.90177],[["219","Prospect Av","2 5","Northbound","Manhattan"]]],["253","Bk",[40.58101,-73.97457],[["F39","Neptune Av","F","Manhattan","Coney Island"]]],["78","Bk",[40.59747,-73.97914],[["N09","Avenue U","N","Manhattan","Coney Island"]]],["368","Bx",[40.82952,-73.87452],[["610","Morrison Av-Soundview","6","Northbound","Manhattan"]]],["247","Bk",[40.62077,-73.97526],[["F32","Bay Pkwy","F","Manhattan","Southbound"]]],["8","M",[40.76481,-73.97335],[["R13","5 Av/59 St","N R W","Queens","Downtown"]]],["69","Bk",[40.5977,-73.98683],[["B22","25 Av","D","Manhattan","Coney Island"]]],["393","M",[40.79863,-73.94162],[["622","116 St","6","The Bronx","Downtown"]]],["202","Q",[40.58321,-73.82756],[["H14","Beach 105 St","A H","Inbound","Rockaway Park"]]],["258","Q",[40.70918,-73.82057],[["F05","Briarwood","E F","Jamaica","Manhattan"]]],["14","M",[40.7413,-73.98934],[["R19","23 St","R W","Uptown","Downtown"]]],["13","M",[40.74549,-73.98869],[["R18","28 St","R W","Uptown","Downtown"]]],["304","M",[40.82655,-73.95036],[["114","145 St","1","Uptown","Downtown"]]],["144","M",[40.86549,-73.92727],[["A03","Dyckman St","A","Uptown","Downtown"]]],["101","Bk",[40.70836,-73.95776],[["M16","Marcy Av","M J Z","Outbound","Manhattan"]]],["463","Q",[40.74222,-73.94892],[["720","Hunters Point Av","7","Outbound","Manhattan"]]],["154","M",[40.80508,-73.95488],[["A16","116 St","C B","Uptown","Downtown"]]],["636","Bk",[40.69226,-73.98664],[["A41","Jay St-MetroTech","A C F","Manhattan","Outbound"],["R29","Jay St-MetroTech","R","Manhattan","Southbound"]]],["33","Bk",[40.64894,-74.01001],[["R39","45 St","R","Manhattan","Southbound"]]],["185","Bk",[40.67454,-73.89655],[["A52","Liberty Av","C","Manhattan","Outbound"]]],["290","Bk",[40.68887,-73.96007],[["G34","Classon Av","G","Queens","Southbound"]]],["46","Bk",[40.64093,-73.96389],[["D30","Cortelyou Rd","Q","Manhattan","Southbound"]]],["272","Q",[40.75204,-73.92878],[["G20","36 St","M R","Outbound","Manhattan"]]],["628","M",[40.71009,-74.00784],[["418","Fulton St","4 5","Uptown","Downtown"],["229","Fulton St","2 3","Uptown","Brooklyn"],["A38","Fulton St","A C","Uptown","Brooklyn"],["M22","Fulton St","J Z","Brooklyn","Downtown"]]],["425","Bx",[40.84883,-73.86846],[["212","Bronx Park East","2 5","Northbound","Manhattan"]]],["444","Bx",[40.86953,-73.84638],[["503","Gun Hill Rd","5","Eastchester","Manhattan"]]],["65","Bk",[40.6135,-74.00061],[["B18","79 St","D","Manhattan","Southbound"]]],["629","Bk",[40.71343,-73.95085],[["G29","Metropolitan Av","G","Queens","Southbound"],["L10","Lorimer St","L","Manhattan","Outbound"]]],["273","Q",[40.74897,-73.93724],[["G21","Queens Plaza","E F R","Outbound","Manhattan"]]],["381","Bx",[40.86776,-73.89717],[["406","Kingsbridge Rd","4","Northbound","Manhattan"]]],["623","M",[40.7187,-74.00058],[["R23","Canal St","R W","Uptown","Downtown"],["M20","Canal St","J Z","Brooklyn","Downtown"],["639","Canal St","6","Uptown","Downtown"],["Q01","Canal St","N Q","Uptown","Downtown"]]],["300","M",[40.85522,-73.92941],[["110","191 St","1","The Bronx","Downtown"]]],["262","Q",[40.72652,-73.85272],[["G09","67 Av","M R","Outbound","Manhattan"]]],["621","Bk",[40.6789,-73.90436],[["A51","Broadway Junction","A C","Manhattan","Outbound"],["J27","Broadway Junction","J Z","Outbound","Manhattan"],["L22","Broadway Junction","L","Manhattan","Outbound"]]],["1","Q",[40.77504,-73.91203],[["R01","Astoria-Ditmars Blvd","N W","","Manhattan"]]],["358","Bk",[40.63997,-73.94841],[["246","Newkirk Av-Little Haiti","2 5","Manhattan","Flatbush"]]],["126","Bk",[40.70661,-73.92291],[["L15","Jefferson St","L","Manhattan","Outbound"]]],["507","SI",[40.58885,-74.09609],[["S25","Dongan Hills","SI","Ferry","South Shore"]]],["196","Q",[40.6721,-73.83592],[["H01","Aqueduct Racetrack","A","Manhattan","Rockaways"]]],["89","Bk",[40.67995,-73.88464],[["J22","Cleveland St","J","Outbound","Manhattan"]]],["158","M",[40.78587,-73.96892],[["A20","86 St","C B","Uptown","Downtown"]]],["189","Bk",[40.67704,-73.86505],[["A57","Grant Av","A","Manhattan","Queens"]]],["268","Q",[40.74967,-73.89845],[["G15","65 St","M R","Outbound","Manhattan"]]],["50","Bk",[40.61762,-73.9594],[["D34","Avenue M","Q","Manhattan","Southbound"]]],["294","Bx",[40.88467,-73.90087],[["103","238 St","1","Van Cortlandt","Manhattan"]]],["341","Bk",[40.67199,-73.96438],[["238","Eastern Pkwy-Brooklyn Museum","2 3","Manhattan","Outbound"]]],["619","M",[40.72561,-73.99543],[["637","Bleecker St","6","Uptown","Downtown"],["D21","Broadway-Lafayette St","B D F M","Uptown","Downtown"]]],["45","Bk",[40.64403,-73.96449],[["D29","Beverley Rd","Q","Manhattan","Southbound"]]],["449","Q",[40.75173,-73.85533],[["705","111 St","7","Outbound","Manhattan"]]],["153","M",[40.81111,-73.95234],[["A15","125 St","A C B D","Uptown","Downtown"]]],["228","M",[40.74288,-73.99282],[["D18","23 St","F M","Uptown","Downtown"]]],["413","M",[40.70756,-74.01186],[["419","Wall St","4 5","Uptown","Downtown"]]],["77","Bk",[40.60392,-73.98035],[["N08","Kings Hwy","N","Manhattan","Coney Island"]]],["305","M",[40.82201,-73.95368],[["115","137 St-City College","1","Uptown","Downtown"]]],["440","M",[40.8021,-73.94962],[["226","116 St","2 3","Uptown","Downtown"]]],["326","M",[40.71932,-74.00689],[["136","Franklin St","1","Uptown","Downtown"]]],["385","Bx",[40.84848,-73.91179],[["410","176 St","4","Northbound","Manhattan"]]],["277","M",[40.76286,-73.98164],[["D14","7 Av","E B D","Outbound","Downtown"]]],["216","Bx",[40.8459,-73.91014],[["D08","174-175 Sts","B D","Northbound","Manhattan"]]],["165","M",[40.74591,-73.99804],[["A30","23 St","C E","Uptown","Downtown"]]],["179","Bk",[40.68044,-73.95043],[["A46","Nostrand Av","A C","Manhattan","Outbound"]]],["72","Bk",[40.63139,-74.00535],[["N03","Fort Hamilton Pkwy","N","Manhattan","Coney Island"]]],["445","Bx",[40.85898,-73.85536],[["504","Pelham Pkwy","5","Eastchester","Manhattan"]]],["5","Q",[40.7568,-73.92957],[["R06","36 Av","N W","Astoria","Manhattan"]]],["211","Bx",[40.87324,-73.88714],[["D03","Bedford Park Blvd","B D","Northbound","Manhattan"]]],["377","Bx",[40.81048,-73.92614],[["619","3 Av-138 St","6","Northbound","Manhattan"]]],["114","Bk",[40.69786,-73.9274],[["M10","Central Av","M","Inbound","Middle Village"]]],["354","Bk",[40.66274,-73.95085],[["242","Sterling St","2 5","Manhattan","Flatbush"]]],["238","Bk",[40.67358,-73.99596],[["F22","Smith-9 Sts","F G","Northbound","Southbound"]]],["369","Bx",[40.82858,-73.87916],[["611","Elder Av","6","Northbound","Manhattan"]]],["475","M",[40.78432,-73.94715],[["Q05","96 St","Q","","Downtown"]]],["503","SI",[40.62792,-74.07516],[["S29","Stapleton","SI","Ferry","South Shore"]]],["109","Q",[40.70619,-73.89588],[["M04","Fresh Pond Rd","M","Inbound","Middle Village"]]],["149","M",[40.83601,-73.93989],[["A10","163 St-Amsterdam Av","C","Uptown","Downtown"]]],["26","Bk",[40.69064,-73.98182],[["R30","DeKalb Av","B Q R","Manhattan","Southbound"]]],["404","M",[40.74307,-73.98426],[["633","28 St","6","Uptown","Downtown"]]],["309","M",[40.79945,-73.96838],[["119","103 St","1","Uptown","Downtown"]]],["221","Q",[40.7542,-73.94284],[["B04","21 St-Queensbridge","M","Outbound","Manhattan"]]],["417","Bx",[40.89838,-73.85438],[["204","Nereid Av","2 5","Northbound","Manhattan"]]],["82","Q",[40.69518,-73.84433],[["J14","104 St","J Z","Jamaica","Manhattan"]]],["133","Bk",[40.67535,-73.9031],[["L24","Atlantic Av","L","Manhattan","Canarsie"]]],["337","Bk",[40.68825,-73.98049],[["234","Nevins St","2 3 4 5","Manhattan","Outbound"]]],["134","Bk",[40.66937,-73.90197],[["L25","Sutter Av","L","Manhattan","Canarsie"]]],["617","Bk",[40.68416,-73.97779],[["D24","Atlantic Av-Barclays Ctr","B Q","Manhattan","Southbound"],["R31","Atlantic Av-Barclays Ctr","D N R","Manhattan","Southbound"],["235","Atlantic Av-Barclays Ctr","2 3 4 5","Manhattan","Outbound"]]],["364","Bx",[40.83649,-73.84704],[["606","Zerega Av","6","Pelham Bay","Manhattan"]]],["243","Bk",[40.64404,-73.97968],[["F27","Church Av","F G","Northbound","Southbound"]]],["57","Bk",[40.57613,-73.97594],[["D42","W 8 St-NY Aquarium","F Q","Manhattan","Coney Island"]]],["249","Bk",[40.60894,-73.97302],[["F34","Avenue P","F","Manhattan","Southbound"]]],["604","Bx",[40.82795,-73.92574],[["414","161 St-Yankee Stadium","4","Northbound","Manhattan"],["D11","161 St-Yankee Stadium","B D","Northbound","Manhattan"]]],["436","M",[40.82388,-73.93647],[["301","Harlem-148 St","3","","Downtown"]]],["601","M",[40.7378,-73.99773],[["132","14 St","1 2 3","Uptown","Downtown"],["D19","14 St","F M","Uptown","Downtown"],["L02","6 Av","L","West Side","Brooklyn"]]],["206","Q",[40.59294,-73.77601],[["H08","Beach 44 St","A","Manhattan","Far Rockaway"]]],["431","Bx",[40.82218,-73.89674],[["218","Intervale Av","2 5","Northbound","Manhattan"]]],["416","Bx",[40.90313,-73.85062],[["201","Wakefield-241 St","2","","Manhattan"]]],["625","M",[40.71846,-73.98778],[["F15","Delancey St-Essex St","F","Uptown","Brooklyn"],["M18","Delancey St-Essex St","M J Z","Brooklyn","Inbound"]]],["81","Q",[40.69742,-73.83634],[["J13","111 St","J","Jamaica","Manhattan"]]],["254","Q",[40.71265,-73.78382],[["F01","Jamaica-179 St","F","","Manhattan"]]],["372","Bx",[40.8161,-73.89643],[["614","Longwood Av","6","Northbound","Manhattan"]]],["308","M",[40.80397,-73.96685],[["118","Cathedral Pkwy (110 St)","1","Uptown","Downtown"]]],["9","M",[40.76466,-73.98066],[["R14","57 St-7 Av","N Q R W","Uptown","Downtown"]]],["365","Bx",[40.83425,-73.85122],[["607","Castle Hill Av","6","Pelham Bay","Manhattan"]]],["68","Bk",[40.60187,-73.99373],[["B21","Bay Pkwy","D","Manhattan","Southbound"]]],["394","M",[40.79502,-73.94425],[["623","110 St","6","The Bronx","Downtown"]]],["333","M",[40.70682,-74.0091],[["230","Wall St","2 3","Uptown","Brooklyn"]]],["201","Q",[40.58531,-73.82056],[["H13","Beach 98 St","A H","Inbound","Rockaway Park"]]],["10","M",[40.7599,-73.98414],[["R15","49 St","N R W","Uptown","Downtown"]]],["220","M",[40.83013,-73.93821],[["D12","155 St","B D","The Bronx","Downtown"]]],["516","SI",[40.53367,-74.19179],[["S16","Huguenot","SI","Ferry","South Shore"]]],["350","Bk",[40.66463,-73.8949],[["255","Pennsylvania Av","3","Manhattan","New Lots"]]],["458","Q",[40.74313,-73.91844],[["714","46 St-Bliss St","7","Outbound","Manhattan"]]],["426","Bx",[40.84189,-73.87349],[["213","E 180 St","2 5","Northbound","Manhattan"]]],["384","Bx",[40.85345,-73.90768],[["409","Burnside Av","4","Northbound","Manhattan"]]],["476","M",[40.77789,-73.95179],[["Q04","86 St","Q","Uptown","Downtown"]]],["276","M",[40.76017,-73.97522],[["F12","5 Av/53 St","E F","Queens","Downtown"]]],["286","Bk",[40.70609,-73.95031],[["G30","Broadway","G","Queens","Southbound"]]],["614","M",[40.76827,-73.98183],[["A24","59 St-Columbus Circle","A C B D","Uptown","Downtown"],["125","59 St-Columbus Circle","1","Uptown","Downtown"]]],["421","Bx",[40.87785,-73.86626],[["208","Gun Hill Rd","2 5","Northbound","Manhattan"]]],["318","M",[40.75037,-73.99106],[["128","34 St-Penn Station","1 2 3","Uptown","Downtown"]]],["53","Bk",[40.59525,-73.95516],[["D38","Neck Rd","Q","Manhattan","Southbound"]]],["192","Q",[40.68043,-73.84385],[["A61","Rockaway Blvd","A","Manhattan","Outbound"]]],["36","Bk",[40.63497,-74.02338],[["R42","Bay Ridge Av","R","Manhattan","Bay Ridge"]]],["58","Bk",[40.57742,-73.98123],[["D43","Coney Island-Stillwell Av","D F N Q","Manhattan",""]]],["399","M",[40.76814,-73.96387],[["628","68 St-Hunter College","6","Uptown","Downtown"]]],["269","Q",[40.75288,-73.90601],[["G16","Northern Blvd","M R","Outbound","Manhattan"]]],["138","Bk",[40.64665,-73.90185],[["L29","Canarsie-Rockaway Pkwy","L","Manhattan",""]]],["618","M",[40.74034,-74.00213],[["A31","14 St","A C E","Uptown","Downtown"],["L01","8 Av","L","","Brooklyn"]]],["606","Q",[40.74714,-73.94503],[["G22","Court Sq","G","","Brooklyn"],["719","Court Sq","7","Outbound","Manhattan"],["F09","Court Sq-23 St","E F","Outbound","Manhattan"]]],["340","Bk",[40.67524,-73.97105],[["237","Grand Army Plaza","2 3","Manhattan","Outbound"]]],["96","Bk",[40.69334,-73.92881],[["J31","Kosciuszko St","J","Outbound","Manhattan"]]],["113","Bk",[40.69866,-73.91971],[["M09","Knickerbocker Av","M","Inbound","Middle Village"]]],["376","Bx",[40.80757,-73.91924],[["618","Brook Av","6","Northbound","Manhattan"]]],["197","Q",[40.66823,-73.83406],[["H02","Aqueduct-N Conduit Av","A","Manhattan","Rockaways"]]],["511","SI",[40.56511,-74.12632],[["S21","Oakwood Heights","SI","Ferry","South Shore"]]],["313","M",[40.77845,-73.98197],[["123","72 St","1 2 3","Uptown","Downtown"]]],["64","Bk",[40.61959,-73.99886],[["B17","71 St","D","Manhattan","Southbound"]]],["345","Bk",[40.6689,-73.93294],[["250","Crown Hts-Utica Av","3 4","Manhattan","Outbound"]]],["453","Q",[40.74766,-73.8837],[["709","82 St-Jackson Hts","7","Outbound","Manhattan"]]],["90","Bk",[40.67802,-73.89169],[["J23","Van Siclen Av","J Z","Outbound","Manhattan"]]],["122","Bk",[40.71457,-73.94405],[["L11","Graham Av","L","Manhattan","Outbound"]]],["85","Q",[40.69132,-73.86714],[["J17","75 St-Elderts Ln","J Z","Jamaica","Manhattan"]]],["448","Q",[40.75462,-73.84562],[["702","Mets-Willets Point","7","Outbound","Manhattan"]]],["409","M",[40.7223,-73.99714],[["638","Spring St","6","Uptown","Downtown"]]],["224","M",[40.76397,-73.97745],[["B10","57 St","M","Uptown","Downtown"]]],["441","M",[40.79908,-73.95182],[["227","110 St-Malcolm X Plaza","2 3","Uptown","Downtown"]]],["157","M",[40.79164,-73.9647],[["A19","96 St","C B","Uptown","Downtown"]]],["32","Bk",[40.65514,-74.00355],[["R36","36 St","D N R","Manhattan","Southbound"]]],["257","Q",[40.70546,-73.81071],[["F04","Sutphin Blvd","F","Jamaica","Manhattan"]]],["188","Bk",[40.67538,-73.87211],[["A55","Euclid Av","A C","Manhattan","Queens"]]],["17","M",[40.72433,-73.9977],[["R22","Prince St","R W","Uptown","Downtown"]]],["301","M",[40.84951,-73.9336],[["111","181 St","1","The Bronx","Downtown"]]],["506","SI",[40.59661,-74.08737],[["S26","Old Town","SI","Ferry","South Shore"]]],["169","M",[40.72082,-74.00523],[["A34","Canal St","A C E","Uptown","Downtown"]]],["143","M",[40.86807,-73.9199],[["A02","Inwood-207 St","A","","Downtown"]]],["49","Bk",[40.62504,-73.9608],[["D33","Avenue J","Q","Manhattan","Southbound"]]],["357","Bk",[40.6451,-73.94896],[["245","Beverly Rd","2 5","Manhattan","Flatbush"]]],["452","Q",[40.74841,-73.87661],[["708","90 St-Elmhurst Av","7","Outbound","Manhattan"]]],["100","Bk",[40.70687,-73.95343],[["M14","Hewes St","M J","Outbound","Manhattan"]]],["380","Bx",[40.87341,-73.89006],[["405","Bedford Park Blvd-Lehman College","4","Northbound","Manhattan"]]],["602","M",[40.73507,-73.99042],[["L03","14 St-Union Sq","L","West Side","Brooklyn"],["635","14 St-Union Sq","4 5 6","Uptown","Downtown"],["R20","14 St-Union Sq","N Q R W","Uptown","Downtown"]]],["125","Bk",[40.70615,-73.93315],[["L14","Morgan Av","L","Manhattan","Outbound"]]],["225","M",[40.75866,-73.98133],[["D15","47-50 Sts-Rockefeller Ctr","B D F M","Uptown","Downtown"]]],["325","M",[40.72285,-74.00628],[["135","Canal St","1","Uptown","Downtown"]]],["193","Q",[40.68171,-73.83768],[["A63","104 St","A","Manhattan","Ozone Park"]]],["622","M",[40.71315,-74.00377],[["M21","Chambers St","J Z","Brooklyn","Downtown"],["640","Brooklyn Bridge-City Hall","4 5 6","Uptown","Downtown"]]],["118","M",[40.73285,-73.98612],[["L05","3 Av","L","West Side","Brooklyn"]]],["212","Bx",[40.86698,-73.89351],[["D04","Kingsbridge Rd","B D","Northbound","Manhattan"]]],["344","Bk",[40.6694,-73.94216],[["249","Kingston Av","3","Manhattan","Outbound"]]],["22","M",[40.70722,-74.01334],[["R26","Rector St","R W","Uptown","Downtown"]]],["86","Bk",[40.68994,-73.87255],[["J19","Cypress Hills","J","Queens","Manhattan"]]],["173","Bk",[40.69934,-73.99053],[["A40","High St","A C","Manhattan","Outbound"]]],["261","Q",[40.72169,-73.84452],[["G08","Forest Hills-71 Av","E F M R","Outbound","Manhattan"]]],["130","Bk",[40.68876,-73.90405],[["L20","Wilson Av","L","Manhattan","Outbound"]]],["289","Bk",[40.68963,-73.95352],[["G33","Bedford-Nostrand Avs","G","Queens","Southbound"]]],["523","SI",[40.51658,-74.2421],[["S11","Arthur Kill","SI","Ferry","Tottenville"]]],["135","Bk",[40.66404,-73.90057],[["L26","Livonia Av","L","Manhattan","Canarsie"]]],["321","M",[40.74104,-73.99787],[["131","18 St","1","Uptown","Downtown"]]],["129","Q",[40.6956,-73.90408],[["L19","Halsey St","L","Manhattan","Outbound"]]],["609","M",[40.75402,-73.98327],[["724","5 Av","7","Queens","Hudson Yards"],["D16","42 St-Bryant Pk","B D F M","Uptown","Downtown"]]],["237","Bk",[40.6803,-73.99505],[["F21","Carroll St","F G","Northbound","Southbound"]]],["353","Bk",[40.66788,-73.95068],[["241","President St-Medgar Evers College","2 5","Manhattan","Flatbush"]]],["244","Bk",[40.63612,-73.97817],[["F29","Ditmas Av","F","Manhattan","Southbound"]]],["250","Bk",[40.60322,-73.97236],[["F35","Kings Hwy","F","Manhattan","Southbound"]]],["603","Bx",[40.81839,-73.92703],[["415","149 St-Hostos","4","Northbound","Manhattan"],["222","149 St-Hostos","2 5","Northbound","Manhattan"]]],["510","SI",[40.57348,-74.11721],[["S22","New Dorp","SI","Ferry","South Shore"]]],["205","Q",[40.59237,-73.78852],[["H07","Beach 60 St","A","Manhattan","Far Rockaway"]]],["422","Bx",[40.87136,-73.86716],[["209","Burke Av","2 5","Northbound","Manhattan"]]],["41","Bk",[40.67705,-73.97237],[["D25","7 Av","B Q","Manhattan","Southbound"]]],["54","Bk",[40.5869,-73.95416],[["D39","Sheepshead Bay","B Q","Manhattan","Southbound"]]],["59","Bk",[40.64629,-73.99432],[["B12","9 Av","D","Manhattan","Southbound"]]],["167","M",[40.73234,-74.0005],[["A32","W 4 St-Wash Sq","A C E","Uptown","Downtown"],["D20","W 4 St-Wash Sq","B D F M","Uptown","Downtown"]]],["280","Q",[40.70257,-73.81686],[["G07","Jamaica-Van Wyck","E","Jamaica","Manhattan"]]],["282","Q",[40.74406,-73.94972],[["G24","21 St","G","Court Square","Brooklyn"]]],["150","M",[40.83052,-73.94151],[["A11","155 St","C","Uptown","Downtown"]]],["388","Bx",[40.83554,-73.9214],[["413","167 St","4","Northbound","Manhattan"]]],["293","Bx",[40.88925,-73.89858],[["101","Van Cortlandt Park-242 St","1","","Manhattan"]]],["162","M",[40.76246,-73.98598],[["A25","50 St","C E","Uptown","Downtown"]]],["403","M",[40.74608,-73.98208],[["632","33 St","6","Uptown","Downtown"]]],["312","M",[40.78393,-73.97992],[["122","79 St","1","Uptown","Downtown"]]],["180","Bk",[40.67992,-73.94086],[["A47","Kingston-Throop Avs","C","Manhattan","Outbound"]]],["420","Bx",[40.8839,-73.86263],[["207","219 St","2 5","Northbound","Manhattan"]]],["265","Q",[40.73701,-73.87722],[["G12","Grand Av-Newtown","M R","Outbound","Manhattan"]]],["615","Bk",[40.62566,-73.99662],[["N04","New Utrecht Av","N","Manhattan","Coney Island"],["B16","62 St","D","Manhattan","Southbound"]]],["151","M",[40.82478,-73.94422],[["A12","145 St","A C","Uptown","Downtown"],["D13","145 St","B D","Uptown","Downtown"]]],["4","Q",[40.76182,-73.92551],[["R05","Broadway","N W","Astoria","Manhattan"]]],["176","Bk",[40.68611,-73.97395],[["A43","Lafayette Av","C","Manhattan","Outbound"]]],["52","Bk",[40.5993,-73.95593],[["D37","Avenue U","Q","Manhattan","Southbound"]]],["191","Q",[40.67984,-73.85147],[["A60","88 St","A","Manhattan","Outbound"]]],["31","Bk",[40.6604,-73.99809],[["R35","25 St","R","Manhattan","Southbound"]]],["270","Q",[40.75631,-73.91333],[["G18","46 St","M R","Outbound","Manhattan"]]],["292","Bk",[40.68712,-73.97537],[["G36","Fulton St","G","Queens","Southbound"]]],["620","Bk",[40.69324,-73.99064],[["423","Borough Hall","4 5","Manhattan","Outbound"],["232","Borough Hall","2 3","Manhattan","Outbound"],["R28","Court St","R","Manhattan","Southbound"]]],["307","M",[40.80772,-73.96411],[["117","116 St-Columbia University","1","Uptown","Downtown"]]],["366","Bx",[40.83323,-73.86082],[["608","Parkchester","6","Northbound","Manhattan"]]],["405","M",[40.73986,-73.9866],[["634","23 St-Baruch College","6","Uptown","Downtown"]]],["204","Q",[40.59093,-73.79692],[["H06","Beach 67 St","A","Manhattan","Far Rockaway"]]],["383","Bx",[40.85841,-73.90388],[["408","183 St","4","Northbound","Manhattan"]]],["612","M",[40.75733,-73.97049],[["F11","Lexington Av/53 St","E F","Queens","Downtown"],["630","51 St","6","Uptown","Downtown"]]],["42","Bk",[40.66161,-73.96225],[["D26","Prospect Park","B Q FS","Northbound","Southbound"]]],["319","M",[40.74721,-73.99336],[["129","28 St","1","Uptown","Downtown"]]],["20","M",[40.71328,-74.00698],[["R24","City Hall","R W","Uptown","Downtown"]]],["260","Q",[40.71833,-73.83732],[["F07","75 Av","E F","Jamaica","Manhattan"]]],["74","Bk",[40.62067,-73.99041],[["N05","18 Av","N","Manhattan","Coney Island"]]],["605","M",[40.84064,-73.93985],[["112","168 St-Washington Hts","1","Uptown","Downtown"],["A09","168 St","A C","Uptown","Downtown"]]],["437","M",[40.82042,-73.93624],[["302","145 St","3","Harlem","Downtown"]]],["146","M",[40.85169,-73.93797],[["A06","181 St","A","Uptown","Downtown"]]],["297","M",[40.86944,-73.91528],[["107","215 St","1","The Bronx","Downtown"]]],["95","Bk",[40.68963,-73.92227],[["J30","Gates Av","J Z","Outbound","Manhattan"]]],["459","Q",[40.74378,-73.92402],[["715","40 St-Lowery St","7","Outbound","Manhattan"]]],["236","Bk",[40.68615,-73.99086],[["F20","Bergen St","F G","Northbound","Southbound"]]],["181","Bk",[40.67936,-73.93073],[["A48","Utica Av","A C","Manhattan","Outbound"]]],["477","M",[40.7688,-73.95842],[["Q03","72 St","Q","Uptown","Downtown"]]],["334","Bk",[40.69747,-73.99309],[["231","Clark St","2 3","Manhattan","Outbound"]]],["160","M",[40.77559,-73.97641],[["A22","72 St","C B","Uptown","Downtown"]]],["187","Bk",[40.67413,-73.88075],[["A54","Shepherd Av","C","Manhattan","Outbound"]]],["35","Bk",[40.64136,-74.01788],[["R41","59 St","N R","Manhattan","Southbound"]]],["361","Bx",[40.84681,-73.83257],[["602","Buhre Av","6","Pelham Bay","Manhattan"]]],["398","M",[40.77362,-73.95987],[["627","77 St","6","Uptown","Downtown"]]],["48","Bk",[40.62927,-73.96164],[["D32","Avenue H","Q","Manhattan","Southbound"]]],["329","M",[40.70751,-74.01378],[["139","Rector St","1","Uptown","Downtown"]]],["6","Q",[40.75288,-73.93276],[["R08","39 Av-Dutch Kills","N W","Astoria","Manhattan"]]],["512","SI",[40.5564,-74.13691],[["S20","Bay Terrace","SI","Ferry","South Shore"]]],["80","Q",[40.70049,-73.82829],[["J12","121 St","J Z","Jamaica","Manhattan"]]],["324","M",[40.72825,-74.00537],[["134","Houston St","1","Uptown","Downtown"]]],["255","Q",[40.71047,-73.7936],[["F02","169 St","F","Jamaica","Manhattan"]]],["245","Bk",[40.62976,-73.97697],[["F30","18 Av","F","Manhattan","Southbound"]]],["442","Bx",[40.8883,-73.83083],[["501","Eastchester-Dyre Av","5","","Manhattan"]]],["287","Bk",[40.70038,-73.95023],[["G31","Flushing Av","G","Queens","Southbound"]]],["346","Bk",[40.66472,-73.92261],[["251","Sutter Av-Rutland Rd","3","Manhattan","New Lots"]]],["427","Bx",[40.84029,-73.88005],[["214","West Farms Sq-E Tremont Av","2 5","Northbound","Manhattan"]]],["395","M",[40.7906,-73.94748],[["624","103 St","6","The Bronx","Downtown"]]],["208","Q",[40.60007,-73.76135],[["H10","Beach 25 St","A","Manhattan","Far Rockaway"]]],["16","M",[40.73033,-73.99263],[["R21","8 St-NYU","R W","Uptown","Downtown"]]],["123","Bk",[40.71193,-73.94067],[["L12","Grand St","L","Manhattan","Outbound"]]],["517","SI",[40.52551,-74.20006],[["S15","Prince's Bay","SI","Ferry","South Shore"]]],["351","Bk",[40.66545,-73.88939],[["256","Van Siclen Av","3","Manhattan","New Lots"]]],["447","Q",[40.7596,-73.83003],[["701","Flushing-Main St","7","","Manhattan"]]],["626","Bk",[40.67051,-73.95869],[["S04","Botanic Garden","FS","Franklin Av","Prospect Park"],["239","Franklin Av-Medgar Evers College","2 3 4 5","Manhattan","Outbound"]]],["213","Bx",[40.8613,-73.89775],[["D05","Fordham Rd","B D","Northbound","Manhattan"]]],["339","Bk",[40.68083,-73.9751],[["236","Bergen St","2 3","Manhattan","Outbound"]]],["630","Bk",[40.69962,-73.91199],[["M08","Myrtle-Wyckoff Avs","M","Inbound","Middle Village"],["L17","Myrtle-Wyckoff Avs","L","Manhattan","Outbound"]]],["314","M",[40.77344,-73.98221],[["124","66 St-Lincoln Center","1","Uptown","Downtown"]]],["240","Bk",[40.66627,-73.98031],[["F24","7 Av","F G","Northbound","Southbound"]]],["375","Bx",[40.80537,-73.91404],[["617","Cypress Av","6","Northbound","Manhattan"]]],["156","M",[40.79609,-73.96145],[["A18","103 St","C B","Uptown","Downtown"]]],["198","Q",[40.66048,-73.8303],[["H03","Howard Beach-JFK Airport","A","Manhattan","Rockaways"]]],["356","Bk",[40.65084,-73.94957],[["244","Church Av","2 5","Manhattan","Flatbush"]]],["616","Q",[40.74675,-73.89137],[["710","74 St-Broadway","7","Outbound","Manhattan"],["G14","Jackson Hts-Roosevelt Av","E F M R","Outbound","Manhattan"]]],["91","Bk",[40.67699,-73.89865],[["J24","Alabama Av","J Z","Outbound","Manhattan"]]],["131","Bk",[40.68283,-73.90525],[["L21","Bushwick Av-Aberdeen St","L","Manhattan","Outbound"]]],["28","Bk",[40.67732,-73.98311],[["R32","Union St","R","Manhattan","Southbound"]]],["610","M",[40.75199,-73.97736],[["631","Grand Central-42 St","4 5 6","Uptown","Downtown"],["723","Grand Central-42 St","7","Queens","Hudson Yards"],["901","Grand Central-42 St","GS","Times Square",""]]],["84","Q",[40.69244,-73.86001],[["J16","85 St-Forest Pkwy","J","Jamaica","Manhattan"]]],["223","M",[40.76463,-73.96611],[["B08","Lexington Av/63 St","M Q","Uptown & Queens","Downtown"]]],["635","M",[40.70258,-74.01333],[["R27","Whitehall St-South Ferry","R W","Uptown","Downtown"],["142","South Ferry","1","Uptown",""]]],["430","Bx",[40.82407,-73.89306],[["217","Simpson St","2 5","Northbound","Manhattan"]]],["136","Bk",[40.65873,-73.89923],[["L27","New Lots Av","L","Manhattan","Canarsie"]]],["423","Bx",[40.86546,-73.86735],[["210","Allerton Av","2 5","Northbound","Manhattan"]]],["251","Bk",[40.59606,-73.97336],[["F36","Avenue U","F","Manhattan","Coney Island"]]],["391","Bx",[40.81322,-73.92985],[["416","138 St-Grand Concourse","4 5","Northbound","Manhattan"]]],["67","Bk",[40.60456,-73.99817],[["B20","20 Av","D","Manhattan","Southbound"]]],["60","Bk",[40.64091,-73.9943],[["B13","Fort Hamilton Pkwy","D","Manhattan","Southbound"]]],["241","Bk",[40.66036,-73.97949],[["F25","15 St-Prospect Park","F G","Northbound","Southbound"]]],["328","M",[40.71184,-74.01219],[["138","WTC Cortlandt","1","Uptown","Downtown"]]],["283","Bk",[40.73135,-73.95445],[["G26","Greenpoint Av","G","Queens","Southbound"]]],["119","M",[40.73095,-73.98163],[["L06","1 Av","L","West Side","Brooklyn"]]],["55","Bk",[40.57762,-73.96138],[["D40","Brighton Beach","B Q","Manhattan","Southbound"]]],["3","Q",[40.76678,-73.92148],[["R04","30 Av","N W","Astoria","Manhattan"]]],["379","Bx",[40.87975,-73.88465],[["402","Mosholu Pkwy","4","Woodlawn","Manhattan"]]],["209","Q",[40.60399,-73.7554],[["H11","Far Rockaway-Mott Av","A","Manhattan",""]]],["360","Bx",[40.85246,-73.82812],[["601","Pelham Bay Park","6","","Manhattan"]]],["371","Bx",[40.82095,-73.89055],[["613","Hunts Point Av","6","Northbound","Manhattan"]]],["505","SI",[40.60312,-74.08409],[["S27","Grasmere","SI","Ferry","South Shore"]]],["87","Bk",[40.68319,-73.87378],[["J20","Crescent St","J Z","Outbound","Manhattan"]]],["194","Q",[40.68433,-73.83216],[["A64","111 St","A","Manhattan","Ozone Park"]]],["147","M",[40.84739,-73.9397],[["A07","175 St","A","Uptown","Downtown"]]],["296","M",[40.87456,-73.90983],[["106","Marble Hill-225 St","1","The Bronx","Downtown"]]],["311","M",[40.78864,-73.97622],[["121","86 St","1","Uptown","Downtown"]]],["419","Bx",[40.88802,-73.86034],[["206","225 St","2 5","Northbound","Manhattan"]]],["266","Q",[40.74245,-73.88202],[["G13","Elmhurst Av","M R","Outbound","Manhattan"]]],["43","Bk",[40.65529,-73.96149],[["D27","Parkside Av","Q","Manhattan","Southbound"]]],["343","Bk",[40.66985,-73.95047],[["248","Nostrand Av","3","Manhattan","Outbound"]]],["451","Q",[40.74914,-73.86953],[["707","Junction Blvd","7","Outbound","Manhattan"]]],["38","Bk",[40.62269,-74.0284],[["R44","86 St","R","Manhattan","Bay Ridge"]]],["387","Bx",[40.84007,-73.91779],[["412","170 St","4","Northbound","Manhattan"]]],["434","Bx",[40.81611,-73.91776],[["221","3 Av-149 St","2 5","Northbound","Manhattan"]]],["298","M",[40.86462,-73.91882],[["108","207 St","1","The Bronx","Downtown"]]],["199","Q",[40.60838,-73.81592],[["H04","Broad Channel","A H","Inbound","Rockaways"]]],["177","Bk",[40.68326,-73.96584],[["A44","Clinton-Washington Avs","C","Manhattan","Outbound"]]],["182","Bk",[40.67882,-73.92079],[["A49","Ralph Av","C","Manhattan","Outbound"]]],["455","Q",[40.74632,-73.8964],[["711","69 St","7","Outbound","Manhattan"]]],["70","Bk",[40.58884,-73.98377],[["B23","Bay 50 St","D","Manhattan","Coney Island"]]],["264","Q",[40.73311,-73.86923],[["G11","Woodhaven Blvd","M R","Outbound","Manhattan"]]],["522","SI",[40.51276,-74.25196],[["S09","Tottenville","SI","Ferry",""]]],["461","Q",[40.75058,-73.9402],[["R09","Queensboro Plaza","N W","Astoria","Manhattan"],["718","Queensboro Plaza","7","Outbound","Manhattan"]]],["99","Bk",[40.70387,-73.94741],[["M13","Lorimer St","M J","Outbound","Manhattan"]]],["509","SI",[40.57896,-74.1097],[["S23","Grant City","SI","Ferry","South Shore"]]],["279","Q",[40.70049,-73.80797],[["G06","Sutphin Blvd-Archer Av-JFK Airport","E J Z","Jamaica","Manhattan"]]],["460","Q",[40.74459,-73.931],[["716","33 St-Rawson St","7","Outbound","Manhattan"]]],["155","M",[40.8006,-73.95816],[["A17","Cathedral Pkwy (110 St)","C B","Uptown","Downtown"]]],["259","Q",[40.71444,-73.83101],[["F06","Kew Gardens-Union Tpke","E F","Jamaica","Manhattan"]]],["320","M",[40.74408,-73.99566],[["130","23 St","1","Uptown","Downtown"]]],["175","Bk",[40.68848,-73.985],[["A42","Hoyt-Schermerhorn Sts","A C G","Westbound","Queens"]]],["438","M",[40.81423,-73.94077],[["224","135 St","2 3","Uptown","Downtown"]]],["75","Bk",[40.61741,-73.98503],[["N06","20 Av","N","Manhattan","Coney Island"]]],["145","M",[40.85902,-73.93418],[["A05","190 St","A","Uptown","Downtown"]]],["291","Bk",[40.68809,-73.96684],[["G35","Clinton-Washington Avs","G","Queens","Southbound"]]],["374","Bx",[40.80872,-73.90766],[["616","E 143 St-St Mary's St","6","Northbound","Manhattan"]]],["94","Bk",[40.68637,-73.91656],[["J29","Halsey St","J","Outbound","Manhattan"]]],["231","M",[40.71827,-73.99375],[["D22","Grand St","B D","Uptown","Brooklyn"]]],["79","Bk",[40.59272,-73.97823],[["N10","86 St","N","Manhattan","Coney Island"]]],["347","Bk",[40.66145,-73.91633],[["252","Saratoga Av","3","Manhattan","New Lots"]]],["513","SI",[40.55123,-74.1514],[["S19","Great Kills","SI","Ferry","South Shore"]]],["111","Q",[40.70276,-73.90774],[["M06","Seneca Av","M","Inbound","Middle Village"]]],["203","Q",[40.5809,-73.83559],[["H15","Rockaway Park-Beach 116 St","A H","Inbound",""]]],["124","Bk",[40.70774,-73.93985],[["L13","Montrose Av","L","Manhattan","Outbound"]]],["218","Bx",[40.83377,-73.91844],[["D10","167 St","B D","Northbound","Manhattan"]]],["352","Bk",[40.66624,-73.88408],[["257","New Lots Av","3","Manhattan",""]]],["518","SI",[40.52241,-74.21785],[["S14","Pleasant Plains","SI","Ferry","South Shore"]]],["443","Bx",[40.87866,-73.83859],[["502","Baychester Av","5","Eastchester","Manhattan"]]],["288","Bk",[40.69457,-73.94905],[["G32","Myrtle-Willoughby Avs","G","Queens","Southbound"]]],["428","Bx",[40.83729,-73.88773],[["215","174 St","2 5","Northbound","Manhattan"]]],["382","Bx",[40.8628,-73.90103],[["407","Fordham Rd","4","Northbound","Manhattan"]]],["159","M",[40.78143,-73.97214],[["A21","81 St-Museum of Natural History","C B","Uptown","Downtown"]]],["501","SI",[40.64375,-74.07364],[["S31","St George","SI","","South Shore"]]],["186","Bk",[40.67271,-73.89036],[["A53","Van Siclen Av","C","Manhattan","Outbound"]]],["303","M",[40.83404,-73.94489],[["113","157 St","1","Uptown","Downtown"]]],["362","Bx",[40.84386,-73.83632],[["603","Middletown Rd","6","Pelham Bay","Manhattan"]]],["30","Bk",[40.66541,-73.99287],[["R34","Prospect Av","R","Manhattan","Southbound"]]],["141","Bk",[40.67477,-73.95762],[["S03","Park Pl","FS","Franklin Av","Prospect Park"]]],["47","Bk",[40.63508,-73.96279],[["D31","Newkirk Plaza","B Q","Manhattan","Southbound"]]],["271","Q",[40.75688,-73.92074],[["G19","Steinway St","M R","Outbound","Manhattan"]]],["256","Q",[40.70756,-73.80333],[["F03","Parsons Blvd","F","Jamaica","Manhattan"]]],["323","M",[40.73342,-74.00291],[["133","Christopher St-Stonewall","1","Uptown","Downtown"]]],["414","M",[40.70482,-74.01407],[["420","Bowling Green","4 5","Uptown","Downtown"]]],["367","Bx",[40.83151,-73.86762],[["609","St Lawrence Av","6","Northbound","Manhattan"]]],["306","M",[40.81558,-73.95837],[["116","125 St","1","Uptown","Downtown"]]],["235","Bk",[40.7014,-73.98675],[["F18","York St","F","Manhattan","Southbound"]]],["246","Bk",[40.62532,-73.97613],[["F31","Avenue I","F","Manhattan","Southbound"]]],["62","Bk",[40.63144,-73.99548],[["B15","55 St","D","Manhattan","Southbound"]]],["207","Q",[40.5954,-73.76817],[["H09","Beach 36 St","A","Manhattan","Far Rockaway"]]],["107","M",[40.70648,-74.01106],[["M23","Broad St","J Z","Brooklyn",""]]],["396","M",[40.78567,-73.95107],[["625","96 St","6","The Bronx","Downtown"]]],["607","M",[40.74964,-73.98789],[["R17","34 St-Herald Sq","N Q R W","Uptown","Downtown"],["D17","34 St-Herald Sq","B D F M","Uptown","Downtown"]]],["214","Bx",[40.85609,-73.90074],[["D06","182-183 Sts","B D","Northbound","Manhattan"]]],["152","M",[40.81789,-73.94765],[["A14","135 St","C B","Uptown","Downtown"]]],["424","Bx",[40.85719,-73.86762],[["211","Pelham Pkwy","2 5","Northbound","Manhattan"]]],["76","Bk",[40.61181,-73.98185],[["N07","Bay Pkwy","N","Manhattan","Coney Island"]]],["439","M",[40.80775,-73.94549],[["225","125 St","2 3","Uptown","Downtown"]]],["61","Bk",[40.63626,-73.99479],[["B14","50 St","D","Manhattan","Southbound"]]],["39","Bk",[40.61662,-74.03088],[["R45","Bay Ridge-95 St","R","Manhattan",""]]],["284","Bk",[40.72463,-73.95128],[["G28","Nassau Av","G","Queens","Southbound"]]],["168","M",[40.72623,-74.00374],[["A33","Spring St","C E","Uptown","Downtown"]]],["386","Bx",[40.84443,-73.91469],[["411","Mt Eden Av","4","Northbound","Manhattan"]]],["278","Q",[40.70215,-73.80111],[["G05","Jamaica Center-Parsons/Archer","E J Z","","Manhattan"]]],["299","M",[40.86053,-73.92554],[["109","Dyckman St","1","The Bronx","Downtown"]]],["34","Bk",[40.64507,-74.01403],[["R40","53 St","R","Manhattan","Southbound"]]],["190","Q",[40.67937,-73.85899],[["A59","80 St","A","Manhattan","Outbound"]]],["183","Bk",[40.67834,-73.91195],[["A50","Rockaway Av","C","Manhattan","Outbound"]]],["51","Bk",[40.60867,-73.95773],[["D35","Kings Hwy","B Q","Manhattan","Southbound"]]],["397","M",[40.77949,-73.95559],[["626","86 St","4 5 6","Uptown","Downtown"]]],["2","Q",[40.77026,-73.91784],[["R03","Astoria Blvd","N W","Astoria","Manhattan"]]],["429","Bx",[40.82999,-73.89186],[["216","Freeman St","2 5","Northbound","Manhattan"]]],["210","Bx",[40.87481,-73.87886],[["D01","Norwood-205 St","D","","Manhattan"]]],["450","Q",[40.74986,-73.8627],[["706","103 St-Corona Plaza","7","Outbound","Manhattan"]]],["355","Bk",[40.65665,-73.9502],[["243","Winthrop St","2 5","Manhattan","Flatbush"]]],["608","Bk",[40.67056,-73.98904],[["F23","4 Av-9 St","F G","Northbound","Southbound"],["R33","4 Av-9 St","R","Manhattan","Southbound"]]],["242","Bk",[40.65078,-73.97578],[["F26","Fort Hamilton Pkwy","F G","Northbound","Southbound"]]],["252","Bk",[40.58962,-73.97425],[["F38","Avenue X","F","Manhattan","Coney Island"]]],["418","Bx",[40.89319,-73.85747],[["205","233 St","2 5","Northbound","Manhattan"]]],["127","Bk",[40.70381,-73.91842],[["L16","DeKalb Av","L","Manhattan","Outbound"]]],["137","Bk",[40.65057,-73.89948],[["L28","East 105 St","L","Manhattan","Canarsie"]]],["464","Q",[40.74263,-73.95358],[["721","Vernon Blvd-Jackson Av","7","Outbound","Manhattan"]]],["392","M",[40.80414,-73.93759],[["621","125 St","4 5 6","The Bronx","Downtown"]]],["508","SI",[40.58359,-74.10334],[["S24","Jefferson Av","SI","Ferry","South Shore"]]],["327","M",[40.71548,-74.00927],[["137","Chambers St","1 2 3","Uptown","Downtown"]]],["195","Q",[40.68595,-73.8258],[["A65","Ozone Park-Lefferts Blvd","A","Manhattan",""]]],["66","Bk",[40.60795,-74.00174],[["B19","18 Av","D","Manhattan","Southbound"]]],["103","M",[40.72028,-73.99392],[["M19","Bowery","J Z","Brooklyn","Downtown"]]],["407","M",[40.73005,-73.99107],[["636","Astor Pl","6","Uptown","Downtown"]]],["44","Bk",[40.65053,-73.96298],[["D28","Church Av","B Q","Manhattan","Southbound"]]],["93","Bk",[40.68289,-73.91046],[["J28","Chauncey St","J Z","Outbound","Manhattan"]]],["456","Q",[40.74563,-73.90298],[["712","61 St-Woodside","7","Outbound","Manhattan"]]],["56","Bk",[40.57631,-73.9685],[["D41","Ocean Pkwy","Q","Manhattan","Coney Island"]]],["88","Bk",[40.68141,-73.88004],[["J21","Norwood Av","J Z","Outbound","Manhattan"]]],["295","Bx",[40.87886,-73.90483],[["104","231 St","1","Van Cortlandt","Manhattan"]]],["263","Q",[40.72985,-73.8616],[["G10","63 Dr-Rego Park","M R","Outbound","Manhattan"]]],["164","M",[40.75229,-73.99339],[["A28","34 St-Penn Station","A C E","Uptown","Downtown"]]],["200","Q",[40.58803,-73.81364],[["H12","Beach 90 St","A H","Inbound","Rockaway Park"]]],["316","M",[40.76173,-73.98385],[["126","50 St","1","Uptown","Downtown"]]],["310","M",[40.79392,-73.97232],[["120","96 St","1 2 3","Uptown","Downtown"]]],["71","Bk",[40.63506,-74.01172],[["N02","8 Av","N","Manhattan","Coney Island"]]],["519","SI",[40.51963,-74.22914],[["S13","Richmond Valley","SI","Ferry","Tottenville"]]],["359","Bk",[40.63284,-73.94764],[["247","Flatbush Av-Brooklyn College","2 5","Manhattan",""]]],["378","Bx",[40.88604,-73.87875],[["401","Woodlawn","4","","Manhattan"]]],["446","Bx",[40.85436,-73.8605],[["505","Morris Park","5","Eastchester","Manhattan"]]],["370","Bx",[40.82652,-73.88628],[["612","Whitlock Av","6","Northbound","Manhattan"]]],["98","Bk",[40.70026,-73.94113],[["M12","Flushing Av","M J","Outbound","Manhattan"]]],["504","SI",[40.62132,-74.0714],[["S28","Clifton","SI","Ferry","South Shore"]]],["433","Bx",[40.81649,-73.90781],[["220","Jackson Av","2 5","Northbound","Manhattan"]]],["215","Bx",[40.85041,-73.90523],[["D07","Tremont Av","B D","Northbound","Manhattan"]]],["120","Bk",[40.7173,-73.95687],[["L08","Bedford Av","L","Manhattan","Outbound"]]],["222","M",[40.75914,-73.95326],[["B06","Roosevelt Island","M","Queens","Downtown"]]],["83","Q",[40.69388,-73.85158],[["J15","Woodhaven Blvd","J Z","Jamaica","Manhattan"]]],["514","SI",[40.5446,-74.16457],[["S18","Eltingville","SI","Ferry","South Shore"]]],["232","M",[40.7234,-73.98994],[["F14","2 Av","F","Uptown","Downtown"]]],["348","Bk",[40.66255,-73.90895],[["253","Rockaway Av","3","Manhattan","New Lots"]]]];
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

  const STATIONS = CATALOG.map(([id, borough, [lat, lon], stops]) => {
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
      lat,
      lon,
      lines: [...new Set(platforms.flatMap((p) => p.lines))].sort((a, b) => lineRank(a) - lineRank(b)),
      platforms,
      stops: platforms.map((p) => p.stop),
    };
  });
  const STATION_BY_ID = new Map(STATIONS.map((s) => [s.id, s]));
  const EQUIPMENT_STATIONS = {"EL293":"119","EL292":"119","ES103":"306","ES101":"306","ES102":"306","EL144":"153","EL143":"153","EL142":"153","EL126":"392","EL125":"392","EL181":"438","EL180":"438","EL520":"305","EL519":"305","EL223":"618","EL222":"618","EL221":"618","EL611":"601","EL616":"601","EL615":"601","EL614":"601","EL220":"602","EL219":"602","EL218":"602","EL217":"602","ES219":"602","ES115":"151","ES116":"151","EL102":"603","EL101":"603","EL100":"603","ES114":"604","ES113":"604","EL135":"604","EL134":"604","EL133":"604","EL132":"604","EL131":"604","EL141":"605","EL140":"605","EL139":"605","EL114":"605","EL113":"605","EL112":"605","EL111":"605","EL508":"387","EL507":"387","EL506":"387","EL124":"147","EL123":"147","EL109":"301","EL108":"301","EL107":"301","EL518":"146","EL517":"146","ES118":"146","ES119":"146","ES117":"146","EL110":"301","EL119":"146","EL118":"146","EL117":"146","EL120":"145","EL116":"145","EL115":"145","EL105":"300","EL104":"300","EL103":"300","EL106":"300","EL407":"221","EL406":"221","EL405":"221","ES422":"221","ES423":"221","ES421":"221","ES426":"221","ES424":"221","ES425":"221","EL299":"405","EL298":"405","EL185":"295","EL184":"295","EL194":"418","EL193":"418","EL192":"418","EL130":"434","EL129":"434","EL213":"607","EL212":"607","EL211":"607","EL210":"607","EL209":"607","ES231":"607","ES232":"607","ES230":"607","ES235":"607","ES236":"607","ES233":"607","ES234":"607","ES221":"607","ES224":"607","ES222":"607","ES223":"607","ES229":"607","EL600":"471","EL603":"471","EL602":"471","EL601":"471","ES631":"471","ES632":"471","ES630":"471","ES635":"471","ES636":"471","ES633":"471","ES634":"471","ES621":"471","ES624":"471","ES625":"471","ES622":"471","ES623":"471","ES628":"471","ES629":"471","ES626":"471","ES627":"471","EL226":"164","EL225":"164","EL228":"164","EL227":"164","EL215":"318","EL214":"318","EL216":"318","EL618":"318","EL236":"225","EL235":"225","EL234":"225","ES242":"276","ES240":"276","ES241":"276","ES239":"276","EL202":"612","EL201":"612","EL621":"224","EL620":"224","EL604":"9","EL283":"9","EL282":"9","EL281":"9","ES213":"613","ES214":"613","ES211":"613","ES212":"613","EL389":"35","EL388":"35","EL387":"35","EL622":"614","EL280":"614","EL279":"614","EL278":"614","EL277":"614","EL610":"601","EL617":"601","EL613":"601","EL612":"601","EL609":"601","ES448":"456","EL741":"615","EL740":"615","EL739":"615","EL237":"314","EL238":"314","EL286":"399","EL285":"399","EL284":"399","EL784":"240","EL783":"240","EL782":"240","ES237":"277","ES238":"277","ES295":"477","ES296":"477","ES290":"477","ES294":"477","ES291":"477","ES286":"477","ES287":"477","ES285":"477","ES288":"477","ES289":"477","EL267":"477","EL266":"477","EL265":"477","EL264":"477","EL262":"477","EL259":"477","EL240":"313","EL239":"313","EL423":"616","EL420":"616","ES451":"616","ES452":"616","ES450":"616","ES453":"616","ES449":"616","EL224":"618","ES297":"476","ES284":"476","ES282":"476","ES283":"476","ES280":"476","ES281":"476","ES275":"476","ES276":"476","ES273":"476","ES274":"476","ES279":"476","ES277":"476","ES278":"476","EL746":"38","EL745":"38","EL273":"397","EL250":"476","EL249":"476","EL753":"71","EL752":"71","ES271":"475","ES272":"475","ES270":"475","ES260":"475","ES259":"475","ES247":"475","ES220":"475","ES202":"475","ES200":"475","EL146":"310","EL145":"310","EL248":"475","EL247":"475","EL467":"2","EL466":"2","EL465":"2","EL464":"2","EL303":"617","EL302":"617","EL301":"617","EL307":"617","EL306":"617","EL305":"617","EL304":"617","ES310":"617","EL378":"68","EL377":"68","EL376":"68","EL381":"39","EL380":"39","EL481":"204","EL480":"204","EL358":"120","EL359":"120","EL501":"211","EL500":"211","EL502":"211","EL332":"619","EL331":"619","EL330":"619","EL329":"619","EL328":"619","ES300":"619","EL318":"620","EL317":"620","EL775":"620","EL774":"620","EL773":"620","ES303":"620","ES334":"103","EL710":"414","ES341":"414","ES342":"414","ES340":"414","ES345":"414","ES343":"414","EL711":"414","ES338":"414","ES339":"414","ES336":"414","ES337":"414","EL424":"258","ES346":"55","ES347":"621","ES330":"621","ES331":"621","EL314":"622","EL316":"622","EL315":"622","EL325":"623","EL324":"623","EL336":"327","EL338":"327","EL337":"327","EL743":"622","EL742":"622","EL321":"356","EL320":"356","EL792":"44","EL791":"44","EL375":"243","EL374":"243","EL373":"243","EL312":"334","EL311":"334","EL310":"334","EL702":"58","EL701":"58","EL736":"328","ES353":"328","EL713":"328","EL712":"328","EL469":"606","EL446":"606","EL447":"606","EL309":"620","EL308":"620","ES305":"620","ES306":"620","EL323":"345","EL322":"345","ES309":"26","ES308":"26","EL372":"26","EL371":"26","EL370":"26","ES327":"625","ES328":"625","EL179":"299","EL178":"299","EL516":"373","EL515":"373","EL160":"426","EL159":"426","ES329":"234","EL757":"341","EL756":"341","EL755":"341","EL343":"188","EL342":"188","EL341":"188","EL498":"209","EL497":"209","EL319":"359","EL395":"98","EL394":"98","EL393":"98","EL414":"447","ES455":"447","ES456":"447","ES457":"447","EL188":"382","EL187":"382","EL186":"382","EL439":"261","EL438":"261","EL437":"261","EL340":"627","EL339":"627","ES352":"627","EL732":"628","ES364":"628","ES367":"628","ES368":"628","EL721":"628","EL720":"628","EL723":"628","EL722":"628","EL719":"628","EL716":"628","EL204":"610","EL206":"610","EL205":"610","ES255":"610","ES256":"610","ES210":"610","ES203":"610","ES206":"610","ES207":"610","ES204":"610","ES205":"610","ES208":"610","ES209":"610","EL296":"610","EL244":"610","EL786":"123","EL785":"123","EL765":"283","EL764":"283","EL763":"283","ES104":"421","ES105":"421","EL199":"444","EL198":"444","EL183":"421","EL182":"421","ES350":"173","ES323":"173","ES324":"173","ES321":"173","ES322":"173","EL197":"371","EL196":"371","EL195":"371","ES108":"431","EL149":"143","EL148":"143","EL422":"616","EL421":"616","EL413":"278","EL412":"278","ES440":"278","ES441":"278","ES444":"278","ES445":"278","ES442":"278","ES443":"278","ES446":"278","ES447":"278","ES438":"278","ES439":"278","EL409":"280","EL408":"280","ES430":"280","ES431":"280","ES427":"280","ES428":"280","ES429":"280","EL433":"254","EL432":"254","EL431":"254","ES356":"636","ES357":"636","EL708":"636","EL707":"636","EL706":"636","ES317":"636","ES318":"636","EL709":"636","EL427":"451","EL426":"451","EL425":"451","EL435":"259","EL434":"259","EL436":"259","EL797":"250","EL796":"250","EL795":"250","EL761":"51","EL760":"51","EL191":"212","EL190":"212","EL189":"212","ES269":"612","ES243":"612","ES246":"612","ES244":"612","ES245":"612","EL245":"612","ES248":"613","ES249":"613","ES215":"613","EL444":"223","EL443":"223","EL442":"223","EL441":"223","EL440":"223","EL402":"223","EL401":"223","ES459":"223","ES458":"223","ES410":"223","ES401":"223","ES404":"223","ES405":"223","ES402":"223","ES403":"223","ES408":"223","ES409":"223","ES406":"223","ES407":"223","EL772":"135","EL771":"135","EL776":"629","EL778":"629","EL777":"629","EL392":"101","EL391":"101","EL781":"629","EL780":"629","EL779":"629","EL523":"379","EL524":"379","ES332":"630","ES333":"630","EL398":"630","EL397":"630","EL396":"630","EL787":"510","EL788":"510","EL738":"615","EL486":"269","EL485":"269","ES112":"210","EL463":"195","EL462":"195","ES301":"624","ES302":"624","EL522":"366","EL521":"366","ES111":"366","ES121":"360","ES120":"360","EL122":"360","EL121":"360","ES122":"424","ES123":"424","EL138":"424","EL137":"424","EL136":"424","ES304":"353","EL383":"42","EL382":"42","EL430":"273","EL429":"273","EL428":"273","EL479":"461","EL478":"461","EL488":"192","EL487":"192","EL404":"222","EL403":"222","ES420":"222","ES411":"222","ES412":"222","ES415":"222","ES416":"222","ES413":"222","ES414":"222","ES419":"222","ES417":"222","ES418":"222","EL794":"54","EL793":"54","EL127":"430","EL128":"430","ES349":"238","ES348":"238","ES313":"238","ES316":"238","ES314":"238","ES315":"238","ES374":"635","ES375":"635","ES372":"635","ES373":"635","EL731":"635","EL730":"635","ES370":"635","ES371":"635","ES369":"635","EL1106":"168","EL411":"279","ES434":"279","ES437":"279","ES435":"279","ES436":"279","EL229":"611","EL619":"611","ES217":"611","ES218":"611","ES216":"611","EL233":"611","EL232":"611","EL230":"611","EL511":"215","EL510":"215","EL509":"215","EL346":"181","EL345":"181","EL344":"181","EL335":"167","EL334":"167","EL333":"167","ES325":"167","ES326":"167","ES335":"57","ES106":"427","EL512":"363","EL514":"363","EL513":"363","ES351":"635","ES312":"635","ES311":"635","EL484":"83","EL483":"83","EL326":"624"};
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

  // Elevators and escalators out of service right now, grouped by station complex ID.
  function buildOutages(list) {
    const out = {};
    for (const o of list || []) {
      if (o.isupcomingoutage === "Y") continue;
      const station = EQUIPMENT_STATIONS[o.equipment];
      if (!station) continue;
      (out[station] ||= []).push({
        kind: o.equipmenttype === "ES" ? "escalator" : "elevator",
        serving: o.serving || "",
        until: o.estimatedreturntoservice || "",
        reason: o.reason || "",
      });
    }
    return out;
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
    const [alertsResult, outagesResult, ...feedResults] = await Promise.allSettled([
      get(fetchFn, ALERTS_URL, "json"),
      get(fetchFn, OUTAGES_URL, "json"),
      ...TRAIN_FEEDS.map((f) => get(fetchFn, f.url, "bytes")),
    ]);

    const failed = [];
    if (alertsResult.status === "fulfilled") {
      cache.alerts = buildAlerts(alertsResult.value, now);
      cache.alertsAt = now;
    } else {
      failed.push({ source: "service alerts", error: reason(alertsResult) });
    }
    if (outagesResult.status === "fulfilled") {
      cache.outages = buildOutages(outagesResult.value);
    } else {
      failed.push({ source: "elevator status", error: reason(outagesResult) });
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
      ok: failed.length < TRAIN_FEEDS.length + 2,
      fetchedAt: now,
      alertsAt: cache.alertsAt || 0,
      arrivalsAt: tripTimes.length ? Math.min(...tripTimes) : 0,
      failed,
      alerts: cache.alerts || [],
      outages: cache.outages || {},
      arrivals: arrivalsFor(cache, stops, now),
      arrivalStops: [...stops],
    };
  }

  const reason = (r) => String((r.reason && r.reason.message) || r.reason);

  return {
    API,
    STATIONS,
    STATION_BY_ID,
    DEFAULT_STATION_IDS,
    LINE_ORDER,
    LINE_ALIASES,
    fields,
    text,
    get,
    reason,
    parseFeed,
    buildAlerts,
    buildArrivals,
    arrivalsFor,
    loadData,
  };
});
