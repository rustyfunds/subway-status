// Loads LIRR and Metro-North departures and alerts for chosen stations.
// RAIL is generated from each railroad's static GTFS: routes [id, name, color, text color] and
// stations [id, name, railroad, lat, lon, [route ids serving it]]. IDs carry an L (LIRR) or
// M (Metro-North) prefix because the two railroads reuse the same numbers.
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./subway-core.js"));
  else root.RailCore = factory(root.SubwayCore);
})(typeof self !== "undefined" ? self : this, function (core) {
  "use strict";

  const RAIL = {"routes":[["L1","Babylon","00985F","FFFFFF"],["L2","Hempstead","CE8E00","121212"],["L3","Oyster Bay","00AF3F","FFFFFF"],["L4","Ronkonkoma","A626AA","FFFFFF"],["L5","Montauk","00B2A9","121212"],["L6","Long Beach","FF6319","FFFFFF"],["L7","Far Rockaway","6E3219","FFFFFF"],["L8","West Hempstead","00A1DE","121212"],["L9","Port Washington","C60C30","FFFFFF"],["L10","Port Jefferson","006EC7","FFFFFF"],["L11","Belmont Park","60269E","FFFFFF"],["L12","City Terminal Zone","4D5357","FFFFFF"],["L13","Greenport Service","A626AA","FFFFFF"],["M3","New Haven","EE0034","FFFFFF"],["M4","New Canaan","EE0034","FFFFFF"],["M5","Danbury","EE0034","FFFFFF"],["M6","Waterbury","EE0034","FFFFFF"],["M1","Hudson","009B3A","FFFFFF"],["M2","Harlem","0039A6","FFFFFF"]],"stations":[["L1","Albertson","LIRR",40.77206,-73.64169,["L3"]],["L100","Islip","LIRR",40.73583,-73.20932,["L5"]],["L101","Inwood","LIRR",40.61229,-73.74418,["L7"]],["L102","Jamaica","LIRR",40.69961,-73.80853,["L1","L10","L12","L2","L3","L4","L5","L6","L7","L8"]],["L107","Kew Gardens","LIRR",40.70965,-73.83089,["L1","L10","L12","L2","L4","L6","L7","L8"]],["L11","Broadway","LIRR",40.76165,-73.80177,["L9"]],["L111","Kings Park","LIRR",40.88367,-73.25625,["L10"]],["L113","Long Beach","LIRR",40.59018,-73.66482,["L6"]],["L114","Lawrence","LIRR",40.61573,-73.7359,["L7"]],["L117","Lindenhurst","LIRR",40.68827,-73.36921,["L1"]],["L118","Long Island City","LIRR",40.74134,-73.95764,["L10","L3","L5"]],["L119","Locust Manor","LIRR",40.67514,-73.76504,["L6","L7"]],["L120","Little Neck","LIRR",40.77504,-73.74065,["L9"]],["L122","Laurelton","LIRR",40.66848,-73.75175,["L1","L6","L7"]],["L123","Locust Valley","LIRR",40.87447,-73.5983,["L3"]],["L124","Lakeview","LIRR",40.68586,-73.65214,["L8"]],["L125","Lynbrook","LIRR",40.65606,-73.67607,["L1","L6"]],["L126","Mattituck","LIRR",40.99179,-72.53606,["L13"]],["L127","Merillon Avenue","LIRR",40.73517,-73.66252,["L10","L4"]],["L129","Medford","LIRR",40.8174,-72.99891,["L13"]],["L13","Bridgehampton","LIRR",40.93898,-72.31005,["L5"]],["L130","Murray Hill","LIRR",40.76271,-73.81454,["L9"]],["L131","Manhasset","LIRR",40.79672,-73.6999,["L9"]],["L132","Mineola","LIRR",40.74035,-73.64086,["L10","L2","L3","L4","L5"]],["L135","Massapequa Park","LIRR",40.67786,-73.45474,["L1"]],["L136","Massapequa","LIRR",40.67693,-73.46906,["L1"]],["L14","Stony Brook","LIRR",40.92032,-73.12855,["L10"]],["L140","Mastic-Shirley","LIRR",40.79899,-72.86442,["L5"]],["L141","Montauk","LIRR",41.04711,-71.95388,["L5"]],["L142","Malverne","LIRR",40.67548,-73.66886,["L8"]],["L148","Nostrand Avenue","LIRR",40.67839,-73.94822,["L1","L10","L12","L2","L6","L7","L8"]],["L149","Nassau Boulevard","LIRR",40.72296,-73.6627,["L2"]],["L152","New Hyde Park","LIRR",40.73076,-73.68096,["L10","L4"]],["L153","Northport","LIRR",40.88065,-73.32849,["L10"]],["L154","Oyster Bay","LIRR",40.87534,-73.53403,["L3"]],["L155","Oceanside","LIRR",40.63472,-73.65467,["L6"]],["L157","Oakdale","LIRR",40.74343,-73.13244,["L5"]],["L16","Bellmore","LIRR",40.6688,-73.52886,["L1"]],["L162","Plandome","LIRR",40.8107,-73.69521,["L9"]],["L163","Patchogue","LIRR",40.76188,-73.01574,["L5"]],["L164","Port Jefferson","LIRR",40.93455,-73.0525,["L10"]],["L165","Pinelawn","LIRR",40.74536,-73.3996,["L4"]],["L171","Port Washington","LIRR",40.82904,-73.6874,["L9"]],["L175","Queens Village","LIRR",40.71746,-73.73646,["L10","L2","L4"]],["L176","Riverhead","LIRR",40.91984,-72.66691,["L13"]],["L179","Ronkonkoma","LIRR",40.80809,-73.10594,["L13","L4"]],["L180","Rosedale","LIRR",40.66595,-73.73555,["L6","L7"]],["L182","Roslyn","LIRR",40.79048,-73.64326,["L3"]],["L183","Rockville Centre","LIRR",40.65832,-73.64655,["L1"]],["L184","St. Albans","LIRR",40.69118,-73.76551,["L1","L8"]],["L185","Sea Cliff","LIRR",40.85237,-73.62542,["L3"]],["L187","Seaford","LIRR",40.67572,-73.48657,["L1"]],["L190","Southold","LIRR",41.06632,-72.42788,["L13"]],["L191","Southampton","LIRR",40.89472,-72.39012,["L5"]],["L193","St. James","LIRR",40.88217,-73.15951,["L10"]],["L195","Stewart Manor","LIRR",40.72303,-73.68102,["L2"]],["L198","Speonk","LIRR",40.82132,-72.70526,["L5"]],["L199","Mets-Willets Point","LIRR",40.7524,-73.8437,["L9"]],["L2","Auburndale","LIRR",40.76144,-73.78996,["L9"]],["L20","Bethpage","LIRR",40.74304,-73.48344,["L4"]],["L202","Smithtown","LIRR",40.85655,-73.19803,["L10"]],["L204","Sayville","LIRR",40.74035,-73.08646,["L5"]],["L205","Syosset","LIRR",40.82486,-73.50045,["L10"]],["L21","Bellport","LIRR",40.77374,-72.94397,["L5"]],["L211","Valley Stream","LIRR",40.66152,-73.70476,["L1","L6","L7","L8"]],["L213","Westbury","LIRR",40.75345,-73.58587,["L10","L4"]],["L214","Woodside","LIRR",40.74585,-73.90298,["L1","L10","L12","L2","L4","L6","L7","L8","L9"]],["L215","Wantagh","LIRR",40.67299,-73.50896,["L1"]],["L216","West Hempstead","LIRR",40.70196,-73.64164,["L8"]],["L217","Woodmere","LIRR",40.63134,-73.71372,["L7"]],["L219","Westwood","LIRR",40.66837,-73.68121,["L8"]],["L220","Wyandanch","LIRR",40.7548,-73.35807,["L4"]],["L223","Yaphank-BNL","LIRR",40.84927,-72.86447,["L13"]],["L225","Baldwin","LIRR",40.65673,-73.60716,["L1"]],["L226","Merrick","LIRR",40.6638,-73.55062,["L1"]],["L23","Bellerose","LIRR",40.7222,-73.71665,["L2"]],["L233","Westhampton","LIRR",40.83031,-72.65032,["L5"]],["L237","Penn Station","LIRR",40.75059,-73.99358,["L1","L10","L12","L2","L3","L4","L5","L6","L7","L8","L9"]],["L241","Atlantic Terminal","LIRR",40.6836,-73.97567,["L1","L10","L12","L2","L4","L6","L7","L8"]],["L25","Bayside","LIRR",40.76315,-73.77125,["L9"]],["L26","Bay Shore","LIRR",40.72443,-73.25408,["L5"]],["L27","Babylon","LIRR",40.70069,-73.32406,["L1","L5"]],["L29","Brentwood","LIRR",40.78083,-73.24361,["L4"]],["L31","Centre Avenue","LIRR",40.64832,-73.66397,["L6"]],["L32","Cedarhurst","LIRR",40.62217,-73.72618,["L7"]],["L33","Central Islip","LIRR",40.79185,-73.19486,["L4"]],["L349","Grand Central Madison","LIRR",40.75516,-73.97545,["L1","L10","L12","L2","L4","L6","L7","L8","L9"]],["L359","Elmont-UBS Arena","LIRR",40.72007,-73.72555,["L10","L2","L4"]],["L36","Country Life Press","LIRR",40.72146,-73.62967,["L2"]],["L38","Copiague","LIRR",40.68102,-73.39834,["L1"]],["L39","Carle Place","LIRR",40.74921,-73.60365,["L10","L4"]],["L4","Amagansett","LIRR",40.98004,-72.13233,["L5"]],["L40","Cold Spring Harbor","LIRR",40.83564,-73.45109,["L10"]],["L42","Douglaston","LIRR",40.76807,-73.74941,["L9"]],["L44","Deer Park","LIRR",40.76948,-73.29356,["L4"]],["L48","East Hampton","LIRR",40.96509,-72.19324,["L5"]],["L50","East New York","LIRR",40.67581,-73.90281,["L1","L10","L12","L2","L6","L7","L8"]],["L51","East Rockaway","LIRR",40.64221,-73.65822,["L6"]],["L52","East Williston","LIRR",40.75602,-73.63941,["L3"]],["L55","Forest Hills","LIRR",40.71958,-73.84481,["L1","L10","L12","L2","L4","L6","L7","L8"]],["L56","Flushing Main Street","LIRR",40.75789,-73.83135,["L9"]],["L59","Farmingdale","LIRR",40.73592,-73.44124,["L4"]],["L63","Floral Park","LIRR",40.72464,-73.7064,["L10","L2","L4"]],["L64","Freeport","LIRR",40.65746,-73.58232,["L1"]],["L65","Far Rockaway","LIRR",40.60914,-73.75054,["L7"]],["L66","Gibson","LIRR",40.64925,-73.70183,["L7"]],["L67","Glen Cove","LIRR",40.86583,-73.61617,["L3"]],["L68","Garden City","LIRR",40.7231,-73.64036,["L2"]],["L71","Glen Head","LIRR",40.83223,-73.62612,["L3"]],["L72","Great Neck","LIRR",40.78722,-73.7261,["L9"]],["L73","Greenport","LIRR",41.09971,-72.3631,["L13"]],["L74","Great River","LIRR",40.74044,-73.1702,["L5"]],["L76","Glen Street","LIRR",40.85798,-73.62122,["L3"]],["L77","Greenvale","LIRR",40.81572,-73.62687,["L3"]],["L78","Greenlawn","LIRR",40.86867,-73.36285,["L10"]],["L8","Amityville","LIRR",40.68025,-73.42031,["L1"]],["L83","Hampton Bays","LIRR",40.87661,-72.52395,["L5"]],["L84","Hempstead","LIRR",40.7133,-73.62503,["L2"]],["L85","Hempstead Gardens","LIRR",40.69491,-73.64621,["L8"]],["L86","Hillside Facility","LIRR",40.70774,-73.77696,["L10","L2","L4","L5"]],["L89","Hollis","LIRR",40.71018,-73.76675,["L10","L2","L4"]],["L90","Hunterspoint Avenue","LIRR",40.74239,-73.94679,["L10","L3","L5"]],["L91","Huntington","LIRR",40.85301,-73.40953,["L10"]],["L92","Hicksville","LIRR",40.76717,-73.52853,["L10","L4","L5"]],["L94","Hewlett","LIRR",40.63676,-73.70514,["L7"]],["L99","Island Park","LIRR",40.6013,-73.65474,["L6"]],["M1","Grand Central","Metro-North",40.753,-73.97706,["M1","M2","M3","M4","M5"]],["M4","Harlem-125 St","Metro-North",40.80516,-73.93915,["M1","M2","M3","M4","M5"]],["M622","Yankees-E 153 St","Metro-North",40.8253,-73.9299,["M1"]],["M184","Highbridge Yard","Metro-North",40.8359,-73.9315,["M1"]],["M9","Morris Heights","Metro-North",40.85425,-73.91958,["M1"]],["M10","University Heights","Metro-North",40.86225,-73.91312,["M1"]],["M11","Marble Hill","Metro-North",40.87433,-73.91094,["M1"]],["M14","Spuyten Duyvil","Metro-North",40.87824,-73.92145,["M1"]],["M16","Riverdale","Metro-North",40.90398,-73.91413,["M1"]],["M17","Ludlow","Metro-North",40.92497,-73.90461,["M1"]],["M18","Yonkers","Metro-North",40.93579,-73.90267,["M1"]],["M19","Glenwood","Metro-North",40.9505,-73.89906,["M1"]],["M20","Greystone","Metro-North",40.9727,-73.88907,["M1"]],["M22","Hastings-on-Hudson","Metro-North",40.99411,-73.88451,["M1"]],["M23","Dobbs Ferry","Metro-North",41.01246,-73.87949,["M1"]],["M24","Ardsley-on-Hudson","Metro-North",41.0262,-73.87654,["M1"]],["M25","Irvington","Metro-North",41.03999,-73.87308,["M1"]],["M27","Tarrytown","Metro-North",41.07647,-73.86456,["M1"]],["M29","Philipse Manor","Metro-North",41.09492,-73.86975,["M1"]],["M30","Scarborough","Metro-North",41.13576,-73.86616,["M1"]],["M31","Ossining","Metro-North",41.15766,-73.86928,["M1"]],["M33","Croton-Harmon","Metro-North",41.1899,-73.88239,["M1"]],["M37","Cortlandt","Metro-North",41.24626,-73.92188,["M1"]],["M39","Peekskill","Metro-North",41.28596,-73.93042,["M1"]],["M40","Manitou","Metro-North",41.3326,-73.97043,["M1"]],["M42","Garrison","Metro-North",41.38178,-73.9472,["M1"]],["M43","Cold Spring","Metro-North",41.41528,-73.95809,["M1"]],["M44","Breakneck Ridge","Metro-North",41.45018,-73.98245,["M1"]],["M46","Beacon","Metro-North",41.50401,-73.98453,["M1"]],["M49","New Hamburg","Metro-North",41.58745,-73.94723,["M1"]],["M51","Poughkeepsie","Metro-North",41.70584,-73.93795,["M1"]],["M54","Melrose","Metro-North",40.82576,-73.91523,["M2"]],["M55","Tremont","Metro-North",40.8473,-73.89955,["M2"]],["M56","Fordham","Metro-North",40.8615,-73.89058,["M2","M3","M4"]],["M57","Botanical Garden","Metro-North",40.86655,-73.88311,["M2"]],["M58","Williams Bridge","Metro-North",40.87857,-73.87106,["M2"]],["M59","Woodlawn","Metro-North",40.89536,-73.86292,["M2"]],["M61","Wakefield","Metro-North",40.90594,-73.85568,["M2"]],["M62","Mt Vernon West","Metro-North",40.91214,-73.85113,["M2"]],["M64","Fleetwood","Metro-North",40.92699,-73.83948,["M2"]],["M65","Bronxville","Metro-North",40.93978,-73.83521,["M2"]],["M66","Tuckahoe","Metro-North",40.94939,-73.83017,["M2"]],["M68","Crestwood","Metro-North",40.959,-73.82056,["M2"]],["M71","Scarsdale","Metro-North",40.98917,-73.80863,["M2"]],["M72","Hartsdale","Metro-North",41.01033,-73.79641,["M2"]],["M74","White Plains","Metro-North",41.03259,-73.77521,["M2"]],["M76","North White Plains","Metro-North",41.04981,-73.77314,["M2"]],["M78","Valhalla","Metro-North",41.07282,-73.7726,["M2"]],["M79","Mt Pleasant","Metro-North",41.09588,-73.79382,["M2"]],["M80","Hawthorne","Metro-North",41.10858,-73.79625,["M2"]],["M81","Pleasantville","Metro-North",41.13522,-73.79266,["M2"]],["M83","Chappaqua","Metro-North",41.15801,-73.77488,["M2"]],["M84","Mt Kisco","Metro-North",41.20824,-73.72978,["M2"]],["M85","Bedford Hills","Metro-North",41.23732,-73.69994,["M2"]],["M86","Katonah","Metro-North",41.25955,-73.68416,["M2"]],["M88","Goldens Bridge","Metro-North",41.29434,-73.67766,["M2"]],["M89","Purdy's","Metro-North",41.32578,-73.65906,["M2"]],["M90","Croton Falls","Metro-North",41.34772,-73.66227,["M2"]],["M91","Brewster","Metro-North",41.39447,-73.6198,["M2"]],["M94","Southeast","Metro-North",41.4132,-73.62379,["M2"]],["M97","Patterson","Metro-North",41.51183,-73.60458,["M2"]],["M98","Pawling","Metro-North",41.56421,-73.60052,["M2"]],["M99","Appalachian Trail","Metro-North",41.59287,-73.58803,["M2"]],["M100","Harlem Valley-Wingdale","Metro-North",41.63752,-73.57145,["M2"]],["M101","Dover Plains","Metro-North",41.7404,-73.5765,["M2"]],["M176","Tenmile River","Metro-North",41.77994,-73.5582,["M2"]],["M177","Wassaic","Metro-North",41.81472,-73.5622,["M2"]],["M105","Mt Vernon East","Metro-North",40.91216,-73.83218,["M3","M4"]],["M106","Pelham","Metro-North",40.91032,-73.81024,["M3","M4"]],["M108","New Rochelle","Metro-North",40.91161,-73.78381,["M3","M4"]],["M110","Larchmont","Metro-North",40.93339,-73.75979,["M3","M4"]],["M111","Mamaroneck","Metro-North",40.95406,-73.73613,["M3","M4"]],["M112","Harrison","Metro-North",40.96943,-73.71296,["M3","M4"]],["M114","Rye","Metro-North",40.98592,-73.68255,["M3","M4"]],["M115","Port Chester","Metro-North",41.00073,-73.6647,["M3","M4"]],["M116","Greenwich","Metro-North",41.02128,-73.62462,["M3","M4","M5"]],["M118","Cos Cob","Metro-North",41.03017,-73.59831,["M3","M4"]],["M120","Riverside","Metro-North",41.03168,-73.58817,["M3","M4"]],["M121","Old Greenwich","Metro-North",41.03382,-73.56586,["M3","M4"]],["M124","Stamford","Metro-North",41.04661,-73.54285,["M3","M4","M5"]],["M153","Glenbrook","Metro-North",41.07055,-73.52002,["M4"]],["M651","Springdale MW Facility","Metro-North",41.08215,-73.51968,["M4"]],["M154","Springdale","Metro-North",41.08876,-73.51783,["M4"]],["M155","Talmadge Hill","Metro-North",41.11601,-73.49815,["M4"]],["M157","New Canaan","Metro-North",41.1463,-73.49563,["M4"]],["M127","Noroton Heights","Metro-North",41.06904,-73.49788,["M3","M5"]],["M128","Darien","Metro-North",41.07691,-73.47297,["M3","M5"]],["M129","Rowayton","Metro-North",41.07746,-73.44553,["M3","M5"]],["M131","South Norwalk","Metro-North",41.09673,-73.42113,["M3","M5"]],["M158","Merritt 7","Metro-North",41.14662,-73.42786,["M5"]],["M160","Wilton","Metro-North",41.1962,-73.43243,["M5"]],["M161","Cannondale","Metro-North",41.21662,-73.4267,["M5"]],["M162","Branchville","Metro-North",41.26763,-73.44142,["M5"]],["M163","Redding","Metro-North",41.32568,-73.4338,["M5"]],["M164","Bethel","Metro-North",41.37622,-73.41817,["M5"]],["M165","Danbury","Metro-North",41.39615,-73.44879,["M5"]],["M133","East Norwalk","Metro-North",41.104,-73.40459,["M3"]],["M134","Westport","Metro-North",41.11893,-73.37141,["M3"]],["M136","Green's Farms","Metro-North",41.12226,-73.31541,["M3"]],["M137","Southport","Metro-North",41.13484,-73.28897,["M3"]],["M138","Fairfield","Metro-North",41.14308,-73.25774,["M3"]],["M188","Fairfield-Black Rock","Metro-North",41.161,-73.23434,["M3"]],["M140","Bridgeport","Metro-North",41.17868,-73.18708,["M3","M6"]],["M143","Stratford","Metro-North",41.19425,-73.13153,["M3","M6"]],["M167","Derby-Shelton","Metro-North",41.31972,-73.08355,["M6"]],["M168","Ansonia","Metro-North",41.34416,-73.07989,["M6"]],["M169","Seymour","Metro-North",41.39514,-73.0725,["M6"]],["M170","Beacon Falls","Metro-North",41.44175,-73.06359,["M6"]],["M171","Naugatuck","Metro-North",41.4942,-73.05266,["M6"]],["M172","Waterbury","Metro-North",41.55273,-73.04613,["M6"]],["M145","Milford","Metro-North",41.22323,-73.05765,["M3"]],["M190","West Haven","Metro-North",41.27142,-72.96349,["M3"]],["M149","New Haven","Metro-North",41.2965,-72.92829,["M3"]],["M151","New Haven-State St","Metro-North",41.30498,-72.92175,["M3"]]]};
  const RAILROADS = [
    { name: "LIRR", prefix: "L", trains: core.API + "lirr%2Fgtfs-lirr", alerts: core.API + "camsys%2Flirr-alerts.json" },
    { name: "Metro-North", prefix: "M", trains: core.API + "mnr%2Fgtfs-mnr", alerts: core.API + "camsys%2Fmnr-alerts.json" },
  ];
  // Atlantic Terminal, Grand Central Madison (LIRR) and Grand Central (Metro-North).
  const DEFAULT_STATION_IDS = ["L241", "L349", "M1"];
  const WINDOW = 3 * 3600;
  const PER_STATION = 8;

  const ROUTE_BY_ID = new Map(
    RAIL.routes.map(([id, name, color, textColor]) => [id, { id, name, color: "#" + color, textColor: "#" + textColor }])
  );
  const STATIONS = RAIL.stations.map(([id, name, railroad, lat, lon, routes]) => ({ id, name, railroad, lat, lon, routes }));
  const STATION_BY_ID = new Map(STATIONS.map((s) => [s.id, s]));

  // Railroad stop updates carry an MTA extension (field 1005) with the track and a status
  // such as "On-Time", "Departed" or "Bus".
  function parseStop(buf, start, end, prefix) {
    const stop = { id: "", time: 0, delay: 0, track: "", status: "" };
    core.fields(buf, start, end, (f, _v, s, e) => {
      if (s == null) return;
      if (f === 4) stop.id = prefix + core.text(buf, s, e);
      else if (f === 2 || f === 3) {
        core.fields(buf, s, e, (xf, xv) => {
          if (xf === 2 && (f === 3 || !stop.time)) stop.time = xv;
          if (xf === 1 && xv < 2 ** 31) stop.delay = xv;
        });
      } else if (f === 1005) {
        core.fields(buf, s, e, (xf, _xv, xs, xe) => {
          if (xs == null) return;
          if (xf === 1 && !stop.track) stop.track = core.text(buf, xs, xe).trim();
          if (xf === 2 && !stop.status) stop.status = core.text(buf, xs, xe).trim();
        });
      }
    });
    return stop;
  }

  function parseRailFeed(buf, prefix) {
    const trips = [];
    core.fields(buf, 0, buf.length, (f, _v, s, e) => {
      if (f !== 2 || s == null) return;
      core.fields(buf, s, e, (ef, _ev, es, ee) => {
        if (ef !== 3 || es == null) return;
        const trip = { route: "", stops: [] };
        core.fields(buf, es, ee, (tf, _tv, ts, te) => {
          if (ts == null) return;
          if (tf === 1) {
            core.fields(buf, ts, te, (xf, _xv, xs, xe) => {
              if (xf === 5 && xs != null) trip.route = prefix + core.text(buf, xs, xe);
            });
          } else if (tf === 2) {
            trip.stops.push(parseStop(buf, ts, te, prefix));
          }
        });
        trips.push(trip);
      });
    });
    return trips;
  }

  // Next departures per station: { stationId: [{ route, dest, t, track, status, delay }] }.
  function buildDepartures(tripLists, stationIds, nowSec) {
    const wanted = new Set(stationIds);
    const out = {};
    for (const trips of tripLists) {
      for (const trip of trips) {
        const n = trip.stops.length;
        if (n < 2) continue;
        let dest = "";
        for (let k = n - 1; k >= 0 && !dest; k--) {
          const st = STATION_BY_ID.get(trip.stops[k].id);
          dest = st ? st.name : "";
        }
        // The last stop is skipped: a train ending its trip there can't be boarded.
        for (let i = 0; i < n - 1; i++) {
          const stop = trip.stops[i];
          if (!wanted.has(stop.id) || !stop.time) continue;
          if (stop.time < nowSec - 60 || stop.time > nowSec + WINDOW) continue;
          if (/departed/i.test(stop.status)) continue;
          (out[stop.id] ||= []).push({ route: trip.route, dest, t: stop.time, track: stop.track, status: stop.status, delay: stop.delay });
        }
      }
    }
    for (const id of Object.keys(out)) out[id] = out[id].sort((a, b) => a.t - b.t).slice(0, PER_STATION);
    return out;
  }

  function prefixAlerts(alerts, prefix) {
    return alerts.map((a) => ({
      ...a,
      id: `${prefix}:${a.id}`,
      lines: a.lines.map((l) => prefix + l),
      wholeLine: a.wholeLine.map((l) => prefix + l),
      stopsByLine: Object.fromEntries(
        Object.entries(a.stopsByLine).map(([l, stops]) => [prefix + l, stops.map((s) => prefix + s)])
      ),
    }));
  }

  function departuresFor(cache, stationIds, nowSec) {
    return buildDepartures(Object.values(cache.trips || {}), stationIds, nowSec);
  }

  async function loadRail(fetchFn, cache, stationIds) {
    cache.trips ||= {};
    cache.alerts ||= {};
    cache.at ||= {};
    const now = Math.floor(Date.now() / 1000);
    const results = await Promise.allSettled(
      RAILROADS.flatMap((r) => [core.get(fetchFn, r.trains, "bytes"), core.get(fetchFn, r.alerts, "json")])
    );
    const failed = [];
    RAILROADS.forEach((r, i) => {
      const trains = results[2 * i];
      const alerts = results[2 * i + 1];
      if (trains.status === "fulfilled") {
        cache.trips[r.prefix] = parseRailFeed(trains.value, r.prefix);
        cache.at[r.prefix] = now;
      } else {
        failed.push({ source: `${r.name} train times`, error: core.reason(trains) });
      }
      if (alerts.status === "fulfilled") cache.alerts[r.prefix] = prefixAlerts(core.buildAlerts(alerts.value, now), r.prefix);
      else failed.push({ source: `${r.name} alerts`, error: core.reason(alerts) });
    });
    const times = Object.values(cache.at);
    return {
      ok: failed.length < results.length,
      fetchedAt: now,
      departuresAt: times.length ? Math.min(...times) : 0,
      failed,
      departures: departuresFor(cache, stationIds, now),
      departureStations: [...stationIds],
      alerts: Object.values(cache.alerts).flat(),
    };
  }

  return { RAILROADS, ROUTE_BY_ID, STATIONS, STATION_BY_ID, DEFAULT_STATION_IDS, parseRailFeed, departuresFor, loadRail };
});
