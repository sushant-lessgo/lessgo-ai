// src/hooks/editStore/granthSeed.ts
// GRANTH (bespoke §13, Writer vertical) — deterministic Hindi-literary profile seed.
// Isolated module so retirement = delete this file + the resolveGranthBlock /
// registry / types entries. Single-page (no chrome/pages — #anchor nav only), NO
// forms (soft conversion = social follow + external Amazon links). Returns the flat
// finalContent shape (layout + content + meta + onboardingData) so loadDraft / edit
// / publish behave like any project. The AI fills NONE of this. Attach to a token via
// the dev seed route with templateId:'granth', paletteId:'sinduri', variantId:'granth'.
//
// Default content = the fictional senior Hindi poet केशव नारायण ‘अरण्य’ from
// template-design/WRDirection1Granth.html (Devanagari numerals authored, no formatter).

const rid = (p: string): string => `${p}${Math.random().toString(36).slice(2, 8)}`;
const sectionId = (type: string): string => `${type}-${Math.random().toString(36).slice(2, 10)}`;

function section(id: string, type: string, layout: string, elements: Record<string, any>): any {
  return {
    id, type, layout, elements,
    isVisible: true,
    backgroundType: 'theme',
    aiMetadata: { aiGenerated: false, lastGenerated: Date.now(), isCustomized: false, aiGeneratedElements: [], excludedElements: [] },
  };
}

const socials = () => ([
  { id: rid('so'), network: 'facebook',  href: '#' },
  { id: rid('so'), network: 'youtube',   href: '#' },
  { id: rid('so'), network: 'instagram', href: '#' },
  { id: rid('so'), network: 'x',         href: '#' },
]);

export function buildGranthHomeFinalContent(opts: {
  tokenId: string;
  title?: string;
  writerName?: string;
}): any {
  const name = (opts.writerName || 'केशव नारायण ‘अरण्य’').trim();
  const title = opts.title || name;

  const heroId = sectionId('hero');
  const aboutId = sectionId('about');
  const booksId = sectionId('books');
  const writingId = sectionId('writing');
  const praiseId = sectionId('praise');
  const footerId = sectionId('footer');

  const hero = section(heroId, 'hero', 'GranthArchedHero', {
    role_line: 'कवि · निबंधकार · साहित्य अकादेमी पुरस्कार से सम्मानित',
    name,
    quote: '“शब्द वह दीपक है जो अँधेरे को नहीं, अँधेरे के भय को मिटाता है।”',
    portrait_image: '',
    cta_label: 'पुस्तकें देखें',
    cta_href: '#books',
    socials: socials(),
  });

  const about = section(aboutId, 'about', 'GranthParichay', {
    eyebrow: 'परिचय',
    heading: 'जीवन और लेखन',
    bio:
      '<p>केशव नारायण ‘अरण्य’ हिंदी कविता की उस परंपरा के कवि हैं जो छायावाद से आधुनिकता तक की यात्रा को अपने भीतर समेटे हुए है। पाँच दशकों के लेखन में उन्होंने बारह कविता-संग्रह, चार निबंध-संग्रह और अनगिनत पत्रिकाओं में प्रकाशित रचनाएँ हिंदी साहित्य को दी हैं।</p>' +
      '<p>उत्तर प्रदेश के एक छोटे से क़स्बे से निकलकर उन्होंने भारतीय साहित्य के शिखर तक की यात्रा की। उनकी कविताएँ प्रकृति, स्मृति और मनुष्य के भीतर के एकांत की पड़ताल करती हैं।</p>',
    facts: [
      { id: rid('fa'), value: '१९४८', label: 'जन्म' },
      { id: rid('fa'), value: '१६', label: 'पुस्तकें' },
      { id: rid('fa'), value: '२०११', label: 'साहित्य अकादेमी पुरस्कार' },
    ],
  });

  const books = section(booksId, 'books', 'GranthJacketShelf', {
    eyebrow: 'पुस्तकें',
    heading: 'प्रकाशित कृतियाँ',
    lead: 'पाँच दशकों की साहित्य-यात्रा से चुनी हुई कृतियाँ।',
    author_mark: 'अरण्य',
    buy_label: 'Amazon पर ख़रीदें →',
    items: [
      { id: rid('bk'), title: 'वन में एकांत', kind: 'कविता-संग्रह', year: '२०२१', blurb: 'प्रकृति और स्मृति की कविताएँ', buy_url: '#', cover_image: '' },
      { id: rid('bk'), title: 'नदी का दूसरा किनारा', kind: 'कविता-संग्रह', year: '२०१६', blurb: 'साहित्य अकादेमी से सम्मानित कृति', buy_url: '#', cover_image: '' },
      { id: rid('bk'), title: 'शब्दों के पार', kind: 'निबंध-संग्रह', year: '२०१२', blurb: 'भाषा और साहित्य पर चिंतन', buy_url: '#', cover_image: '' },
      { id: rid('bk'), title: 'पहला अक्षर', kind: 'कविता-संग्रह', year: '२००५', blurb: 'आरंभिक दौर की प्रतिनिधि कविताएँ', buy_url: '#', cover_image: '' },
    ],
  });

  const writing = section(writingId, 'writing', 'GranthFramedPage', {
    label: 'एक रचना',
    title: 'सुबह',
    poem: 'ओस की एक बूँद में\nसमूचा आकाश उतर आया है —\nमैं झुककर देखता हूँ\nऔर सोचता हूँ,\nइतने बड़े होने का\nक्या अर्थ है।',
    signature: '— अरण्य',
  });

  const praise = section(praiseId, 'praise', 'GranthCriticsGrid', {
    eyebrow: 'सम्मान और चर्चा',
    heading: 'आलोचकों की दृष्टि में',
    awards_line: 'साहित्य अकादेमी पुरस्कार <em>·</em> व्यास सम्मान (नामांकित) <em>·</em> उ.प्र. हिंदी संस्थान सम्मान',
    quotes: [
      { id: rid('qu'), text: 'अरण्य की कविता में वह ठहराव है जो आज की हिंदी कविता में दुर्लभ है।', source: '— हंस पत्रिका' },
      { id: rid('qu'), text: 'प्रकृति के कवि, पर मनुष्य की आँख से।', source: '— डॉ. विजया सिंह, आलोचक' },
    ],
  });

  const footer = section(footerId, 'footer', 'GranthFollowFooter', {
    eyebrow: 'जुड़िए',
    heading: 'नई रचनाओं की सूचना के लिए जुड़िए',
    note: 'फ़ेसबुक और यूट्यूब पर नियमित रचनाएँ और वक्तव्य।',
    socials: socials(),
    copyright: `${name} © २०२६`,
  });

  const order = [heroId, aboutId, booksId, writingId, praiseId, footerId];
  const secs = [hero, about, books, writing, praise, footer];
  const sectionLayouts: Record<string, string> = {};
  const content: Record<string, any> = {};
  secs.forEach((s) => { sectionLayouts[s.id] = s.layout; content[s.id] = s; });

  return {
    layout: { sections: order, sectionLayouts, theme: {}, globalSettings: {} },
    content,
    meta: { id: opts.tokenId, title, slug: '', lastUpdated: Date.now(), version: 1, tokenId: opts.tokenId },
    onboardingData: { oneLiner: `${name} — हिंदी साहित्यकार`, productName: name },
    generatedAt: Date.now(),
  };
}
