// Speaker script, one entry per slide. Target: about 9.5 minutes at a relaxed pace.
export const NOTES = [
  {
    title: 'Intro: lights on', time: '0:00 – 0:35',
    say: `(Room dark. Let the black screen and the light scan play.)
"Introducing..."
(Wait for the headlight to ignite and the camera to pull back.)
"KickShift. A car built to score."`,
  },
  {
    title: 'The idea', time: '0:35 – 0:55',
    say: `"Soccer is the most watched sport on earth. Supercars are what people put on their walls."
"Car-soccer already exists in video games. Nobody has built it for real, with real energy and real physics."
"So: what if the car was the player?"`,
  },
  {
    title: 'What we are pitching', time: '0:55 – 1:20',
    say: `"KickShift is a new sport with three parts: the car, the arena, and the game."
"Your investment builds a prototype of the whole system: two cars and one test arena. Let me show you what's in each."`,
  },
  {
    title: 'The car: not just a car', time: '1:20 – 2:15',
    say: `(Let the X-ray sweep finish, then point to each label as it appears.)
"From the outside it looks like a supercar. Inside, it's built for the game."
"(a) A receiver coil under the floor picks up power from the charging lanes. (b) That power fills a supercapacitor, which fills in one pass and empties in one boost. (c) A battery runs the car for the whole match."
"(d) Four hub motors give instant torque at every wheel. (e) The front is a swappable strike shell: change it and you change the hitbox. (f) Tracking markers let the arena see every car 120 times a second. (g) And a light bar shows the crowd how much energy you're carrying."`,
  },
  {
    title: 'The arena: the field is the charger', time: '2:15 – 3:00',
    say: `"And this is the arena: what a venue actually buys."
"(a) Charging lanes: coils under the floor that switch on only when a car is over them. Watch the tiles light up under the car."
"(b) Tracking cameras on the roof follow every car and the ball, so the referee is automatic and every joule is measured."
"(c) A scoreboard that shows the score and every car's energy, live. (d) Safety walls, so fans sit right next to the action."
"The arena is what venues buy. The game is why players come back."`,
  },
  {
    title: 'Physics 1: wireless charging', time: '3:00 – 3:40',
    say: `"These demos use our 50 kilogram prototype."
"Coils under the lane carry alternating current. The dots and crosses are current coming out of and going into the page, and they swap as the current alternates. That makes a magnetic field above the lane that keeps flipping."
"The car's receiver coil sits in that changing field. A changing magnetic flux induces a voltage: Faraday's law, equation 1, the same idea as wireless phone charging."
"The graph shows that induced voltage. It only appears while the car is over the lane, and the energy collected is power times time, equation 2."`,
  },
  {
    title: 'Physics 2: battery and supercapacitor', time: '3:40 – 4:15',
    say: `"The car stores energy two ways. On this chart, across is energy per kilogram and up is power per kilogram, on log scales."
"Batteries hold far more energy per kilogram: that's endurance for the whole match. Supercapacitors hold less, but take it in and give it out much faster: that's the sprint."
"The capacitor stores one half C V squared, equation 3. Watch it charge on the lane and empty in the boost. For the prototype, 0.87 farads at 48 volts holds 1,000 joules."`,
  },
  {
    title: 'Physics 3: the boost', time: '4:15 – 4:55',
    say: `"Pressing boost sends that stored power to the motor, which means more torque at the wheel."
"The tyre pushes backward on the floor, and the floor pushes the car forward: Newton's third law, an equal and opposite pair."
"But there's a limit: grip. The forward force can't exceed mu m g, equation 4. For the prototype that's about 440 newtons. On the graph, force rises with torque until the grip limit; push harder and the wheel slips, and the force actually drops."
"So boost is limited by stored energy, motor power and grip."`,
  },
  {
    title: 'Physics 4: one pass', time: '4:55 – 5:30',
    say: `"Is one pass over a lane enough? The lane is 4 metres, the car crosses at 4 metres per second, so it spends 1 second on it. At 1,000 watts, that's 1,000 joules, equation 5."
"Speeding up from 4 to 6 metres per second needs one half m times v final squared minus v initial squared: 500 joules, equation 6."
"Even if half is lost in storage and the drivetrain, one pass pays for the boost. Wireless charging of moving vehicles has already been demonstrated, at highway speed by Purdue University. The prototype will measure what ours actually delivers."`,
  },
  {
    title: 'Physics 5: energy is a tactic', time: '5:30 – 6:05',
    say: `"Energy collected equals power times lane length divided by speed, equation 7. So slower means more energy."
"At 2 metres per second a car collects 2,000 joules; at 8, only 500. But the slow car spends 2 seconds on the lane, and its opponent might reach the ball first."
"KickShift turns energy management into gameplay: collect power from the field, store it onboard, and decide when to spend it."`,
  },
  {
    title: 'Physics 6: hitboxes', time: '6:05 – 6:45',
    say: `"Like in Rocket League, different cars have different hitboxes: the simplified shape the game uses to decide what touched the ball. In KickShift the hitbox is real: it's the shape of the bumper shell, and the arena uses the same box to referee."
"The key number is h, the height of the front edge. If the edge is below the centre of the ball, the contact pushes up through the ball's centre, so the ball leaves at an angle theta equals arcsine of r minus h over r, equation 8."
"Wedge: a low edge at 45 centimetres chips the ball up at about 24 degrees. Balanced: 60 centimetres, about 12 degrees. Wall: a flat face taller than the ball's centre drives it straight."
"So choosing your car shape is choosing your play style."`,
  },
  {
    title: 'Business model', time: '6:45 – 7:30',
    say: `"How does this make money? We start small. Full-size cars come later; first we sell KickShift arenas with the 50 kilogram remote-driven cars to entertainment venues, like go-kart and family entertainment centres."
"Players pay the venue about $20 each for a 10-minute match. The venue buys the arena package from us for $400,000, then pays us $2,000 a month for software and the league, plus 10% of match revenue. Later, sponsors and streaming pay us too."
(Point to the chart.) "For one venue running 24 matches a day, that's about $672,000 a year. After staff, space, upkeep and our fees, the venue keeps about $359,000, so it earns back the arena in about 13 months. That's why a venue would buy one."`,
  },
  {
    title: 'Costs', time: '7:30 – 7:55',
    say: `"This is a log scale, so each line is ten times the last."
"Running it is cheap: the electricity for a whole match is under a dollar. A replacement bumper shell is about $150, and a production car about $12,000."
"Building it: this round, the prototype system, is $250,000. Each venue arena costs us about $250,000 to build and sells for $400,000. A full-size pro arena, around $3 million, only comes later, once venues have proven the game."`,
  },
  {
    title: 'Roadmap', time: '7:55 – 8:15',
    say: `"The plan, in five stages. Months 0 to 6: build two 50 kilogram prototype cars. Months 6 to 9: measure how many joules a real lane delivers per pass. Months 9 to 12: play 50 full test matches. That's this seed round."
"Year 2: open our own flagship arena and prove players pay. Year 3: start selling arena packages to other venues."
"Each stage ends with a number we either hit or don't, so problems show up early and cheaply."`,
  },
  {
    title: 'Projections', time: '8:15 – 8:45',
    say: `"These are projections, not promises. We open our own flagship arena in year 2, then sell 4 arenas in year 3, 10 in year 4 and 20 in year 5."
"That's 35 arenas open by year 5 and about $10.8 million in revenue, and the company becomes profitable in year 4."`,
  },
  {
    title: 'The numbers', time: '8:45 – 9:15',
    say: `"So here's everything on one page."
"What it takes: $250,000 for the prototype system, $250,000 to build each venue arena, under a dollar of electricity per match, and a full-size pro arena, around $3 million, only later. Years 1 and 2 together cost about $1.55 million."
"What it makes: we sell each arena for $400,000, then every venue pays $2,000 a month plus 10% of every match, and sponsors and streaming come in once the league is running."
"A venue earns its arena back in about 13 months, and KickShift turns a profit in year 4."`,
  },
  {
    title: 'Close', time: '9:15 – 9:35',
    say: `(Let the car light up and the title appear.)
"Collect power from the field, store it onboard, and decide when to spend it. That's KickShift: a car built to score."
"Thank you. I'm happy to take your questions."`,
  },
];
