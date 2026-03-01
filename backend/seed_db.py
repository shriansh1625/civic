"""
CivicLens AI — Seed Database Script (v2 — Demo-Optimized)
Drops and recreates tables, populates 35 realistic schemes,
crawl sources, updates, and alerts for a polished demo.
"""

import asyncio
import sys
import os
import random
from datetime import datetime, timedelta

# Fix Windows console encoding for emoji/unicode characters
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import engine, async_session, Base
from app.core.security import hash_password
from app.models.user import User, UserPreference
from app.models.scheme import Scheme, CrawlSource, Update
from app.models.alert import Alert


async def seed():
    """Drop all, recreate, and seed with rich demo data."""

    # ── Drop & Recreate ──────────────────────────────
    async with engine.begin() as conn:
        from app.models import user, scheme, alert, subscription  # noqa — register models
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    print("[OK] Tables recreated")

    async with async_session() as db:

        # ════════════════════════════════════════════════
        # 1. USERS (5 demo accounts)
        # ════════════════════════════════════════════════
        users = [
            User(email="admin@civiclens.ai", hashed_password=hash_password("demo123"),
                 full_name="Admin User", user_type="citizen", state="Delhi", is_admin=True),
            User(email="student@civiclens.ai", hashed_password=hash_password("demo123"),
                 full_name="Priya Sharma", user_type="student", state="Maharashtra"),
            User(email="farmer@civiclens.ai", hashed_password=hash_password("demo123"),
                 full_name="Rajesh Patel", user_type="farmer", state="Gujarat"),
            User(email="startup@civiclens.ai", hashed_password=hash_password("demo123"),
                 full_name="Ankit Verma", user_type="startup", state="Karnataka"),
            User(email="msme@civiclens.ai", hashed_password=hash_password("demo123"),
                 full_name="Sunita Devi", user_type="msme", state="Uttar Pradesh"),
        ]
        db.add_all(users)
        await db.flush()
        print(f"[OK] {len(users)} users created (password: demo123)")

        # Preferences
        pref_map = {
            1: ["welfare", "health", "education"],
            2: ["education", "technology", "employment"],
            3: ["agriculture", "welfare", "health"],
            4: ["startup", "business", "technology"],
            5: ["business", "technology", "employment"],
        }
        for uid, cats in pref_map.items():
            for c in cats:
                db.add(UserPreference(user_id=uid, category=c, keywords=""))
        await db.flush()

        # ════════════════════════════════════════════════
        # 2. SCHEMES (35 realistic records)
        # ════════════════════════════════════════════════
        now = datetime.utcnow()
        schemes_data = [
            # ── Agriculture (6) ──
            dict(title="PM-KISAN Samman Nidhi Yojana", ministry="Ministry of Agriculture & Farmers Welfare",
                 category="agriculture", target_audience="farmer", budget_allocated=60000, state="All India",
                 description="Direct income support of ₹6,000 per year to all landholding farmer families across India, transferred in three equal installments of ₹2,000 via Direct Benefit Transfer.",
                 eligibility="All landholding farmer families with cultivable land. Excludes institutional landholders, income tax payers, and constitutional post holders.",
                 benefits="₹6,000/year in 3 installments of ₹2,000 directly to bank accounts via DBT. Over 11 crore farmers covered.",
                 documents_required="Aadhaar card, Land records/khasra-khatauni, Bank account details, Mobile number",
                 deadline="Ongoing", source_url="https://pmkisan.gov.in/",
                 ai_summary="PM-KISAN provides ₹6,000/year income support to 11+ crore farmer families in three installments via DBT.",
                 published_date=now - timedelta(days=180)),

            dict(title="Pradhan Mantri Fasal Bima Yojana", ministry="Ministry of Agriculture & Farmers Welfare",
                 category="agriculture", target_audience="farmer", budget_allocated=16000, state="All India",
                 description="Comprehensive crop insurance scheme covering all food, oilseed, and horticultural crops against natural calamities, pests, and diseases.",
                 eligibility="All farmers including sharecroppers and tenant farmers growing notified crops. Both loanee and non-loanee farmers eligible.",
                 benefits="Premium: 2% Kharif, 1.5% Rabi, 5% Commercial/Horticultural. Full sum insured coverage with no cap on government subsidy.",
                 documents_required="Land records, Sowing certificate, Bank account, Aadhaar, Premium payment receipt",
                 deadline="Season-based (Kharif: July, Rabi: December)", source_url="https://pmfby.gov.in/",
                 ai_summary="PMFBY provides affordable crop insurance with premium of just 2% for Kharif and 1.5% for Rabi crops with full sum insured coverage.",
                 published_date=now - timedelta(days=120)),

            dict(title="PM Kisan Maandhan Yojana", ministry="Ministry of Agriculture & Farmers Welfare",
                 category="agriculture", target_audience="farmer", budget_allocated=900, state="All India",
                 description="Pension scheme for small and marginal farmers providing ₹3,000/month pension after age 60.",
                 eligibility="Small and marginal farmers aged 18-40 with cultivable land up to 2 hectares.",
                 benefits="₹3,000/month pension after age 60. Government matches farmer's monthly contribution.",
                 documents_required="Aadhaar, Bank account, Land records, Age proof",
                 deadline="Ongoing", source_url="https://maandhan.in/",
                 ai_summary="Pension scheme for small farmers: ₹3,000/month after age 60 with government-matched contributions.",
                 published_date=now - timedelta(days=90)),

            dict(title="Soil Health Card Scheme", ministry="Ministry of Agriculture & Farmers Welfare",
                 category="agriculture", target_audience="farmer", budget_allocated=568, state="All India",
                 description="Provides soil health cards to farmers with crop-wise nutrient recommendations to improve productivity and reduce input costs.",
                 eligibility="All farmers across India. Soil testing conducted at government laboratories.",
                 benefits="Free soil testing, Crop-wise fertilizer recommendations, Improved yield by 10-15%, Reduced input costs.",
                 documents_required="Land ownership proof, Aadhaar card",
                 deadline="Ongoing", source_url="https://soilhealth.dac.gov.in/",
                 ai_summary="Free soil health cards with nutrient recommendations helping farmers improve yields by 10-15%.",
                 published_date=now - timedelta(days=200)),

            dict(title="e-NAM (National Agriculture Market)", ministry="Ministry of Agriculture & Farmers Welfare",
                 category="agriculture", target_audience="farmer", budget_allocated=1500, state="All India",
                 description="Pan-India electronic trading portal linking 1,000+ APMC mandis for transparent price discovery and online trading of agricultural commodities.",
                 eligibility="All farmers, traders, and commission agents registered with APMCs.",
                 benefits="Better price discovery, Reduced intermediaries, Online payment, Quality testing at mandis.",
                 documents_required="APMC registration, Bank account, PAN card, Mobile number",
                 deadline="Ongoing", source_url="https://enam.gov.in/",
                 ai_summary="e-NAM connects 1,000+ mandis for transparent agri-commodity trading with better price discovery.",
                 published_date=now - timedelta(days=150)),

            dict(title="Namo Drone Didi Scheme", ministry="Ministry of Agriculture & Farmers Welfare",
                 category="agriculture", target_audience="farmer", budget_allocated=1261, state="All India",
                 description="Provides drones to 15,000 Women SHGs for agricultural services like pesticide spraying, nutrient management, and crop monitoring.",
                 eligibility="Women Self Help Groups with at least 10 members. SHG members will be trained as drone pilots.",
                 benefits="Free drone supply, Training as drone pilot, Income up to ₹1 lakh/year from drone services.",
                 documents_required="SHG registration, Member Aadhaar cards, Bank account details",
                 deadline="31-March-2026", source_url="https://agriculture.gov.in/",
                 ai_summary="Drones for 15,000 Women SHGs with drone pilot training; income potential ₹1 lakh/year from agri-services.",
                 published_date=now - timedelta(days=30)),

            # ── Startup & Business (6) ──
            dict(title="Startup India Seed Fund Scheme", ministry="Ministry of Commerce & Industry",
                 category="startup", target_audience="startup", budget_allocated=945, state="All India",
                 description="Financial assistance up to ₹50 lakh for DPIIT-recognized startups for proof of concept, prototype development, product trials, and market entry.",
                 eligibility="DPIIT-recognized startups incorporated ≤2 years ago, not received >₹10 lakh support previously.",
                 benefits="Up to ₹20 lakh grant for validation, up to ₹50 lakh for market-entry via convertible debentures.",
                 documents_required="DPIIT recognition certificate, Business plan, Incorporation certificate, PAN, Bank details, Pitch deck",
                 deadline="31-March-2026", source_url="https://seedfund.startupindia.gov.in/",
                 ai_summary="Up to ₹50 lakh for DPIIT startups: ₹20L grant for validation + ₹50L for market entry. ₹945 crore total corpus.",
                 published_date=now - timedelta(days=60)),

            dict(title="Fund of Funds for Startups (FFS)", ministry="Ministry of Commerce & Industry",
                 category="startup", target_audience="startup", budget_allocated=10000, state="All India",
                 description="₹10,000 crore Fund of Funds managed by SIDBI, investing in SEBI-registered AIFs that in turn invest in startups.",
                 eligibility="DPIIT-recognized startups at any stage. Investment routed through empanelled AIFs.",
                 benefits="Equity funding access, No direct government equity, Market-rate returns, Extended runway.",
                 documents_required="DPIIT recognition, Pitch deck, Financial projections, Cap table",
                 deadline="Ongoing", source_url="https://www.startupindia.gov.in/",
                 ai_summary="₹10,000 crore Fund of Funds via SIDBI investing through AIFs into startups at all stages.",
                 published_date=now - timedelta(days=100)),

            dict(title="MUDRA Yojana (Pradhan Mantri MUDRA)", ministry="Ministry of Finance",
                 category="business", target_audience="msme", budget_allocated=15000, state="All India",
                 description="Collateral-free loans up to ₹10 lakh for non-corporate, non-farm micro and small enterprises through banks, NBFCs, and MFIs.",
                 eligibility="Any Indian citizen with a business plan for non-farm income-generating activity. No collateral needed.",
                 benefits="Shishu: up to ₹50,000 | Kishore: ₹50K-₹5L | Tarun: ₹5L-₹10L. Subsidized interest rates.",
                 documents_required="Identity proof, Address proof, Business plan, Quotation of machinery, Passport photo",
                 deadline="Ongoing", source_url="https://www.mudra.org.in/",
                 ai_summary="MUDRA: Collateral-free loans up to ₹10 lakh in 3 tiers for micro enterprises through any bank.",
                 published_date=now - timedelta(days=140)),

            dict(title="Credit Guarantee Fund Trust (CGTMSE)", ministry="Ministry of MSME",
                 category="business", target_audience="msme", budget_allocated=7500, state="All India",
                 description="Collateral-free credit up to ₹5 crore for MSMEs with guarantee coverage up to 85% of the sanctioned amount.",
                 eligibility="New and existing micro and small enterprises in manufacturing and service sectors.",
                 benefits="Collateral-free loans up to ₹5 crore, 85% guarantee coverage, Reduced borrowing cost.",
                 documents_required="Business registration, GST certificate, Financial statements, Bank statements, PAN",
                 deadline="Ongoing", source_url="https://www.cgtmse.in/",
                 ai_summary="Collateral-free credit up to ₹5 crore for MSMEs with 85% government guarantee coverage.",
                 published_date=now - timedelta(days=80)),

            dict(title="MSME Champions Scheme", ministry="Ministry of MSME",
                 category="business", target_audience="msme", budget_allocated=3200, state="All India",
                 description="Unified scheme covering MSME Technology Upgradation, Competitiveness, and Quality Certification support.",
                 eligibility="Registered MSMEs under Udyam Registration portal.",
                 benefits="Technology upgrade subsidy up to 25%, ISO certification reimbursement, Market development assistance.",
                 documents_required="Udyam Registration, GST certificate, Project report, Quotations",
                 deadline="31-December-2026", source_url="https://champions.gov.in/",
                 ai_summary="Technology upgrade subsidies (25%), ISO reimbursement, and market development for registered MSMEs.",
                 published_date=now - timedelta(days=45)),

            dict(title="Atal Innovation Mission (AIM)", ministry="NITI Aayog",
                 category="startup", target_audience="startup", budget_allocated=2000, state="All India",
                 description="Promotes innovation with Atal Tinkering Labs in schools, Atal Incubation Centres, and Atal New India Challenges to solve sectoral problems.",
                 eligibility="Schools (ATL), Universities/organizations (AIC), Startups/innovators (ANIC).",
                 benefits="ATL: ₹20 lakh grant per school. AIC: ₹10 crore over 5 years. ANIC: Up to ₹1 crore per innovation.",
                 documents_required="Institution registration, Project proposal, Innovation description",
                 deadline="Ongoing", source_url="https://aim.gov.in/",
                 ai_summary="Atal Innovation Mission: ₹20L for school labs, ₹10Cr for incubators, ₹1Cr for innovation challenges.",
                 published_date=now - timedelta(days=110)),

            # ── Education & Scholarships (6) ──
            dict(title="National Scholarship Portal (NSP)", ministry="Ministry of Education",
                 category="education", target_audience="student", budget_allocated=7500, state="All India",
                 description="One-stop digital platform for 125+ scholarship schemes for students from Class 1 to PhD, covering central and state government scholarships.",
                 eligibility="Students enrolled in recognized institutions. Various criteria: income, merit, category, minority status.",
                 benefits="₹1,000 to ₹2,00,000 per annum depending on scheme, level of education, and category. Directly to bank account.",
                 documents_required="Aadhaar, Income certificate, Institution verification letter, Marksheets, Bank account, Caste certificate (if applicable)",
                 deadline="31-October-2026", source_url="https://scholarships.gov.in/",
                 ai_summary="125+ scholarships from ₹1,000 to ₹2 lakh/year for students Class 1 to PhD on a single portal.",
                 published_date=now - timedelta(days=50)),

            dict(title="PM Vidyalaxmi Scheme", ministry="Ministry of Education",
                 category="education", target_audience="student", budget_allocated=3600, state="All India",
                 description="Education loans with interest subsidy for students from economically weaker sections pursuing higher education in top institutions.",
                 eligibility="Students admitted to QS-ranked institutions, family income ≤₹8 lakh/year for full interest subsidy.",
                 benefits="Collateral-free education loans up to ₹10 lakh, 100% interest subsidy for EWS, 75% for LIG.",
                 documents_required="Admission letter, Income certificate, Aadhaar, Bank details, Academic records",
                 deadline="Academic year 2026-27", source_url="https://vidyalaxmi.co.in/",
                 ai_summary="Education loans up to ₹10 lakh with 100% interest subsidy for EWS students in top institutions.",
                 published_date=now - timedelta(days=15)),

            dict(title="INSPIRE Scholarship (DST)", ministry="Ministry of Science & Technology",
                 category="education", target_audience="student", budget_allocated=1250, state="All India",
                 description="Scholarship for Higher Education (SHE) provides ₹80,000/year to top 1% performers in Class 12 pursuing natural science courses.",
                 eligibility="Students in top 1% of Class 12 board exam, pursuing B.Sc/B.S/Int M.Sc in natural sciences.",
                 benefits="₹80,000/year scholarship + ₹20,000 summer research project mentorship for 5 years.",
                 documents_required="Class 12 marksheet, Aadhaar, Admission letter to science course, Bank account",
                 deadline="31-October-2026", source_url="https://online-inspire.gov.in/",
                 ai_summary="₹80,000/year + ₹20,000 research grant for top 1% science students pursuing B.Sc/Int M.Sc.",
                 published_date=now - timedelta(days=40)),

            dict(title="PM Research Fellowship (PMRF)", ministry="Ministry of Education",
                 category="education", target_audience="student", budget_allocated=1650, state="All India",
                 description="Fellowship for doctoral research at IITs, IISc, IISERs, and top NITs with enhanced stipend and research grant.",
                 eligibility="GATE/GPAT/NET qualified candidates, or B.Tech from top institutions with CGPA ≥8.0.",
                 benefits="₹70,000-₹80,000/month stipend + ₹2 lakh/year research grant for 5 years. Total value: ₹50+ lakh.",
                 documents_required="GATE/NET scorecard, B.Tech degree, Research proposal, Recommendation letters",
                 deadline="31-May-2026", source_url="https://pmrf.in/",
                 ai_summary="₹70K-80K/month fellowship + ₹2L/year research grant for PhD at IITs/IISc. Total value ₹50L+.",
                 published_date=now - timedelta(days=25)),

            dict(title="Pragati & Saksham Scholarship (AICTE)", ministry="Ministry of Education",
                 category="education", target_audience="student", budget_allocated=500, state="All India",
                 description="Pragati for girls, Saksham for differently-abled students pursuing technical education. ₹50,000/year each.",
                 eligibility="Girls (Pragati) or differently-abled (Saksham) students in AICTE-approved institutions, family income ≤₹8 lakh.",
                 benefits="₹50,000/year tuition fee waiver + ₹2,000/month for incidentals = ₹74,000/year total.",
                 documents_required="AICTE institution admission, Income certificate, Disability certificate (Saksham), Aadhaar",
                 deadline="31-December-2026", source_url="https://www.aicte-pragati-saksham-gov.in/",
                 ai_summary="₹74,000/year for girls (Pragati) and differently-abled (Saksham) in AICTE technical courses.",
                 published_date=now - timedelta(days=55)),

            dict(title="Ishan Uday Scholarship (NER)", ministry="Ministry of Education",
                 category="education", target_audience="student", budget_allocated=220, state="North East India",
                 description="Special area scholarship for students from North Eastern states pursuing higher education.",
                 eligibility="Domicile of NE states, family income ≤₹4.5 lakh, pursuing UG/PG in recognized institutions.",
                 benefits="₹5,400/month (general) to ₹7,800/month (professional) for the course duration.",
                 documents_required="Domicile certificate, Income certificate, Admission letter, Aadhaar, Bank details",
                 deadline="31-November-2026", source_url="https://scholarships.gov.in/",
                 ai_summary="₹5,400-7,800/month scholarship for NE state students pursuing higher education across India.",
                 published_date=now - timedelta(days=70)),

            # ── Health (5) ──
            dict(title="Ayushman Bharat PM-JAY", ministry="Ministry of Health & Family Welfare",
                 category="health", target_audience="citizen", budget_allocated=7200, state="All India",
                 description="World's largest health insurance scheme providing cashless coverage of ₹5 lakh per family per year for 1,949 medical procedures at empanelled hospitals.",
                 eligibility="10.74 crore poor families identified via SECC 2011 — rural deprivation and urban occupational criteria.",
                 benefits="₹5 lakh/family/year, Cashless & paperless at 28,000+ hospitals, No cap on family size or age, Pre & post hospitalization covered.",
                 documents_required="Aadhaar card, Ration card, SECC data verification, ABHA Health ID",
                 deadline="Ongoing", source_url="https://pmjay.gov.in/",
                 ai_summary="₹5 lakh/year health insurance for 10.74 crore families — cashless at 28,000+ hospitals, 1,949 procedures covered.",
                 published_date=now - timedelta(days=160)),

            dict(title="Ayushman Bharat Health Account (ABHA)", ministry="Ministry of Health & Family Welfare",
                 category="health", target_audience="citizen", budget_allocated=1600, state="All India",
                 description="Digital health ID for every Indian citizen to maintain lifelong health records accessible across healthcare providers.",
                 eligibility="All Indian citizens with Aadhaar or Driving License.",
                 benefits="14-digit health ID, Digital health records, Interoperable across hospitals, Integration with PM-JAY.",
                 documents_required="Aadhaar card or Driving License, Mobile number",
                 deadline="Ongoing", source_url="https://healthid.ndhm.gov.in/",
                 ai_summary="Free digital health ID (ABHA) for lifelong portable health records accessible across all hospitals.",
                 published_date=now - timedelta(days=130)),

            dict(title="Pradhan Mantri Jan Aushadhi Yojana", ministry="Ministry of Chemicals & Fertilizers",
                 category="health", target_audience="citizen", budget_allocated=350, state="All India",
                 description="Network of 10,000+ Jan Aushadhi Kendras providing quality generic medicines at 50-90% cheaper rates than branded equivalents.",
                 eligibility="All citizens. Medicines available OTC or with prescription at any Jan Aushadhi Kendra.",
                 benefits="50-90% savings on medicines, 1,800+ medicines and 285+ surgical items available, Quality assured by CDSCO.",
                 documents_required="Prescription (for prescription drugs), None for OTC medicines",
                 deadline="Ongoing", source_url="https://janaushadhi.gov.in/",
                 ai_summary="10,000+ Jan Aushadhi stores providing quality generic medicines at 50-90% cheaper than branded drugs.",
                 published_date=now - timedelta(days=100)),

            dict(title="Mission Indradhanush (Immunization)", ministry="Ministry of Health & Family Welfare",
                 category="health", target_audience="citizen", budget_allocated=3800, state="All India",
                 description="Intensified immunization drive targeting unvaccinated and partially vaccinated children and pregnant women in 652 districts.",
                 eligibility="Children aged 0-5 years and pregnant women in identified districts.",
                 benefits="Free vaccination against 12 diseases: BCG, OPV, Hepatitis B, Pentavalent, Rotavirus, PCV, MR, JE, DPT booster, TT.",
                 documents_required="Child's birth certificate, Mother's Aadhaar, Immunization card",
                 deadline="Ongoing", source_url="https://www.nhm.gov.in/",
                 ai_summary="Free immunization against 12 diseases for children 0-5 years across 652 priority districts.",
                 published_date=now - timedelta(days=85)),

            dict(title="PM Surya Ghar: Muft Bijli Yojana", ministry="Ministry of New & Renewable Energy",
                 category="welfare", target_audience="citizen", budget_allocated=75021, state="All India",
                 description="Rooftop solar for 1 crore households providing 300 units free electricity per month with central subsidy up to ₹78,000.",
                 eligibility="Residential households with suitable rooftop. Grid-connected metered consumers of DISCOMs.",
                 benefits="Subsidy: ₹30,000 for 1kW, ₹60,000 for 2kW, ₹78,000 for 3kW+. Save ₹15,000-25,000/year on bills.",
                 documents_required="Electricity bill, Aadhaar, Bank account, Rooftop photo, DISCOM consumer number",
                 deadline="31-March-2027", source_url="https://pmsuryaghar.gov.in/",
                 ai_summary="Rooftop solar subsidy up to ₹78,000 for households — 300 units free electricity/month, ₹25K annual savings.",
                 published_date=now - timedelta(days=10)),

            # ── Welfare & Housing (4) ──
            dict(title="PM Awas Yojana - Urban 2.0", ministry="Ministry of Housing & Urban Affairs",
                 category="housing", target_audience="citizen", budget_allocated=48000, state="All India",
                 description="Affordable housing for urban poor targeting 1 crore additional houses with interest subsidy on home loans and direct construction assistance.",
                 eligibility="EWS (≤₹3L income), LIG (₹3-6L), MIG-I (₹6-12L), MIG-II (₹12-18L). Must not own pucca house.",
                 benefits="Interest subsidy 3-6.5% on home loans, Direct beneficiary assistance up to ₹2.5 lakh.",
                 documents_required="Aadhaar, Income certificate, No-property certificate, Bank details, Land documents",
                 deadline="31-December-2026", source_url="https://pmaymis.gov.in/",
                 ai_summary="Urban housing: 3-6.5% interest subsidy on home loans + ₹2.5L assistance for EWS/LIG families.",
                 published_date=now - timedelta(days=65)),

            dict(title="PM Awas Yojana - Gramin", ministry="Ministry of Rural Development",
                 category="housing", target_audience="citizen", budget_allocated=54000, state="All India",
                 description="Pucca houses with basic amenities for rural homeless and those living in kutcha/dilapidated houses.",
                 eligibility="Houseless or living in houses with kutcha roof/wall. Identified from SECC 2011 data.",
                 benefits="₹1.20 lakh (plain areas) / ₹1.30 lakh (hilly/difficult areas) + MGNREGA 90 person-days.",
                 documents_required="SECC identification, Aadhaar, Bank account, Land ownership document",
                 deadline="Ongoing", source_url="https://pmayg.nic.in/",
                 ai_summary="₹1.20-1.30 lakh for building pucca houses in rural areas with MGNREGA 90-day wage support.",
                 published_date=now - timedelta(days=130)),

            dict(title="PM Vishwakarma Yojana", ministry="Ministry of MSME",
                 category="welfare", target_audience="citizen", budget_allocated=13000, state="All India",
                 description="End-to-end support for traditional artisans and craftspeople through recognition, training, toolkit, credit, and marketing support across 18 trades.",
                 eligibility="Traditional artisans/craftspeople in 18 trades: carpenter, blacksmith, goldsmith, potter, sculptor, etc.",
                 benefits="₹15,000 toolkit grant, ₹1-3 lakh collateral-free loan at 5%, Skill training with ₹500/day stipend, PM Vishwakarma certificate.",
                 documents_required="Aadhaar, Trade verification by Gram Panchayat, Bank account, Mobile number",
                 deadline="Ongoing", source_url="https://pmvishwakarma.gov.in/",
                 ai_summary="₹15,000 toolkit + ₹3L loan at 5% + skill training for traditional artisans in 18 trades.",
                 published_date=now - timedelta(days=20)),

            dict(title="MGNREGA (Mahatma Gandhi NREGA)", ministry="Ministry of Rural Development",
                 category="welfare", target_audience="citizen", budget_allocated=86000, state="All India",
                 description="Guarantees 100 days of wage employment per year to every rural household willing to do unskilled manual work.",
                 eligibility="Any adult member of a rural household willing to do unskilled manual work. Must have Job Card.",
                 benefits="100 days guaranteed wage employment at ₹267-375/day (state-dependent). Unemployment allowance if work not provided within 15 days.",
                 documents_required="Job Card (free), Aadhaar, Bank account",
                 deadline="Ongoing", source_url="https://nrega.nic.in/",
                 ai_summary="100 days guaranteed rural employment at ₹267-375/day. Unemployment allowance if work not provided.",
                 published_date=now - timedelta(days=200)),

            # ── Technology & Digital (4) ──
            dict(title="Digital India Programme", ministry="Ministry of Electronics & IT",
                 category="technology", target_audience="citizen", budget_allocated=14903, state="All India",
                 description="Transformative programme covering 9 pillars: broadband highways, universal mobile access, public internet, e-Governance, e-Kranti, IT for jobs, early harvest, electronics manufacturing, digital literacy.",
                 eligibility="All citizens, government departments, and organizations. Sub-schemes have specific criteria.",
                 benefits="BharatNet rural broadband, DigiLocker, UMANG app, CSC network, e-Sign, PMGDISHA digital literacy.",
                 documents_required="Varies by specific initiative — generally Aadhaar and mobile number",
                 deadline="Ongoing", source_url="https://www.digitalindia.gov.in/",
                 ai_summary="9-pillar digital transformation: broadband, e-governance, digital literacy, electronics manufacturing.",
                 published_date=now - timedelta(days=170)),

            dict(title="BharatNet Phase-III", ministry="Ministry of Communications",
                 category="technology", target_audience="citizen", budget_allocated=19041, state="All India",
                 description="High-speed optical fiber broadband connectivity to all 6.4 lakh villages. Phase-III extends to underserved habitations via satellite and wireless.",
                 eligibility="All Gram Panchayats and rural habitations.",
                 benefits="Minimum 100 Mbps broadband to every village, Free Wi-Fi at Gram Panchayats, Digital services enablement.",
                 documents_required="Not applicable — infrastructure project",
                 deadline="December 2027", source_url="https://bbnl.nic.in/",
                 ai_summary="100 Mbps broadband to all 6.4 lakh villages via optical fiber, satellite, and wireless.",
                 published_date=now - timedelta(days=50)),

            dict(title="Semiconductor Mission (ISM)", ministry="Ministry of Electronics & IT",
                 category="technology", target_audience="startup", budget_allocated=76000, state="All India",
                 description="India Semiconductor Mission with ₹76,000 crore to establish semiconductor fabs, OSAT, display fabs, and compound semiconductor facilities in India.",
                 eligibility="Companies with semiconductor manufacturing experience, minimum investment thresholds per category.",
                 benefits="50% fiscal support for semiconductor fabs, 50% for display fabs, Design-linked incentive up to 50%.",
                 documents_required="Detailed project report, Technology tie-up proof, Financial commitments",
                 deadline="Ongoing", source_url="https://ism.gov.in/",
                 ai_summary="₹76,000 crore for domestic semiconductor manufacturing — 50% fiscal support for fabs and design.",
                 published_date=now - timedelta(days=95)),

            dict(title="MeitY Startup Hub (MSH)", ministry="Ministry of Electronics & IT",
                 category="startup", target_audience="startup", budget_allocated=500, state="All India",
                 description="Accelerator and innovation hub for tech startups with mentorship, funding access, and government project opportunities.",
                 eligibility="Technology startups registered in India. Focus on AI, IoT, Blockchain, Cybersecurity, etc.",
                 benefits="Mentorship from industry experts, Seed grants up to ₹25 lakh, Government contract access, Office space.",
                 documents_required="Company registration, Product demo, Team details, Technology description",
                 deadline="Rolling applications", source_url="https://meitystartuphub.in/",
                 ai_summary="Tech startup accelerator: ₹25L seed grants, mentorship, government contract access for AI/IoT/Blockchain startups.",
                 published_date=now - timedelta(days=35)),

            # ── Employment & Skill (3) ──
            dict(title="Skill India Mission (PMKVY 4.0)", ministry="Ministry of Skill Development",
                 category="employment", target_audience="citizen", budget_allocated=12000, state="All India",
                 description="Free short-term skill training (150-300 hours) with industry-aligned certification, assessment, and placement assistance across 40+ sectors.",
                 eligibility="Indian citizens aged 15-45. Special focus on school dropouts, women, and marginalized communities.",
                 benefits="Free training + ₹8,000 reward on certification + placement assistance. Training in 600+ job roles.",
                 documents_required="Aadhaar card, Bank account, Educational certificates (if any), Mobile number",
                 deadline="Ongoing", source_url="https://www.skillindia.gov.in/",
                 ai_summary="Free skill training in 600+ job roles with ₹8,000 reward and placement assistance for ages 15-45.",
                 published_date=now - timedelta(days=75)),

            dict(title="PM Internship Scheme", ministry="Ministry of Corporate Affairs",
                 category="employment", target_audience="student", budget_allocated=6000, state="All India",
                 description="12-month internship opportunity at top 500 companies for youth aged 21-24 with monthly assistance of ₹5,000 and one-time grant of ₹6,000.",
                 eligibility="Indian youth aged 21-24 with annual family income ≤₹8 lakh. Must not be employed full-time.",
                 benefits="₹5,000/month assistance for 12 months + ₹6,000 one-time grant = ₹66,000 total. Industry experience certificate.",
                 documents_required="Aadhaar, Income certificate, Educational certificates, Resume, Bank details",
                 deadline="31-August-2026", source_url="https://pminternship.mca.gov.in/",
                 ai_summary="12-month corporate internship: ₹5,000/month + ₹6,000 grant at top 500 companies for youth 21-24.",
                 published_date=now - timedelta(days=12)),

            dict(title="National Apprenticeship Promotion Scheme", ministry="Ministry of Skill Development",
                 category="employment", target_audience="citizen", budget_allocated=1500, state="All India",
                 description="Shares 25% of prescribed stipend (up to ₹1,500/month) with employers to promote apprenticeship training in establishments.",
                 eligibility="Any establishment engaging apprentices under the Apprentices Act. Apprentices aged 14+.",
                 benefits="25% stipend sharing by government (max ₹1,500/month), Basic training support, Certification.",
                 documents_required="Establishment registration on apprenticeship portal, Apprentice Aadhaar, Bank details",
                 deadline="Ongoing", source_url="https://www.apprenticeshipindia.gov.in/",
                 ai_summary="Government shares 25% stipend (up to ₹1,500/month) with employers for apprenticeship training.",
                 published_date=now - timedelta(days=110)),
        ]

        for i, sdata in enumerate(schemes_data):
            s = Scheme(**sdata)
            s.content_hash = f"hash_{i+1:03}"
            s.last_crawled_at = now - timedelta(hours=random.randint(1, 48))
            s.created_at = sdata.get("published_date", now)
            db.add(s)

        await db.flush()
        print(f"[OK] {len(schemes_data)} schemes created")

        # ════════════════════════════════════════════════
        # 3. CRAWL SOURCES (8 realistic sources)
        # ════════════════════════════════════════════════
        sources = [
            CrawlSource(name="MyScheme.gov.in", url="https://www.myscheme.gov.in/", category="welfare",
                        is_active=True, last_crawled_at=now - timedelta(hours=2), last_status="success"),
            CrawlSource(name="India.gov.in Services", url="https://services.india.gov.in/", category="general",
                        is_active=True, last_crawled_at=now - timedelta(hours=4), last_status="success"),
            CrawlSource(name="Startup India Portal", url="https://www.startupindia.gov.in/", category="startup",
                        is_active=True, last_crawled_at=now - timedelta(hours=6), last_status="success"),
            CrawlSource(name="PM India Initiatives", url="https://www.pmindia.gov.in/en/major_initiatives/", category="flagship",
                        is_active=True, last_crawled_at=now - timedelta(hours=3), last_status="success"),
            CrawlSource(name="National Scholarship Portal", url="https://scholarships.gov.in/", category="education",
                        is_active=True, last_crawled_at=now - timedelta(hours=8), last_status="success"),
            CrawlSource(name="MSME Ministry", url="https://msme.gov.in/", category="business",
                        is_active=True, last_crawled_at=now - timedelta(hours=5), last_status="success"),
            CrawlSource(name="Agriculture Ministry", url="https://agricoop.nic.in/", category="agriculture",
                        is_active=True, last_crawled_at=now - timedelta(hours=12), last_status="success"),
            CrawlSource(name="eGazette of India", url="https://egazette.gov.in/", category="gazette",
                        is_active=True, last_crawled_at=now - timedelta(hours=1), last_status="success"),
        ]
        db.add_all(sources)
        await db.flush()
        print(f"[OK] {len(sources)} crawl sources created")

        # ════════════════════════════════════════════════
        # 4. UPDATES (10 realistic news-style updates)
        # ════════════════════════════════════════════════
        updates = [
            Update(title="PM-KISAN 18th Installment Released", scheme_id=1,
                   content="₹2,000 transferred to 9.8 crore eligible farmer families under PM-KISAN 18th installment on 24-Feb-2026.",
                   summary="₹2,000 transferred to 9.8 crore farmers.", source_url="https://pmkisan.gov.in/",
                   category="agriculture", change_type="new", created_at=now - timedelta(hours=3)),
            Update(title="Startup Seed Fund Extended to March 2028", scheme_id=7,
                   content="DPIIT extends Startup India Seed Fund Scheme to March 2028 with additional ₹500 crore allocation.",
                   summary="Seed Fund extended with ₹500Cr additional allocation.", source_url="https://seedfund.startupindia.gov.in/",
                   category="startup", change_type="modified", created_at=now - timedelta(hours=8)),
            Update(title="MUDRA Loan Limit Doubled to ₹20 Lakh", scheme_id=9,
                   content="Union Cabinet approves increase in MUDRA Tarun category from ₹10 lakh to ₹20 lakh for micro enterprises.",
                   summary="MUDRA Tarun doubled to ₹20L.", source_url="https://www.mudra.org.in/",
                   category="business", change_type="modified", created_at=now - timedelta(hours=18)),
            Update(title="NSP 2026-27 Applications Open — 15 New Scholarships", scheme_id=13,
                   content="National Scholarship Portal opens applications for 2026-27 with 15 new post-graduate scholarships added.",
                   summary="NSP opens with 15 new PG scholarships.", source_url="https://scholarships.gov.in/",
                   category="education", change_type="new", created_at=now - timedelta(days=1)),
            Update(title="PM-JAY Adds 200 New Medical Packages", scheme_id=19,
                   content="Ayushman Bharat PM-JAY expands coverage with 200 new medical procedure packages including advanced cardiac and oncology treatments.",
                   summary="PM-JAY adds 200 new procedure packages.", source_url="https://pmjay.gov.in/",
                   category="health", change_type="modified", created_at=now - timedelta(days=1, hours=6)),
            Update(title="PM Surya Ghar Crosses 50 Lakh Registrations", scheme_id=23,
                   content="PM Surya Ghar scheme achieves milestone of 50 lakh household registrations within 6 months of launch.",
                   summary="50L registrations for rooftop solar scheme.", source_url="https://pmsuryaghar.gov.in/",
                   category="welfare", change_type="new", created_at=now - timedelta(days=2)),
            Update(title="Semiconductor Fab Groundbreaking in Gujarat", scheme_id=31,
                   content="India Semiconductor Mission: Tata-PSMC fab groundbreaking at Dholera SIR. Production expected by 2028.",
                   summary="Semiconductor fab construction begins in Gujarat.", source_url="https://ism.gov.in/",
                   category="technology", change_type="new", created_at=now - timedelta(days=3)),
            Update(title="PM Vishwakarma: 50 Lakh Artisans Registered", scheme_id=27,
                   content="PM Vishwakarma Yojana crosses 50 lakh artisan registrations across 18 traditional trades.",
                   summary="50L artisans registered under PM Vishwakarma.", source_url="https://pmvishwakarma.gov.in/",
                   category="welfare", change_type="new", created_at=now - timedelta(days=4)),
            Update(title="PMFBY Claims Disbursed: ₹1.6 Lakh Crore", scheme_id=2,
                   content="Total claims of ₹1.6 lakh crore disbursed to farmers under Pradhan Mantri Fasal Bima Yojana since inception.",
                   summary="₹1.6L crore PMFBY claims disbursed.", source_url="https://pmfby.gov.in/",
                   category="agriculture", change_type="new", created_at=now - timedelta(days=5)),
            Update(title="PM Internship: 1 Lakh Applications in First Week", scheme_id=34,
                   content="PM Internship Scheme receives over 1 lakh applications within first week of portal launch.",
                   summary="1L+ applications for PM Internship in first week.", source_url="https://pminternship.mca.gov.in/",
                   category="employment", change_type="new", created_at=now - timedelta(days=6)),
        ]
        db.add_all(updates)
        await db.flush()
        print(f"[OK] {len(updates)} updates created")

        # ════════════════════════════════════════════════
        # 5. ALERTS (multi-user, varied types & priorities)
        # ════════════════════════════════════════════════
        alerts = [
            # Admin user alerts
            Alert(user_id=1, title="New Scheme: PM Surya Ghar", message="Rooftop solar scheme with ₹78,000 subsidy. 300 units free electricity/month.", alert_type="new_scheme", priority="high", scheme_id=23),
            Alert(user_id=1, title="Deadline in 30 days: Startup Seed Fund", message="Startup India Seed Fund deadline: 31-March-2026. Apply now!", alert_type="deadline_reminder", priority="urgent", scheme_id=7),
            Alert(user_id=1, title="MUDRA Limit Doubled", message="MUDRA Tarun category doubled to ₹20 lakh.", alert_type="update", priority="normal", scheme_id=9),
            Alert(user_id=1, title="System: Crawl Cycle Complete", message="All 8 sources crawled successfully. 3 new schemes discovered.", alert_type="system", priority="low"),
            # Student alerts
            Alert(user_id=2, title="PM Vidyalaxmi: Education Loans", message="New education loan scheme with 100% interest subsidy for EWS students.", alert_type="new_scheme", priority="high", scheme_id=14),
            Alert(user_id=2, title="NSP Deadline: 31-Oct-2026", message="Apply for 125+ scholarships before the deadline.", alert_type="deadline_reminder", priority="high", scheme_id=13),
            Alert(user_id=2, title="PM Internship Scheme", message="12-month internship at top 500 companies with ₹5,000/month.", alert_type="new_scheme", priority="high", scheme_id=34),
            # Farmer alerts
            Alert(user_id=3, title="PM-KISAN 18th Installment", message="₹2,000 credited to your account.", alert_type="new_scheme", priority="high", scheme_id=1),
            Alert(user_id=3, title="Namo Drone Didi", message="Drones for Women SHGs — apply for agricultural drone services.", alert_type="new_scheme", priority="normal", scheme_id=6),
            Alert(user_id=3, title="PMFBY Rabi Season Deadline", message="Enroll for Rabi crop insurance before December.", alert_type="deadline_reminder", priority="high", scheme_id=2),
            # Startup alerts
            Alert(user_id=4, title="Seed Fund Deadline: 31-Mar-2026", message="Only 30 days left to apply for up to ₹50 lakh.", alert_type="deadline_reminder", priority="urgent", scheme_id=7),
            Alert(user_id=4, title="Semiconductor Mission Opportunity", message="₹76,000 crore ISM — apply for design-linked incentives.", alert_type="new_scheme", priority="high", scheme_id=31),
            # MSME alerts
            Alert(user_id=5, title="MUDRA Doubled to ₹20L", message="Tarun category now up to ₹20 lakh collateral-free.", alert_type="update", priority="high", scheme_id=9),
            Alert(user_id=5, title="CGTMSE Up to ₹5 Crore", message="Collateral-free credit guarantee up to ₹5 crore for MSMEs.", alert_type="new_scheme", priority="high", scheme_id=10),
            Alert(user_id=5, title="MSME Champions: Dec 2026", message="Apply for technology upgrade subsidy before deadline.", alert_type="deadline_reminder", priority="normal", scheme_id=11),
        ]
        for a in alerts:
            a.created_at = now - timedelta(hours=random.randint(1, 72))
        db.add_all(alerts)

        await db.commit()
        print(f"[OK] {len(alerts)} alerts created")
        print()
        print("=" * 50)
        print("  Database seeded successfully!")
        print("=" * 50)
        print("Demo accounts (password: demo123):")
        print("  admin@civiclens.ai   - Admin/Citizen")
        print("  student@civiclens.ai - Student")
        print("  farmer@civiclens.ai  - Farmer")
        print("  startup@civiclens.ai - Startup Founder")
        print("  msme@civiclens.ai    - MSME Owner")
        print(f"  Total schemes: {len(schemes_data)}")
        print(f"  Total crawl sources: {len(sources)}")
        print(f"  Total updates: {len(updates)}")
        print(f"  Total alerts: {len(alerts)}")
        print("=" * 50)


if __name__ == "__main__":
    asyncio.run(seed())
