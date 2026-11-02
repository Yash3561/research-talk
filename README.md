# Research discussion — Yash Chaudhary

A standalone, professor-facing research presentation. Static HTML, CSS and JavaScript; no analytics, remote fonts, application backend or package installation.

Six chapters cover prior papers, a physical-control question, experimental design, the completed fresh comparison and a proposed model-error learning study. Methods and academic links are available in a supporting dialog. Arrow navigation, fullscreen, a static thrust illustration and a saved development-trajectory replay work locally.

The current result is planner 13/192, selected integral feedback 29/192, ordinary PD 27/192. Primary paired difference: −8.33 percentage points, 95% whole-group interval [−15.62, −1.56]. All 576 fresh episodes passed replay audits. The plotted fresh-g000-w1-s0 example shows integral-only success and was selected after outcomes; it cannot estimate aggregate performance.

No rehearsal scripts, talk cues, interview coaching, private-site links, CV, unpublished manuscript PDFs, private raw logs or source filesystem paths are included. The robot image is an original simulation rendering. This public presentation does not imply a laboratory affiliation or claim a novel validated controller.

Publish the repository root through GitHub Pages (`main`, `/`). `.nojekyll` disables Jekyll. `noindex,nofollow` asks search engines not to index the presentation; it is not an access restriction.

The site has no ongoing idle animation or timer loop. Playback requests frames only after Play, and stops when paused, hidden or on a different chapter.

## Fresh recorded demo

`demo.html` embeds a 39-second MP4 with burned-in captions, exact archived fresh states and the completed negative aggregate result. Two post-outcome illustrations show opposite discordant cases, selected by a declared lexicographic rule. These are not representative samples. Public provenance contains source and rendering hashes. The archived v14 development film is unchanged.

## Research-fit framing

The opening emphasizes AI research experience. The robot experiment is an exploratory pilot, with its negative result retained. The proposed first PhD study investigates model-error learning only after baseline reproduction and controlled diagnosis, then evaluates task benefit against matched conventional alternatives. No new learning method, causal explanation, advance over the lab platforms or publication-ready contribution is claimed.

## Complete recorded-state replay

`replay.html` provides all 192 fresh cases and all three frozen controllers (576 audited recordings, 65,295 saved samples). It loads one case at a time, with a bounded three-case cache. It does not download the complete 31 MB export on page entry. The slide contains only its selected case.

Both replay surfaces progressively reveal elapsed trajectories, move endpoints and update recorded pose/measurements together. The full replay includes height, horizontal distance, body tilt, joint angles, speed and expandable commanded rotor-force bars. Pose schematics use the authored box/rotor dimensions and recorded quaternion/joint transforms. The reference plane is projected at starting height; it is not a floor. Views fit the complete trajectory and can have different scales. Original state precision is retained; no state interpolation, speculative future motion, physics integration or controller execution occurs in the browser. Early-ended recordings hold the final saved pose with a label.

All compressed source records were matched to their passing independent audits during export. The exporter lives in `scripts/export-replays.py`; give it `--study` and `--output` paths. The source experiment is unchanged. Curated public recordings omit hidden actuator parameters, solver internals and personal material. Offline case loading requires serving the directory over HTTP; the base presentation and video remain local assets.

Browser checks cover progressive path growth, synchronized pose changes, seeking, pause/reset, case switching, 192 options, three controllers, mobile overflow, existing presentation controls and MP4 playback. Display kinematics were independently compared with MuJoCo forward kinematics for 81 sampled poses; maximum rotor-pose absolute error was below 2e-15. This is a display check, not new control evidence.
