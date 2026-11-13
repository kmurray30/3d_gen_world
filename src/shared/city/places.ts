/**
 * Where things are found in a real town: the venues the city is built from. Every word in the catalog is tagged
 * with the venues it could be found at (best first) and how it would be shown there (its spot), and the city
 * generator gives each word to one venue and builds that venue with fixtures to suit (shelves, pens, tanks...).
 */

export type Zone = 'downtown' | 'civic' | 'residential' | 'parkland' | 'industry' | 'transport' | 'waterfront' | 'farmland' | 'wild' | 'fantasy' | 'sky';

/** shop: a storefront building; hall: a big building (museum, aquarium); house: rooms inside a family home;
 *  lot: a fenced outdoor area; open: open ground (park, wilderness, beach); street: along the streets; sky: overhead. */
export type VenueKind = 'shop' | 'hall' | 'house' | 'lot' | 'open' | 'street' | 'sky';

export interface PlaceDef {
  title: string;
  zone: Zone;
  kind: VenueKind;
  /** What belongs there (for taggers, and the venue's sign). */
  hint: string;
}

export const PLACES = {
  // food and drink
  grocery: { title: 'Grocery Store', zone: 'downtown', kind: 'shop', hint: 'fruit, vegetables, packaged and canned food, dairy, eggs, bottled drinks, snacks, spices, condiments, frozen food, grocery shoppers' },
  bakery: { title: 'Bakery', zone: 'downtown', kind: 'shop', hint: 'bread, cakes, pies, pastries, cookies, donuts, baking ingredients, bakers' },
  butcher: { title: 'Butcher & Fish Market', zone: 'downtown', kind: 'shop', hint: 'raw meat, sausages, ham, raw fish and seafood for eating, butchers, fishmongers' },
  restaurant: { title: 'Restaurant', zone: 'downtown', kind: 'shop', hint: 'prepared dishes and meals, soups, pasta, salads, steak dinners, sushi, fancy plated food, chefs, waiters' },
  diner: { title: 'Diner', zone: 'downtown', kind: 'shop', hint: 'burgers, fries, pizza, hot dogs, sandwiches, milkshakes, breakfast plates, takeout, fast food workers' },
  cafe: { title: 'Café', zone: 'downtown', kind: 'shop', hint: 'coffee, tea, hot chocolate, mugs and cups, coffee machines, light pastries, baristas' },
  candy_shop: { title: 'Candy & Ice Cream Shop', zone: 'downtown', kind: 'shop', hint: 'sweets, candy, chocolate, lollipops, ice cream, sundaes, desserts' },
  pub: { title: 'Pub', zone: 'downtown', kind: 'shop', hint: 'beer, wine, cocktails, bar tools, darts and pool tables, bartenders' },
  // health
  pharmacy: { title: 'Pharmacy', zone: 'downtown', kind: 'shop', hint: 'medicine, pills, syrups, first aid, bandages, thermometers, toiletries and hygiene products, pharmacists' },
  hospital: { title: 'Hospital', zone: 'civic', kind: 'hall', hint: 'medical equipment, hospital beds, wheelchairs, surgery tools, x-rays, anatomy models of organs, bones and body parts, germs, dentist things, doctors, nurses, patients, paramedics' },
  // shops
  clothing_store: { title: 'Clothing Store', zone: 'downtown', kind: 'shop', hint: 'everyday clothes, shoes, boots, hats, bags, belts, gloves, scarves, coats, underwear, swimwear, sleepwear' },
  jewelry_store: { title: 'Jewelry Store', zone: 'downtown', kind: 'shop', hint: 'jewellery, rings, necklaces, watches, gems, gold, silver, crowns for sale' },
  salon: { title: 'Hair Salon & Barber', zone: 'downtown', kind: 'shop', hint: 'hairstyles, wigs, hair accessories, makeup, cosmetics, nail polish, combs, razors, barbers, stylists' },
  craft_store: { title: 'Fabric & Craft Shop', zone: 'downtown', kind: 'shop', hint: 'sewing things, fabrics, yarn, buttons, art and craft supplies, paints, brushes, easels, tailors' },
  toy_store: { title: 'Toy Store', zone: 'downtown', kind: 'shop', hint: 'toys, dolls, action figures, stuffed animals, board games, puzzles, model kits, ride-on toys' },
  party_store: { title: 'Party & Costume Shop', zone: 'downtown', kind: 'shop', hint: 'party supplies, balloons, streamers, piñatas, costumes, masks, fireworks, holiday decorations, pranks and joke toys' },
  music_store: { title: 'Music Store', zone: 'downtown', kind: 'shop', hint: 'musical instruments, amplifiers, speakers, microphones, sheet music, records, musicians' },
  electronics_store: { title: 'Electronics Store', zone: 'downtown', kind: 'shop', hint: 'gadgets, computers, phones, tablets, cameras, TVs, game consoles, cables, batteries, headphones' },
  hardware_store: { title: 'Hardware Store', zone: 'downtown', kind: 'shop', hint: 'hand tools, power tools, nails, screws, hardware, paint, ladders, rope, chains, plumbing and electrical parts, building materials' },
  home_store: { title: 'Home & Furniture Store', zone: 'downtown', kind: 'shop', hint: 'new furniture, lamps, rugs, mirrors, curtains, home decor, storage, appliances for sale' },
  bookstore: { title: 'Bookshop & Stationers', zone: 'downtown', kind: 'shop', hint: 'books, comics, magazines, newspapers, stationery, pens, notebooks, office and paper supplies' },
  sports_store: { title: 'Sports Shop', zone: 'downtown', kind: 'shop', hint: 'balls, rackets, bats, helmets, sports gear, skates, skateboards, fishing gear, exercise gear for sale' },
  pet_store: { title: 'Pet Shop & Vet', zone: 'downtown', kind: 'shop', hint: 'pet supplies, pet food, cages, small pets (hamsters, rabbits, guinea pigs, budgies), pet fish, vets' },
  garden_center: { title: 'Garden Center & Florist', zone: 'downtown', kind: 'shop', hint: 'potted plants, flowers, bouquets, seeds, garden tools, planters, garden ornaments, florists, gardeners' },
  antique_shop: { title: 'Antique & Curiosity Shop', zone: 'downtown', kind: 'shop', hint: 'old-fashioned objects, curios, oddities, gramophones, candlesticks, old maps, things from another era that no other shop would sell' },
  // civic
  bank: { title: 'Bank', zone: 'civic', kind: 'hall', hint: 'money, coins, banknotes, safes, vaults, piggy banks, bankers, tellers' },
  post_office: { title: 'Post Office', zone: 'civic', kind: 'shop', hint: 'mail, letters, envelopes, parcels, stamps, mailbags, mail carriers' },
  police_station: { title: 'Police Station', zone: 'civic', kind: 'hall', hint: 'police gear, handcuffs, badges, jail cells, police cars, police officers, detectives, criminals, robbers' },
  fire_station: { title: 'Fire Station', zone: 'civic', kind: 'hall', hint: 'fire engines, fire hoses, extinguishers, fire helmets, axes, fire alarms, firefighters' },
  city_hall: { title: 'City Hall & Courthouse', zone: 'civic', kind: 'hall', hint: 'government, law, politics, flags, voting, gavels, judges, lawyers, mayors, presidents, kings and queens of today' },
  school: { title: 'School', zone: 'civic', kind: 'hall', hint: 'classroom things, desks, blackboards, letters of the alphabet, numbers, shapes, maps, globes, rulers, teachers, students, children' },
  library: { title: 'Library', zone: 'civic', kind: 'hall', hint: 'books on shelves, scrolls, reading lamps, encyclopedias, librarians, storybook characters' },
  science_lab: { title: 'Science Lab', zone: 'civic', kind: 'hall', hint: 'lab equipment, test tubes, chemicals, microscopes, inventions, robots, scientists, inventors' },
  museum: { title: 'Museum', zone: 'civic', kind: 'hall', hint: 'history: fossils, dinosaur skeletons, ancient artifacts, mummies, old weapons and armour on display, historical people, cavemen, statues' },
  gallery: { title: 'Art Gallery & Hall of Ideas', zone: 'civic', kind: 'hall', hint: 'paintings, sculptures, artists, and abstract things shown as art: feelings, ideas, concepts, symbols, sounds, qualities' },
  place_of_worship: { title: 'Temple & Chapel', zone: 'civic', kind: 'hall', hint: 'religious items, holy symbols, candles, bells, priests, monks, nuns, weddings, angels' },
  observatory: { title: 'Observatory & Space Center', zone: 'civic', kind: 'hall', hint: 'telescopes, planets and stars as models, constellations, zodiac signs, rockets, satellites, space suits, astronauts, aliens, UFOs' },
  theater: { title: 'Theater & Cinema', zone: 'downtown', kind: 'hall', hint: 'stage gear, spotlights, curtains, film cameras, popcorn, actors, singers, dancers, comedians, magicians, famous performers, characters from shows and films' },
  arcade: { title: 'Game Arcade', zone: 'downtown', kind: 'shop', hint: 'arcade machines, video games, consoles, pinball, video game characters, gamers' },
  gym: { title: 'Gym', zone: 'downtown', kind: 'hall', hint: 'exercise equipment, weights, treadmills, punching bags, yoga mats, martial arts, boxers, bodybuilders, trainers' },
  stadium: { title: 'Stadium & Sports Fields', zone: 'parkland', kind: 'lot', hint: 'sports fields and courts, goals, nets, scoreboards, athletes, players, referees, coaches, cheerleaders, mascots' },
  office: { title: 'Office Tower', zone: 'downtown', kind: 'hall', hint: 'office desks, office chairs, filing cabinets, photocopiers, computers at work, office workers, business people, bosses' },
  // homes (houses with rooms)
  kitchen: { title: 'Kitchen', zone: 'residential', kind: 'house', hint: 'kitchen appliances, cookware, utensils, plates, cups, cutlery, food storage, a family meal on the table' },
  living_room: { title: 'Living Room', zone: 'residential', kind: 'house', hint: 'sofas, armchairs, TVs, lamps, rugs, clocks, fireplaces, houseplants, family photos, home decor, families' },
  bedroom: { title: 'Bedroom', zone: 'residential', kind: 'house', hint: 'beds, bedding, pillows, wardrobes, dressers, alarm clocks, pyjamas, diaries' },
  nursery: { title: 'Nursery', zone: 'residential', kind: 'house', hint: 'baby things, cribs, prams, bottles, nappies, rattles, babies, toddlers, nannies' },
  bathroom: { title: 'Bathroom', zone: 'residential', kind: 'house', hint: 'toilet, bath, shower, sink, towels, toothbrushes, soap, shampoo, bathroom scale' },
  laundry_garage: { title: 'Laundry & Garage', zone: 'residential', kind: 'house', hint: 'washing machine, dryer, ironing, cleaning supplies, brooms, mops, vacuum cleaners, trash cans, storage boxes, tools kept at home' },
  backyard: { title: 'Backyard', zone: 'residential', kind: 'lot', hint: 'barbecue grill, patio furniture, swing set, trampoline, kiddie pool, doghouse, lawn mower, garden hose, washing line, garden gnome' },
  // outdoors and nature
  park: { title: 'Park & Playground', zone: 'parkland', kind: 'open', hint: 'benches, playground equipment, ponds, ducks, pigeons, squirrels, picnic things, kites, statues, dog walkers, joggers, people relaxing' },
  street: { title: 'City Streets', zone: 'downtown', kind: 'street', hint: 'street furniture, road signs, traffic lights, lampposts, mailboxes, hydrants, bins, cars, taxis, buses, bicycles, scooters, street vendors, pedestrians, everyday people' },
  farm: { title: 'Farm', zone: 'farmland', kind: 'lot', hint: 'farm animals, barns, tractors, crops, fields, hay, farm tools, horses and riding gear, scarecrows, farmers, cowboys' },
  zoo: { title: 'Zoo', zone: 'parkland', kind: 'lot', hint: 'wild animals from savanna, jungle, desert, polar regions and Australia, big birds, reptiles, insects in a bug house, zookeepers' },
  aquarium: { title: 'Aquarium', zone: 'waterfront', kind: 'hall', hint: 'fish, sharks, rays, whales, dolphins, seals, octopus, jellyfish, crabs, coral, sea creatures' },
  beach: { title: 'Beach', zone: 'waterfront', kind: 'open', hint: 'sand, shells, beach toys, umbrellas, towels, surfboards, sandcastles, seagulls, lifeguards, swimmers' },
  harbor: { title: 'Harbor & Marina', zone: 'waterfront', kind: 'lot', hint: 'boats, ships, yachts, docks, anchors, buoys, nets, fishing boats, sailors, captains, fishermen, pirates, lighthouses' },
  wilderness: { title: 'Wilderness', zone: 'wild', kind: 'open', hint: 'forest, trees, rocks, minerals, mountains, hills, rivers, waterfalls, caves, deserts, woodland creatures, wild birds, bugs in the wild, natural landforms, fire, ice' },
  campground: { title: 'Campground', zone: 'wild', kind: 'open', hint: 'tents, campfires, sleeping bags, lanterns, hiking and camping gear, canoes, hikers, scouts' },
  sky: { title: 'The Sky', zone: 'sky', kind: 'sky', hint: 'clouds, weather, rainbows, lightning, the sun and moon, things that fly or float overhead: balloons, kites, blimps, flying birds' },
  // transport and industry
  garage: { title: 'Car Dealership & Auto Shop', zone: 'transport', kind: 'lot', hint: 'cars, trucks, motorbikes, car parts, tyres, engines, gas pumps, car wash, mechanics, racing drivers' },
  airport: { title: 'Airport', zone: 'transport', kind: 'lot', hint: 'airplanes, jets, helicopters, gliders, luggage, control tower, pilots, flight attendants, travellers' },
  train_station: { title: 'Train & Bus Station', zone: 'transport', kind: 'lot', hint: 'trains, trams, subway cars, rail tracks, buses, coaches, tickets, conductors, commuters' },
  construction_site: { title: 'Construction Site', zone: 'industry', kind: 'lot', hint: 'construction vehicles, cranes, diggers, scaffolding, cones, bricks, concrete, steel beams, road works, construction workers' },
  factory: { title: 'Factory & Warehouse', zone: 'industry', kind: 'hall', hint: 'industrial machines, conveyor belts, crates, pallets, barrels, forklifts, robots, factory workers' },
  power_plant: { title: 'Power & Water Works', zone: 'industry', kind: 'lot', hint: 'power lines, pylons, transformers, generators, wind turbines, solar panels, pipes, pumps, water towers, dams, engineers' },
  dump: { title: 'Recycling Center & Dump', zone: 'industry', kind: 'lot', hint: 'trash, junk, scrap metal, recycling bins, dumpsters, garbage trucks, broken things, garbage collectors' },
  military_base: { title: 'Military Base', zone: 'industry', kind: 'lot', hint: 'guns, weapons, ammunition, explosives, tanks, military vehicles and aircraft, army gear, soldiers, generals' },
  // fantasy and history
  castle: { title: 'Castle', zone: 'fantasy', kind: 'lot', hint: 'medieval things, thrones, knights, swords, shields, armour, catapults, banners, kings, queens, princes, princesses, jesters' },
  wizard_tower: { title: "Wizard's Tower", zone: 'fantasy', kind: 'hall', hint: 'magic items, potions, wands, spell books, crystal balls, cauldrons, wizards, witches, sorcerers' },
  enchanted_forest: { title: 'Enchanted Forest', zone: 'fantasy', kind: 'open', hint: 'fairies, elves, unicorns, trolls, goblins, gnomes, dragons, mythical creatures, gods, magic plants, fairy-tale characters' },
  graveyard: { title: 'Graveyard & Haunted House', zone: 'fantasy', kind: 'lot', hint: 'tombstones, coffins, ghosts, zombies, vampires, werewolves, mummies, skeletons, spooky things' },
  fairground: { title: 'Fairground & Circus', zone: 'parkland', kind: 'lot', hint: 'rides, carousel, carnival games, circus tent, clowns, acrobats, jugglers, ringmasters, cotton candy, prizes' },
  miniature_park: { title: 'Miniature Park', zone: 'parkland', kind: 'lot', hint: 'famous landmarks and wonders of the world as scale models (towers, monuments, pyramids, bridges), and anything too huge to stand in town at full size' },
} as const satisfies Record<string, PlaceDef>;

export type PlaceId = keyof typeof PLACES;
export const PLACE_IDS = Object.keys(PLACES) as PlaceId[];

/** How a thing is shown at its venue. */
export const SPOTS = {
  shelf: 'on shelves (small packaged or stacked things)',
  table: 'on a display table or counter (small things shown one by one)',
  case: 'in a glass display case (valuables, jewellery, delicate artifacts)',
  rack: 'hanging on a rack or pegboard (clothes, tools, bags)',
  floor: 'standing on the floor (furniture, appliances, machines, big objects)',
  wall: 'on a wall (paintings, clocks, mirrors, signs)',
  pedestal: 'on a plinth as an exhibit (museum and gallery pieces, scale models)',
  pen: 'in an enclosure or pen (animals that walk)',
  tank: 'in a water tank (fish and sea creatures)',
  water: 'afloat on open water (boats, ships)',
  parked: 'parked (vehicles)',
  ground: 'growing or lying outdoors on the ground (plants, trees, rocks, landforms)',
  sky: 'floating or flying overhead',
  person: 'a person or character standing or working there',
  building: 'a whole building or big structure standing on its own ground (houses, shops, towers, barns, bridges, monuments)',
} as const;
export type Spot = keyof typeof SPOTS;
export const SPOT_IDS = Object.keys(SPOTS) as Spot[];
