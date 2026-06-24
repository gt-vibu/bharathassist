import fs from 'fs';
import path from 'path';
import { User, Scheme, Application, Notification, UserDocument, SchemeEligibilityCriteria } from '../src/types.js';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

// Interface for our database structure
export interface DBStructure {
  users: User[];
  schemes: Scheme[];
  applications: Application[];
  notifications: Notification[];
  documents: UserDocument[];
}

// Function to generate 100+ highly detailed and realistic schemes across 14 categories
function generate105Schemes(): Scheme[] {
  const schemes: Scheme[] = [];

  const categories = [
    "Scholarships",
    "Farmer Schemes",
    "Women Welfare",
    "Startup Support",
    "MSME Benefits",
    "Senior Citizen Schemes",
    "Pension Programs",
    "Healthcare Schemes",
    "Housing Schemes",
    "Employment Schemes",
    "Skill Development",
    "Education Support",
    "Rural Development",
    "State Welfare Programs"
  ];

  const states = [
    "National", "Karnataka", "Tamil Nadu", "Maharashtra", 
    "Uttar Pradesh", "Bihar", "Gujarat", "Rajasthan", "Delhi", "Kerala"
  ];

  // 1. First, seed 20 anchor, real high-profile schemes
  const anchorSchemes: Omit<Scheme, 'id'>[] = [
    {
      name: "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
      description: "An initiative by the Government of India that provides up to ₹6,000 per year in three equal installments to all small and marginal landholding farmer families.",
      eligibilityDescription: "Small and marginal farmers holding land up to 2 hectares. Families of farmers who are currently paying income tax or hold constitutional posts are excluded.",
      eligibilityCriteria: {
        ageMin: 18,
        ageMax: 100,
        incomeMax: 300000,
        states: ["National", "All"],
        occupations: ["Farmer"],
        categories: ["General", "OBC", "SC", "ST"]
      },
      benefits: "Income support of ₹6,000 per year, transferred directly into the bank accounts of farmers in three equal installments of ₹2,000.",
      documentsRequired: ["Aadhaar Card", "Land Registry Documents", "Bank Account Details"],
      officialApplicationLink: "https://pmkisan.gov.in/",
      deadline: "2026-12-31",
      state: "National",
      category: "Farmer Schemes",
      tags: ["farmers", "income support", "agriculture", "direct benefit transfer"]
    },
    {
      name: "Ayushman Bharat Pradhan Mantri Jan Arogya Yojana (PM-JAY)",
      description: "The largest health assurance scheme in the world which aims to provide a health cover of ₹5 lakhs per family per year for secondary and tertiary care hospitalization.",
      eligibilityDescription: "Identified families as per SECC 2011 database. Includes families with no adult male member, female-headed households, landless families, and manual scavenger families.",
      eligibilityCriteria: {
        ageMin: 0,
        ageMax: 110,
        incomeMax: 150000,
        states: ["National", "All"],
        categories: ["General", "OBC", "SC", "ST"]
      },
      benefits: "Cashless and paperless access to healthcare services up to ₹5,00,000 per family per year for secondary and tertiary hospitalization.",
      documentsRequired: ["Aadhaar Card", "Ration Card", "Income Certificate"],
      officialApplicationLink: "https://pmjay.gov.in/",
      deadline: "2026-12-31",
      state: "National",
      category: "Healthcare Schemes",
      tags: ["health", "insurance", "hospitalization", "medical", "cashless"]
    },
    {
      name: "Sukanya Samriddhi Yojana (SSY)",
      description: "A small deposit scheme for a girl child launched as a part of the 'Beti Bachao Beti Padhao' campaign. Offers high interest rates and tax savings.",
      eligibilityDescription: "Can be opened by a natural or legal guardian for a girl child of age below 10 years. Only one account per girl child, maximum of two accounts in a family.",
      eligibilityCriteria: {
        ageMin: 0,
        ageMax: 10,
        genders: ["Female"],
        states: ["National", "All"]
      },
      benefits: "Attractive compounding interest rate (currently 8.2%), income tax exemption under Section 80C, and a maturity payout when the child turns 21 or marries after 18.",
      documentsRequired: ["Aadhaar Card", "Birth Certificate of Girl Child", "Guardian PAN Card"],
      officialApplicationLink: "https://www.indiapost.gov.in/",
      deadline: "2026-12-31",
      state: "National",
      category: "Women Welfare",
      tags: ["girl child", "savings", "education", "marriage", "tax benefits"]
    },
    {
      name: "Pradhan Mantri Mudra Yojana (PMMY)",
      description: "Provides loans up to ₹10 Lakhs to non-corporate, non-farm small/micro enterprises. Divided into three categories: Shishu, Kishor, and Tarun based on growth phase.",
      eligibilityDescription: "Any Indian citizen who has a business plan for a non-farm sector income generating activity such as manufacturing, processing, trading or service sector.",
      eligibilityCriteria: {
        ageMin: 18,
        ageMax: 65,
        states: ["National", "All"]
      },
      benefits: "Collateral-free business loans under three tiers: Shishu (up to ₹50,000), Kishor (₹50,001 to ₹5 Lakhs), and Tarun (₹5,00,001 to ₹10 Lakhs).",
      documentsRequired: ["Aadhaar Card", "PAN Card", "Business Registration Proof", "Bank Statement"],
      officialApplicationLink: "https://www.mudra.org.in/",
      deadline: "2027-03-31",
      state: "National",
      category: "MSME Benefits",
      tags: ["business loan", "microfinance", "entrepreneur", "startups"]
    },
    {
      name: "Atal Pension Yojana (APY)",
      description: "A pension scheme targeted at unorganized sector workers like delivery boys, domestic helps, gardeners, etc., ensuring stable income post-retirement.",
      eligibilityDescription: "All citizens of India between 18 and 40 years of age having a savings bank account. Must not be a beneficiary of any social security schemes or a taxpayer.",
      eligibilityCriteria: {
        ageMin: 18,
        ageMax: 40,
        incomeMax: 250000,
        states: ["National", "All"]
      },
      benefits: "Guaranteed minimum monthly pension ranging from ₹1,000 to ₹5,000 after reaching the age of 60, based on contributions.",
      documentsRequired: ["Aadhaar Card", "Bank Account Details"],
      officialApplicationLink: "https://www.npscra.nsdl.co.in/",
      deadline: "2026-12-31",
      state: "National",
      category: "Pension Programs",
      tags: ["pension", "retirement", "unorganized sector", "senior safety"]
    },
    {
      name: "Startup India Seed Fund Scheme (SISFS)",
      description: "Provides financial assistance to startups for proof of concept, prototype development, product trials, market entry, and commercialization.",
      eligibilityDescription: "A startup recognized by DPIIT, incorporated not more than 2 years ago, and must have a business idea to develop a product with a market fit.",
      eligibilityCriteria: {
        ageMin: 18,
        ageMax: 100,
        states: ["National", "All"]
      },
      benefits: "Grants of up to ₹20 Lakhs for validation of Proof of Concept/prototype, and up to ₹50 Lakhs of investment via debt or convertible debentures.",
      documentsRequired: ["Aadhaar Card", "PAN Card", "DPIIT Recognition Certificate", "Pitch Deck"],
      officialApplicationLink: "https://www.startupindia.gov.in/",
      deadline: "2026-12-31",
      state: "National",
      category: "Startup Support",
      tags: ["startup", "seed funding", "funding", "innovation", "dpiit"]
    },
    {
      name: "Post-Matric Scholarship Scheme for SC Students",
      description: "A centrally sponsored scheme providing financial assistance to Scheduled Caste students to pursue post-matriculation or post-secondary courses.",
      eligibilityDescription: "Indian nationals belonging to Scheduled Castes whose parents' combined annual income does not exceed ₹2.5 Lakhs per annum.",
      eligibilityCriteria: {
        ageMin: 15,
        ageMax: 30,
        incomeMax: 250000,
        categories: ["SC"],
        states: ["National", "All"]
      },
      benefits: "100% reimbursement of non-refundable compulsory fees and an additional academic allowance of up to ₹13,500 per year directly to bank accounts.",
      documentsRequired: ["Aadhaar Card", "Caste Certificate", "Income Certificate", "Previous Year Marksheet"],
      officialApplicationLink: "https://scholarships.gov.in/",
      deadline: "2026-11-30",
      state: "National",
      category: "Scholarships",
      tags: ["scholarship", "sc students", "education", "college fee"]
    },
    {
      name: "Pradhan Mantri Awas Yojana (PMAY-Urban)",
      description: "Provides central assistance to implementing agencies to provide all-weather pucca houses to all eligible urban households.",
      eligibilityDescription: "Families belonging to EWS (income up to ₹3L), LIG (income up to ₹6L), and MIG (income up to ₹18L). The beneficiary family must not own a pucca house anywhere in India.",
      eligibilityCriteria: {
        ageMin: 18,
        ageMax: 100,
        incomeMax: 1800000,
        states: ["National", "All"]
      },
      benefits: "Interest subsidy of up to 6.5% on home loans for up to 20 years, saving beneficiaries up to ₹2.67 Lakhs on home acquisitions.",
      documentsRequired: ["Aadhaar Card", "Income Certificate", "Non-owning of Property Affidavit", "PAN Card"],
      officialApplicationLink: "https://pmay-urban.gov.in/",
      deadline: "2026-12-31",
      state: "National",
      category: "Housing Schemes",
      tags: ["housing", "urban", "home loan", "interest subsidy"]
    },
    {
      name: "Mahatma Gandhi National Rural Employment Guarantee Act (MGNREGA)",
      description: "Guarantees 100 days of wage employment in a financial year to a rural household whose adult members volunteer to do unskilled manual work.",
      eligibilityDescription: "Adult members of rural households who volunteer for unskilled manual work. Must be local residents of the rural area.",
      eligibilityCriteria: {
        ageMin: 18,
        ageMax: 100,
        states: ["National", "All"]
      },
      benefits: "Guaranteed minimum of 100 days of paid employment per year. Wages are paid directly into bank accounts within 15 days.",
      documentsRequired: ["Aadhaar Card", "Job Card", "Bank Account Details"],
      officialApplicationLink: "https://nrega.nic.in/",
      deadline: "2026-12-31",
      state: "National",
      category: "Employment Schemes",
      tags: ["rural employment", "wages", "manual work", "unskilled job"]
    },
    {
      name: "Pradhan Mantri Kaushal Vikas Yojana (PMKVY 4.0)",
      description: "A flagship skill certification scheme aiming to enable Indian youth to take up industry-relevant skill training that will help them secure a better livelihood.",
      eligibilityDescription: "Unemployed youth or school/college dropouts between 15 and 45 years of age. Must possess an Aadhaar card and an active bank account.",
      eligibilityCriteria: {
        ageMin: 15,
        ageMax: 45,
        states: ["National", "All"]
      },
      benefits: "Free industry-aligned skill training courses, official NSDC certification, reward money upon passing assessment, and job placement assistance.",
      documentsRequired: ["Aadhaar Card", "School leaving certificate", "Bank Passbook"],
      officialApplicationLink: "https://www.pmkvyofficial.org/",
      deadline: "2026-10-31",
      state: "National",
      category: "Skill Development",
      tags: ["skills", "vocational training", "placement", "unemployed", "youth"]
    },
    {
      name: "National Means-cum-Merit Scholarship (NMMSS)",
      description: "A centrally sponsored scholarship scheme providing financial support to meritorious students of economically weaker sections to arrest dropouts in Class VIII.",
      eligibilityDescription: "Students studying in class IX with minimum 55% marks in class VIII. Parents' income should not exceed ₹3.5 Lakhs per year.",
      eligibilityCriteria: {
        ageMin: 12,
        ageMax: 16,
        incomeMax: 350000,
        states: ["National", "All"]
      },
      benefits: "Scholarship of ₹12,000 per annum (₹1,000 per month) from Class IX to XII to help continue high school education.",
      documentsRequired: ["Aadhaar Card", "Income Certificate", "Class 8 Marksheet", "School Bonafide Certificate"],
      officialApplicationLink: "https://scholarships.gov.in/",
      deadline: "2026-09-30",
      state: "National",
      category: "Scholarships",
      tags: ["merit scholarship", "school education", "middle class", "student aid"]
    },
    {
      name: "Gruha Lakshmi Scheme (Karnataka)",
      description: "A landmark state welfare scheme of the Government of Karnataka which provides financial assistance to the female heads of households in the state.",
      eligibilityDescription: "Women listed as the head of the family in Antyodaya, BPL, and APL ration cards. Family should not be income-taxpayers or GST registrants.",
      eligibilityCriteria: {
        ageMin: 18,
        ageMax: 100,
        genders: ["Female"],
        states: ["Karnataka"],
        incomeMax: 200000
      },
      benefits: "Direct bank transfer of ₹2,000 monthly to the account of the designated female head of the family.",
      documentsRequired: ["Aadhaar Card", "Ration Card (BPL/APL/Antyodaya)", "Bank Account Details Linked with Aadhaar"],
      officialApplicationLink: "https://sevasindhu.karnataka.gov.in/",
      deadline: "2026-12-31",
      state: "Karnataka",
      category: "State Welfare Programs",
      tags: ["karnataka", "women welfare", "monthly cash", "housewife aid"]
    },
    {
      name: "Pudhumai Penn Scheme (Tamil Nadu)",
      description: "Moovalur Ramamirtham Ammaiyar Higher Education Assurance Scheme of Tamil Nadu to encourage girl students from government schools to pursue higher education.",
      eligibilityDescription: "Girl students who have studied from Class 6 to 12 in Tamil Nadu government schools and got admitted into higher education programs (degree, diploma).",
      eligibilityCriteria: {
        ageMin: 17,
        ageMax: 25,
        genders: ["Female"],
        states: ["Tamil Nadu"]
      },
      benefits: "Monthly assistance of ₹1,000 credited directly into the student's bank account until completion of their degree or diploma program.",
      documentsRequired: ["Aadhaar Card", "Government School Study Certificate (6th-12th)", "College Admission Proof", "Bank Passbook"],
      officialApplicationLink: "https://penkalvi.tn.gov.in/",
      deadline: "2026-09-15",
      state: "Tamil Nadu",
      category: "State Welfare Programs",
      tags: ["tamil nadu", "girls education", "higher education", "monthly incentive"]
    }
  ];

  // Map anchors with IDs
  anchorSchemes.forEach((s, idx) => {
    schemes.push({
      id: `scheme_anchor_${idx + 1}`,
      ...s
    });
  });

  // 2. Programmatically generate the remaining schemes to reach 105 total, ensuring:
  // - High details
  // - Clean variety across categories and states
  // - Diverse eligibility ranges for testing
  const totalTarget = 105;
  let runningId = schemes.length + 1;

  while (schemes.length < totalTarget) {
    const category = categories[schemes.length % categories.length];
    const state = states[schemes.length % states.length];
    
    // Choose a realistic set of details based on category
    let name = "";
    let description = "";
    let eligibilityDescription = "";
    let benefits = "";
    let docs = ["Aadhaar Card"];
    let tags: string[] = [category.toLowerCase().replace(" ", "-")];
    let criteria: SchemeEligibilityCriteria = {
      states: [state, "All"]
    };

    switch (category) {
      case "Scholarships":
        name = `${state === "National" ? "National" : state} Post-Graduate Merit Fellowship for ${["Single Girl Child", "Backward Classes", "Minority Students", "Meritorious Youth"][runningId % 4]}`;
        description = `An initiative to provide financial support to students from ${state} who have achieved academic excellence and wish to pursue full-time Post-Graduate studies.`;
        eligibilityDescription = `Student enrolled in a recognized university inside ${state} with at least 60% marks in graduation. Family income less than ₹4.5 Lakhs per year.`;
        benefits = "A monthly stipend of ₹5,000 for 2 years plus a contingency grant of ₹12,000 per annum.";
        docs = ["Aadhaar Card", "Income Certificate", "College Admission Letter", "Graduation Marksheet"];
        tags = ["scholarship", "merit", "college", "higher-education"];
        criteria = {
          ageMin: 20,
          ageMax: 28,
          incomeMax: 450000,
          states: [state, "All"]
        };
        if (runningId % 2 === 0) {
          criteria.genders = ["Female"];
        }
        break;

      case "Farmer Schemes":
        name = `${state === "National" ? "Pradhan Mantri" : state} Welfare Grid for ${["Horticulture Development", "Organic Farming Subsidies", "Solar Pump Installation", "Drip Irrigation Support"][runningId % 4]}`;
        description = `Helps farmers transition to efficient techniques by subsidizing the initial setup of modernized farm equipment and training programs.`;
        eligibilityDescription = `Active farmers owning cultivable lands in ${state} with valid land records and bank accounts linked with Aadhaar.`;
        benefits = "Up to 80% direct subsidy for equipment cost (capped at ₹75,000) and free training at government centers.";
        docs = ["Aadhaar Card", "Land Registry Documents", "Bank Account Details"];
        tags = ["agriculture", "farmer-aid", "irrigation", "subsidy"];
        criteria = {
          ageMin: 18,
          ageMax: 75,
          states: [state, "All"],
          occupations: ["Farmer"]
        };
        break;

      case "Women Welfare":
        name = `${state === "National" ? "Nari" : state} ${["Suraksha Cash Grant", "Udyami Loan Support", "Self Help Group Subsidy", "Maternal Care Incentive"][runningId % 4]}`;
        description = `Designed to foster financial autonomy and support primary health-maternity concerns for women residing in ${state}.`;
        eligibilityDescription = `Women who belong to underprivileged households. Age between 18 and 60, with family income below the poverty threshold.`;
        benefits = `A one-time assistance of ₹15,000 or cheap business loans with 0% interest rates up to ₹2,00,000.`;
        docs = ["Aadhaar Card", "Income Certificate", "Ration Card"];
        tags = ["women", "financial-support", "healthcare", "business-loan"];
        criteria = {
          ageMin: 18,
          ageMax: 60,
          genders: ["Female"],
          states: [state, "All"],
          incomeMax: 250000
        };
        break;

      case "Startup Support":
        name = `${state === "National" ? "Pradhan Mantri" : state} NextGen Incubator & ${["Tech Grant", "Incubation Fund", "Patent Subsidy", "Digital Startup Boost"][runningId % 4]}`;
        description = `Supports young tech developers and product founders by giving initial prototyping micro-grants and expert mentors.`;
        eligibilityDescription = `Any citizen under 35 with a registered innovative firm inside ${state}. Requires a working product model.`;
        benefits = `Direct grant of ₹10,000,000 or patent registration cost recovery up to 90%.`;
        docs = ["Aadhaar Card", "PAN Card", "Business Registration Proof", "Patent Description"];
        tags = ["startup", "grant", "innovation", "technology"];
        criteria = {
          ageMin: 18,
          ageMax: 35,
          states: [state, "All"]
        };
        break;

      case "MSME Benefits":
        name = `${state === "National" ? "Aatmanirbhar" : state} Support for ${["Handloom Weavers", "Coir & Jute Industries", "Metal Handicrafts", "Micro Food Processors"][runningId % 4]}`;
        description = `Encourages traditional artisans and micro-vendors by providing raw materials at cheaper rates and formalizing trade networks.`;
        eligibilityDescription = `Registered micro-enterprises or individual artisans in ${state} with valid Udyam Registration.`;
        benefits = `Subsidy of 35% on raw materials, up to ₹1,50,000 and free digital store listings.`;
        docs = ["Aadhaar Card", "PAN Card", "Udyam Registration Certificate"];
        tags = ["msme", "artisan", "weaving", "subsidy"];
        criteria = {
          ageMin: 18,
          ageMax: 70,
          states: [state, "All"]
        };
        break;

      case "Senior Citizen Schemes":
        name = `${state === "National" ? "Vayoshri" : state} ${["Free Medical Supplies", "Safe Transport Pass", "Home Care Allowance", "Aids & Assistive Devices Scheme"][runningId % 4]}`;
        description = `Provides daily life ease and physical assistance to senior citizens who require living supports.`;
        eligibilityDescription = `Citizens aged above 60 years. Special priority given to senior citizens in BPL category.`;
        benefits = `Free distribution of standard assistive living equipment (wheelchairs, hearing aids, spectacles) or ₹1,500 monthly home support cash.`;
        docs = ["Aadhaar Card", "Income Certificate", "Age Proof Certificate"];
        tags = ["senior-citizen", "healthcare", "assistive-device", "pension"];
        criteria = {
          ageMin: 60,
          ageMax: 100,
          states: [state, "All"],
          incomeMax: 200000
        };
        break;

      case "Pension Programs":
        name = `${state === "National" ? "Atal" : state} ${["Social Security Pension", "Disabled Citizen Pension", "Widow Welfare Pension", "Unorganized Sector Pension"][runningId % 4]}`;
        description = `A monthly financial payout structured for citizens who have no other source of regular income and belong to designated vulnerable classes.`;
        eligibilityDescription = `Must be a resident of ${state} with total family income below threshold limit. Eligible for widows or disabled citizens specifically.`;
        benefits = `Guaranteed lifelong pension of ₹2,000 every month.`;
        docs = ["Aadhaar Card", "Caste Certificate", "Income Certificate", "Death Certificate of Spouse (if widow)"];
        tags = ["pension", "monthly-cash", "social-security", "retirement"];
        criteria = {
          ageMin: 18,
          ageMax: 80,
          states: [state, "All"],
          incomeMax: 180000
        };
        if (runningId % 4 === 1) {
          criteria.disabilityRequired = true;
        }
        break;

      case "Healthcare Schemes":
        name = `${state === "National" ? "Swasthya" : state} ${["Universal Health Cover", "Maternal Delivery Benefit", "Essential Medicine Card", "Dialysis Support Facility"][runningId % 4]}`;
        description = `Provides medical reimbursement or cashless access to critical diagnostic treatments across partner clinics.`;
        eligibilityDescription = `All resident families in ${state} with income levels under EWS/BPL specifications.`;
        benefits = `Cashless medical coverage of up to ₹2,50,000 for standard surgeries and free supply of 200 essential drugs.`;
        docs = ["Aadhaar Card", "Ration Card", "Income Certificate"];
        tags = ["health", "hospital", "cashless", "medicine"];
        criteria = {
          ageMin: 0,
          ageMax: 90,
          states: [state, "All"],
          incomeMax: 200000
        };
        break;

      case "Housing Schemes":
        name = `${state === "National" ? "Awas" : state} ${["Grameen Housing Subsidy", "Slum Rehabilitation Scheme", "Affordable Housing Rental Assist", "EWS Home Allotment"][runningId % 4]}`;
        description = `Ensures proper shelter with concrete roofs and toilets for homeless and economically weak residents of ${state}.`;
        eligibilityDescription = `People currently living in kutcha/damaged temporary shelters who do not own a permanent house.`;
        benefits = `Direct financial assistance of ₹1,20,000 in plains and ₹1,30,000 in hilly areas to construct a permanent house.`;
        docs = ["Aadhaar Card", "Income Certificate", "Domicile Certificate"];
        tags = ["housing", "home-construction", "rural-development"];
        criteria = {
          ageMin: 18,
          ageMax: 80,
          states: [state, "All"],
          incomeMax: 300000
        };
        break;

      case "Employment Schemes":
        name = `${state === "National" ? "Udyog" : state} ${["Rural Skill Placement", "Urban Wage Employment", "Apprenticeship Support Portal", "Youth Job Fair Initiative"][runningId % 4]}`;
        description = `Bridges employment gaps by providing short-term contract jobs or industrial paid apprenticeships with top firms.`;
        eligibilityDescription = `Unemployed youth with minimum Class 10 education who reside in ${state}.`;
        benefits = `Stipend of ₹6,000 - ₹12,000 per month during internship and certificate of industrial practice.`;
        docs = ["Aadhaar Card", "School leaving certificate", "Unemployment Registration Certificate"];
        tags = ["employment", "job", "internship", "stipend"];
        criteria = {
          ageMin: 18,
          ageMax: 35,
          states: [state, "All"]
        };
        break;

      case "Skill Development":
        name = `${state === "National" ? "Kaushal" : state} ${["IT Training Drive", "Handicraft Apprenticeship", "Women Tailoring Center", "Drone Pilot Certification"][runningId % 4]}`;
        description = `Provides high-tech or vocational trade certificate programs with certified training partners in ${state}.`;
        eligibilityDescription = `Any citizen who wants to acquire a technical skill to get self-employed. No high academic requirement.`;
        benefits = `100% sponsored course fee, free study kit, and startup tool kit value up to ₹10,000 upon passing exam.`;
        docs = ["Aadhaar Card", "Class 10 Marksheet"];
        tags = ["skill-building", "technical-training", "certification", "artisan"];
        criteria = {
          ageMin: 16,
          ageMax: 40,
          states: [state, "All"]
        };
        break;

      case "Education Support":
        name = `${state === "National" ? "Shiksha" : state} ${["Free Tablets For Students", "Bicycle Scheme for Girls", "Higher Education Loan Subsidy", "Hostel Accommodation Grant"][runningId % 4]}`;
        description = `Reduces dropout rates in government schools and colleges by giving material or boarding aids directly.`;
        eligibilityDescription = `Students enrolled in government or government-aided schools/colleges with 60%+ attendance.`;
        benefits = `Free distribution of Android tablet / gear bicycle or hostel fee waiver of up to ₹3,000 monthly.`;
        docs = ["Aadhaar Card", "School Bonafide Certificate", "Marksheet"];
        tags = ["education", "student-benefit", "tablet-distribution", "hostel"];
        criteria = {
          ageMin: 12,
          ageMax: 24,
          states: [state, "All"]
        };
        break;

      case "Rural Development":
        name = `${state === "National" ? "Gram" : state} ${["Solar Streetlight Mission", "Clean Drinking Water Project", "Biogas Plant Installation Aid", "Rural Roads Connectivity Scheme"][runningId % 4]}`;
        description = `Implements grass-root community facilities like biogas, water access points, and clean energy solutions.`;
        eligibilityDescription = `Local village representatives, village panchayats, or individual farmers living in villages in ${state}.`;
        benefits = `Capital support of 70% of biogas/solar installation cost and technical worker deployment.`;
        docs = ["Aadhaar Card", "Domicile Certificate", "Panchayat Clearance Form"];
        tags = ["rural", "infrastructure", "drinking-water", "solar"];
        criteria = {
          ageMin: 18,
          ageMax: 100,
          states: [state, "All"]
        };
        break;

      case "State Welfare Programs":
        name = `${state} ${["Family Health Assurance", "Youth Self-Employment Boost", "Farmer Power Subsidy", "Social Safety Net Grant"][runningId % 4]}`;
        description = `A specialized state-level flagship scheme of the ${state} government designed for localized benefits.`;
        eligibilityDescription = `Permanent residents of ${state} state, belonging to economically disadvantaged backgrounds.`;
        benefits = `Free electricity up to 200 units for farmers, or a localized direct cash benefit of ₹1,500 per month.`;
        docs = ["Aadhaar Card", "Domicile Certificate", "Ration Card"];
        tags = ["state-welfare", state.toLowerCase(), "direct-benefit"];
        criteria = {
          ageMin: 18,
          ageMax: 70,
          states: [state],
          incomeMax: 220000
        };
        break;
    }

    schemes.push({
      id: `scheme_gen_${runningId}`,
      name,
      description,
      eligibilityDescription,
      eligibilityCriteria: criteria,
      benefits,
      documentsRequired: docs,
      officialApplicationLink: "https://www.india.gov.in/my-government/schemes",
      deadline: "2026-11-30",
      state,
      category,
      tags
    });

    runningId++;
  }

  return schemes;
}

export class DataStore {
  private static instance: DataStore;
  private db: DBStructure = {
    users: [],
    schemes: [],
    applications: [],
    notifications: [],
    documents: []
  };

  private constructor() {
    this.init();
  }

  public static getInstance(): DataStore {
    if (!DataStore.instance) {
      DataStore.instance = new DataStore();
    }
    return DataStore.instance;
  }

  private init() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf8');
        this.db = JSON.parse(fileContent);
        
        // Ensure we always have 100+ schemes loaded
        if (!this.db.schemes || this.db.schemes.length < 100) {
          console.log("Seeding government schemes database...");
          this.db.schemes = generate105Schemes();
          this.saveToDisk();
        }
      } else {
        console.log("Initializing database file...");
        this.db.users = [];
        this.db.schemes = generate105Schemes();
        this.db.applications = [];
        this.db.notifications = [];
        this.db.documents = [];
        this.saveToDisk();
      }
    } catch (error) {
      console.error("Failed to initialize database:", error);
    }
  }

  private saveToDisk() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.db, null, 2), 'utf8');
    } catch (error) {
      console.error("Failed to save database to disk:", error);
    }
  }

  // --- Users Operations ---
  public getUsers(): User[] {
    return this.db.users || [];
  }

  public getUserById(id: string): User | undefined {
    return this.getUsers().find(u => u.id === id);
  }

  public getUserByEmail(email: string): User | undefined {
    return this.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public saveUser(user: User): User {
    const users = this.getUsers();
    const existingIdx = users.findIndex(u => u.id === user.id);
    if (existingIdx >= 0) {
      users[existingIdx] = user;
    } else {
      users.push(user);
    }
    this.db.users = users;
    this.saveToDisk();
    return user;
  }

  // --- Schemes Operations ---
  public getSchemes(): Scheme[] {
    return this.db.schemes || [];
  }

  public getSchemeById(id: string): Scheme | undefined {
    return this.getSchemes().find(s => s.id === id);
  }

  public saveScheme(scheme: Scheme): Scheme {
    const schemes = this.getSchemes();
    const existingIdx = schemes.findIndex(s => s.id === scheme.id);
    if (existingIdx >= 0) {
      schemes[existingIdx] = scheme;
    } else {
      schemes.push(scheme);
    }
    this.db.schemes = schemes;
    this.saveToDisk();
    return scheme;
  }

  public deleteScheme(id: string): boolean {
    const schemes = this.getSchemes();
    const newSchemes = schemes.filter(s => s.id !== id);
    if (newSchemes.length === schemes.length) return false;
    this.db.schemes = newSchemes;
    this.saveToDisk();
    return true;
  }

  // --- Applications Operations ---
  public getApplications(): Application[] {
    return this.db.applications || [];
  }

  public saveApplication(app: Application): Application {
    const apps = this.getApplications();
    const existingIdx = apps.findIndex(a => a.id === app.id);
    if (existingIdx >= 0) {
      apps[existingIdx] = app;
    } else {
      apps.push(app);
    }
    this.db.applications = apps;
    this.saveToDisk();
    return app;
  }

  // --- Notifications Operations ---
  public getNotifications(): Notification[] {
    return this.db.notifications || [];
  }

  public saveNotification(notification: Notification): Notification {
    const notifications = this.getNotifications();
    const existingIdx = notifications.findIndex(n => n.id === notification.id);
    if (existingIdx >= 0) {
      notifications[existingIdx] = notification;
    } else {
      notifications.push(notification);
    }
    this.db.notifications = notifications;
    this.saveToDisk();
    return notification;
  }

  // --- Documents Operations ---
  public getDocuments(): UserDocument[] {
    return this.db.documents || [];
  }

  public saveDocument(doc: UserDocument): UserDocument {
    const docs = this.getDocuments();
    const existingIdx = docs.findIndex(d => d.id === doc.id);
    if (existingIdx >= 0) {
      docs[existingIdx] = doc;
    } else {
      docs.push(doc);
    }
    this.db.documents = docs;
    this.saveToDisk();
    return doc;
  }
}
