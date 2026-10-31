# How ChiroMatch scoring works

Version `v1` lives in `src/lib/match/score.ts`. The weights add up to 100:

- Technique, 25
- Who you care for, 15
- How the practice is paid, 15
- Location, 15
- When you want to start, 10
- How pay works, 10
- Practice size, 5
- How you explain care and how long visits are, 5

Two people only get a score when the doctor offers something the student is looking for, and the clinic is somewhere the student will go. Otherwise they are left out. They are not given a low score.

Each factor is a number from 0 to 1. The match percent is the weighted total, rounded. The sentence on the card uses the two strongest factors that are at least 0.75. We do not mention the weak ones.

Location uses the clinic state. The same state scores highest. "Willing to relocate anywhere" still counts, at a lower number. A max distance counts only when both sides have map coordinates.

The tonal family (Tonal, Network Spinal, Torque Release) counts as a partial technique match when the names are not the same.

Doctors show up only if they turn on Open to students and finish the questions. Students show up only with an active membership, a finished profile, and a verified school.

## Changing the weights later

There is no learning model in v1. After about 50 outcomes (hired, shadowed, or not a fit), compare the average of each factor for the outcomes that worked with the ones that did not. If a factor is high in both groups, it is not telling you much. If hired matches are consistently higher on one factor, that factor can take more of the 100 points.

Raymond approves any change. Edit `WEIGHTS_V1`, keep the total at 100, and store the version name with every new match. Old matches keep the factors they were saved with.
