// Brani svoj grad više ne koristi generirani JS paket.
// BraniSvojGrad učita odabrani grad iz Supabasea i spremi ga u ovaj
// mali runtime cache prije nego što App pokrene postojeći QuizPlayer.
const CITY_QUESTIONS = new Proxy([], {
  get(target, property, receiver) {
    if (property === Symbol.iterator) {
      const cached = globalThis.__PATRIA_CITY_QUESTIONS__;
      return function* iterator() {
        yield* (Array.isArray(cached) ? cached : target);
      };
    }
    return Reflect.get(target, property, receiver);
  },
});

export { CITY_QUESTIONS };
