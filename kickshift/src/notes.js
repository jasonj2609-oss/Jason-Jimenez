// Speaker script, one entry per slide, in plain words. Target: about 8 minutes at a relaxed pace.
// Tip: the big title on each slide is your cue; explain it in your own words.
export const NOTES = [
  {
    title: 'Intro: lights on', time: '0:00 – 0:30',
    say: `(Room quiet. Let the black screen and the light play.)
"Introducing..."
(Wait for the headlights to turn on.)
"KickShift. A car built to score."`,
  },
  {
    title: 'The idea', time: '0:30 – 0:50',
    say: `"Everyone loves soccer, and everyone loves supercars. But car soccer only exists in video games."
"So we asked: what if the car was the player?"`,
  },
  {
    title: 'What we are pitching', time: '0:50 – 1:10',
    say: `"KickShift is a new sport with three parts: the car, the arena, and the game."
"Your investment builds a small test version: two cars and one test arena."`,
  },
  {
    title: 'The car: not just a car', time: '1:10 – 2:05',
    say: `"It looks like a supercar, but inside it's built for the game."
(Point at each label as it appears.)
"A coil underneath picks up power from the floor. A supercapacitor stores it for a quick boost. A battery runs the car all match. Motors in every wheel give the push."
"The nose swaps out when it gets hit. Markers let cameras track the car. And a light bar shows everyone how much energy you have."`,
  },
  {
    title: 'The arena: the field is the charger', time: '2:05 – 2:50',
    say: `"This is the arena, and this is what we sell."
"The floor has charging lanes. They light up and charge a car only when it drives over them."
"Cameras on the roof track every car and the ball, so the game referees itself. The scoreboard shows everyone's energy, and glass walls keep the fans safe."`,
  },
  {
    title: 'Physics 1: wireless charging', time: '2:50 – 3:25',
    say: `"How does the floor charge the car? It's the same idea as a wireless phone charger."
"Coils in the floor make a magnetic field that keeps flipping. A changing magnetic field through the car's coil makes electricity. That's Faraday's law, equation 1."
"The graph shows it: electricity only appears while the car is over the lane."`,
  },
  {
    title: 'Physics 2: battery and supercapacitor', time: '3:25 – 4:00',
    say: `"The car stores energy two ways."
"The battery is like a big water tank: it holds a lot, but fills and empties slowly. The supercapacitor is like a bucket: it holds less, but fills and empties almost instantly."
"So the battery lasts the whole match, and the supercapacitor is for quick boosts. Ours holds about 1,000 joules."`,
  },
  {
    title: 'Physics 3: the boost', time: '4:00 – 4:35',
    say: `"When you boost, the wheels push back on the floor, and the floor pushes the car forward. That's Newton's third law."
"But there's a limit: grip. Push too hard and the tyres just spin, like a car on ice. So more power doesn't always mean more speed."`,
  },
  {
    title: 'Physics 4: one pass', time: '4:35 – 5:05',
    say: `"Is one trip over a lane enough for a boost?"
"One pass gives about 1,000 joules. A boost needs about 500. So even if half the energy is lost along the way, one pass pays for one boost."`,
  },
  {
    title: 'Physics 5: energy is a tactic', time: '5:05 – 5:40',
    say: `"Here's the twist: the slower you drive over a lane, the more energy you collect, because you're on it longer."
"But if you go slow, the other team might get the ball first. That choice is the game."
"Collect power from the field, store it, and decide when to spend it."`,
  },
  {
    title: 'Business model', time: '5:40 – 6:20',
    say: `"How does it make money? We sell arenas to places like go-kart tracks."
"Players pay about $20 to play. The venue pays us $400,000 for the arena, plus a monthly fee and a small cut of every game."
(Point to the chart.) "One venue makes about $359,000 a year, so it earns back the arena in about a year."`,
  },
  {
    title: 'Costs', time: '6:20 – 6:40',
    say: `"It's cheap to run: a whole game uses less than a dollar of electricity."
"An arena costs us $250,000 to build, and we sell it for $400,000."`,
  },
  {
    title: 'Roadmap', time: '6:40 – 7:00',
    say: `"First we build two test cars, test the charging lanes, and play 50 test games. That's the first year."
"Then we open our own arena, and then we sell arenas to other places."`,
  },
  {
    title: 'Projections', time: '7:00 – 7:20',
    say: `"These are predictions, not promises."
"By year 5 we could have 35 arenas and about $10.8 million a year in sales, and we start making a profit in year 4."`,
  },
  {
    title: 'The numbers', time: '7:20 – 7:45',
    say: `"Here's everything on one page: what it costs on the left, and how it makes money on the right."
"The big takeaway: a venue earns its money back in about a year, and KickShift makes a profit by year 4."`,
  },
  {
    title: 'Close', time: '7:45 – 8:00',
    say: `(Let the car light up first.)
"Collect power from the field, store it, and decide when to spend it. That's KickShift: a car built to score."
"Thank you. Any questions?"
(If anyone asks about the car model: it's a concept render restyled from the 3D model "Ferrari 458 Italia" by vicent091036, licensed CC BY 4.0.)`,
  },
];
