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
  - is it possible to define a setter without a getter? maybe with `set x(){}` notation? could simplify `center` accessor
  - in `getSnaps`, clarify perpendicular to edge vs perpendicular card arrangement. maybe rename things to normal and tangent instead of perpendicular and parallel, for the vectors.
  - break up `Card.js`
  - ESM (I would've done this from the start except it doesn't work with the `file://` protocol)
- UI:
  - anchor corner properly when animating roller card movement (right now the card's center position is transitioned linearly but it should go in an arc)
  - `pointerup` is not the only thing that must end a drag. `pointercancel` should as well, but need to handle case of no event, before another `pointerdown`. handle page `blur`.
  - rotate about grabbed position? (I have a `getRotatedLoc` method now that could be used to easily try this)
  - mark edge highlights red when invalid
  - touch controls for rotating cards
    - on-screen buttons
    - ideally, support multitouch to rotate as well
  - ~~animation for snapping?~~ nah, smoothing it feels bad. it should feel snappy!
  - could maybe use a higher threshold for unsnapping compared to snapping, to stabilize the snapping state/behavior
  - undo/redo
- gameplay:
  - implement a deck and/or hand
  - will need to serialize movement or otherwise address simultaneous movement, because right now card order matters, even though it's not apparent visually.
  - figure out some goals. can implement different goals in order to try out different mechanics.
    - reach a certain location
    - kill all enemies
    - collect all resources
  - Try making a nicer fractal pattern
  - Try making fractal card contain another card, like roller, that it turns into after some number of turns. Track and show recursion with concentric rings/boxes that disappear, unboxing until the contained card is the last thing.
  - Bomb card that flips all cards in a radius to the back side
  - Snaking card (similar to fractal card)
  - Resource trains (cards feeding adjacent cards with resources)
  - Gun/gunner card
  - Excavation/revival card that uncovers flipped cards that it touches
  - Action card sequencing like in Shogun Showdown (but maybe you could also include non-"action" cards where the action would be to place the card, and maybe you could even rotate the card in the action stack to place it rotated?? That bit might be hard to visualize / plan for while playing.)  


## Naming

I chose the name Cardium because I don't have a clear idea of what the game will be about, I'm just interested so far in the cards as a material, as a medium. Cardium is a play on the word "card" and the suffix "-ium" which is often used in the names of chemical elements.

"Cardscape" would also speak to the ubiquity/materiality of the cards, especially a landscape made of cards. Although it's a name already used by at least two other games.

Maybe "Cardium" will remain the name of the game engine, while the game (or games?) can find their own names.

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
