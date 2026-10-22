// Loads MTA service alerts and real-time train times for the stations below.
// Shared by subway-status.html (live refresh in the browser) and sync-subway.js (Node snapshot).
// To add a station, add it to STATIONS with its GTFS parent stop IDs and platform labels.
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.SubwayCore = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const API = "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/";
  const ALERTS_URL = API + "camsys%2Fsubway-alerts.json";
  const TRAIN_FEEDS = [
    { url: API + "nyct%2Fgtfs", lines: ["1", "2", "3", "4", "5", "6", "7", "S"] },
    { url: API + "nyct%2Fgtfs-ace", lines: ["A", "C", "E"] },
    { url: API + "nyct%2Fgtfs-bdfm", lines: ["B", "D", "F", "M"] },
    { url: API + "nyct%2Fgtfs-g", lines: ["G"] },
    { url: API + "nyct%2Fgtfs-jz", lines: ["J", "Z"] },
    { url: API + "nyct%2Fgtfs-nqrw", lines: ["N", "Q", "R", "W"] },
    { url: API + "nyct%2Fgtfs-l", lines: ["L"] },
  ];

  // Normal service hours in New York time, from the MTA's route descriptions.
  // Approximate; holidays and special schedules are ignored. Days: 0 = Sunday.
  const HOURS = {
    exceptLateNights: {
      note: "Runs here at all times except late nights (about midnight to 6 AM).",
      windows: [{ days: "0123456", from: "06:00", to: "24:00" }],
    },
    daily6to11: {
      note: "Runs daily, about 6 AM to 11 PM.",
      windows: [{ days: "0123456", from: "06:00", to: "23:00" }],
    },
    weekdaysExceptLateNights: {
      note: "Runs weekdays only, except late nights (about midnight to 6 AM).",
      windows: [{ days: "12345", from: "06:00", to: "24:00" }],
    },
    weekdaysDaytime: {
      note: "Reaches Brooklyn on weekday daytimes only (about 6 AM to 9 PM). Other times it ends at Bowling Green.",
      windows: [{ days: "12345", from: "06:00", to: "21:00" }],
    },
    rushHoursOnly: {
      note: "Runs weekday rush hours only: about 7 to 8:15 AM toward Manhattan and 4:30 to 5:45 PM away from it.",
      windows: [
        { days: "12345", from: "07:00", to: "08:15" },
        { days: "12345", from: "16:30", to: "17:45" },
      ],
    },
  };

  // Platform labels follow the MTA's station signs. A direction the MTA marks
  // "Last Stop" is left out, since no one boards toward it.
  const STATIONS = [
    {
      id: "fulton",
      name: "Fulton St",
      borough: "Manhattan",
      lines: ["2", "3", "4", "5", "A", "C", "J", "Z"],
      platforms: [
        { stop: "229", lines: ["2", "3"], N: "Uptown", S: "Brooklyn" },
        { stop: "418", lines: ["4", "5"], N: "Uptown", S: "Downtown" },
        { stop: "A38", lines: ["A", "C"], N: "Uptown", S: "Brooklyn" },
        { stop: "M22", lines: ["J", "Z"], N: "Brooklyn", S: "Downtown" },
      ],
      hours: { 3: "exceptLateNights", 5: "exceptLateNights", C: "daily6to11", Z: "rushHoursOnly" },
    },
    {
      id: "atlantic",
      name: "Atlantic Av-Barclays Ctr",
      borough: "Brooklyn",
      lines: ["2", "3", "4", "5", "B", "D", "N", "Q", "R"],
      platforms: [
        { stop: "235", lines: ["2", "3", "4", "5"], N: "Manhattan", S: "Away from Manhattan" },
        { stop: "D24", lines: ["B", "Q"], N: "Manhattan", S: "Away from Manhattan" },
        { stop: "R31", lines: ["D", "N", "R"], N: "Manhattan", S: "Away from Manhattan" },
      ],
      hours: { 3: "exceptLateNights", 5: "weekdaysDaytime", B: "weekdaysExceptLateNights" },
    },
    {
      id: "grand-central",
      name: "Grand Central-42 St",
      borough: "Manhattan",
      lines: ["4", "5", "6", "7", "S"],
      platforms: [
        { stop: "631", lines: ["4", "5", "6"], N: "Uptown", S: "Downtown" },
        { stop: "723", lines: ["7"], N: "Queens", S: "Hudson Yards" },
        { stop: "901", lines: ["S"], N: "Times Square" },
      ],
      hours: { 5: "exceptLateNights", S: "exceptLateNights" },
    },
    {
      id: "flushing",
      name: "Flushing-Main St",
      borough: "Queens",
      lines: ["7"],
      platforms: [{ stop: "701", lines: ["7"], S: "Manhattan" }],
      hours: {},
    },
  ];
  for (const s of STATIONS) s.stops = s.platforms.map((p) => p.stop);

  // Express variants share their local line's bullet on station signs.
  const LINE_ALIASES = { "6X": "6", "7X": "7", GS: "S" };
  const ALERT_KEEP_DAYS = 14;
  const ALERT_MAX_PERIODS = 40;
  const ARRIVAL_WINDOW = 90 * 60;
  const ARRIVALS_PER_DIRECTION = 6;

  const STOP_NAMES = {"101":"Van Cortlandt Park-242 St","103":"238 St","104":"231 St","106":"Marble Hill-225 St","107":"215 St","108":"207 St","109":"Dyckman St","110":"191 St","111":"181 St","112":"168 St-Washington Hts","113":"157 St","114":"145 St","115":"137 St-City College","116":"125 St","117":"116 St-Columbia University","118":"Cathedral Pkwy (110 St)","119":"103 St","120":"96 St","121":"86 St","122":"79 St","123":"72 St","124":"66 St-Lincoln Center","125":"59 St-Columbus Circle","126":"50 St","127":"Times Sq-42 St","128":"34 St-Penn Station","129":"28 St","130":"23 St","131":"18 St","132":"14 St","133":"Christopher St-Stonewall","134":"Houston St","135":"Canal St","136":"Franklin St","137":"Chambers St","138":"WTC Cortlandt","139":"Rector St","142":"South Ferry","201":"Wakefield-241 St","204":"Nereid Av","205":"233 St","206":"225 St","207":"219 St","208":"Gun Hill Rd","209":"Burke Av","210":"Allerton Av","211":"Pelham Pkwy","212":"Bronx Park East","213":"E 180 St","214":"West Farms Sq-E Tremont Av","215":"174 St","216":"Freeman St","217":"Simpson St","218":"Intervale Av","219":"Prospect Av","220":"Jackson Av","221":"3 Av-149 St","222":"149 St-Hostos","224":"135 St","225":"125 St","226":"116 St","227":"110 St-Malcolm X Plaza","228":"Park Place","229":"Fulton St","230":"Wall St","231":"Clark St","232":"Borough Hall","233":"Hoyt St","234":"Nevins St","235":"Atlantic Av-Barclays Ctr","236":"Bergen St","237":"Grand Army Plaza","238":"Eastern Pkwy-Brooklyn Museum","239":"Franklin Av-Medgar Evers College","241":"President St-Medgar Evers College","242":"Sterling St","243":"Winthrop St","244":"Church Av","245":"Beverly Rd","246":"Newkirk Av-Little Haiti","247":"Flatbush Av-Brooklyn College","248":"Nostrand Av","249":"Kingston Av","250":"Crown Hts-Utica Av","251":"Sutter Av-Rutland Rd","252":"Saratoga Av","253":"Rockaway Av","254":"Junius St","255":"Pennsylvania Av","256":"Van Siclen Av","257":"New Lots Av","301":"Harlem-148 St","302":"145 St","401":"Woodlawn","402":"Mosholu Pkwy","405":"Bedford Park Blvd-Lehman College","406":"Kingsbridge Rd","407":"Fordham Rd","408":"183 St","409":"Burnside Av","410":"176 St","411":"Mt Eden Av","412":"170 St","413":"167 St","414":"161 St-Yankee Stadium","415":"149 St-Hostos","416":"138 St-Grand Concourse","418":"Fulton St","419":"Wall St","420":"Bowling Green","423":"Borough Hall","501":"Eastchester-Dyre Av","502":"Baychester Av","503":"Gun Hill Rd","504":"Pelham Pkwy","505":"Morris Park","601":"Pelham Bay Park","602":"Buhre Av","603":"Middletown Rd","604":"Westchester Sq-E Tremont Av","606":"Zerega Av","607":"Castle Hill Av","608":"Parkchester","609":"St Lawrence Av","610":"Morrison Av-Soundview","611":"Elder Av","612":"Whitlock Av","613":"Hunts Point Av","614":"Longwood Av","615":"E 149 St","616":"E 143 St-St Mary's St","617":"Cypress Av","618":"Brook Av","619":"3 Av-138 St","621":"125 St","622":"116 St","623":"110 St","624":"103 St","625":"96 St","626":"86 St","627":"77 St","628":"68 St-Hunter College","629":"59 St","630":"51 St","631":"Grand Central-42 St","632":"33 St","633":"28 St","634":"23 St-Baruch College","635":"14 St-Union Sq","636":"Astor Pl","637":"Bleecker St","638":"Spring St","639":"Canal St","640":"Brooklyn Bridge-City Hall","701":"Flushing-Main St","702":"Mets-Willets Point","705":"111 St","706":"103 St-Corona Plaza","707":"Junction Blvd","708":"90 St-Elmhurst Av","709":"82 St-Jackson Hts","710":"74 St-Broadway","711":"69 St","712":"61 St-Woodside","713":"52 St","714":"46 St-Bliss St","715":"40 St-Lowery St","716":"33 St-Rawson St","718":"Queensboro Plaza","719":"Court Sq","720":"Hunters Point Av","721":"Vernon Blvd-Jackson Av","723":"Grand Central-42 St","724":"5 Av","725":"Times Sq-42 St","726":"34 St-Hudson Yards","901":"Grand Central-42 St","902":"Times Sq-42 St","A02":"Inwood-207 St","A03":"Dyckman St","A05":"190 St","A06":"181 St","A07":"175 St","A09":"168 St","A10":"163 St-Amsterdam Av","A11":"155 St","A12":"145 St","A14":"135 St","A15":"125 St","A16":"116 St","A17":"Cathedral Pkwy (110 St)","A18":"103 St","A19":"96 St","A20":"86 St","A21":"81 St-Museum of Natural History","A22":"72 St","A24":"59 St-Columbus Circle","A25":"50 St","A27":"42 St-Port Authority Bus Terminal","A28":"34 St-Penn Station","A30":"23 St","A31":"14 St","A32":"W 4 St-Wash Sq","A33":"Spring St","A34":"Canal St","A36":"Chambers St","A38":"Fulton St","A40":"High St","A41":"Jay St-MetroTech","A42":"Hoyt-Schermerhorn Sts","A43":"Lafayette Av","A44":"Clinton-Washington Avs","A45":"Franklin Av","A46":"Nostrand Av","A47":"Kingston-Throop Avs","A48":"Utica Av","A49":"Ralph Av","A50":"Rockaway Av","A51":"Broadway Junction","A52":"Liberty Av","A53":"Van Siclen Av","A54":"Shepherd Av","A55":"Euclid Av","A57":"Grant Av","A59":"80 St","A60":"88 St","A61":"Rockaway Blvd","A63":"104 St","A64":"111 St","A65":"Ozone Park-Lefferts Blvd","B04":"21 St-Queensbridge","B06":"Roosevelt Island","B08":"Lexington Av/63 St","B10":"57 St","B12":"9 Av","B13":"Fort Hamilton Pkwy","B14":"50 St","B15":"55 St","B16":"62 St","B17":"71 St","B18":"79 St","B19":"18 Av","B20":"20 Av","B21":"Bay Pkwy","B22":"25 Av","B23":"Bay 50 St","D01":"Norwood-205 St","D03":"Bedford Park Blvd","D04":"Kingsbridge Rd","D05":"Fordham Rd","D06":"182-183 Sts","D07":"Tremont Av","D08":"174-175 Sts","D09":"170 St","D10":"167 St","D11":"161 St-Yankee Stadium","D12":"155 St","D13":"145 St","D14":"7 Av","D15":"47-50 Sts-Rockefeller Ctr","D16":"42 St-Bryant Pk","D17":"34 St-Herald Sq","D18":"23 St","D19":"14 St","D20":"W 4 St-Wash Sq","D21":"Broadway-Lafayette St","D22":"Grand St","D24":"Atlantic Av-Barclays Ctr","D25":"7 Av","D26":"Prospect Park","D27":"Parkside Av","D28":"Church Av","D29":"Beverley Rd","D30":"Cortelyou Rd","D31":"Newkirk Plaza","D32":"Avenue H","D33":"Avenue J","D34":"Avenue M","D35":"Kings Hwy","D37":"Avenue U","D38":"Neck Rd","D39":"Sheepshead Bay","D40":"Brighton Beach","D41":"Ocean Pkwy","D42":"W 8 St-NY Aquarium","D43":"Coney Island-Stillwell Av","E01":"World Trade Center","F01":"Jamaica-179 St","F02":"169 St","F03":"Parsons Blvd","F04":"Sutphin Blvd","F05":"Briarwood","F06":"Kew Gardens-Union Tpke","F07":"75 Av","F09":"Court Sq-23 St","F11":"Lexington Av/53 St","F12":"5 Av/53 St","F14":"2 Av","F15":"Delancey St-Essex St","F16":"East Broadway","F18":"York St","F20":"Bergen St","F21":"Carroll St","F22":"Smith-9 Sts","F23":"4 Av-9 St","F24":"7 Av","F25":"15 St-Prospect Park","F26":"Fort Hamilton Pkwy","F27":"Church Av","F29":"Ditmas Av","F30":"18 Av","F31":"Avenue I","F32":"Bay Pkwy","F33":"Avenue N","F34":"Avenue P","F35":"Kings Hwy","F36":"Avenue U","F38":"Avenue X","F39":"Neptune Av","G05":"Jamaica Center-Parsons/Archer","G06":"Sutphin Blvd-Archer Av-JFK Airport","G07":"Jamaica-Van Wyck","G08":"Forest Hills-71 Av","G09":"67 Av","G10":"63 Dr-Rego Park","G11":"Woodhaven Blvd","G12":"Grand Av-Newtown","G13":"Elmhurst Av","G14":"Jackson Hts-Roosevelt Av","G15":"65 St","G16":"Northern Blvd","G18":"46 St","G19":"Steinway St","G20":"36 St","G21":"Queens Plaza","G22":"Court Sq","G24":"21 St","G26":"Greenpoint Av","G28":"Nassau Av","G29":"Metropolitan Av","G30":"Broadway","G31":"Flushing Av","G32":"Myrtle-Willoughby Avs","G33":"Bedford-Nostrand Avs","G34":"Classon Av","G35":"Clinton-Washington Avs","G36":"Fulton St","H01":"Aqueduct Racetrack","H02":"Aqueduct-N Conduit Av","H03":"Howard Beach-JFK Airport","H04":"Broad Channel","H06":"Beach 67 St","H07":"Beach 60 St","H08":"Beach 44 St","H09":"Beach 36 St","H10":"Beach 25 St","H11":"Far Rockaway-Mott Av","H12":"Beach 90 St","H13":"Beach 98 St","H14":"Beach 105 St","H15":"Rockaway Park-Beach 116 St","J12":"121 St","J13":"111 St","J14":"104 St","J15":"Woodhaven Blvd","J16":"85 St-Forest Pkwy","J17":"75 St-Elderts Ln","J19":"Cypress Hills","J20":"Crescent St","J21":"Norwood Av","J22":"Cleveland St","J23":"Van Siclen Av","J24":"Alabama Av","J27":"Broadway Junction","J28":"Chauncey St","J29":"Halsey St","J30":"Gates Av","J31":"Kosciuszko St","L01":"8 Av","L02":"6 Av","L03":"14 St-Union Sq","L05":"3 Av","L06":"1 Av","L08":"Bedford Av","L10":"Lorimer St","L11":"Graham Av","L12":"Grand St","L13":"Montrose Av","L14":"Morgan Av","L15":"Jefferson St","L16":"DeKalb Av","L17":"Myrtle-Wyckoff Avs","L19":"Halsey St","L20":"Wilson Av","L21":"Bushwick Av-Aberdeen St","L22":"Broadway Junction","L24":"Atlantic Av","L25":"Sutter Av","L26":"Livonia Av","L27":"New Lots Av","L28":"East 105 St","L29":"Canarsie-Rockaway Pkwy","M01":"Middle Village-Metropolitan Av","M04":"Fresh Pond Rd","M05":"Forest Av","M06":"Seneca Av","M08":"Myrtle-Wyckoff Avs","M09":"Knickerbocker Av","M10":"Central Av","M11":"Myrtle Av","M12":"Flushing Av","M13":"Lorimer St","M14":"Hewes St","M16":"Marcy Av","M18":"Delancey St-Essex St","M19":"Bowery","M20":"Canal St","M21":"Chambers St","M22":"Fulton St","M23":"Broad St","N02":"8 Av","N03":"Fort Hamilton Pkwy","N04":"New Utrecht Av","N05":"18 Av","N06":"20 Av","N07":"Bay Pkwy","N08":"Kings Hwy","N09":"Avenue U","N10":"86 St","Q01":"Canal St","Q03":"72 St","Q04":"86 St","Q05":"96 St","R01":"Astoria-Ditmars Blvd","R03":"Astoria Blvd","R04":"30 Av","R05":"Broadway","R06":"36 Av","R08":"39 Av-Dutch Kills","R09":"Queensboro Plaza","R11":"Lexington Av/59 St","R13":"5 Av/59 St","R14":"57 St-7 Av","R15":"49 St","R16":"Times Sq-42 St","R17":"34 St-Herald Sq","R18":"28 St","R19":"23 St","R20":"14 St-Union Sq","R21":"8 St-NYU","R22":"Prince St","R23":"Canal St","R24":"City Hall","R25":"Cortlandt St","R26":"Rector St","R27":"Whitehall St-South Ferry","R28":"Court St","R29":"Jay St-MetroTech","R30":"DeKalb Av","R31":"Atlantic Av-Barclays Ctr","R32":"Union St","R33":"4 Av-9 St","R34":"Prospect Av","R35":"25 St","R36":"36 St","R39":"45 St","R40":"53 St","R41":"59 St","R42":"Bay Ridge Av","R43":"77 St","R44":"86 St","R45":"Bay Ridge-95 St","S01":"Franklin Av","S03":"Park Pl","S04":"Botanic Garden","S09":"Tottenville","S11":"Arthur Kill","S13":"Richmond Valley","S14":"Pleasant Plains","S15":"Prince's Bay","S16":"Huguenot","S17":"Annadale","S18":"Eltingville","S19":"Great Kills","S20":"Bay Terrace","S21":"Oakwood Heights","S22":"New Dorp","S23":"Grant City","S24":"Jefferson Av","S25":"Dongan Hills","S26":"Old Town","S27":"Grasmere","S28":"Clifton","S29":"Stapleton","S30":"Tompkinsville","S31":"St George"};

  const ourLines = new Set(STATIONS.flatMap((s) => s.lines));
  const ourStops = new Set(STATIONS.flatMap((s) => s.stops));
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

  function buildArrivals(tripLists, nowSec) {
    const out = {};
    for (const trips of tripLists) {
      for (const trip of trips) {
        const n = trip.stops.length;
        if (n < 2) continue;
        const dest = STOP_NAMES[trip.stops[n - 1].stopId.slice(0, -1)] || "";
        // The last stop is skipped: a train ending its trip there can't be boarded.
        for (let i = 0; i < n - 1; i++) {
          const stop = trip.stops[i];
          const parent = stop.stopId.slice(0, -1);
          const dir = stop.stopId.slice(-1);
          if (!ourStops.has(parent) || (dir !== "N" && dir !== "S")) continue;
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
        byDir[dir] = byDir[dir].sort((a, b) => a.t - b.t).slice(0, ARRIVALS_PER_DIRECTION);
      }
    }
    return out;
  }

  function english(field) {
    const t = ((field && field.translation) || []).find((x) => x.language === "en");
    return t ? t.text.trim() : "";
  }

  function buildAlerts(feed, fetchedAt) {
    const alerts = [];
    for (const ent of feed.entity || []) {
      const a = ent.alert;
      if (!a) continue;
      const lines = new Set();
      const linesWithStops = new Set();
      const stopsByLine = {};
      for (const ie of a.informed_entity || []) {
        const line = LINE_ALIASES[ie.route_id] || ie.route_id;
        if (!line) continue;
        lines.add(line);
        if (!ie.stop_id) continue;
        linesWithStops.add(line);
        if (ourStops.has(ie.stop_id)) (stopsByLine[line] ||= new Set()).add(ie.stop_id);
      }
      const relevant = [...lines].filter((l) => ourLines.has(l));
      if (!relevant.length) continue;

      const horizon = fetchedAt + ALERT_KEEP_DAYS * 86400;
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
        lines: relevant,
        wholeLine: relevant.filter((l) => !linesWithStops.has(l)),
        stopsByLine: Object.fromEntries(
          relevant.filter((l) => stopsByLine[l]).map((l) => [l, [...stopsByLine[l]]])
        ),
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

  // `cache` carries the last good result of each source between calls, so one
  // failed feed keeps its previous data instead of blanking part of the page.
  async function loadData(fetchFn, cache) {
    cache = cache || {};
    cache.trips ||= {};
    cache.tripsAt ||= {};
    const now = Math.floor(Date.now() / 1000);
    const feeds = TRAIN_FEEDS.filter((f) => f.lines.some((l) => ourLines.has(l)));
    const [alertsResult, ...feedResults] = await Promise.allSettled([
      get(fetchFn, ALERTS_URL, "json"),
      ...feeds.map((f) => get(fetchFn, f.url, "bytes")),
    ]);

    const failed = [];
    if (alertsResult.status === "fulfilled") {
      cache.alerts = buildAlerts(alertsResult.value, now);
      cache.alertsAt = now;
    } else {
      failed.push({ source: "service alerts", error: String(alertsResult.reason && alertsResult.reason.message || alertsResult.reason) });
    }
    feedResults.forEach((r, i) => {
      const feed = feeds[i];
      if (r.status === "fulfilled") {
        cache.trips[feed.url] = parseFeed(r.value);
        cache.tripsAt[feed.url] = now;
      } else {
        failed.push({ source: `${feed.lines.join(" ")} train times`, error: String(r.reason && r.reason.message || r.reason) });
      }
    });

    const tripTimes = feeds.map((f) => cache.tripsAt[f.url]).filter(Boolean);
    return {
      ok: failed.length < feeds.length + 1,
      fetchedAt: now,
      alertsAt: cache.alertsAt || 0,
      arrivalsAt: tripTimes.length ? Math.min(...tripTimes) : 0,
      failed,
      hours: HOURS,
      stations: STATIONS,
      alerts: cache.alerts || [],
      arrivals: buildArrivals(Object.values(cache.trips), now),
    };
  }

  return { STATIONS, HOURS, parseFeed, buildAlerts, buildArrivals, loadData };
});
