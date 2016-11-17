
export default function newNormalizer({initialEntries = [], rules = []} = {}) {

  function applyRules(str) {
    for (let rule of rules) {
      str = rule(str);
    }
    return str;
  }

  const cache = new Map(
    initialEntries.map(([k,v]) => [k, applyRules(v)]));

  return (str) => {
    if (cache.has(str)) {
      return cache.get(str);
    }

    let normalized = applyRules(str);

    cache.set(str, normalized);

    return normalized;
  }

}
