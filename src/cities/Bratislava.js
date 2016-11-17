import OsmLoader from "../loaders/OsmLoader"
import {addTrips} from "../loaders/tripLoader"
import newNormalizer from "./nameNormalizer"

const normalizer = newNormalizer({
   initialEntries: [
     ["Nár. onkolog. ústav", "Národný onkologický ústav"],
     ["ŽST Dev. Nová Ves", "ŽST Devínska Nová Ves"],
     ["Nemocnica P. Biskupice", "Nemocnica Podunajské Biskupice"],
     ["Letisko", "Letisko (Airport)"],
     ["Trnavská-NAD", "Trnavská, NAD"],
     ["MiÚ Záh. Bystrica", "Miestny úrad Záhorská Bystrica"],
     ["Záhumenice-Drevona", "Záhumenice"]
   ],
   rules: [
     s => s.toLowerCase(),
     s => s.replace(/(^| )(nám)\./g, "$1námestie"),
     s => s.replace(/\S-\S/, match => [...match].join(" "))
   ]
 });

export default function loadCityData(data, routeTimetables) {

  let loader = new OsmLoader(normalizer);

  let routesToSkip = ["901", "525", "131", "141", "203", "801", "525"];

  loader.loadAll([...data.nodes, ...data.ways, ...data.lines], (el) => {

    if (el && el.type == "relation" && el.tags.ref) {
      if (el.tags.operator !== "DPB" || routesToSkip.includes(el.tags.ref)) {
        return false;
      }
    }
    return true;
  });

  let transitData = loader.transitData;

  const STOP_SECONDS = 15;

  addTrips(loader.transitData, routeTimetables, STOP_SECONDS);



  transitData.removeStopsWithoutRoutes();
  transitData.removeRoutesWithoutTrips();

  return [transitData, loader.warnings];
}


