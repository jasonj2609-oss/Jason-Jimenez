# KickShift — Speaker Script (~9 min)

Press **N** in the HTML deck to see these notes with a running timer.

## 1. Intro: lights on  `0:00 – 0:40`

*(Room dark. Let the black screen and the light scan play.)*

"Introducing..."

*(Wait for the headlight to ignite and the camera to pull back.)*

"KickShift. A car built to score."

## 2. The idea  `0:40 – 1:05`

"Soccer is the most watched sport on earth. Supercars are what people put on their walls."

"Car-soccer already exists in video games. Nobody has built it for real, with real energy and real physics."

"So: what if the car was the player?"

## 3. What we are pitching  `1:05 – 1:50`

"To be clear about what I'm pitching: KickShift is a new sport, and it has three parts."

"One, the car: built to collect, store and spend energy."

"Two, the arena: charging lanes in the floor, cameras, and an automatic referee. The arena is what a venue would buy."

"Three, the game: energy becomes a tactic, and the shape of your car changes how you hit the ball."

"Your investment builds a prototype of the whole system: two cars and one test arena."

## 4. Meet the car  `1:50 – 2:30`

"This is the full-size concept. The technologies inside already exist; the invention is combining them into a game."

"(a) A supercapacitor for short bursts. (b) A receiver coil underneath that collects energy from the lanes. (c) Motors that turn stored energy into a boost. (d) A curved strike-face nose for the ball."

"Everything follows one chain: collect, store, spend. Let's follow it."

## 5. Physics 1: wireless charging  `2:30 – 3:20`

"These demos use our prototype: the same car at 1 to 2.6 scale, 50 kilograms."

"Coils under the lane carry alternating current. The dots and crosses are current coming out of and going into the page, and they swap as the current alternates. That makes a magnetic field above the lane that keeps flipping."

"The car's receiver coil sits in that changing field. A changing magnetic flux induces a voltage: Faraday's law, equation 1, the same idea as wireless phone charging."

"The graph shows that induced voltage. It only appears while the car is over the lane, and the energy collected is power times time, equation 2."

## 6. Physics 2: battery and supercapacitor  `3:20 – 4:00`

"The car stores energy two ways. On this chart, across is energy per kilogram and up is power per kilogram, on log scales."

"Batteries hold far more energy per kilogram: that's endurance for the whole match. Supercapacitors hold less, but take it in and give it out much faster: that's the sprint."

"The capacitor stores one half C V squared, equation 3. Watch it charge on the lane and empty in the boost. For the prototype, 0.87 farads at 48 volts holds 1,000 joules."

## 7. Physics 3: the boost  `4:00 – 4:50`

"Pressing boost sends that stored power to the motor, which means more torque at the wheel."

"The tyre pushes backward on the floor, and the floor pushes the car forward: Newton's third law, an equal and opposite pair."

"But there's a limit: grip. The forward force can't exceed mu m g, equation 4. For the prototype that's about 440 newtons. On the graph, force rises with torque until the grip limit; push harder and the wheel slips, and the force actually drops."

"So boost is limited by stored energy, motor power, grip and heat. And extra power at the wheels can't make the car fly."

## 8. Physics 4: one pass  `4:50 – 5:30`

"Is one pass over a lane enough? The lane is 4 metres, the car crosses at 4 metres per second, so it spends 1 second on it. At 1,000 watts, that's 1,000 joules, equation 5."

"Speeding up from 4 to 6 metres per second needs one half m times v final squared minus v initial squared: 500 joules, equation 6."

"Even if half is lost in storage and the drivetrain, one pass pays for the boost. Wireless charging of moving vehicles has already been demonstrated, at highway speed by Purdue University. The prototype will measure what ours actually delivers."

## 9. Physics 5: energy is a tactic  `5:30 – 6:10`

"Energy collected equals power times lane length divided by speed, equation 7. So slower means more energy."

"At 2 metres per second a car collects 2,000 joules; at 8, only 500. But the slow car spends 2 seconds on the lane, and its opponent might reach the ball first."

"KickShift turns energy management into gameplay: collect power from the field, store it onboard, and decide when to spend it."

## 10. Physics 6: hitboxes  `6:10 – 7:00`

"Like in Rocket League, different cars have different hitboxes: the simplified shape the game uses to decide what touched the ball. In KickShift the hitbox is real: it's the shape of the bumper shell, and the arena uses the same box to referee."

"The key number is h, the height of the front edge. If the edge is below the centre of the ball, the contact pushes up through the ball's centre, so the ball leaves at an angle theta equals arcsine of r minus h over r, equation 8."

"Wedge: a low edge at 45 centimetres chips the ball up at about 24 degrees. Balanced: 60 centimetres, about 12 degrees. Wall: a flat face taller than the ball's centre drives it straight."

"So choosing your car shape is choosing your play style."

## 11. Operating cost  `7:00 – 7:30`

"What does a match cost to run? Energy is the area under the power curve, equation 9."

"For a full 10-minute match that's about 1.5 kilowatt-hours per car, roughly 25 cents of electricity."

## 12. Roadmap  `7:30 – 8:10`

"The plan, in four stages."

"Months 0 to 6: build two 50 kilogram prototype cars."

"Months 6 to 9: charge. Measure how many joules a real lane delivers per pass, and how much reaches the wheels."

"Months 9 to 12: play 50 full test matches."

"Year 2: launch a full-size pilot league."

"Each stage ends with a number we either hit or don't, so problems show up early and cheaply."

## 13. The ask  `8:10 – 8:50`

"We're raising $250,000 in seed funding: 40% for prototype cars, 30% for charging lanes, 20% for testing and 10% for safety."

"For that, you get two prototype cars, a charging test arena, and 50 matches of real energy data that prove whether this sport works."

## 14. Close  `8:50 – 9:30`

*(Let the car launch and hit the ball before speaking.)*

"Faraday's law to charge. A supercapacitor to store. Newton's third law to boost. Geometry to score."

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

Sources and caveats: the prototype numbers are illustrative. Supercapacitor and battery ranges are typical published values. Purdue University has reported wireless power transfer to a moving truck at highway speed; that supports the principle, not KickShift's specific design.
