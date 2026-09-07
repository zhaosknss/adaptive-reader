// Verified excerpts from the linked Simple English Wikipedia pages, retrieved
// 2026-09-03. Text is CC BY-SA 4.0/GFDL; only whitespace was cleaned.
export type SimpleWikiSnapshot = {
  title: string;
  topic: string;
  content: string;
  originalUrl: string;
};

export const SIMPLE_WIKI_SNAPSHOTS_B: readonly SimpleWikiSnapshot[] = [
  {
    title: "Ancient Egypt",
    topic: "History",
    content:
      "Ancient Egypt was a society that began around 3150 BC and lasted until 30 BC, when it was invaded by the Romans. Egypt grew along the Nile River and was at its most powerful in the 2nd millennium BC. Its land stretched from the Nile Delta to Nubia, a kingdom located mostly in present-day Sudan. With the water from the Nile, crops were generally good. They were grown after the water from the Nile floods went down. The Egyptians created a way of writing using hieroglyphics. They also built huge temples and tombs, traded with other areas, and had a powerful army. Their religion had many gods, and its priests were powerful and rich. The Egyptian rulers, called pharaohs, were thought to be close to the gods.",
    originalUrl: "https://simple.wikipedia.org/wiki/Ancient_Egypt",
  },
  {
    title: "Roman Empire",
    topic: "History",
    content:
      "The Roman Empire ruled the Mediterranean and much of Europe, Western Asia and North Africa. The Romans conquered most of this during the Republic, and it was ruled by emperors following Octavian's assumption of effective sole rule in 27 BC. The western empire collapsed in 476 AD, but the eastern empire, the Byzantine Empire, lasted until the fall of Constantinople in 1453. The Empire started in 27 BC, when Octavian became Emperor Augustus after the death of Julius Caesar. The fall of Western Roman Empire to the Germanic kings in 476 AD, marked the end of classical antiquity and the beginning of the Middle Ages. The Empire was the third stage of Ancient Rome. Rome was first ruled by Roman kings, later by the Roman Republic and then by an emperor.",
    originalUrl: "https://simple.wikipedia.org/wiki/Roman_Empire",
  },
  {
    title: "Industrial Revolution",
    topic: "History",
    content:
      "The Industrial Revolution is the name of the time when there was a big change in the way things were made. Instead of things being hand-made in small workshops, they were made more cheaply in large quantities by machines in factories. This improved the idea of assembly lines. People found that they could make many more things using an assembly line than each person working individually. This mass production meant that the goods were sold for less. It started in the 1760s. A Second Industrial Revolution began in the 1870s.",
    originalUrl: "https://simple.wikipedia.org/wiki/Industrial_Revolution",
  },
  {
    title: "French Revolution",
    topic: "History",
    content:
      "The French Revolution was a revolution in France from 1789 to 1799. It ended the French monarchy. The revolution began with a meeting of the Estates General in Versailles, and ended when Napoleon Bonaparte took power in November 1804. Before 1789, France was ruled by the nobles and the Catholic Church. The ideas of the Enlightenment were beginning to make the ordinary people want more power. They could see that the American Revolution had created a country in which the people had power, instead of a king. The government before the revolution was called the \"Ancien Régime\".",
    originalUrl: "https://simple.wikipedia.org/wiki/French_Revolution",
  },
  {
    title: "Renaissance",
    topic: "Culture",
    content:
      "The Renaissance is a period in European history that followed the Middle Ages and ended in the 17th century. Renaissance is a French word for “cultural rebirth.” During this period, there was a “rebirth” of classical learning. People started relearning the teachings of scholars from Ancient Greece, Rome, and other ancient societies. The Renaissance is often said to be the start of the modern age. During the Renaissance, there were many advances in art, literature, the sciences, mathematics, and culture. Many famous artists, writers, philosophers, and scientists lived during this period. A person who is clever at a great number of things is sometimes called a \"Renaissance man.\" The most famous Renaissance man was Leonardo da Vinci, a painter, scientist, musician, and philosopher.",
    originalUrl: "https://simple.wikipedia.org/wiki/Renaissance",
  },
  {
    title: "Printing press",
    topic: "Culture",
    content:
      "The printing press is a machine for printing. It makes many copies of identical pages. The printing press today is used to print books and newspapers. It had a great influence on society, especially western society. It was \"one of the most potent agents... of western civilization in bringing together the scattered ideas of thinkers\". Woodcut printing has been done for several centuries. Words and pictures for whole pages were carved into blocks of wood. In the 15th century Johannes Gutenberg improved the process. He used separate alloy letters screwed into a frame. This way a large set of letters could make almost any page for printing. This process was called typesetting. Each letter was in a block of metal, fixed in a frame. He could then move paper and ink over it, much like a stamp. This method was called letterpress. The letters would leave ink on the paper in the shape of the letters, creating text or illustrations.",
    originalUrl: "https://simple.wikipedia.org/wiki/Printing_press",
  },
  {
    title: "Great Depression",
    topic: "History",
    content:
      "The Great Depression was the global economic crisis that started after the U.S. stock market crash in 1929. The prices on the Wall Street stock market greatly fell from October 24 to 29, 1929. Many people lost their jobs. By 1932, 25–30% of people had lost their jobs. They became homeless and poor, which ended the wealth of the Roaring Twenties. Many people think that the Great Depression started on Tuesday, October 29, but economists think Black Tuesday was just one of the causes. From 1929 to 1932, the depression worsened. Many suspect that one reason was the increased taxes on Americans such as tariffs (taxes on imports). The economist Milton Friedman said that the Great Depression was worsened because the Federal Reserve printed out less money than usual. When the depression started, Herbert Hoover was the president of the United States and so he was blamed for it. A new president was elected in 1932, Franklin D. Roosevelt. He convinced Congress to pass many new laws and programs to help people who were hurt by the Great Depression, which were called the New Deal. One of the programs was the Civilian Conservation Corps. The CCC put many young men to work outdoors. The men were paid thirty dollars a month for their work, twenty-five dollars of which was sent home to support their families, and they got free food and shelter. Another program, called Social Security, continues to this day. It gives retired seniors a small income to let them have money for things that they need. The depression was a difficult time, but with everyone's help, it would get better. Between 1939 and 1944, more people had jobs again because of World War II, and the Great Depression came to an end.",
    originalUrl: "https://simple.wikipedia.org/wiki/Great_Depression",
  },
  {
    title: "United Nations",
    topic: "Society",
    content:
      "The United Nations (UN) is an organization between countries established on 24 October 1945 to promote international cooperation. It was founded to replace the League of Nations following World War II and to prevent another conflict. When it was founded, the UN had 51 members. Now there are 193. Most nations are members of the UN and send diplomats to the headquarters to hold meetings and make decisions about global issues.",
    originalUrl: "https://simple.wikipedia.org/wiki/United_Nations",
  },
  {
    title: "Age of Discovery",
    topic: "History",
    content:
      "The Age of Discovery or Age of Exploration was a period from the early 15th century that continued into the early 17th century, during which European ships traveled around the world to search for new trading routes and partners. They were in search of trading goods such as gold, silver and spices. In the process, Europeans met people and mapped lands previously unknown to them. Among the most famous explorers of the period were Christopher Columbus, Vasco da Gama, Pedro Álvares Cabral, John Cabot, Yermak, Juan Ponce de León, Juan Sebastian Elcano, Bartholomeu Dias, Ferdinand Magellan, Willem Barentsz, Abel Tasman, Jean Alfonse, Jacques Cartier, Samuel de Champlain, and Willem Blaeu.",
    originalUrl: "https://simple.wikipedia.org/wiki/Age_of_Discovery",
  },
  {
    title: "Leonardo da Vinci",
    topic: "People",
    content:
      "Leonardo Da Vinci (15 April 1452 – 2 May 1519) was an Italian polymath who lived during the Renaissance. He is famous for his paintings. He was also a scientist, mathematician, engineer, inventor, anatomist, sculptor, architect, botanist, musician, and writer. Leonardo wanted to know everything about nature, and wanted to know how everything worked. He was very good at studying, as well as designing and making all sorts of inventions. The art historian Helen Gardner said that no one has ever been quite like him because he was interested in so many things that he seems to have had the mind of a giant, and yet what he was like as a person is still a mystery. Leonardo was born in Vinci, a small town near Florence, Italy. He was trained to be an artist by the sculptor and painter Verrocchio. He spent most of his life working for rich Italian noblemen. In his last years, he lived in an expensive home given to him by the King of France. Two of his paintings are among the best-known in the world: the Mona Lisa and The Last Supper. He did many drawings. His best-known drawing is Vitruvian Man. Leonardo often thought of new inventions. He kept notebooks with notes and drawings of these ideas. Most of his inventions were never made. Some of his ideas were a helicopter, a tank, a calculator, a parachute, a robot, a telephone, evolution, and solar power.",
    originalUrl: "https://simple.wikipedia.org/wiki/Leonardo_da_Vinci",
  },
  {
    title: "Marie Curie",
    topic: "Science",
    content:
      "Marie Salomée Skłodowska, Madame Pierre Curie (born Maria Salomea Skłodowska; 7 November 1867 – 4 July 1934) was a Polish-born French physicist and chemist. She did research on radioactivity. She was also the first woman to win a Nobel Prize, which she went on to win twice. She was the first female professor at the University of Paris. She was the first person to win two Nobel Prizes. She received a Nobel Prize in physics for her research on uncontrolled radiation, which was discovered by Henri Becquerel. She died because of too much exposure to radiation in her laboratory. She had no protection against the effects of radiation. Its effects were not understood at that time.",
    originalUrl: "https://simple.wikipedia.org/wiki/Marie_Curie",
  },
  {
    title: "Charles Darwin",
    topic: "Science",
    content:
      "Charles Robert Darwin (12 February 1809 – 19 April 1882) was an English naturalist. He is famous for his work on the theory of evolution. Darwin's book On the Origin of Species was published in 1859. In this book, he put forward much evidence that evolution had occurred. He also proposed natural selection as the way evolution had taken place. Darwin did not know about genetics: he never read the work of Gregor Mendel. Nevertheless, Darwin's explanation of evolution was fundamentally correct. In contrast to Lamarck, Darwin's idea was that the giraffe's neck became longer because those with longer necks survived better. These survivors passed their genes on, and in time the whole species got longer necks.",
    originalUrl: "https://simple.wikipedia.org/wiki/Charles_Darwin",
  },
  {
    title: "Nelson Mandela",
    topic: "People",
    content:
      "Nelson Rolihlahla Mandela (18 July 1918 – 5 December 2013) was a South African politician and activist. On 27 April 1994, he became the first President of South Africa, elected in a fully represented democratic election. He was also the first black South African head of state. Mandela was born in Mvezo, South Africa to a Thembu royal family. His government focused on throwing out the legacy of apartheid by ending racism, poverty, inequality and on improving racial understanding in South Africa. Politically a believer in socialism, he served as the President of the African National Congress (ANC) from 1991 to 1997 and adopted a new Constitution of South African in 1996 that prohibits all discrimination, regardless of if it is based on language, culture, tribe, religion, handicap and sexual orientation, not only on racism. Internationally, Mandela was the Secretary General of the Non-Aligned Movement from 1998 to 1999. Mandela received more than 250 honors, including the 1993 Nobel Peace Prize, the US Presidential Medal of Freedom, and the Soviet Order of Lenin. He is often referred to by his Xhosa clan name, Madiba, or as Tata (\"Father\"). Mandela was described as a hero, and his actions gave thousands of people homes. Mandela was sick for several years during his retirement. He was hospitalized in late summer of 2013 from a continuous lung infection. Mandela died on 5 December 2013 in Houghton Estate, Johannesburg from a respiratory tract infection. He was 95 years old.",
    originalUrl: "https://simple.wikipedia.org/wiki/Nelson_Mandela",
  },
  {
    title: "Martin Luther King Jr.",
    topic: "People",
    content:
      "Martin Luther King, Jr. (born Michael King, Jr.; January 15, 1929 – April 4, 1968) was an American pastor, activist, humanitarian, and leader in the Civil Rights Movement. He was best known for improving civil rights by using nonviolent civil disobedience, based on his Christian beliefs. Because he was both a Ph.D. and a pastor, King was sometimes called the Reverend Doctor Martin Luther King Jr. (abbreviation: the Rev. Dr. King), or just Dr King. He is also known by his initials MLK. He was the pastor of the Ebenezer Baptist Church in Atlanta, Georgia. Martin Luther King Jr. worked hard to make people understand that not only black people but that all races should always be treated equally to white people. He gave speeches to encourage African Americans to protest without using violence. Led by Dr. King and others, many African Americans used nonviolent, peaceful strategies to fight for their civil rights. These strategies included sit-ins, boycotts, and protest marches. Often, they were attacked by white police officers or people who did not want African Americans to have more rights. However, no matter how badly they were attacked, Dr. King and his followers never fought back. King also helped to organize the 1963 March on Washington, where he delivered his \"I Have a Dream\" speech. The next year, he won the Nobel Peace Prize. King fought for equal rights from the start of the Montgomery Bus Boycott in 1955 until he was murdered by James Earl Ray in April 1968.",
    originalUrl: "https://simple.wikipedia.org/wiki/Martin_Luther_King_Jr.",
  },
  {
    title: "Jane Austen",
    topic: "Culture",
    content:
      "Jane Austen (16 December 1775 – 18 July 1817) was an English novelist. She wrote many books of romantic fiction about the gentry. Her works made her one of the most famous and beloved writers in English literature. She is one of the great masters of the English novel. Her greatest selling book is Pride and Prejudice. Austen's works criticized sentimental novels in the late 18th century, and are part of the change to nineteenth-century realism. She wrote about typical people in everyday life. This gave the English novel its first distinctly modern character. Austen's stories are often comic, but they also show how women depended on marriage for social standing and economic security. Her works are also about moral problems.",
    originalUrl: "https://simple.wikipedia.org/wiki/Jane_Austen",
  },
  {
    title: "Migration",
    topic: "Science",
    content:
      "Migration is when animals move on a regular cycle. For example, caribou in the Arctic go south in winter and return in summer when it is warmer. Migration is the travelling of long distances in search of a new habitat. The trigger for the migration may be local climate, local availability of food, or the season of the year. To be counted as a true migration, and not just a local dispersal, the movement should be an annual or seasonal event. Many birds migrate to warmer places for the winter, as do some insects such as the migratory locust. Young Atlantic salmon leave the river of their birth when they have reached a few inches (cm) in size. Many species in the sea have a daily migration. Plankton go up for the day where there is light, and down at night, where they are less easy to find. The many species which feed on them follow them up and down. Migration is an evolutionary force. This is because it is a major source of natural selection. The success of migratory animals to make the journey is usually needed for them to reproduce. Many parts of the world have a strongly seasonal climate. In order to survive, many species need to breed in one place and, later, eat in another place. The simplest example is the African herbivores, who follow the growth of grass in East Africa. This region has seasonal rainfall, and so it has seasonal growth of grass. Their predators follow them.",
    originalUrl: "https://simple.wikipedia.org/wiki/Migration",
  },
  {
    title: "DNA",
    topic: "Science",
    content:
      "DNA, short for deoxyribonucleic acid, is the molecule that contains the genetic code of living organisms. This includes animals, plants, protists, archaea and bacteria. It is made up of two polynucleotide chains in a double helix. DNA, present in most cells such as skin, muscle, and nerve cells, contains the genetic instructions that cells use to make proteins, but it is absent in some cells like mature red blood cells. Many of these proteins are enzymes. DNA is inherited by children from their parents. This is why children share traits with their parents, such as skin, hair and eye color. The DNA in a person is a combination of the DNA from each of their parents. Part of an organism's DNA is \"non-coding DNA\" sequences. They do not code for protein sequences. Some noncoding DNA is transcribed into non-coding RNA molecules, such as transfer RNA, ribosomal RNA, and regulatory RNAs. Other sequences are not transcribed at all, or give rise to RNA of unknown function. The amount of non-coding DNA varies greatly among species. For example, over 98% of the human genome is non-coding DNA, while only about 2% of a typical bacterial genome is non-coding DNA. Viruses use either DNA or RNA to infect organisms. The genome replication of most DNA viruses takes place in the cell's nucleus, whereas RNA viruses usually replicate in the cytoplasm. Inside eukaryotic cells, DNA is organized into chromosomes. Before cell division, more chromosomes are made in the process of DNA replication. Eukaryotic organisms like animals, plants, fungi and protists store most of their DNA inside the cell nucleus. But prokaryotes, like bacteria and archaea store their DNA only in the cytoplasm, in circular chromosomes. Inside eukaryotic chromosomes, chromatin proteins, such as histones, help to compact and organize DNA.",
    originalUrl: "https://simple.wikipedia.org/wiki/DNA",
  },
  {
    title: "Electricity",
    topic: "Science",
    content:
      "Electricity is the presence and flow of electric current. Using electricity, we can transfer energy in ways that make machines do work. Its best-known form is the flow of electrons through conductors such as copper wires. The word \"electricity\" is sometimes used to mean \"electrical energy\". They are not the same thing: electricity is a transmission medium for electrical energy, like sea water is a transmission medium for wave energy. An item which allows electricity to move through it is called a conductor. Copper wires and other metal items are good conductors, allowing electricity to move through them and transmit electrical energy. Plastics are a poor conductor (they are insulators) and don't allow much electricity to move through them. They stop the transmission of electrical energy. Electrical energy can be made naturally (such as lightning), or by people (such as in a generator). It can be used to power machines and electrical devices. When electrical charges are not moving, electricity is called static electricity. When the charges are moving they are an electric current, sometimes called 'dynamic electricity'.",
    originalUrl: "https://simple.wikipedia.org/wiki/Electricity",
  },
  {
    title: "Human rights",
    topic: "Society",
    content:
      "Human rights are rights and freedoms that all people should have. All human beings are born free and equal in dignity and rights. Today, the ideas of human rights are protected as legal rights in national and international law. They are seen as universal, which means they are meant for everyone, no matter what their race, religion, ethnicity, nationality, age, sex, political beliefs (or any other kind of beliefs), intelligence, disability, sexual orientation, or gender identity are. All human rights are universal, indivisible and interdependent and related. The international community must treat human rights globally in a fair and equal manner, on the same footing, and with the same emphasis.",
    originalUrl: "https://simple.wikipedia.org/wiki/Human_rights",
  },
  {
    title: "Democracy",
    topic: "Society",
    content:
      "Democracy means rule by the people. People meet to decide about new laws, and changes to existing ones. This is usually called direct democracy. It is never used except in small countries, or perhaps in towns. Modern populations are usually too large to do this. The people elect their leaders. These leaders make decisions about laws. This is called representative democracy. Elections are either held after a certain time, or when a leader dies. Sometimes people can suggest new laws or changes to existing laws. Usually, this is done using a referendum, a vote. Sometimes, people are chosen to make decisions more or less at random. The type of government where only one person has most of the power is called a dictatorship. Democracy is the opposite of a dictatorship. Dictatorships often act against freedom of expression so people cannot say bad things about the dictator or replace them for somebody else.",
    originalUrl: "https://simple.wikipedia.org/wiki/Democracy",
  },
];
