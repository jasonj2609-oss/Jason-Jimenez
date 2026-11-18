# KickShift — Speaker Script (~9 min)

Press **N** in the HTML deck to see these notes with a running timer.

## 1. Intro: lights on  `0:00 – 0:35`

*(Room dark. Let the black screen and the light scan play.)*

"Introducing..."

*(Wait for the headlight to ignite and the camera to pull back.)*

"KickShift. A car built to score."

## 2. The idea  `0:35 – 0:55`

"Soccer is the most watched sport on earth. Supercars are what people put on their walls."

"Car-soccer already exists in video games. Nobody has built it for real, with real energy and real physics."

"So: what if the car was the player?"

## 3. What we are pitching  `0:55 – 1:20`

"KickShift is a new sport with three parts: the car, the arena, and the game."

"Your investment builds a prototype of the whole system: two cars and one test arena. Let me show you what's in each."

## 4. The car: not just a car  `1:20 – 2:15`

*(Let the X-ray sweep finish, then point to each label as it appears.)*

"From the outside it looks like a supercar. Inside, it's built for the game."

"(a) A receiver coil under the floor picks up power from the charging lanes. (b) That power fills a supercapacitor, which fills in one pass and empties in one boost. (c) A battery runs the car for the whole match."

"(d) Four hub motors give instant torque at every wheel. (e) The front is a swappable strike shell: change it and you change the hitbox. (f) Tracking markers let the arena see every car 120 times a second. (g) And a light bar shows the crowd how much energy you're carrying."

## 5. The arena: the field is the charger  `2:15 – 3:00`

"And this is the arena: what a venue actually buys."

"(a) Charging lanes: coils under the floor that switch on only when a car is over them. Watch the tiles light up under the car."

"(b) Tracking cameras on the roof follow every car and the ball, so the referee is automatic and every joule is measured."

"(c) A scoreboard that shows the score and every car's energy, live. (d) Safety walls, so fans sit right next to the action."

"The arena is what venues buy. The game is why players come back."

## 6. Physics 1: wireless charging  `3:00 – 3:40`

"These demos use our 50 kilogram prototype."

"Coils under the lane carry alternating current. The dots and crosses are current coming out of and going into the page, and they swap as the current alternates. That makes a magnetic field above the lane that keeps flipping."

"The car's receiver coil sits in that changing field. A changing magnetic flux induces a voltage: Faraday's law, equation 1, the same idea as wireless phone charging."

"The graph shows that induced voltage. It only appears while the car is over the lane, and the energy collected is power times time, equation 2."

## 7. Physics 2: battery and supercapacitor  `3:40 – 4:15`

"The car stores energy two ways. On this chart, across is energy per kilogram and up is power per kilogram, on log scales."

"Batteries hold far more energy per kilogram: that's endurance for the whole match. Supercapacitors hold less, but take it in and give it out much faster: that's the sprint."

"The capacitor stores one half C V squared, equation 3. Watch it charge on the lane and empty in the boost. For the prototype, 0.87 farads at 48 volts holds 1,000 joules."

## 8. Physics 3: the boost  `4:15 – 4:55`

"Pressing boost sends that stored power to the motor, which means more torque at the wheel."

"The tyre pushes backward on the floor, and the floor pushes the car forward: Newton's third law, an equal and opposite pair."

"But there's a limit: grip. The forward force can't exceed mu m g, equation 4. For the prototype that's about 440 newtons. On the graph, force rises with torque until the grip limit; push harder and the wheel slips, and the force actually drops."

"So boost is limited by stored energy, motor power and grip."

## 9. Physics 4: one pass  `4:55 – 5:30`

"Is one pass over a lane enough? The lane is 4 metres, the car crosses at 4 metres per second, so it spends 1 second on it. At 1,000 watts, that's 1,000 joules, equation 5."

"Speeding up from 4 to 6 metres per second needs one half m times v final squared minus v initial squared: 500 joules, equation 6."

"Even if half is lost in storage and the drivetrain, one pass pays for the boost. Wireless charging of moving vehicles has already been demonstrated, at highway speed by Purdue University. The prototype will measure what ours actually delivers."

## 10. Physics 5: energy is a tactic  `5:30 – 6:05`

"Energy collected equals power times lane length divided by speed, equation 7. So slower means more energy."

"At 2 metres per second a car collects 2,000 joules; at 8, only 500. But the slow car spends 2 seconds on the lane, and its opponent might reach the ball first."

"KickShift turns energy management into gameplay: collect power from the field, store it onboard, and decide when to spend it."

## 11. Physics 6: hitboxes  `6:05 – 6:45`

"Like in Rocket League, different cars have different hitboxes: the simplified shape the game uses to decide what touched the ball. In KickShift the hitbox is real: it's the shape of the bumper shell, and the arena uses the same box to referee."

"The key number is h, the height of the front edge. If the edge is below the centre of the ball, the contact pushes up through the ball's centre, so the ball leaves at an angle theta equals arcsine of r minus h over r, equation 8."

"Wedge: a low edge at 45 centimetres chips the ball up at about 24 degrees. Balanced: 60 centimetres, about 12 degrees. Wall: a flat face taller than the ball's centre drives it straight."

"So choosing your car shape is choosing your play style."

## 12. Business model  `6:45 – 7:30`

"How does this make money? We start small. Full-size cars come later; first we sell KickShift arenas with the 50 kilogram remote-driven cars to entertainment venues, like go-kart and family entertainment centres."

"Players pay the venue about $20 each for a 10-minute match. The venue buys the arena package from us for $400,000, then pays us $2,000 a month for software and the league, plus 10% of match revenue. Later, sponsors and streaming pay us too."

*(Point to the chart.) "For one venue running 24 matches a day, that's about $672,000 a year. After staff, space, upkeep and our fees, the venue keeps about $359,000, so it earns back the arena in about 13 months. That's why a venue would buy one."*

## 13. Costs  `7:30 – 7:55`

"This is a log scale, so each line is ten times the last."

"Running it is cheap: the electricity for a whole match is under a dollar. A replacement bumper shell is about $150, and a production car about $12,000."

"Building it: this round, the prototype system, is $250,000. Each venue arena costs us about $250,000 to build and sells for $400,000. A full-size pro arena, around $3 million, only comes later, once venues have proven the game."

## 14. Roadmap  `7:55 – 8:15`

"The plan, in five stages. Months 0 to 6: build two 50 kilogram prototype cars. Months 6 to 9: measure how many joules a real lane delivers per pass. Months 9 to 12: play 50 full test matches. That's this seed round."

"Year 2: open our own flagship arena and prove players pay. Year 3: start selling arena packages to other venues."

"Each stage ends with a number we either hit or don't, so problems show up early and cheaply."

## 15. Projections  `8:15 – 8:45`

"These are projections, not promises. We open our own flagship arena in year 2, then sell 4 arenas in year 3, 10 in year 4 and 20 in year 5."

"That's 35 arenas open by year 5 and about $10.8 million in revenue, and the company becomes profitable in year 4."

## 16. The numbers  `8:45 – 9:15`

"So here's everything on one page."

"What it takes: $250,000 for the prototype system, $250,000 to build each venue arena, under a dollar of electricity per match, and a full-size pro arena, around $3 million, only later. Years 1 and 2 together cost about $1.55 million."

"What it makes: we sell each arena for $400,000, then every venue pays $2,000 a month plus 10% of every match, and sponsors and streaming come in once the league is running."

"A venue earns its arena back in about 13 months, and KickShift turns a profit in year 4."

## 17. Close  `9:15 – 9:35`

*(Let the car light up and the title appear.)*

"Collect power from the field, store it onboard, and decide when to spend it. That's KickShift: a car built to score."

"Thank you. I'm happy to take your questions."

---
### Physics cheat-sheet (for Q&A)

| Idea | Equation | Numbers used |
|---|---|---|
| Faraday's law | ε = −N dΦ/dt | AC in the lane coils changes the flux through the car's receiver coil |
| Energy collected | E = P t | 1 kW for 1 s (4 m lane at 4 m/s) = 1,000 J |
| Capacitor energy | E = ½ C V² | 0.87 F at 48 V ≈ 1,000 J |
| Grip limit | F = τ/r ≤ μ m g | m = 50 kg, μ = 0.9 → 441 N; r = 0.15 m → τ ≈ 66 N·m |
| Boost energy | ΔE = ½ m (v_f² − v_i²) | ½(50)(6² − 4²) = 500 J |
| Tactics | E = P L / v | 2 m/s → 2,000 J; 4 m/s → 1,000 J; 8 m/s → 500 J |
| Hitbox launch angle | θ = arcsin((r − h)/r), h < r | r = 0.75 m: Wedge h = 0.45 → 24°, Balanced 0.60 → 12°, Wall ≥ 0.75 → 0° |
| Match energy | E = ∫ P dt | ≈ 1.5 kWh per car → ≈ $0.25 at $0.16/kWh |

### Business cheat-sheet (for Q&A)

| Item | Estimate | How we got it |
|---|---|---|
| Match price | $20 per player, 4 players (2v2), 10 minutes | in line with go-kart pricing |
| Venue revenue | ≈ $672K a year | $80 a match × 24 matches a day × 350 days |
| Venue costs | staff $120K, space $60K, upkeep + power $42K, our fees $91K | our fees = $2K/month + 10% of revenue |
| Venue profit | ≈ $359K a year → arena pays back in ≈ 13 months | $400K ÷ $359K |
| Arena package | costs us ≈ $250K, sells for $400K | 6 cars $72K, floor + lanes $120K, cameras/software $30K, barriers/install $28K |
| Production car | ≈ $12K | 50 kg remote-driven car with coil, supercapacitor, battery, motors, telemetry |
| Electricity per match | under $1 | 4 cars × ≈ 0.1 kWh at ≈ $0.16/kWh, plus lane losses |
| Projections | 0 → 1 → 5 → 15 → 35 arenas (years 1–5); revenue $0 → $0.67M → $2.45M → $5.49M → $10.85M | sales + recurring fees + flagship venue |
| Break-even | year 4 (projected) | costs $0.25M → $1.3M → $2.6M → $4.7M → $8.4M |

### Likely question: "What about damage to the cars? Does it still make money?"

Say: "The first cars are 50 kilograms and remote-driven. A full-speed hit carries about 900 joules, around 200 times less than a real car. The front is a bumper shell that's made to be crushed and swapped for $150, like a hockey stick. Even if damage costs a venue $70,000 a year, it still makes about $290,000 and earns back its arena in under a year and a half. And every replacement shell is something we sell."

- Physics: KE = ½mv² = ½ × 50 × 6² = 900 J (a 900 kg car at 20 m/s has 180,000 J). Impulse: F = Δp/Δt; p = 300 kg·m/s, so stopping in 5 ms means about 60 kN, while a shell that crushes over 30 ms brings it down to about 10 kN.
- Cost per venue per year (estimate): 33,600 car-matches; one shell per 100 matches = 336 shells × $150 = $50K; other repairs about $18K (25% of the $72K fleet). Total about $68K, so the venue keeps about $290K and pays back in about 17 months (about 22 months if damage is double).
- Upside: shells are a consumable we sell (about $50K a year per venue; at roughly $40 each to make, about $37K profit). This is not in the projections.
- Full-size cars come later, with racing crash structures, and sponsors and the league fund repairs. The first year's 50 test matches measure the real damage rate.

Biggest risks (be ready to name them): wireless-lane efficiency on moving cars, bumper durability, safety around crowds, and whether venues buy. The seed round tests the first three before big money is spent.

Sources and caveats: the prototype numbers are illustrative. Supercapacitor and battery ranges are typical published values. Purdue University has reported wireless power transfer to a moving truck at highway speed; that supports the principle, not KickShift's specific design.
