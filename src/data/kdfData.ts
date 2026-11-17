export interface LeadershipMember {
  id: string;
  name: string;
  role: string;
  phone?: string;
  department: string;
  region: string;
}

export interface ServicePillar {
  id: string;
  number: string;
  title: string;
  shortDesc: string;
  detailedMandate: string;
  targetGroups: string[];
  image?: string;
}

export interface GlobalLinkItem {
  name: string;
  category: string;
  description: string;
  url: string;
  actionLabel: string;
}

export const KDF_ORG = {
  name: 'Kibatto Development Foundation Limited',
  shortName: 'KDF UGANDA',
  jurisdiction: 'Registered to operate in Africa',
  officeLine: '+256 789509103',
  poBox: 'P.O Box 2678, Mityana District, Uganda, Africa',
  email: 'Kibattojoseph374@gmail.com',
  beneficiaries: [
    'Orphans',
    'Persons with Disabilities',
    'Elderly',
    'Orphans & Vulnerable Children (OVC)',
    'Widows',
    'Girl Child & Women',
    'Street Children',
  ],
};

export const KDF_LEADERSHIP: LeadershipMember[] = [
  {
    id: 'dir-kibatto',
    name: 'Kibatto Joseph',
    role: 'Director',
    phone: '+256 770610329',
    department: 'Executive Board',
    region: 'Mityana District HQ, Uganda',
  },
  {
    id: 'ced-nakyejwe',
    name: 'Nakyejwe Sherina',
    role: 'Chief Executive Director',
    phone: '+256783913861',
    department: 'Executive Leadership',
    region: 'Uganda & Africa Operations',
  },
  {
    id: 'gd-kule',
    name: 'RF Kule David',
    role: 'General Director',
    department: 'General Directorate',
    region: 'Uganda',
  },
  {
    id: 'md-sempa',
    name: 'Sempa Abdulrahman',
    role: 'Managing Director',
    phone: '+25670762727481',
    department: 'Management & Operations',
    region: 'Uganda',
  },
  {
    id: 'sec-namwanje',
    name: 'Namwanje Proscovia',
    role: 'Secretary',
    phone: '+256 776391872',
    department: 'Secretariat & Administration',
    region: 'Mityana District HQ',
  },
  {
    id: 'adv-namayanja',
    name: 'Namayanja Oivia',
    role: 'Chief Advisor',
    phone: '+256709270120',
    department: 'Strategic Advisory',
    region: 'Uganda',
  },
  {
    id: 'med-mugabirwe',
    name: 'Mugabirwe Jackline',
    role: 'Medical Director',
    phone: '+256731509445',
    department: 'Health & Medical Services',
    region: 'Mityana & Rural Clinics',
  },
  {
    id: 'spec-akankunda',
    name: 'Akankunda Violah',
    role: 'Specialist',
    phone: '+256706600148',
    department: 'Community & Medical Support',
    region: 'Uganda',
  },
  {
    id: 'reg-namutebi-j',
    name: 'Namutebi Josephine',
    role: 'Regional Director',
    department: 'Regional Operations',
    region: 'Central & Western Uganda',
  },
  {
    id: 'reg-nansubuga',
    name: 'Nansubuga Joseline',
    role: 'Regional Director',
    department: 'Regional Operations',
    region: 'Eastern & Northern Africa Outreach',
  },
  {
    id: 'hr-bunjo',
    name: 'Bunjo Robert Son',
    role: 'Human Resource',
    department: 'Human Resources & Staffing',
    region: 'Mityana District HQ',
  },
  {
    id: 'me-nakkazi',
    name: 'Nakkazi Josemine',
    role: 'Monitoring and Evaluation',
    department: 'M&E & Document Verification',
    region: 'Uganda',
  },
  {
    id: 'ict-nabunjo',
    name: 'Nabunjo Vivian',
    role: 'ICT Specialist',
    department: 'Information Technology & Digital Systems',
    region: 'Uganda',
  },
  {
    id: 'leg-namutebi-v',
    name: 'Namutebi Vanessa',
    role: 'Legal Advisor',
    department: 'Legal Affairs, Protection & Compliance',
    region: 'Uganda & International',
  },
];

export const KDF_SERVICES: ServicePillar[] = [
  {
    id: 'education',
    number: '01',
    title: 'Education and Training',
    shortDesc: 'Scholarships, school supplies, literacy, and vocational skills training.',
    detailedMandate:
      'Providing formal primary and secondary school bursaries, scholastic materials, digital literacy, and hands-on vocational training for orphans, street children, girl children, and youth with disabilities across Mityana and rural Uganda.',
    targetGroups: ['Orphans', 'Girl Child & Women', 'Street Children', 'OVC'],
    image: '/src/assets/images/kdf_community_education_1794924417679.jpg',
  },
  {
    id: 'health',
    number: '02',
    title: 'Health and Medical',
    shortDesc: 'Primary healthcare access, maternal care, assistive devices, and clinical outreach.',
    detailedMandate:
      'Coordinated by Medical Director Mugabirwe Jackline and Specialist Akankunda Violah, delivering community checkups, maternal and child care, disability mobility aids, elderly healthcare, and emergency clinic referrals.',
    targetGroups: ['Elderly', 'Persons with Disabilities', 'Widows', 'OVC'],
    image: '/src/assets/images/kdf_rural_health_1794924417350.jpg',
  },
  {
    id: 'construction',
    number: '03',
    title: 'Building Construction & Premises Renovation',
    shortDesc: 'Constructing safe homes and renovating existing shelters for vulnerable groups.',
    detailedMandate:
      'Designing and constructing accessible housing, safe shelters, clean sanitation blocks, and renovating dilapidated community premises for widows, the elderly, persons with disabilities, and rescued street children.',
    targetGroups: ['Widows', 'Elderly', 'Persons with Disabilities', 'Street Children'],
  },
  {
    id: 'disease-edu',
    number: '04',
    title: 'Disease & HIV/AIDS Education',
    shortDesc: 'Rural and urban public health sensitization on HIV/AIDS, malaria, and preventable illness.',
    detailedMandate:
      'Running grassroots workshops, youth clubs, and mobile testing referrals in both rural villages and urban centers to combat HIV/AIDS stigma, promote prevention and treatment adherence, and improve hygiene and nutrition awareness.',
    targetGroups: ['All Community Groups', 'Girl Child & Women', 'Street Children'],
  },
  {
    id: 'infrastructure',
    number: '05',
    title: 'Rehabilitation Centers, Workshops, Schools & Hospitals',
    shortDesc: 'Constructing and maintaining permanent community institutions for long-term resilience.',
    detailedMandate:
      'Establishing and continuously maintaining dedicated rehabilitation centers for street children and persons recovering from trauma or disability; vocational workshops for carpentry, tailoring, and welding; community schools; and rural maternity and general hospitals equipped with solar power and clean water.',
    targetGroups: ['Street Children', 'Persons with Disabilities', 'Orphans', 'Elderly'],
  },
  {
    id: 'fund-mobilisation',
    number: '06',
    title: 'Community Fund Mobilisation',
    shortDesc: 'Grant partnerships, diaspora sponsorships, and transparent local savings mobilization.',
    detailedMandate:
      'Mobilizing domestic and international donor grants, UN partner funds, and community revolving savings groups to sustain every KDF Uganda sector transparently under M&E oversight.',
    targetGroups: ['Widows', 'Women Cooperatives', 'OVC Households'],
  },
  {
    id: 'farming',
    number: '07',
    title: 'Rural Farming Skills & Harvest Markets',
    shortDesc: 'Climate-smart agriculture training and direct market linkages for better farmer prices.',
    detailedMandate:
      'Training rural smallholder farmers and widows in modern agronomy, soil conservation, improved matooke/coffee/maize yields, post-harvest storage, and collective bargaining to connect harvests directly to regional and export buyers.',
    targetGroups: ['Widows', 'Rural Households', 'Youth & Women'],
    image: '/src/assets/images/kdf_agriculture_harvest_1794924418148.jpg',
  },
];

export const KDF_JOBS = [
  {
    id: 'job-1',
    title: 'Community Health & HIV/AIDS Outreach Nurse',
    location: 'Mityana & Kassanda Districts, Uganda',
    type: 'Full-Time · Field Operations',
    supervisor: 'Mugabirwe Jackline (Medical Director)',
    summary: 'Lead mobile clinic outreach, HIV/AIDS counseling, and maternal checkups in rural parishes.',
  },
  {
    id: 'job-2',
    title: 'Agricultural Extension & Market Linkage Officer',
    location: 'Mityana & Mubende Districts, Uganda',
    type: 'Full-Time · Rural Development',
    supervisor: 'Namutebi Josephine (Regional Director)',
    summary: 'Train farmer cooperatives on climate-smart techniques and connect harvests to wholesale buyers.',
  },
  {
    id: 'job-3',
    title: 'Civil Construction & Rehabilitation Site Supervisor',
    location: 'Central Region, Uganda',
    type: 'Contract · Infrastructure',
    supervisor: 'Sempa Abdulrahman (Managing Director)',
    summary: 'Oversee construction of schools, rehabilitation centers, workshops, and accessible homes.',
  },
  {
    id: 'job-4',
    title: 'Monitoring, Evaluation & Protection Assistant',
    location: 'Mityana HQ, P.O Box 2678',
    type: 'Full-Time · M&E / Compliance',
    supervisor: 'Nakkazi Josemine (M&E) & Bunjo Robert Son (HR)',
    summary: 'Verify beneficiary documents, track program outcomes, and prepare UN/donor impact reports.',
  },
];

export const UN_AND_GLOBAL_PORTALS: GlobalLinkItem[] = [
  {
    name: 'UN Partner Portal (UNPP)',
    category: 'UN Systems',
    description: 'Official United Nations joint portal for CSO/NGO registration, partnership profiles, and call for expressions of interest (UNICEF, UNHCR, WFP, UNFPA).',
    url: 'https://www.unpartnerportal.org',
    actionLabel: 'Open UN Partner Portal',
  },
  {
    name: 'UN Women',
    category: 'UN Systems',
    description: 'United Nations entity dedicated to gender equality, empowerment of women, widows, and protection of the girl child.',
    url: 'https://www.unwomen.org',
    actionLabel: 'Connect to UN Women',
  },
  {
    name: 'UN DESA / eSANGO & CSO Net',
    category: 'UN Systems',
    description: 'United Nations Economic and Social Council (ECOSOC) NGO branch (eSANGO) for consultative status and global NGO collaboration.',
    url: 'https://esango.un.org',
    actionLabel: 'Open eSANGO Portal',
  },
  {
    name: 'UN Sustainable Development Goals (SDG)',
    category: 'UN Systems',
    description: 'UN 2030 Agenda SDG Action Platform tracking poverty eradication, zero hunger, health, quality education, and gender equality.',
    url: 'https://sdgs.un.org',
    actionLabel: 'Open UN SDG Hub',
  },
  {
    name: 'World Bank Group',
    category: 'Development Finance',
    description: 'Global development financing, Uganda country economic programs, IDA grants, and community development knowledge portals.',
    url: 'https://www.worldbank.org',
    actionLabel: 'Open World Bank',
  },
  {
    name: 'UNICEF · UNHCR · WHO · UNDP · WFP',
    category: 'UN Agencies',
    description: 'United Nations Children’s Fund, Refugee Agency, World Health Organization, Development Programme, and World Food Programme.',
    url: 'https://www.un.org/en/about-us/specialized-agencies',
    actionLabel: 'Browse All UN Agencies',
  },
];

export const UNIVERSITIES_AND_LEARNING: GlobalLinkItem[] = [
  {
    name: 'Alison Free Online Courses',
    category: 'Free University & Skills',
    description: 'Free certified diplomas and certificate courses in healthcare, agriculture, project management, NGO leadership, and ICT.',
    url: 'https://alison.com',
    actionLabel: 'Study on Alison',
  },
  {
    name: 'UNDSS Safety Training (BSAFE)',
    category: 'UN Safety & Security',
    description: 'United Nations Department of Safety and Security mandatory field safety and humanitarian security training portal.',
    url: 'https://training.dss.un.org',
    actionLabel: 'Open UNDSS Portal',
  },
  {
    name: 'MIT OpenCourseWare',
    category: 'Free University',
    description: 'Free university-level courses in engineering, public health, agriculture technology, and economics from MIT.',
    url: 'https://ocw.mit.edu',
    actionLabel: 'Explore MIT OCW',
  },
  {
    name: 'OpenWHO Humanitarian Health',
    category: 'Medical Education',
    description: 'World Health Organization free interactive courses on HIV/AIDS, epidemic response, maternal care, and rural health.',
    url: 'https://openwho.org',
    actionLabel: 'Open OpenWHO',
  },
  {
    name: 'OpenLearn (The Open University)',
    category: 'Free University',
    description: 'Over 1,000 free university courses with statements of participation across law, social care, and education.',
    url: 'https://www.open.edu/openlearn/',
    actionLabel: 'Open OpenLearn',
  },
  {
    name: 'University of the People',
    category: 'Tuition-Free Degree',
    description: 'Accredited tuition-free online American university offering degrees in Health Science, Education, and Business.',
    url: 'https://www.uopeople.edu',
    actionLabel: 'Visit UoPeople',
  },
];

export const LEGAL_MEDICAL_POLICE_PORTALS: GlobalLinkItem[] = [
  {
    name: 'Uganda Police Force & Emergency (999 / 112)',
    category: 'Police & Public Safety',
    description: 'National emergency response, Child & Family Protection Unit (CFPU), and community policing stations across Uganda.',
    url: 'https://www.upf.go.ug',
    actionLabel: 'Uganda Police Portal',
  },
  {
    name: 'INTERPOL Public Safety & Notices',
    category: 'International Police',
    description: 'Global police cooperation network, public safety alerts, and international missing/wanted notices.',
    url: 'https://www.interpol.int',
    actionLabel: 'Open INTERPOL',
  },
  {
    name: 'LASPNET & FIDA Uganda (Free Legal Aid)',
    category: 'Free Legal Systems',
    description: 'Free legal representation and human rights protection for widows, women, girl children, orphans, and indigent citizens in Uganda.',
    url: 'https://www.laspnet.org',
    actionLabel: 'Access Free Legal Aid',
  },
  {
    name: 'International Legal Foundation (ILF)',
    category: 'Global Legal Aid',
    description: 'Global pro-bono criminal and civil defense legal aid network protecting vulnerable communities worldwide.',
    url: 'https://www.theilf.org',
    actionLabel: 'Open ILF Legal Aid',
  },
  {
    name: 'Doctors Without Borders (MSF) & Red Cross',
    category: 'Free Medical & Emergency',
    description: 'Humanitarian emergency medical care, Uganda Red Cross Society, and global disease response networks.',
    url: 'https://www.redcrossug.org',
    actionLabel: 'Uganda Red Cross',
  },
  {
    name: 'CIA World Factbook & FOIA Public Library',
    category: 'Public Intelligence Reference',
    description: 'Official public global country intelligence factbook, infrastructure data, and declassified public research archives.',
    url: 'https://www.cia.gov/the-world-factbook/',
    actionLabel: 'Open CIA Public Factbook',
  },
];

export const TELECOM_SATELLITE_BANKING: GlobalLinkItem[] = [
  {
    name: 'MTN Uganda & MTN Group Roaming',
    category: 'African Telecom',
    description: 'East & Pan-African mobile voice, data roaming, and MTN MoMo financial services across 19+ African countries.',
    url: 'https://www.mtn.co.ug',
    actionLabel: 'MTN Uganda',
  },
  {
    name: 'Airtel Uganda & Airtel Africa One Network',
    category: 'African Telecom',
    description: 'Cross-border Africa roaming across 14 countries, Airtel Money, and rural broadband connectivity.',
    url: 'https://www.airtel.co.ug',
    actionLabel: 'Airtel Uganda',
  },
  {
    name: 'Safaricom, Vodacom & Orange Africa',
    category: 'Pan-African Carriers',
    description: 'Seamless cross-network East, West, and Southern African communication and mobile money interoperability.',
    url: 'https://www.vodacom.com',
    actionLabel: 'African Carrier Hub',
  },
  {
    name: 'Starlink Africa & Humanitarian Satellite Net',
    category: 'Satellite & Rural Wi-Fi',
    description: 'Low-earth-orbit satellite broadband bringing high-speed connectivity to rural schools, hospitals, and NGO hubs.',
    url: 'https://www.starlink.com/map',
    actionLabel: 'Check Satellite Coverage',
  },
  {
    name: 'Centenary Bank & Bank of Uganda',
    category: 'Banking & Microfinance',
    description: 'Rural agricultural microfinance, NGO community banking, and Uganda financial inclusion services.',
    url: 'https://www.centenarybank.co.ug',
    actionLabel: 'Centenary Bank',
  },
  {
    name: 'African Development Bank (AfDB)',
    category: 'International Banking',
    description: 'Continental development finance supporting agriculture, infrastructure, health, and social protection in Africa.',
    url: 'https://www.afdb.org',
    actionLabel: 'Open AfDB',
  },
];

export const FRIENDSHIP_AND_AI_PLATFORMS: GlobalLinkItem[] = [
  {
    name: 'Tandem Language & Global Friendship',
    category: 'International Friends',
    description: 'Connect safely with verified international peers worldwide for cultural exchange, language practice, and friendship.',
    url: 'https://www.tandem.net',
    actionLabel: 'Open Tandem',
  },
  {
    name: 'Meetup Local & Global Communities',
    category: 'Local & Global Friends',
    description: 'Discover local community groups, volunteer events, and international networking circles.',
    url: 'https://www.meetup.com',
    actionLabel: 'Open Meetup',
  },
  {
    name: 'Bumble BFF / InterPals / Badoo / Hinge',
    category: 'Free Social & Dating Apps',
    description: 'Free local and international friend-making and social connection platforms for consenting adults (18+).',
    url: 'https://bumble.com/bff',
    actionLabel: 'Open Bumble BFF',
  },
  {
    name: 'Tinder & OkCupid International',
    category: 'Global Social & Dating',
    description: 'Free international social matching and cross-border friendship/dating apps with safety verification.',
    url: 'https://www.okcupid.com',
    actionLabel: 'Open OkCupid',
  },
  {
    name: 'Google Gemini & DeepMind Research',
    category: 'Advanced AI Systems',
    description: 'Global multimodal AI systems for education, healthcare research, translation, and agricultural analysis.',
    url: 'https://deepmind.google',
    actionLabel: 'Explore Global AI',
  },
  {
    name: 'OpenAI · Anthropic · Hugging Face Open AI',
    category: 'Advanced AI Ecosystem',
    description: 'Open-source and global AI platforms supporting education, coding, translation, and humanitarian analytics.',
    url: 'https://huggingface.co',
    actionLabel: 'Open Hugging Face',
  },
];

export const GLOBAL_FREE_DATING_AND_MARRIAGE: GlobalLinkItem[] = [
  {
    name: 'Tinder Global',
    category: 'Free Dating & Matching',
    description: 'Free worldwide matching platform for local and international dating, friendship, and social discovery.',
    url: 'https://tinder.com',
    actionLabel: 'Open Tinder',
  },
  {
    name: 'Bumble & Bumble BFF',
    category: 'Dating, Friendship & Networking',
    description: 'Free women-first dating, local/global friendship (BFF mode), and career connections.',
    url: 'https://bumble.com',
    actionLabel: 'Open Bumble',
  },
  {
    name: 'Hinge',
    category: 'Serious Relationships & Marriage',
    description: 'Free relationship-focused dating app designed for meaningful long-term partnerships and marriage.',
    url: 'https://hinge.co',
    actionLabel: 'Open Hinge',
  },
  {
    name: 'OkCupid International',
    category: 'Global Dating & Compatibility',
    description: 'Free international compatibility matching based on values, beliefs, and life goals.',
    url: 'https://www.okcupid.com',
    actionLabel: 'Open OkCupid',
  },
  {
    name: 'Badoo Worldwide',
    category: 'Free Chat, Friendship & Dating',
    description: 'Widely used across Africa, Europe, and globally for free chat, local friends, and dating.',
    url: 'https://badoo.com',
    actionLabel: 'Open Badoo',
  },
  {
    name: 'AfroIntroductions',
    category: 'African & Diaspora Dating & Marriage',
    description: 'Connects singles across Uganda, East Africa, and the global African diaspora for friendship and marriage.',
    url: 'https://www.afrointroductions.com',
    actionLabel: 'Open AfroIntroductions',
  },
  {
    name: 'Plenty of Fish (POF)',
    category: 'Free Messaging & Dating',
    description: 'Free global online dating service supporting unlimited messaging and local/international search.',
    url: 'https://www.pof.com',
    actionLabel: 'Open Plenty of Fish',
  },
  {
    name: 'Facebook Dating',
    category: 'Free Community Dating',
    description: 'Free integrated relationship and friendship matching via shared groups, events, and communities.',
    url: 'https://www.facebook.com/dating',
    actionLabel: 'Open Facebook Dating',
  },
  {
    name: 'Muzz (Marriage & Faith Matching)',
    category: 'Marriage & Values',
    description: 'Free global platform tailored for serious, respectful marriage introductions with privacy controls.',
    url: 'https://muzz.com',
    actionLabel: 'Open Muzz',
  },
  {
    name: 'Christian Mingle',
    category: 'Faith-Based Marriage & Dating',
    description: 'Connects faith-centered singles seeking marriage, companionship, and shared community values.',
    url: 'https://www.christianmingle.com',
    actionLabel: 'Open Christian Mingle',
  },
  {
    name: 'Tandem & InterPals',
    category: 'International Friendship & Pen Pals',
    description: 'Free global community apps for international friendship, language exchange, and cultural dialogue.',
    url: 'https://www.tandem.net',
    actionLabel: 'Open Tandem',
  },
  {
    name: 'Meetup Global Communities',
    category: 'Local & International Groups',
    description: 'Join free local and international community meetups, social clubs, and volunteer circles.',
    url: 'https://www.meetup.com',
    actionLabel: 'Open Meetup',
  },
];

export interface FaqPromptItem {
  id: string;
  category: 'Humanitarian Services' | 'Programs & Outreach' | 'Registration & Verification' | 'Donors & Partnerships';
  question: string;
}

export const KDF_FAQ_QUESTIONS: FaqPromptItem[] = [
  {
    id: 'faq-1',
    category: 'Humanitarian Services',
    question: 'Which vulnerable groups does Kibatto Development Foundation Limited (KDF Uganda) serve and how can someone qualify for support?',
  },
  {
    id: 'faq-2',
    category: 'Programs & Outreach',
    question: 'How does KDF Uganda build and maintain rehabilitation centers, vocational workshops, community schools, and rural hospitals?',
  },
  {
    id: 'faq-3',
    category: 'Programs & Outreach',
    question: 'What HIV/AIDS education, medical services, and rural farming harvest market support are currently available?',
  },
  {
    id: 'faq-4',
    category: 'Registration & Verification',
    question: 'How does the applicant registration, encrypted document upload, and verification status process work?',
  },
  {
    id: 'faq-5',
    category: 'Registration & Verification',
    question: 'Which directors or specialists oversee medical referrals, HR applications, M&E verification, and legal aid?',
  },
  {
    id: 'faq-6',
    category: 'Donors & Partnerships',
    question: 'How can international donors, sponsors, and UN Partner Portal / UN Women agencies collaborate with KDF Uganda?',
  },
];

export const GLOBAL_GOVERNMENT_POLICE_PORTALS: GlobalLinkItem[] = [
  {
    name: 'Uganda Police Force HQ & Emergency (999 / 112)',
    category: 'National Police HQ',
    description: 'Official Uganda Police Force headquarters portal, Child & Family Protection Unit, and national emergency dispatch.',
    url: 'https://www.upf.go.ug',
    actionLabel: 'Contact Uganda Police',
  },
  {
    name: 'INTERPOL Global Police Headquarters',
    category: 'International Police Cooperation',
    description: 'Worldwide police headquarters network spanning 196 member countries, public safety notices, and global contacts.',
    url: 'https://www.interpol.int/Who-we-are/Contact-INTERPOL',
    actionLabel: 'INTERPOL Global HQ',
  },
  {
    name: 'U.S. Government Official Portal (USA.gov)',
    category: 'United States Federal Government',
    description: 'Official directory connecting citizens and international organizations to all U.S. federal departments and agencies.',
    url: 'https://www.usa.gov/agency-index',
    actionLabel: 'Open USA.gov Directory',
  },
  {
    name: 'U.S. Embassy in Uganda (Kampala)',
    category: 'U.S. Diplomatic & Grants Liaison',
    description: 'Official United States diplomatic mission in Uganda handling USAID, PEPFAR HIV/AIDS partnerships, and citizen services.',
    url: 'https://ug.usembassy.gov',
    actionLabel: 'U.S. Embassy Kampala',
  },
  {
    name: 'Federal Bureau of Investigation (FBI) Public Contact',
    category: 'U.S. Federal Law Enforcement',
    description: 'Official FBI public contact, field office directory, and electronic tip/cybercrime reporting portal.',
    url: 'https://www.fbi.gov/contact-us',
    actionLabel: 'FBI Official Contact',
  },
  {
    name: 'Central Intelligence Agency (CIA) Public Contact & Factbook',
    category: 'U.S. Intelligence Public Desk',
    description: 'Official CIA public contact channel, FOIA electronic reading room, and global World Factbook reference.',
    url: 'https://www.cia.gov/contact-cia/',
    actionLabel: 'CIA Official Contact',
  },
];

export const GLOBAL_SATELLITE_PORTALS: GlobalLinkItem[] = [
  {
    name: 'UNOSAT (United Nations Satellite Centre)',
    category: 'Humanitarian Satellite Mapping',
    description: 'United Nations satellite imagery analysis supporting disaster relief, rural infrastructure, and humanitarian operations.',
    url: 'https://unosat.org',
    actionLabel: 'Open UNOSAT',
  },
  {
    name: 'NASA Worldview & Earthdata Satellites',
    category: 'Global Earth Observation Satellites',
    description: 'Real-time global satellite imagery for weather, agriculture, drought monitoring, and flood response across Africa.',
    url: 'https://worldview.earthdata.nasa.gov',
    actionLabel: 'Open NASA Worldview',
  },
  {
    name: 'ESA Copernicus Global Satellite Hub',
    category: 'European Space Agency Satellites',
    description: 'Open global satellite data monitoring land use, crops, water resources, and humanitarian emergencies.',
    url: 'https://www.copernicus.eu',
    actionLabel: 'Open Copernicus',
  },
  {
    name: 'CelesTrak Global Satellite Orbital Tracker',
    category: 'Orbital Satellite Catalog',
    description: 'Public catalog and orbital tracking data for active communications, weather, and navigation satellites worldwide.',
    url: 'https://celestrak.org',
    actionLabel: 'Open CelesTrak',
  },
  {
    name: 'Starlink Africa & Rural Satellite Broadband',
    category: 'Satellite Internet',
    description: 'Satellite internet availability map for remote schools, hospitals, and NGO community centers across Africa.',
    url: 'https://www.starlink.com/map',
    actionLabel: 'Check Starlink Map',
  },
  {
    name: 'Inmarsat & Iridium Global Humanitarian Comms',
    category: 'Emergency Satellite Networks',
    description: 'Global L-band satellite voice and emergency data services for remote humanitarian field teams.',
    url: 'https://www.inmarsat.com',
    actionLabel: 'Open Inmarsat',
  },
];

export interface ImportantContactItem {
  id: string;
  category: 'Health & Medical' | 'Security & Police' | 'Legal & Protection' | 'Headquarters & Advisory';
  title: string;
  personOrUnit: string;
  phone: string;
  location: string;
  notes: string;
}

export const IMPORTANT_HEALTH_SECURITY_CONTACTS: ImportantContactItem[] = [
  {
    id: 'cnt-med-1',
    category: 'Health & Medical',
    title: 'KDF Medical Director',
    personOrUnit: 'Mugabirwe Jackline',
    phone: '+256731509445',
    location: 'Mityana & Rural Outreach Clinics',
    notes: 'Primary health care, maternal checkups, elderly & disability medical referrals.',
  },
  {
    id: 'cnt-med-2',
    category: 'Health & Medical',
    title: 'KDF Community & Medical Specialist',
    personOrUnit: 'Akankunda Violah',
    phone: '+256706600148',
    location: 'Uganda Field Health Unit',
    notes: 'HIV/AIDS education, disease sensitization, and rehabilitation follow-up.',
  },
  {
    id: 'cnt-med-3',
    category: 'Health & Medical',
    title: 'Uganda National Medical Emergency & Red Cross',
    personOrUnit: 'Ministry of Health / Red Cross Ambulance',
    phone: '911',
    location: 'Uganda Nationwide',
    notes: 'National emergency medical ambulance & Red Cross rapid response.',
  },
  {
    id: 'cnt-sec-1',
    category: 'Security & Police',
    title: 'Uganda Police Force Emergency & Child Protection',
    personOrUnit: 'Uganda Police National Dispatch (CFPU)',
    phone: '999',
    location: 'All Districts, Uganda',
    notes: 'Immediate police emergency, family & child protection unit (also dial 112).',
  },
  {
    id: 'cnt-sec-2',
    category: 'Security & Police',
    title: 'Uganda Police Toll-Free Emergency',
    personOrUnit: 'Uganda Police Control Room',
    phone: '112',
    location: 'Uganda Nationwide',
    notes: '24/7 toll-free security, fire, and emergency response across mobile networks.',
  },
  {
    id: 'cnt-leg-1',
    category: 'Legal & Protection',
    title: 'KDF Legal Advisor',
    personOrUnit: 'Namutebi Vanessa',
    phone: '+256789509103',
    location: 'KDF Uganda Legal Desk',
    notes: 'Legal protection for widows, orphans, girl child, and community rights.',
  },
  {
    id: 'cnt-leg-2',
    category: 'Legal & Protection',
    title: 'KDF Chief Advisor',
    personOrUnit: 'Namayanja Oivia',
    phone: '+256709270120',
    location: 'KDF Advisory Office',
    notes: 'Strategic guidance, community mediation, and safeguarding oversight.',
  },
  {
    id: 'cnt-hq-1',
    category: 'Headquarters & Advisory',
    title: 'KDF Uganda Official Office Line',
    personOrUnit: 'Director Kibatto Joseph / CED Nakyejwe Sherina',
    phone: '+256789509103',
    location: 'P.O Box 2678, Mityana District, Uganda',
    notes: 'Direct headquarters line (+256 770610329 Director · +256783913861 CED).',
  },
  {
    id: 'cnt-hq-2',
    category: 'Headquarters & Advisory',
    title: 'KDF Secretary & Managing Director',
    personOrUnit: 'Namwanje Proscovia & Sempa Abdulrahman',
    phone: '+256776391872',
    location: 'Mityana District HQ',
    notes: 'Secretariat (+256 776391872) & Operations (+25670762727481).',
  },
];

export const DIGITAL_COMMERCE_AND_MARKETS: GlobalLinkItem[] = [
  {
    name: 'Kaluta Digital Shopping Mall',
    category: 'Digital Shopping Mall',
    description: 'Connect to the Kaluta Digital Shopping Mall ecosystem for digital commerce, community merchants, and online goods.',
    url: 'https://www.google.com/search?q=Kaluta+Digital+Shopping+Mall',
    actionLabel: 'Connect to Kaluta Mall',
  },
  {
    name: 'Pi Network Global Community',
    category: 'Digital Currency & Ecosystem',
    description: 'Official Pi Network portal for peer-to-peer digital utility, Pi Browser apps, and merchant communities.',
    url: 'https://minepi.com',
    actionLabel: 'Open Pi Network',
  },
  {
    name: 'Pernum (Personal Number & SafeZone)',
    category: 'Digital Identity & Commerce',
    description: 'Official Pernum identity and digital marketplace gateway within the SafeZone ecosystem.',
    url: 'https://pernum.com',
    actionLabel: 'Open Pernum',
  },
  {
    name: 'YEM Exchange & Digital Trade',
    category: 'Digital Exchange',
    description: 'Connect to YEM digital exchange portals and SafeZone digital trade communities.',
    url: 'https://www.google.com/search?q=YEM+Exchange+SafeZone',
    actionLabel: 'Open YEM Exchange',
  },
  {
    name: 'Jumia Uganda & East Africa Marketplace',
    category: 'African E-Commerce Market',
    description: 'Buy and sell electronics, farm tools, household essentials, and clothing across Uganda and Africa.',
    url: 'https://www.jumia.ug',
    actionLabel: 'Open Jumia Uganda',
  },
  {
    name: 'Jiji Uganda Classifieds & Harvest Market',
    category: 'Local Buying & Supply',
    description: 'Local marketplace across Mityana, Kampala, and Uganda for farm produce, livestock, tools, and supplies.',
    url: 'https://jiji.ug',
    actionLabel: 'Open Jiji Uganda',
  },
  {
    name: 'Alibaba Global Wholesale Supply',
    category: 'Global B2B Wholesale Market',
    description: 'Source agricultural machinery, solar panels, medical supplies, and building materials globally.',
    url: 'https://www.alibaba.com',
    actionLabel: 'Open Alibaba Global',
  },
  {
    name: 'Amazon Global Marketplace',
    category: 'International Retail Market',
    description: 'Global marketplace for educational books, medical equipment, ICT hardware, and community supplies.',
    url: 'https://www.amazon.com',
    actionLabel: 'Open Amazon',
  },
];

export interface FreeMediaStream {
  id: string;
  name: string;
  type: 'Radio' | 'TV';
  region: string;
  description: string;
  streamUrl?: string;
  externalUrl: string;
}

export const FREE_TV_AND_RADIO: FreeMediaStream[] = [
  {
    id: 'tv-aljazeera',
    name: 'Al Jazeera English Live TV',
    type: 'TV',
    region: 'Global News',
    description: 'Free 24/7 international news, Africa reporting, and humanitarian documentaries.',
    externalUrl: 'https://www.aljazeera.com/live',
  },
  {
    id: 'tv-france24',
    name: 'France 24 English Live TV',
    type: 'TV',
    region: 'Global & Africa Desk',
    description: 'Free live global television news with dedicated Africa and development coverage.',
    externalUrl: 'https://www.france24.com/en/live',
  },
  {
    id: 'tv-dw',
    name: 'DW News (Deutsche Welle) Live',
    type: 'TV',
    region: 'Europe & Africa',
    description: 'Free international television broadcasts covering global health, science, and Africa.',
    externalUrl: 'https://www.dw.com/en/live-tv/s-100825',
  },
  {
    id: 'tv-un',
    name: 'UN Web TV (United Nations)',
    type: 'TV',
    region: 'United Nations Global',
    description: 'Free live coverage of UN Security Council, UN Women, SDG summits, and humanitarian briefings.',
    externalUrl: 'https://webtv.un.org',
  },
  {
    id: 'rad-bbc',
    name: 'BBC World Service Radio',
    type: 'Radio',
    region: 'Global & East Africa',
    description: 'Free 24-hour global radio news, Focus on Africa, and community health programming.',
    streamUrl: 'https://stream.live.vc.bbcmedia.co.uk/bbc_world_service',
    externalUrl: 'https://www.bbc.co.uk/sounds/play/live:bbc_world_service',
  },
  {
    id: 'rad-rfi',
    name: 'RFI English & Africa Radio',
    type: 'Radio',
    region: 'Pan-African Radio',
    description: 'Free African news, culture, agriculture, and regional updates in English.',
    streamUrl: 'https://rfienanglais64k.ice.infomaniak.ch/rfienanglais-64.mp3',
    externalUrl: 'https://www.rfi.fr/en/',
  },
  {
    id: 'rad-voa',
    name: 'VOA Africa Radio',
    type: 'Radio',
    region: 'Africa Live Radio',
    description: 'Voice of America Africa live radio bulletins, health reports, and youth programs.',
    externalUrl: 'https://www.voaafrica.com',
  },
  {
    id: 'rad-uganda',
    name: 'Uganda Radio Network & Local Stations',
    type: 'Radio',
    region: 'Mityana & Uganda',
    description: 'Ugandan regional news, agriculture prices, and community radio dispatches.',
    externalUrl: 'https://ugandaradionetwork.net',
  },
];

export const NIRA_OFFICIAL_SOURCES: GlobalLinkItem[] = [
  {
    name: 'NIRA Uganda (National Identification & Registration Authority)',
    category: 'National ID & Birth/Death Registry',
    description: 'Official Ugandan authority for National Identification Numbers (NIN), National ID card status, and birth/death registration.',
    url: 'https://www.nira.go.ug',
    actionLabel: 'Open NIRA Uganda',
  },
  {
    name: 'URSB (Uganda Registration Services Bureau)',
    category: 'Company & NGO Legal Registry',
    description: 'Official business, limited company, marriage, and intellectual property registration authority in Uganda.',
    url: 'https://ursb.go.ug',
    actionLabel: 'Open URSB Portal',
  },
  {
    name: 'Uganda National NGO Bureau',
    category: 'NGO Verification & Permits',
    description: 'Ministry of Internal Affairs NGO registration verification and operating permit registry for Uganda.',
    url: 'https://ngobureau.go.ug',
    actionLabel: 'Open NGO Bureau',
  },
  {
    name: 'Uganda e-Immigration & Passport Portal',
    category: 'Passports & Travel Identity',
    description: 'Official Directorate of Citizenship and Immigration Control portal for Uganda passport and visa status.',
    url: 'https://visas.immigration.go.ug',
    actionLabel: 'Open Immigration Portal',
  },
  {
    name: 'UNHCR Global Verification & Protection Portal',
    category: 'Refugee & Humanitarian ID',
    description: 'International refugee identity verification and humanitarian protection support services.',
    url: 'https://www.unhcr.org',
    actionLabel: 'Open UNHCR',
  },
];



