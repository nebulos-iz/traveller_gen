const Name = {
  label: "Name",
  type: "freeform",
  v: "Placeholder Name",
  o: (state, val) => state.set("name", val),
  r: state => {
    Characteristics.forEach(c => enqueue(state, c));
    enqueue(state, BackgroundSkills);
    enqueue(state, Term);
  },
}

const characteristics = ["STR", "DEX", "END", "INT", "EDU", "SOC"];
const Characteristics = characteristics.map((stat, idx) => {
  return {
    label: "Initial " + stat,
    type: "set",
    v: v_2d6,
    p: p_2d6,
    o: v_2d6.map(val => (state => state.set(stat, val))),
    r: () => {}
  }
});

const background_skills = ["Admin", "Animals", "Art", "Athletics", "Carouse", "Drive", "Science", "Seafarer", "Streetwise", "Survival", "Vacc Suit", "Electronics", "Flyer", "Language", "Mechanic", "Medic", "Profession"];
const BackgroundSkills = uniform({
  label: "Background Skills",
  type: "pick",
  v: background_skills,
  o: background_skills.map(skill => (state => setSkill(state, skill, 0))),
  n: 4,
  r: () => {},
});

