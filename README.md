# Cardium

Game prototype with cards that can rotate around the perimeter of other cards.

## Implemented

- Drag and drop cards, rotating with mouse wheel
- Cards snap to other cards' edges, with highlights
- Player card that can move around corners (press left/right arrow keys to move)
- Roller card that follows the perimeter of other cards (press space to take a turn)
- Fractal card that creates new cards every turn
- Right click to flip cards over (flipped cards do nothing on their turn)
- Animation for flipping cards and cards returning to their original position after an invalid move

## To Do / Ideas

- technical:
  - `findSnap` and `findCollisions`: add argument for `allCards`? would allow slight slight optimization and make it more functionally oriented
  - in `getSnaps`, clarify perpendicular to edge vs perpendicular card arrangement. maybe rename things to normal and tangent instead of perpendicular and parallel, for the vectors.
  - break up `Card.js`
  - ESM (I would've done this from the start except it doesn't work with the `file://` protocol)
  - gameplay tests (I was really happy with the [tests I made for Junkbot](https://1j01.github.io/janitorial-android/#tests), so I'd like to do something similar here, i.e. a bespoke test runner that runs the game visually with levels constructed for testing purposes)
    - need serialization for this
  - unit tests for angle difference calculation, if only because I saw a gist with some test cases... the implementation I found is actually super intuitive, compared to many implementations you might find online.
  - animation system
    - queue animations (per card, or globally? or both?)
    - speed up in-progress animations when queueing new ones in order to get to new inputs in a timely fashion
    - (queued animations override default easing towards target position? or such transitions are something that gets queued)
    - queued animations don't necessarily need to define their duration, they can just signal when they're done, but typically it's helpful to get the fraction of the way through an animation. (doesn't matter much if the animation system provides said fraction.)
- UI:
  - anchor corner properly when animating roller card movement (right now the card's center position is transitioned linearly but it should go in an arc)
  - `pointerup` is not the only thing that must end a drag. `pointercancel` should as well, but need to handle case of no event, before another `pointerdown`. handle page `blur`.
  - rotate about grabbed position? (I have a `getRotatedLoc` method now that could be used to easily try this)
  - mark edge highlights red when invalid? (the snap isn't the problem, it's a collision that makes it invalid, but on the other hand, the snap highlight is implicitly signaling that it's valid...)
  - touch controls for rotating cards
    - on-screen buttons
    - ideally, support multitouch to rotate as well
  - touch controls for moving player / taking turns
  - ~~animation for snapping?~~ nah, smoothing it feels bad. it should feel snappy!
  - could maybe use a higher threshold for unsnapping compared to snapping, to stabilize the snapping state/behavior
  - undo/redo
  - zooming and panning
  - maybe use viewport units for perspective? it gets pretty distorted if you zoom out with the browser zoom.
  - credits screen can say "Isaiah Odhner" with the initials being formed by the 3rd and 2nd smallest card arrangements that a roller card can naturally traverse (with its edge always aligning completely with another card's edge) (the smallest is a single card, the 2nd smallest is a square formed by 4 cards, the 3rd smallest is a rectangle formed by 8 cards, with the 4 corners vertical, and the other cards horizontal)
- gameplay:
  - implement a deck and/or hand
  - will need to serialize movement or otherwise address simultaneous movement, because right now card order matters, even though it's not apparent visually.
  - figure out some goals. can implement different goals in order to try out different mechanics.
    - reach a certain location (this would be good for puzzles and automated tests)
    - kill all enemies
    - collect all resources
    - protect a location/character (survival)
    - build a structure (especially with a crafting system)
    - Probably makes sense to try starting with a proven game idea, like Bomberman, and adapting it to a world of cards (and yes we can try realtime as well as turn-based)
  - Try making a nicer fractal pattern
  - Try making fractal card contain another card, like roller, that it turns into after some number of turns. Track and show recursion with concentric rings/boxes that disappear, unboxing until the contained card is the last thing.
  - Fractal card could preview its spawn locations with arrows. Can project the spawn locations onto each of the edges of the card, then find the closest overall, then optionally offset it inwards (perhaps with CSS).
  - Bomb card that flips all cards in a radius to the back side
  - Snaking card (similar to fractal card)
  - Resource trains (cards feeding adjacent cards with resources)
  - Gun/gunner card
  - Excavation/revival card that uncovers flipped cards that it touches
  - Enemy that fans out cards in a radius, offensively and/or defensively
  - Portal card
    - "Cardal tunnel syndrome" / "Card-pull tunnel syndrome" (now you're thinking with meaningless puns)
  - Action card sequencing like in Shogun Showdown (but maybe you could also include non-"action" cards where the action would be to place the card, and maybe you could even rotate the card in the action stack to place it rotated?? That bit might be hard to visualize / plan for while playing.)  
  - Allowing diagonals quickly allows for very awkward situations, where a card can just barely fit or not fit, due to the square root of 2.
    - I thought about adding some sort of "anti-placement zone" around diagonal cards, but that feels like a bandaid at best, and possibly more awkward than the problem it's trying to solve.


## Naming

I chose the name Cardium because I don't have a clear idea of what the game will be about, I'm just interested so far in the cards as a material, as a medium. Cardium is a play on the word "card" and the suffix "-ium" which is often used in the names of chemical elements.

(Perhaps I can borrow some aesthetic queues from Cardium pottery for the card designs.)

"Cardscape" would also speak to the ubiquity/materiality of the cards, especially a landscape made of cards. Although it's a name already used by at least two other games.

Maybe "Cardium" will remain the name of the game engine, while the game (or games?) can find their own names.

Carbon, calcium, cadmium, caesium, and californium all start with "ca", and scandium is the only other element (currently named) with a "ca" in it.  
Carbon gets "C", calcium gets "Ca", cadmium gets "Cd", and chromium gets "Cr". What would "cardium" be left with? "Rd"? "Ad"?  
Tellurium gets atomic number 52, which obviously should be reserved for Cardium. So inconsiderate.  

- Cardium
- Cardscape
- Cardarium
- Cardwheel (They see me rollin'!)
- Cardboard (also would be a good engine name; too generic for a game)
- CardGarden; CardGardener
- Dectrex (from "deck" and "Vectrex"; also more engine-y, as it implies a platform, but also evokes trekking over a landscape of cards); Decktrex
- DeckTrek 37,000,000,000,000 (from "deck" and "[FlexTrek 37,000,000,000,000](https://www.youtube.com/watch?v=ZAtzN_ScKXY)")
- Decktris (obviously a card game related to Tetris... possibly with tetrominoes made up of 4 cards?)
- Cardistry (the art of card manipulation; speaks to using cards in unexpected ways, especially physical arrangements and movements)
- Minecardft (it's like Minecraft but everything's cards and you can build "minecard tracks" for "minecards" to go on and collect resources)
- Car-related:
  - Cardpooling (carpooling; you can have a pool of cards as well, i.e. a deck/hand/meld)
  - Cardjacking (carjacking; jack is a card as well)
- Drinking-related:
  - Druncard
  - Totally Nackcard
  - Carded
- Deckathalon (sounds like a lot of work haha)
- Caardvark (why)
- Tableaunia (a bad name, if I mesa-y so myself. it's like it's trying not to be "tableland")
- Utterly Deckadent / Deckadent Desserts / Deckadent / Just Decksserts (mm the double double consonant, so classy, what an elegant portmanteau)
- Keep Calm and Card On
- Keeping Up with the Card-Ashians (where Ashian means Pokemon-ic) (I have literally no idea)
- Cardinal Spin (like cardinal sin, but, like, cards... and rotation... birds...?)
- CardiGAN (a generative adversarial network for generating card games, or cards, or sweaters or something)
- Jokard (do you really need to portmanteau "joker" with "card"?)
- Tellurium52 / Tellus52 (tellus is Latin for "earth", so this play on the atomic number of tellurium might evoke a sci-fi setting of a "world 52" as well as a pack of cards)
- Dracocard (a palindrome. something about dragons. 🀄)

The game engine is really suited to dominoes perhaps more than cards.  
I didn't think about dominoes when I started, but dominoes are placed snapping together like the mechanics I was picturing for cards.

(Is there a generic term for "dominoes" and "cards"? "Tiles" is almost applicable given how I'm *using* cards, but cards are not typically called tiles. Or pieces.)

- Dominodes (dominoes crossed with, uh... idk, Phage Wars?)
- Dominotes (musical dominoes)
- Bombinoes (dominoes crossed with Bomberman?)
- Domino? what about Domiyes
- Calminoes (a relaxing... game. nevermind what it's about. you can forget about that, and just relax. so soothing.)
