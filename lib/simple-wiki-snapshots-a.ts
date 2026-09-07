// Verified excerpts from the linked Simple English Wikipedia pages, retrieved
// 2026-09-03. Text is CC BY-SA 4.0/GFDL; only whitespace was cleaned.
export type SimpleWikiSnapshot = {
  title: string;
  topic: string;
  content: string;
  originalUrl: string;
};

export const SIMPLE_WIKI_SNAPSHOTS_A: readonly SimpleWikiSnapshot[] = [
  {
    title: "Water",
    topic: "nature",
    content: `Water (H₂O) is a simple chemical compound made of two hydrogen atoms and one oxygen atom. It is clear, has no taste or smell, and is almost colorless. All living things need water to survive. Water molecules stick together because of hydrogen bonds. These bonds give water special properties. For example, water has high surface tension, and can dissolve many substances. Water exists in three forms on Earth: solid (ice), liquid (water), and gas (water vapor).`,
    originalUrl: "https://simple.wikipedia.org/wiki/Water",
  },
  {
    title: "Tree",
    topic: "nature",
    content: `A tree is a tall plant with a trunk and branches made of wood. Trees can live for many years. The oldest living tree found is about 5,000 years old. The oldest tree from the UK is about 1,000 years old.`,
    originalUrl: "https://simple.wikipedia.org/wiki/Tree",
  },
  {
    title: "Rain",
    topic: "nature",
    content: `Rain is a kind of precipitation. Precipitation is any kind of water that falls from clouds in the sky, like rain, hail, sleet and snow. It is measured by a rain gauge. Rain is part of the water cycle. Clouds will often absorb smoke to create rain, commonly referred to as "nature's laundry" due to this process. Some places have frequent rain. This makes rainforests. Some have little rain. This makes deserts.`,
    originalUrl: "https://simple.wikipedia.org/wiki/Rain",
  },
  {
    title: "Sun",
    topic: "nature",
    content: `The Sun, also known as Sol, is a star at the center of the solar system. It is a white star that gives off different types of energy such as infrared energy (heat), ultraviolet light, radio waves and light. It gives off the light and heat that make life on Earth possible. Without it, Earth would be a frozen, lifeless place. It is a huge ball of hot gases, mostly hydrogen and helium. The Sun is nearly a perfect sphere and has a diameter of about 1.39 million kilometers (or 864,000 miles), which is about 109 times wider than Earth. Its mass is 333,000 times heavier than Earth, and it makes up over 99.8% of all the mass in the Solar System.`,
    originalUrl: "https://simple.wikipedia.org/wiki/Sun",
  },
  {
    title: "Moon",
    topic: "nature",
    content: `The Moon, also known as Luna, is Earth's only natural satellite (the only object which orbits the Earth and is not man-made). It is usually visible in the night sky, but is sometimes seen during the day. The Moon is about one-fourth of the width of Earth. Because it is so far away it looks small in the sky, about half a degree wide. The gravity on the Moon is one-sixth of the Earth's gravity. It means that an object will be one-sixth as heavy on the Moon compared to Earth. The Moon is a rocky and dusty place. It moves slowly away from the Earth at a rate of 3.8 centimeters per year due to the effect of tidal dissipation.`,
    originalUrl: "https://simple.wikipedia.org/wiki/Moon",
  },
  {
    title: "Wind",
    topic: "nature",
    content: `Wind is the flow of gases. On Earth, wind is mostly the movement of air. In outer space, solar wind is the movement of gases or particles from the sun through space. The strongest winds seen on a planet in our solar system are on Neptune and Saturn. Short bursts of fast winds are called gusts. Strong winds that go on for about one minute are called squalls. Winds that go on for a long time are called many different things, such as breeze, gale, hurricane, and typhoon. Wind can move land, especially in deserts. Cold wind can sometimes have a bad effect on livestock. Wind also affects animals' food stores, their hunting and the way they protect themselves.`,
    originalUrl: "https://simple.wikipedia.org/wiki/Wind",
  },
  {
    title: "Mountain",
    topic: "nature",
    content: `A mountain is a large natural rise of the Earth's surface that usually has a "summit" (the name for a mountain's top, which can also be called a peak). It is usually steeper and taller than a hill. By definition, mountains are often thought of as being a landform which is higher than 2,000 feet (610 m).`,
    originalUrl: "https://simple.wikipedia.org/wiki/Mountain",
  },
  {
    title: "River",
    topic: "nature",
    content: `A river is a stream of water that flows through a channel on the surface of the ground. The passage where the river flows is called the riverbed and the earth on each side is called a riverbank. A river begins on high ground or in hills or mountains and flows down from the high ground to the lower ground, because of gravity. A river begins as a small stream and gets bigger the farther it flows.`,
    originalUrl: "https://simple.wikipedia.org/wiki/River",
  },
  {
    title: "Ocean",
    topic: "nature",
    content: `An ocean is a large body of water between continents. Oceans are extremely big and they join smaller seas together. Oceans (or marine) cover 70% of Earth. There are five main oceans: the Pacific Ocean, the Atlantic Ocean, the Indian Ocean, the Southern Ocean, and the Arctic Ocean. The largest ocean is the Pacific Ocean. The smallest ocean is the Arctic Ocean. Many types of animals live in oceans, such as carp, crabs, starfish, sharks, and whales.`,
    originalUrl: "https://simple.wikipedia.org/wiki/Ocean",
  },
  {
    title: "Forest",
    topic: "nature",
    content: `A forest is a piece of land with many trees. Forests are important and grow in many places around the world. They are an ecosystem which includes many plants and animals. Many animals live in forests and need them to survive.`,
    originalUrl: "https://simple.wikipedia.org/wiki/Forest",
  },
  {
    title: "Flower",
    topic: "nature",
    content: `A flower is the reproductive part of flowering plants. Flowers are also called the bloom or blossom of a plant. Flowers have petals. Inside the part of the flower that has petals are the parts which produce pollen and seeds. In all plants, a flower is usually its most colourful part. We say the plant 'flowers', 'is flowering' or 'is in flower' when this colourful part begins to grow bigger and open out. There are many different kinds of flowers in different areas in the world. Even in the coldest places, for example the Arctic, flowers can grow during a few months.`,
    originalUrl: "https://simple.wikipedia.org/wiki/Flower",
  },
  {
    title: "Cloud",
    topic: "nature",
    content: `A cloud is water vapour in the atmosphere (sky) that has condensed into very small water droplets or ice crystals that appear in visible shapes or formations above the ground. Water on the Earth evaporates (turns into an invisible gas) and rises up into the sky. Higher up where the air is colder, the water condenses: it changes from a gas to drops of water or crystals of ice. We see these drops of water as clouds. The drops fall back down to earth as rain, and then the water evaporates again. This is called the "water cycle".`,
    originalUrl: "https://simple.wikipedia.org/wiki/Cloud",
  },
  {
    title: "Snow",
    topic: "nature",
    content: `Snow is a form of ice. Snow forms when water in the atmosphere becomes frozen. It comprises individual ice crystals that grow while suspended in the atmosphere—usually within clouds—and then fall, accumulating on the ground where they undergo further changes. Snow comes in all different shapes and sizes. At the freezing point of water (0° Celsius, 32° Fahrenheit), snow melts and becomes liquid water. Sometimes, the snow will melt very fast and become water vapor. This is called sublimation. The opposite, where water vapor becomes snow, is called deposition. Snow is used for some winter sport activities like skiing and sledding. Sometimes people make artificial snow so they can ski. People also commonly build things out of snow for fun.`,
    originalUrl: "https://simple.wikipedia.org/wiki/Snow",
  },
  {
    title: "Ice",
    topic: "nature",
    content: `Ice is the common name for frozen water. Other liquids, such as ammonia or methane or milk, are called 'milk ice', for instance, instead of just 'ice'. Liquid water becomes solid ice when it is very cold. The freezing point is 0° Celsius (32° Fahrenheit or 273 kelvin).`,
    originalUrl: "https://simple.wikipedia.org/wiki/Ice",
  },
  {
    title: "Air",
    topic: "nature",
    content: `Air is the Earth's atmosphere. Air is a mixture of many gases and tiny dust particles. It is the clear gas in which living things live and breathe. It has an indefinite shape and volume. It has mass and weight, because it is matter. The weight of air creates atmospheric pressure. There is no air in outer space. Earth's atmosphere is composed of about 78 percent nitrogen, 21 percent oxygen, 0.9 percent argon, and 0.1 percent other gases.`,
    originalUrl: "https://simple.wikipedia.org/wiki/Air",
  },
  {
    title: "Bird",
    topic: "nature",
    content: `Birds (Aves) are a group of animals with backbones. Birds are the only dinosaurs that survived the Cretaceous–Paleogene extinction, and are part of the theropod group of dinosaurs. The word for "bird-like" is avian, from Latin language avis, bird. Birds are warm blooded. Their feathers help prevent loss of body heat. Modern birds do not have teeth. They have beaked jaws. Birds lay hard-shelled eggs. They have a high metabolic rate and a strong but lightweight skeleton. Their hearts have four chambers. Birds live all over the world. They range in size from the 5 cm (2 in) bee hummingbird to the 2.70 m (9 ft) ostrich. There are about ten thousand species of birds. More than half of these are passerines, or perching birds.`,
    originalUrl: "https://simple.wikipedia.org/wiki/Bird",
  },
  {
    title: "Light",
    topic: "science",
    content: `Light is a form of electromagnetic radiation. It is natural agent that stimulates sight and makes things easier to see. Light is the opposite of darkness. Light has a wavelength. Some wavelengths can be seen by the human eye. Others cannot. Many animals can see light. They need it to find food, water, and other things. Light makes up a part of both the electromagnetic spectrum and radiation given by stars, like the sun. The light that comes from the sun reaches the Earth and makes it bright. This is called daytime. Rainbows are a type of light and stars are a type of light too.`,
    originalUrl: "https://simple.wikipedia.org/wiki/Light",
  },
  {
    title: "Sound",
    topic: "science",
    content: `Sound is caused by waves of pressure called sound waves. It can be heard when it goes through a medium to the ear. All sounds are made by vibrations of molecules. For example, when a person hits a drum or a cymbal the object vibrates. These vibrations make air molecules move. Sound waves move away from where they came from. When the vibrating air molecules reach our ears, the eardrum vibrates, too. The bones of the ear vibrate in the way the object that started the sound wave vibrates. There are three different mediums. They are solids, liquids and gas. Sound travels fastest through solids because the particles in a solid are closer together than they are in gases and liquids.`,
    originalUrl: "https://simple.wikipedia.org/wiki/Sound",
  },
  {
    title: "Electricity",
    topic: "science",
    content: `Electricity is the presence and flow of electric current. Using electricity, we can transfer energy in ways that make machines do work. Its best-known form is the flow of electrons through conductors such as copper wires. The word "electricity" is sometimes used to mean "electrical energy". They are not the same thing: electricity is a transmission medium for electrical energy, like sea water is a transmission medium for wave energy. An item which allows electricity to move through it is called a conductor. Copper wires and other metal items are good conductors, allowing electricity to move through them and transmit electrical energy.`,
    originalUrl: "https://simple.wikipedia.org/wiki/Electricity",
  },
  {
    title: "Weather",
    topic: "science",
    content: `Weather is the day-to-day or hour-to-hour change in the atmosphere. Weather includes wind, lightning, storms, hurricanes, tornadoes, rain, hail, snow, and lots more. Energy from the Sun affects the weather too. Climate tells us what kinds of weather usually happen in an area at different times of the year. Changes in weather can affect the mood and life of many living things. People wear different clothes and do different things in different weather conditions. They also choose different food in different seasons.`,
    originalUrl: "https://simple.wikipedia.org/wiki/Weather",
  },
  {
    title: "Temperature",
    topic: "science",
    content: `Temperature is how hot or cold something is. The human body can feel the difference between something which is hot and something which is cold. To measure temperature more accurately, a thermometer is used. Thermometers use a temperature scale to record how hot or cold something is. The scale used in most of the world is in degrees Celsius, sometimes called "centigrade". In the US and some other countries degrees Fahrenheit are more often used while scientists mostly use kelvins to measure temperature because it never goes below zero.`,
    originalUrl: "https://simple.wikipedia.org/wiki/Temperature",
  },
  {
    title: "Health",
    topic: "science",
    content: `Health is a state of complete physical, mental, and social well-being, and not merely the absence of disease according to the World Health Organization (WHO). Physical health is about the body. Mental health is about how people think and feel. Social health talks about how people live with other people. It is about family, work, school, and friends.`,
    originalUrl: "https://simple.wikipedia.org/wiki/Health",
  },
  {
    title: "Medicine",
    topic: "science",
    content: `Medicine is the science that treats and prevents diseases in humans. Medical workers treat injuries, infections, and sickness. Medicine also helps people with disease prevention and the best ways to not get sick from bacteria or viruses. Medical doctors also help unhealthy (bad habits, overweight, underweight) people return to a healthy condition. People who practice medicine are most often called medical doctors or physicians. Often doctors work closely with nurses and many other types of health care workers.`,
    originalUrl: "https://simple.wikipedia.org/wiki/Medicine",
  },
  {
    title: "Bread",
    topic: "daily-life",
    content: `Bread is a type of baked food. It is mainly made from dough, which is made mainly from flour and water. Usually, salt and yeast are added. Bread is often baked in an oven. It can be bought all over the world. Bread can be toasted or used to make sandwiches. Bread can be made into many different foods, like pizza. There are many different kinds of bread.`,
    originalUrl: "https://simple.wikipedia.org/wiki/Bread",
  },
  {
    title: "House",
    topic: "daily-life",
    content: `A house is a building that is made for people to live in. It is usually built for a family (parents and their children). It is a "permanent" building that is meant to stay standing. It is not easily packed up and carried away like a tent, or moved like a caravan. If people live in the same house for more than a short stay, then they call it their "home". Being without a home is called homelessness. Houses are usually numbered. Some are also named. Houses are usually occupied by a single family or housemates, like in the cases of group homes and boarding houses.`,
    originalUrl: "https://simple.wikipedia.org/wiki/House",
  },
  {
    title: "Clothing",
    topic: "daily-life",
    content: `Clothing are items used to cover the human body. Humans are the only animals that wear clothing. During the many thousands of years between losing body hair and learning to make clothes, humans were naked. Some native people in hot places continue to be naked in everyday life. Clothing is worn where the human body needs protection; from the sun and dust in hot, dry countries lacking shade and from the cold and wet in temperate climates. Clothing such as thick wool coats and boots keeps the human body warm in very cold temperatures (such as in the arctic).`,
    originalUrl: "https://simple.wikipedia.org/wiki/Clothing",
  },
  {
    title: "Money",
    topic: "daily-life",
    content: `Money, also sometimes called currency, can be defined as anything that people use to buy goods and services. Money is what many people receive for selling their own things or services. There are lots of different kinds of money in the world. Most countries have their own kind of money, such as the United States dollar or the Iranian rial.`,
    originalUrl: "https://simple.wikipedia.org/wiki/Money",
  },
  {
    title: "Coffee",
    topic: "daily-life",
    content: `Coffee is a caffeinated drink prepared from roasted coffee beans. It's also a plant (Coffea) and the name of the drink that is made from this plant. The coffee plant is a bush or tree that can grow up to ten meters (about 32 feet) high, but is usually cut shorter. Coffee plants originally grew in Ethiopia, and now also grow in South America, Central America, Southeast Asia and Turkey. They are an important crop for the economies of many countries. The drink is made from the seeds of the coffee plant, called coffee beans. Coffee is usually served hot, and is a popular drink in many countries.`,
    originalUrl: "https://simple.wikipedia.org/wiki/Coffee",
  },
  {
    title: "Bicycle",
    topic: "daily-life",
    content: `A bicycle (or bike) is a small, human powered land vehicle with a seat, two wheels, two pedals, and a metal chain connected to cogs on the pedals and rear wheel. A frame gives the bike strength, and the other parts are attached to the frame. The name comes from the prefix bi (meaning two) and the suffix cycle (meaning wheel). It is powered by a person riding on top, who pushes the pedals around with his or her feet.`,
    originalUrl: "https://simple.wikipedia.org/wiki/Bicycle",
  },
  {
    title: "Computer",
    topic: "technology",
    content: `A computer is a machine that uses electronics to input, process, store, and output data. Data is information such as numbers, words, and lists. Input of data means to read information from a keyboard, a storage device like a hard drive, or a sensor. The computer processes or changes the data by following the instructions in software programs. A computer program is a list of instructions the computer has to perform. Programs usually perform mathematical calculations, modify data, or move it around. The data is then saved on a storage device, shown on a display, or sent to another computer. Computers can be connected together to form a network such as the internet, allowing the computers to communicate with each other.`,
    originalUrl: "https://simple.wikipedia.org/wiki/Computer",
  },
  {
    title: "Internet",
    topic: "technology",
    content: `The Internet is the world’s largest global communication network for computers and other devices. It connects many smaller networks from homes, schools, businesses, and governments. These networks share different kinds of information. The short form of the Internet is “the Net.” One of its most popular services is the World Wide Web, which is used by billions of people every day.`,
    originalUrl: "https://simple.wikipedia.org/wiki/Internet",
  },
  {
    title: "Telephone",
    topic: "technology",
    content: `A telephone, also known as a phone, is a communication tool. People use it to talk with people far away. Originally, it was an electric tool sending analogue speech through wires. Many telephones in the 21st century are electronic tools sending digital signals on wires or radio transmission. Using a telephone, two people who are in different places can talk to each other. Early telephones needed to be connected with wires which are called fixed or landline telephones. Modern mobile phones use radio waves.`,
    originalUrl: "https://simple.wikipedia.org/wiki/Telephone",
  },
  {
    title: "Smartphone",
    topic: "technology",
    content: `A smartphone is a mobile device. It works as a computer but are small and portable like a mobile phone or a E-reader. It uses a system on a chip or a minimal instruction set computer so it can be small.`,
    originalUrl: "https://simple.wikipedia.org/wiki/Smartphone",
  },
  {
    title: "Robot",
    topic: "technology",
    content: `A robot is a machine that can move and do certain tasks and work. Robots are controlled by a computer program or electronic circuitry. They may be directly controlled by humans. They may be designed to look like humans, in which case their behaviour may suggest intelligence or thought but they do not have feelings. Most robots do a specific job, and they do not always look like humans. They can come in many forms. In fiction, however, robots usually look like people, and seem to have a life of their own. There are many books, movies, and video games with robots in them. Isaac Asimov's I, Robot is perhaps the most famous.`,
    originalUrl: "https://simple.wikipedia.org/wiki/Robot",
  },
  {
    title: "Radio",
    topic: "technology",
    content: `Radio is a way to send electromagnetic signals over a long distance. It is mainly used to deliver information from one place to another. A machine that sends radio waves is called a transmitter, while a machine that "picks up" the signals is called a receiver or antenna. A machine that does both jobs is a "transceiver". When radio signals are sent out to many receivers at the same time, it is called a broadcast. Television also uses radio signals to send pictures and sound. Airplanes and other things may be used under radio control. Radio signals can be used to lock and unlock the doors in a car from a distance.`,
    originalUrl: "https://simple.wikipedia.org/wiki/Radio",
  },
  {
    title: "Camera",
    topic: "technology",
    content: `A camera is a device that takes pictures (photographs). It uses film or electronics to make a picture of something. It is a tool of photography. A lens makes the image that the film or electronics "sees". A camera that takes one picture at a time is sometimes called a still camera. A camera that can take pictures that seem to move is called a movie camera. If it can take videos it is called a video camera or a camcorder. The majority of cameras are on mobile phones.`,
    originalUrl: "https://simple.wikipedia.org/wiki/Camera",
  },
  {
    title: "Battery",
    topic: "technology",
    content: `A battery converts chemical energy into electrical energy by a chemical reaction. Usually the chemicals are kept inside the battery. It is used in a circuit to power other components. A battery produces direct current (DC) electricity (electricity that flows in one direction, and does not switch back and forth). Using the electricity from an outlet in a building is cheaper and more efficient, but a battery can provide electricity in areas that do not have electric power distribution. It is also useful for things that move, such as electric vehicles and mobile phones. Batteries may be primary or secondary. The primary is thrown away when it can no longer provide electricity. The secondary can be recharged and reused.`,
    originalUrl: "https://simple.wikipedia.org/wiki/Battery",
  },
  {
    title: "Art",
    topic: "culture",
    content: `Art is a creative activity. It produces a product, an object. Art is a diverse range of human activities in creating visual, performing subjects, and expressing the author's thoughts. The product of art is called a work of art, for others to experience. Some art is useful in a practical sense, such as a sculptured clay bowl that can be used. That kind of art is sometimes called a craft. Those who make art are called artists. They hope to affect the emotions of people who experience it. Some people find art relaxing, exciting or informative. Some say people are driven to make art due to their inner creativity.`,
    originalUrl: "https://simple.wikipedia.org/wiki/Art",
  },
  {
    title: "Music",
    topic: "culture",
    content: `Music is a form of art that uses sound organised in time. Music is also a form of entertainment that puts sounds together in a way that people like, find interesting or dance to. Most music includes people singing with their voices or playing musical instruments, such as the piano, guitar, drums or bass.`,
    originalUrl: "https://simple.wikipedia.org/wiki/Music",
  },
  {
    title: "Book",
    topic: "culture",
    content: `A book is a set of printed sheets of paper held together between two covers. The sheets of paper in a book are called pages. The pages have words written in them and maybe illustrations drawn. The first books were not printed, but written by hand in ink. The book is a more flexible format than the earlier idea of the scroll. The change from scrolls to books began in the Roman Empire and took many centuries to become complete. A writer of a book is often called an author. Someone who draws the pictures in a book is called an illustrator. Books can have more than one writer or illustrator.`,
    originalUrl: "https://simple.wikipedia.org/wiki/Book",
  },
  {
    title: "Dance",
    topic: "culture",
    content: `Dance is a performing art. It is described in many ways. It is when people move to a musical rhythm. They may be alone, or in a group. The dance may be an informal play, a part of a ritual, or a part of a professional performance. There are many kinds of dances, and every human society has its own dances.`,
    originalUrl: "https://simple.wikipedia.org/wiki/Dance",
  },
  {
    title: "Theatre",
    topic: "culture",
    content: `Theatre (British English and also American English), or Theater (mostly American English), has several meanings. The word comes originally from the Greek Theatron, meaning roughly, 'a place for viewing'. In American English, the word 'theater' can mean either a place where films are shown (this is also called a cinema) or a place where live stage plays are performed. In British English, 'theatre' means a place where live plays are performed. Some people, both English and American, use the spelling 'theatre' to mean a place where live plays are performed, and the spelling 'theater' to mean a cinema. 'Theatre' can also mean the business of putting on plays.`,
    originalUrl: "https://simple.wikipedia.org/wiki/Theatre",
  },
  {
    title: "Photography",
    topic: "culture",
    content: `Photography is a way of making a picture using a camera. A person who makes pictures using a camera is called a photographer. A picture made using a camera is called a photograph or photo. Photography became popular in the middle 19th century with Daguerreotype. Later wet plate and dry plate methods were invented. Most photography in the 20th century was on photographic film and most in the 21st uses digital cameras.`,
    originalUrl: "https://simple.wikipedia.org/wiki/Photography",
  },
  {
    title: "Poetry",
    topic: "culture",
    content: `Poetry is written, spoken or sung language that is used in stronger or more original ways than prose is used. Poetry uses the meanings of words as prose does; but it also uses the sounds of words as if they were music, especially rhymes, other repeating sounds, and rhythms (beats or meters). Poetry arranges words and groups of words to make repetitions and parallelisms. Poetry uses figures of speech, ellipses and delayed identification to suggest that there is more meaning in the language.`,
    originalUrl: "https://simple.wikipedia.org/wiki/Poetry",
  },
  {
    title: "Language",
    topic: "culture",
    content: `Language is the normal way humans communicate. Only humans use language, though other animals communicate through other means. The study of language is called linguistics. Human language has syntax, a set of rules for connecting words together to make statements and questions. Language can also be changed, by adding new words, for example, to describe new things. Other animals may inherit a set of calls which have preset functions.`,
    originalUrl: "https://simple.wikipedia.org/wiki/Language",
  },
];
