// Loads Citi Bike dock status (GBFS) and finds the docks nearest a point.
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./subway-core.js"));
  else root.BikeCore = factory(root.SubwayCore);
})(typeof self !== "undefined" ? self : this, function (core) {
  "use strict";

  const GBFS = "https://gbfs.lyft.com/gbfs/2.3/bkn/en/";

  // Dock names and locations rarely change, so they load once per visit; counts load every call.
  async function loadBikes(fetchFn, cache) {
    const now = Math.floor(Date.now() / 1000);
    const failed = [];
    if (!cache.info) {
      try {
        const info = await core.get(fetchFn, GBFS + "station_information.json", "json");
        cache.info = info.data.stations.map((s) => ({ id: s.station_id, name: s.name, lat: s.lat, lon: s.lon, capacity: s.capacity }));
      } catch (err) {
        failed.push({ source: "Citi Bike docks", error: String((err && err.message) || err) });
      }
    }
    try {
      const status = await core.get(fetchFn, GBFS + "station_status.json", "json");
      cache.status = new Map(status.data.stations.map((s) => [s.station_id, s]));
      cache.at = now;
    } catch (err) {
      failed.push({ source: "Citi Bike availability", error: String((err && err.message) || err) });
    }

    const stations = [];
    for (const info of cache.info || []) {
      const st = cache.status && cache.status.get(info.id);
      if (!st || !st.is_installed) continue;
      const ebikes = st.num_ebikes_available || 0;
      stations.push({
        ...info,
        bikes: Math.max(0, (st.num_bikes_available || 0) - ebikes),
        ebikes,
        docks: st.num_docks_available || 0,
        renting: Boolean(st.is_renting),
        returning: Boolean(st.is_returning),
      });
    }
    return { ok: stations.length > 0, fetchedAt: cache.at || 0, failed, stations };
  }

  function distanceMeters(lat1, lon1, lat2, lon2) {
    const rad = Math.PI / 180;
    const x = (lon2 - lon1) * rad * Math.cos(((lat1 + lat2) / 2) * rad);
    const y = (lat2 - lat1) * rad;
    return Math.sqrt(x * x + y * y) * 6371000;
  }

  function nearest(stations, lat, lon, count, maxMeters) {
    return stations
      .map((s) => ({ ...s, meters: distanceMeters(lat, lon, s.lat, s.lon) }))
      .filter((s) => s.meters <= maxMeters)
      .sort((a, b) => a.meters - b.meters)
      .slice(0, count);
  }

  return { loadBikes, nearest };
});
