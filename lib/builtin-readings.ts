import type { CandidateArticle, ContentType } from "./types.ts";

export type BuiltinReading = {
  id: string;
  title: string;
  content: string;
  author: string;
  topic: "Poetry" | "Fables" | "Fairy Tales" | "Short Stories" | "Greek Mythology" | "Literary Prose";
  readingLevel: number;
  sourceName: string;
  sourceUrl: string;
};

export const BUILTIN_READINGS: readonly BuiltinReading[] = [
  {
    id: "rain-stevenson",
    title: "Rain",
    author: "Robert Louis Stevenson",
    topic: "Poetry",
    readingLevel: 0,
    sourceName: "A Child's Garden of Verses",
    sourceUrl: "https://www.gutenberg.org/ebooks/25608?just-read=rain",
    content: `The rain is raining all around,
It falls on field and tree,
It rains on the umbrellas here,
And on the ships at sea.`,
  },
  {
    id: "who-has-seen-the-wind",
    title: "Who Has Seen the Wind?",
    author: "Christina Rossetti",
    topic: "Poetry",
    readingLevel: 0,
    sourceName: "Sing-Song",
    sourceUrl: "https://www.gutenberg.org/ebooks/76703?just-read=who-has-seen-the-wind",
    content: `Who has seen the wind?
Neither I nor you:
But when the leaves hang trembling,
The wind is passing thro'.

Who has seen the wind?
Neither you nor I:
But when the trees bow down their heads,
The wind is passing by.`,
  },
  {
    id: "the-swing",
    title: "The Swing",
    author: "Robert Louis Stevenson",
    topic: "Poetry",
    readingLevel: 1,
    sourceName: "A Child's Garden of Verses",
    sourceUrl: "https://www.gutenberg.org/ebooks/25608?just-read=the-swing",
    content: `How do you like to go up in a swing,
Up in the air so blue?
Oh, I do think it the pleasantest thing
Ever a child can do!

Up in the air and over the wall,
Till I can see so wide,
Rivers and trees and cattle and all
Over the countryside—

Till I look down on the garden green,
Down on the roof so brown—
Up in the air I go flying again,
Up in the air and down!`,
  },
  {
    id: "the-lion-and-the-mouse",
    title: "The Lion and the Mouse",
    author: "Aesop",
    topic: "Fables",
    readingLevel: 1,
    sourceName: "The Aesop for Children",
    sourceUrl: "https://www.gutenberg.org/ebooks/19994?just-read=lion-and-mouse",
    content: `A Lion lay asleep in the forest, his great head resting on his paws. A timid little Mouse came upon him unexpectedly, and in her fright and haste to get away, ran across the Lion's nose. Roused from his nap, the Lion laid his huge paw angrily on the tiny creature to kill her.

"Spare me!" begged the poor Mouse. "Please let me go and some day I will surely repay you."

The Lion was much amused to think that a Mouse could ever help him. But he was generous and finally let the Mouse go.

Some days later, while stalking his prey in the forest, the Lion was caught in the toils of a hunter's net. Unable to free himself, he filled the forest with his angry roaring. The Mouse knew the voice and quickly found the Lion struggling in the net. Running to one of the great ropes that bound him, she gnawed it until it parted, and soon the Lion was free.

"You laughed when I said I would repay you," said the Mouse. "Now you see that even a Mouse can help a Lion."

A kindness is never wasted.`,
  },
  {
    id: "teeny-tiny",
    title: "Teeny-Tiny",
    author: "Joseph Jacobs",
    topic: "Short Stories",
    readingLevel: 1,
    sourceName: "English Fairy Tales",
    sourceUrl: "https://www.gutenberg.org/ebooks/7439?just-read=teeny-tiny",
    content: `Once upon a time there was a teeny-tiny woman lived in a teeny-tiny house in a teeny-tiny village. Now, one day this teeny-tiny woman put on her teeny-tiny bonnet, and went out of her teeny-tiny house to take a teeny-tiny walk. And when this teeny-tiny woman had gone a teeny-tiny way she came to a teeny-tiny gate; so the teeny-tiny woman opened the teeny-tiny gate, and went into a teeny-tiny churchyard.

And when this teeny-tiny woman had got into the teeny-tiny churchyard, she saw a teeny-tiny bone on a teeny-tiny grave, and the teeny-tiny woman said to her teeny-tiny self, "This teeny-tiny bone will make me some teeny-tiny soup for my teeny-tiny supper." So the teeny-tiny woman put the teeny-tiny bone into her teeny-tiny pocket, and went home to her teeny-tiny house.

Now when the teeny-tiny woman got home to her teeny-tiny house she was a teeny-tiny bit tired; so she went up her teeny-tiny stairs to her teeny-tiny bed, and put the teeny-tiny bone into a teeny-tiny cupboard. And when this teeny-tiny woman had been to sleep a teeny-tiny time, she was awakened by a teeny-tiny voice from the teeny-tiny cupboard, which said:

"Give me my bone!"

And this teeny-tiny woman was a teeny-tiny frightened, so she hid her teeny-tiny head under the teeny-tiny clothes and went to sleep again. And when she had been to sleep again a teeny-tiny time, the teeny-tiny voice again cried out from the teeny-tiny cupboard a teeny-tiny louder, "Give me my bone!"

This made the teeny-tiny woman a teeny-tiny more frightened, so she hid her teeny-tiny head a teeny-tiny further under the teeny-tiny clothes. And when the teeny-tiny woman had been to sleep again a teeny-tiny time, the teeny-tiny voice from the teeny-tiny cupboard said again a teeny-tiny louder,

"Give me my bone!"

And this teeny-tiny woman was a teeny-tiny bit more frightened, but she put her teeny-tiny head out of the teeny-tiny clothes, and said in her loudest teeny-tiny voice, "TAKE IT!"`,
  },
  {
    id: "north-wind-and-sun",
    title: "The North Wind and the Sun",
    author: "Aesop",
    topic: "Fables",
    readingLevel: 2,
    sourceName: "The Aesop for Children",
    sourceUrl: "https://www.gutenberg.org/ebooks/19994?just-read=north-wind-and-sun",
    content: `The North Wind and the Sun had a quarrel about which of them was the stronger. While they were disputing with much heat and bluster, a Traveler passed along the road wrapped in a cloak.

"Let us agree," said the Sun, "that he is the stronger who can strip that Traveler of his cloak."

"Very well," growled the North Wind, and at once sent a cold, howling blast against the Traveler.

With the first gust of wind the ends of the cloak whipped about the Traveler's body. But he immediately wrapped it closely around him, and the harder the Wind blew, the tighter he held it to him. The North Wind tore angrily at the cloak, but all his efforts were in vain.

Then the Sun began to shine. At first his beams were gentle, and in the pleasant warmth after the bitter cold of the North Wind, the Traveler unfastened his cloak and let it hang loosely from his shoulders. The Sun's rays grew warmer and warmer. The man took off his cap and mopped his brow. At last he became so heated that he pulled off his cloak, and, to escape the blazing sunshine, threw himself down in the welcome shade of a tree by the roadside.

Gentleness and kind persuasion win where force and bluster fail.`,
  },
  {
    id: "three-little-pigs",
    title: "The Story of the Three Little Pigs",
    author: "L. Leslie Brooke",
    topic: "Fairy Tales",
    readingLevel: 2,
    sourceName: "The Story of the Three Little Pigs",
    sourceUrl: "https://www.gutenberg.org/ebooks/18155?just-read=three-little-pigs",
    content: `Once upon a time there was an old Sow with three little Pigs, and as she had not enough to keep them, she sent them out to seek their fortune.

The first that went off met a Man with a bundle of straw, and said to him, "Please, Man, give me that straw to build me a house"; which the Man did, and the little Pig built a house with it. Presently came along a Wolf, and knocked at the door, and said, "Little Pig, little Pig, let me come in."

To which the Pig answered, "No, no, by the hair of my chinny chin chin."

"Then I'll huff and I'll puff, and I'll blow your house in!" said the Wolf. So he huffed and he puffed, and he blew his house in, and ate up the little Pig.

The second Pig met a Man with a bundle of furze, and said, "Please, Man, give me that furze to build a house"; which the Man did, and the Pig built his house.

Then along came the Wolf and said, "Little Pig, little Pig, let me come in."

"No, no, by the hair of my chinny chin chin."

"Then I'll puff and I'll huff, and I'll blow your house in!" So he huffed and he puffed, and he puffed and he huffed, and at last he blew the house down, and ate up the second little Pig.

The third little Pig met a Man with a load of bricks, and said, "Please, Man, give me those bricks to build a house with"; so the Man gave him the bricks, and he built his house with them. So the Wolf came, as he did to the other little Pigs, and said, "Little Pig, little Pig, let me come in."

"No, no, by the hair of my chinny chin chin."

"Then I'll huff and I'll puff, and I'll blow your house in."

Well, he huffed and he puffed, and he huffed and he puffed, and he puffed and he huffed; but he could not get the house down. When he found that he could not, with all his huffing and puffing, blow the house down, he said, "Little Pig, I know where there is a nice field of turnips."

"Where?" said the little Pig.

"Oh, in Mr. Smith's home-field; and if you will be ready to-morrow morning, I will call for you, and we will go together and get some for dinner."

"Very well," said the little Pig, "I will be ready. What time do you mean to go?"

"Oh, at six o'clock."

Well, the little Pig got up at five, and got the turnips and was home again before six. When the Wolf came he said, "Little Pig, are you ready?"

"Ready!" said the little Pig, "I have been and come back again, and got a nice pot-full for dinner."

The Wolf felt very angry at this, but thought that he would be up to the little Pig somehow or other; so he said, "Little Pig, I know where there is a nice apple-tree."

"Where?" said the Pig.

"Down at Merry-garden," replied the Wolf; "and if you will not deceive me I will come for you, at five o'clock to-morrow, and we will go together and get some apples."

Well, the little Pig woke at four the next morning, and bustled up, and went off for the apples, hoping to get back before the Wolf came; but he had farther to go, and had to climb the tree, so that just as he was coming down from it, he saw the Wolf coming, which, as you may suppose, frightened him very much. When the Wolf came up he said, "Little Pig, what! are you here before me? Are they nice apples?"

"Yes, very," said the little Pig; "I will throw you down one." And he threw it so far that, while the Wolf was gone to pick it up, the little Pig jumped down and ran home.

The next day the Wolf came again, and said to the little Pig, "Little Pig, there is a Fair in the Town this afternoon: will you go?"

"Oh, yes," said the Pig, "I will go; what time shall you be ready?"

"At three," said the Wolf.

So the little Pig went off before the time, as usual, and got to the Fair, and bought a butter churn, and was on his way home with it when he saw the Wolf coming. Then he could not tell what to do. So he got into the churn to hide, and in doing so turned it round, and it began to roll, and rolled down the hill with the Pig inside it, which frightened the Wolf so much that he ran home without going to the Fair.

He went to the little Pig's house, and told him how frightened he had been by a great round thing which came down the hill past him.

Then the little Pig said, "Hah! I frightened you, did I? I had been to the Fair and bought a butter churn, and when I saw you I got into it, and rolled down the hill."

Then the Wolf was very angry indeed, and declared he would eat up the little Pig, and that he would get down the chimney after him.

When the little Pig saw what he was about, he hung on the pot full of water, and made up a blazing fire, and, just as the Wolf was coming down, took off the cover of the pot, and in fell the Wolf. And the little Pig put on the cover again in an instant, boiled him up, and ate him for supper, and lived happy ever after.`,
  },
  {
    id: "icarus-and-daedalus",
    title: "Icarus and Daedalus",
    author: "Josephine Preston Peabody",
    topic: "Greek Mythology",
    readingLevel: 3,
    sourceName: "Old Greek Folk Stories Told Anew",
    sourceUrl: "https://www.gutenberg.org/ebooks/9313?just-read=icarus-and-daedalus",
    content: `Among all those mortals who grew so wise that they learned the secrets of the gods, none was more cunning than Daedalus.

He once built, for King Minos of Crete, a wonderful Labyrinth of winding ways so cunningly tangled up and twisted around that, once inside, you could never find your way out again without a magic clue. But the king's favor veered with the wind, and one day he had his master architect imprisoned in a tower. Daedalus managed to escape from his cell; but it seemed impossible to leave the island, since every ship that came or went was well guarded by order of the king.

At length, watching the sea-gulls in the air,—the only creatures that were sure of liberty,—he thought of a plan for himself and his young son Icarus, who was captive with him.

Little by little, he gathered a store of feathers great and small. He fastened these together with thread, moulded them in with wax, and so fashioned two great wings like those of a bird. When they were done, Daedalus fitted them to his own shoulders, and after one or two efforts, he found that by waving his arms he could winnow the air and cleave it, as a swimmer does the sea. He held himself aloft, wavered this way and that with the wind, and at last, like a great fledgling, he learned to fly.

Without delay, he fell to work on a pair of wings for the boy Icarus, and taught him carefully how to use them, bidding him beware of rash adventures among the stars. "Remember," said the father, "never to fly very low or very high, for the fogs about the earth would weigh you down, but the blaze of the sun will surely melt your feathers apart if you go too near."

For Icarus, these cautions went in at one ear and out by the other. Who could remember to be careful when he was to fly for the first time? Are birds careful? Not they! And not an idea remained in the boy's head but the one joy of escape.

The day came, and the fair wind that was to set them free. The father bird put on his wings, and, while the light urged them to be gone, he waited to see that all was well with Icarus, for the two could not fly hand in hand. Up they rose, the boy after his father. The hateful ground of Crete sank beneath them; and the country folk, who caught a glimpse of them when they were high above the tree-tops, took it for a vision of the gods,—Apollo, perhaps, with Cupid after him.

At first there was a terror in the joy. The wide vacancy of the air dazed them,—a glance downward made their brains reel. But when a great wind filled their wings, and Icarus felt himself sustained, like a halcyon-bird in the hollow of a wave, like a child uplifted by his mother, he forgot everything in the world but joy. He forgot Crete and the other islands that he had passed over: he saw but vaguely that winged thing in the distance before him that was his father Daedalus.

He longed for one draught of flight to quench the thirst of his captivity: he stretched out his arms to the sky and made towards the highest heavens.

Alas for him! Warmer and warmer grew the air. Those arms, that had seemed to uphold him, relaxed. His wings wavered, drooped. He fluttered his young hands vainly,—he was falling,—and in that terror he remembered. The heat of the sun had melted the wax from his wings; the feathers were falling, one by one, like snowflakes; and there was none to help.

He fell like a leaf tossed down the wind, down, down, with one cry that overtook Daedalus far away. When he returned, and sought high and low for the poor boy, he saw nothing but the bird-like feathers afloat on the water, and he knew that Icarus was drowned.

The nearest island he named Icaria, in memory of the child; but he, in heavy grief, went to the temple of Apollo in Sicily, and there hung up his wings as an offering. Never again did he attempt to fly.`,
  },
  {
    id: "on-going-a-journey-opening",
    title: "On Going a Journey — Opening",
    author: "William Hazlitt",
    topic: "Literary Prose",
    readingLevel: 4,
    sourceName: "Table-Talk",
    sourceUrl: "https://www.gutenberg.org/ebooks/66129?just-read=on-going-a-journey",
    content: `One of the pleasantest things in the world is going a journey; but I like to go by myself. I can enjoy society in a room; but out of doors, nature is company enough for me. I am then never less alone than when alone.

I cannot see the wit of walking and talking at the same time. When I am in the country, I wish to vegetate like the country. I am not for criticising hedge-rows and black cattle. I go out of town in order to forget the town and all that is in it.

There are those who for this purpose go to watering-places, and carry the metropolis with them. I like more elbow-room, and fewer incumbrances. I like solitude, when I give myself up to it, for the sake of solitude.

The soul of a journey is liberty, perfect liberty, to think, feel, do just as one pleases. We go a journey chiefly to be free of all impediments and inconveniences; to leave ourselves behind, much more to get rid of others.`,
  },
] as const;

const readingsById = new Map(BUILTIN_READINGS.map((reading) => [reading.id, reading]));

export function getBuiltinReading(id: string | null | undefined) {
  return id ? readingsById.get(id) : undefined;
}

export function builtinReadingCandidates(discoveredAt: string): CandidateArticle[] {
  return BUILTIN_READINGS.map((reading) => {
    const sourceId = `library:${slug(reading.topic)}`;
    const pool = reading.readingLevel <= 1 ? "success" : reading.readingLevel <= 3 ? "bridge" : "open_web";
    return {
      id: `builtin:${reading.id}`,
      sourceId,
      sourceName: reading.sourceName,
      topic: reading.topic,
      title: reading.title,
      url: reading.sourceUrl,
      summary: firstParagraph(reading.content),
      author: reading.author,
      publishedAt: null,
      discoveredAt,
      status: "available",
      articleId: null,
      contentId: reading.id,
      contentSnapshot: reading.content,
      pool,
      successBandMin: Math.max(0, reading.readingLevel - 1),
      successBandMax: Math.min(5, reading.readingLevel + 1),
      readingLevel: reading.readingLevel,
      provenance: {
        sourceId,
        sourceName: reading.sourceName,
        sourceUrl: "https://www.gutenberg.org/",
        originalUrl: reading.sourceUrl,
        license: "Public domain in the USA",
        licenseUrl: "https://www.gutenberg.org/policy/license.html",
        attribution: `${reading.author}, via Project Gutenberg`,
        author: reading.author,
        publishedAt: null,
        retrievedAt: discoveredAt,
        contentType: contentTypeFor(reading.topic),
        transformations: ["excerpt", "cleaned"],
      },
    } satisfies CandidateArticle;
  });
}

function firstParagraph(content: string) {
  return content.split(/\n\s*\n/)[0].replace(/\s+/g, " ").trim();
}

function slug(value: string) {
  return value.toLocaleLowerCase("en-US").replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "");
}

function contentTypeFor(topic: BuiltinReading["topic"]): ContentType {
  if (topic === "Poetry") return "poetry";
  if (topic === "Literary Prose") return "essay";
  return "story";
}
