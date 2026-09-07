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
  isExcerpt?: boolean;
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
    id: "let-it-be-forgotten",
    title: "Let It Be Forgotten",
    author: "Sara Teasdale",
    topic: "Poetry",
    readingLevel: 2,
    sourceName: "Flame and Shadow",
    sourceUrl: "https://www.gutenberg.org/ebooks/591?just-read=let-it-be-forgotten",
    content: `Let it be forgotten, as a flower is forgotten,
Forgotten as a fire that once was singing gold,
Let it be forgotten for ever and ever,
Time is a kind friend, he will make us old.

If anyone asks, say it was forgotten
Long and long ago,
As a flower, as a fire, as a hushed footfall
In a long forgotten snow.`,
  },
  {
    id: "may-day-teasdale",
    title: "May Day",
    author: "Sara Teasdale",
    topic: "Poetry",
    readingLevel: 2,
    sourceName: "Flame and Shadow",
    sourceUrl: "https://www.gutenberg.org/ebooks/591?just-read=may-day",
    content: `A delicate fabric of bird song
Floats in the air,
The smell of wet wild earth
Is everywhere.

Red small leaves of the maple
Are clenched like a hand,
Like girls at their first communion
The pear trees stand.

Oh I must pass nothing by
Without loving it much,
The raindrop try with my lips,
The grass with my touch;

For how can I be sure
I shall see again
The world on the first of May
Shining after the rain?`,
  },
  {
    id: "there-will-come-soft-rains",
    title: "There Will Come Soft Rains",
    author: "Sara Teasdale",
    topic: "Poetry",
    readingLevel: 3,
    sourceName: "Flame and Shadow",
    sourceUrl: "https://www.gutenberg.org/ebooks/591?just-read=there-will-come-soft-rains",
    content: `There will come soft rains and the smell of the ground,
And swallows circling with their shimmering sound;

And frogs in the pools singing at night,
And wild plum-trees in tremulous white;

Robins will wear their feathery fire
Whistling their whims on a low fence-wire;

And not one will know of the war, not one
Will care at last when it is done.

Not one would mind, neither bird nor tree
If mankind perished utterly;

And Spring herself, when she woke at dawn,
Would scarcely know that we were gone.`,
  },
  {
    id: "said-a-blade-of-grass",
    title: "Said a Blade of Grass",
    author: "Kahlil Gibran",
    topic: "Fables",
    readingLevel: 2,
    sourceName: "The Madman: His Parables and Poems",
    sourceUrl: "https://www.gutenberg.org/ebooks/5616?just-read=said-a-blade-of-grass",
    content: `Said a blade of grass to an autumn leaf, “You make such a noise falling! You scatter all my winter dreams.”

Said the leaf indignant, “Low-born and low-dwelling! Songless, peevish thing! You live not in the upper air and you cannot tell the sound of singing.”

Then the autumn leaf lay down upon the earth and slept. And when spring came she waked again—and she was a blade of grass.

And when it was autumn and her winter sleep was upon her, and above her through all the air the leaves were falling, she muttered to herself, “O these autumn leaves! They make such noise! They scatter all my winter dreams.”`,
  },
  {
    id: "the-eye-gibran",
    title: "The Eye",
    author: "Kahlil Gibran",
    topic: "Fables",
    readingLevel: 2,
    sourceName: "The Madman: His Parables and Poems",
    sourceUrl: "https://www.gutenberg.org/ebooks/5616?just-read=the-eye",
    content: `Said the Eye one day, “I see beyond these valleys a mountain veiled with blue mist. Is it not beautiful?”

The Ear listened, and after listening intently awhile, said, “But where is any mountain? I do not hear it.”

Then the Hand spoke and said, “I am trying in vain to feel it or touch it, and I can find no mountain.”

And the Nose said, “There is no mountain, I cannot smell it.”

Then the Eye turned the other way, and they all began to talk together about the Eye's strange delusion. And they said, “Something must be the matter with the Eye.”`,
  },
  {
    id: "the-two-learned-men",
    title: "The Two Learned Men",
    author: "Kahlil Gibran",
    topic: "Fables",
    readingLevel: 3,
    sourceName: "The Madman: His Parables and Poems",
    sourceUrl: "https://www.gutenberg.org/ebooks/5616?just-read=the-two-learned-men",
    content: `Once there lived in the ancient city of Afkar two learned men who hated and belittled each other's learning. For one of them denied the existence of the gods and the other was a believer.

One day the two met in the marketplace, and amidst their followers they began to dispute and to argue about the existence or the non-existence of the gods. And after hours of contention they parted.

That evening the unbeliever went to the temple and prostrated himself before the altar and prayed the gods to forgive his wayward past.

And the same hour the other learned man, he who had upheld the gods, burned his sacred books. For he had become an unbeliever.`,
  },
  {
    id: "when-my-sorrow-was-born",
    title: "When My Sorrow Was Born",
    author: "Kahlil Gibran",
    topic: "Literary Prose",
    readingLevel: 3,
    sourceName: "The Madman: His Parables and Poems",
    sourceUrl: "https://www.gutenberg.org/ebooks/5616?just-read=when-my-sorrow-was-born",
    content: `When my Sorrow was born I nursed it with care, and watched over it with loving tenderness.

And my Sorrow grew like all living things, strong and beautiful and full of wondrous delights.

And we loved one another, my Sorrow and I, and we loved the world about us; for Sorrow had a kindly heart and mine was kindly with Sorrow.

And when we conversed, my Sorrow and I, our days were winged and our nights were girdled with dreams; for Sorrow had an eloquent tongue, and mine was eloquent with Sorrow.

And when we sang together, my Sorrow and I, our neighbors sat at their windows and listened; for our songs were deep as the sea and our melodies were full of strange memories.

And when we walked together, my Sorrow and I, people gazed at us with gentle eyes and whispered in words of exceeding sweetness. And there were those who looked with envy upon us, for Sorrow was a noble thing and I was proud with Sorrow.

But my Sorrow died, like all living things, and alone I am left to muse and ponder.

And now when I speak my words fall heavily upon my ears.

And when I sing my songs my neighbours come not to listen.

And when I walk the streets no one looks at me.

Only in my sleep I hear voices saying in pity, “See, there lies the man whose Sorrow is dead.”`,
  },
  {
    id: "preface-idle-thoughts",
    title: "Preface to Idle Thoughts of an Idle Fellow",
    author: "Jerome K. Jerome",
    topic: "Literary Prose",
    readingLevel: 3,
    sourceName: "The Idle Thoughts of an Idle Fellow",
    sourceUrl: "https://www.gutenberg.org/ebooks/849?just-read=preface",
    content: `One or two friends to whom I showed these papers in MS. having observed that they were not half bad, and some of my relations having promised to buy the book if it ever came out, I feel I have no right to longer delay its issue. But for this, as one may say, public demand, I perhaps should not have ventured to offer these mere “idle thoughts” of mine as mental food for the English-speaking peoples of the earth. What readers ask nowadays in a book is that it should improve, instruct, and elevate.

This book wouldn't elevate a cow. I cannot conscientiously recommend it for any useful purposes whatever. All I can suggest is that when you get tired of reading “the best hundred books,” you may take this up for half an hour. It will be a change.`,
  },
  {
    id: "arrival-at-burnt-fork",
    title: "The Arrival at Burnt Fork",
    author: "Elinore Pruitt Stewart",
    topic: "Literary Prose",
    readingLevel: 3,
    sourceName: "Letters of a Woman Homesteader",
    sourceUrl: "https://www.gutenberg.org/ebooks/16623?just-read=arrival-at-burnt-fork",
    content: `Burnt Fork, Wyoming,
April 18, 1909.

Dear Mrs. Coney,—

Are you thinking I am lost, like the Babes in the Wood? Well, I am not and I'm sure the robins would have the time of their lives getting leaves to cover me out here. I am 'way up close to the Forest Reserve of Utah, within half a mile of the line, sixty miles from the railroad. I was twenty-four hours on the train and two days on the stage, and oh, those two days! The snow was just beginning to melt and the mud was about the worst I ever heard of.

The first stage we tackled was just about as rickety as it could very well be and I had to sit with the driver, who was a Mormon and so handsome that I was not a bit offended when he insisted on making love all the way, especially after he told me that he was a widower Mormon. But, of course, as I had no chaperone I looked very fierce (not that that was very difficult with the wind and mud as allies) and told him my actual opinion of Mormons in general and particular.

Meantime my new employer, Mr. Stewart, sat upon a stack of baggage and was dreadfully concerned about something he calls his “Tookie,” but I am unable to tell you what that is. The road, being so muddy, was full of ruts and the stage acted as if it had the hiccoughs and made us all talk as though we were affected in the same way. Once Mr. Stewart asked me if I did not think it a “gey duir trip.” I told him he could call it gay if he wanted to, but it didn't seem very hilarious to me.

Every time the stage struck a rock or a rut Mr. Stewart would “hoot,” until I began to wish we would come to a hollow tree or a hole in the ground so he could go in with the rest of the owls.

At last we “arriv,” and everything is just lovely for me. I have a very, very comfortable situation and Mr. Stewart is absolutely no trouble, for as soon as he has his meals he retires to his room and plays on his bagpipe, only he calls it his “bugpeep.” It is “The Campbells are Coming,” without variations, at intervals all day long and from seven till eleven at night. Sometimes I wish they would make haste and get here.

There is a saddle horse especially for me and a little shotgun with which I am to kill sage chickens. We are between two trout streams, so you can think of me as being happy when the snow is through melting and the water gets clear. We have the finest flock of Plymouth Rocks and get so many nice eggs. It sure seems fine to have all the cream I want after my town experiences. Jerrine is making good use of all the good things we are having. She rides the pony to water every day.

I have not filed on my land yet because the snow is fifteen feet deep on it, and I think I would rather see what I am getting, so will wait until summer. They have just three seasons here, winter and July and August. We are to plant our garden the last of May. When it is so I can get around I will see about land and find out all I can and tell you.

I think this letter is about to reach thirty-secondly, so I will send you my sincerest love and quit tiring you. Please write me when you have time.

Sincerely yours,
Elinore Rupert.`,
  },
  {
    id: "the-selfish-giant",
    title: "The Selfish Giant",
    author: "Oscar Wilde",
    topic: "Fairy Tales",
    readingLevel: 3,
    sourceName: "The Happy Prince and Other Tales",
    sourceUrl: "https://www.gutenberg.org/ebooks/30120?just-read=the-selfish-giant",
    content: `Every afternoon, as they were coming from school, the children used to go and play in the Giant's garden.

It was a large lovely garden, with soft green grass. Here and there over the grass stood beautiful flowers like stars, and there were twelve peach-trees that in the spring-time broke out into delicate blossoms of pink and pearl, and in the autumn bore rich fruit. The birds sat on the trees and sang so sweetly that the children used to stop their games in order to listen to them. “How happy we are here!” they cried to each other.

One day the Giant came back. He had been to visit his friend the Cornish ogre, and had stayed with him for seven years. After the seven years were over he had said all that he had to say, for his conversation was limited, and he determined to return to his own castle. When he arrived he saw the children playing in the garden.

“What are you doing here?” he cried in a very gruff voice, and the children ran away.

“My own garden is my own garden,” said the Giant; “any one can understand that, and I will allow nobody to play in it but myself.” So he built a high wall all round it, and put up a notice-board.

TRESPASSERS WILL BE PROSECUTED

He was a very selfish Giant.

The poor children had now nowhere to play. They tried to play on the road, but the road was very dusty and full of hard stones, and they did not like it. They used to wander round the high wall when their lessons were over, and talk about the beautiful garden inside. “How happy we were there!” they said to each other.

Then the Spring came, and all over the country there were little blossoms and little birds. Only in the garden of the Selfish Giant it was still winter. The birds did not care to sing in it as there were no children, and the trees forgot to blossom. Once a beautiful flower put its head out from the grass, but when it saw the notice-board it was so sorry for the children that it slipped back into the ground again, and went off to sleep. The only people who were pleased were the Snow and the Frost.

“Spring has forgotten this garden,” they cried, “so we will live here all the year round.” The Snow covered up the grass with her great white cloak, and the Frost painted all the trees silver. Then they invited the North Wind to stay with them, and he came. He was wrapped in furs, and he roared all day about the garden, and blew the chimney-pots down. “This is a delightful spot,” he said, “we must ask the Hail on a visit.” So the Hail came.

Every day for three hours he rattled on the roof of the castle till he broke most of the slates, and then he ran round and round the garden as fast as he could go. He was dressed in grey, and his breath was like ice.

“I cannot understand why the Spring is so late in coming,” said the Selfish Giant, as he sat at the window and looked out at his cold white garden; “I hope there will be a change in the weather.”

But the Spring never came, nor the Summer. The Autumn gave golden fruit to every garden, but to the Giant's garden she gave none. “He is too selfish,” she said. So it was always Winter there, and the North Wind and the Hail, and the Frost, and the Snow danced about through the trees.

One morning the Giant was lying awake in bed when he heard some lovely music. It sounded so sweet to his ears that he thought it must be the King's musicians passing by. It was really only a little linnet singing outside his window, but it was so long since he had heard a bird sing in his garden that it seemed to him to be the most beautiful music in the world. Then the Hail stopped dancing over his head, and the North Wind ceased roaring, and a delicious perfume came to him through the open casement.

“I believe the Spring has come at last,” said the Giant; and he jumped out of bed and looked out.

What did he see?

He saw a most wonderful sight. Through a little hole in the wall the children had crept in, and they were sitting in the branches of the trees. In every tree that he could see there was a little child. And the trees were so glad to have the children back again that they had covered themselves with blossoms, and were waving their arms gently above the children's heads. The birds were flying about and twittering with delight, and the flowers were looking up through the green grass and laughing.

It was a lovely scene, only in one corner it was still winter. It was the farthest corner of the garden, and in it was standing a little boy.

He was so small that he could not reach up to the branches of the tree, and he was wandering all round it, crying bitterly. The poor tree was still quite covered with frost and snow, and the North Wind was blowing and roaring above it. “Climb up! little boy,” said the Tree, and it bent its branches down as low as it could; but the boy was too tiny.

And the Giant's heart melted as he looked out. “How selfish I have been!” he said; “now I know why the Spring would not come here. I will put that poor little boy on the top of the tree, and then I will knock down the wall, and my garden shall be the children's playground for ever and ever.” He was really very sorry for what he had done.

So he crept downstairs and opened the front door quite softly, and went out into the garden. But when the children saw him they were so frightened that they all ran away, and the garden became winter again. Only the little boy did not run, for his eyes were so full of tears that he did not see the Giant coming. And the Giant stole up behind him and took him gently in his hand, and put him up into the tree.

And the tree broke at once into blossom, and the birds came and sang on it, and the little boy stretched out his two arms and flung them round the Giant's neck, and kissed him. And the other children, when they saw that the Giant was not wicked any longer, came running back, and with them came the Spring. “It is your garden now, little children,” said the Giant, and he took a great axe and knocked down the wall.

And when the people were going to market at twelve o'clock they found the Giant playing with the children in the most beautiful garden they had ever seen.

All day long they played, and in the evening they came to the Giant to bid him good-bye.

“But where is your little companion?” he said: “the boy I put into the tree.” The Giant loved him the best because he had kissed him.

“We don't know,” answered the children; “he has gone away.”

“You must tell him to be sure and come here to-morrow,” said the Giant. But the children said that they did not know where he lived, and had never seen him before; and the Giant felt very sad.

Every afternoon, when school was over, the children came and played with the Giant. But the little boy whom the Giant loved was never seen again. The Giant was very kind to all the children, yet he longed for his first little friend, and often spoke of him. “How I would like to see him!” he used to say.

Years went over, and the Giant grew very old and feeble. He could not play about any more, so he sat in a huge armchair, and watched the children at their games, and admired his garden. “I have many beautiful flowers,” he said; “but the children are the most beautiful flowers of all.”

One winter morning he looked out of his window as he was dressing. He did not hate the winter now, for he knew that it was merely the Spring asleep, and that the flowers were resting.

Suddenly he rubbed his eyes in wonder and looked and looked. It certainly was a marvellous sight. In the farthest corner of the garden was a tree quite covered with lovely white blossoms. Its branches were all golden, and silver fruit hung down from them, and underneath it stood the little boy he had loved.

Downstairs ran the Giant in great joy, and out into the garden. He hastened across the grass, and came near to the child. And when he came quite close his face grew red with anger, and he said, “Who hath dared to wound thee?” For on the palms of the child's hands were the prints of two nails, and the prints of two nails were on the little feet.

“Who hath dared to wound thee?” cried the Giant; “tell me, that I might take my big sword and slay him.”

“Nay!” answered the child; “but these are the wounds of Love.”

“Who art thou?” said the Giant, and a strange awe fell on him, and he knelt before the little child.

And the child smiled on the Giant, and said to him, “You let me play once in your garden, to-day you shall come with me to my garden, which is Paradise.”

And when the children ran in that afternoon, they found the Giant lying dead under the tree, all covered with white blossoms.`,
  },
  {
    id: "on-going-a-journey-opening",
    title: "On Going a Journey — Opening",
    author: "William Hazlitt",
    topic: "Literary Prose",
    readingLevel: 4,
    sourceName: "Table-Talk",
    sourceUrl: "https://www.gutenberg.org/ebooks/66129?just-read=on-going-a-journey",
    isExcerpt: true,
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
        transformations: reading.isExcerpt ? ["excerpt", "cleaned"] : ["cleaned"],
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
