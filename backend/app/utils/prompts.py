"""Agent prompts for the SEM Manager pipeline."""

LANDING_PAGE_ANALYSIS_PROMPT = """
You are a brand research specialist. Analyze the following website content from multiple landing pages and extract a unified brand analysis for SEM campaign planning.

Landing Page Content:
{content}

Extract and return a JSON object with:
{{
    "brand_name": "The company/brand name",
    "brand_voice": "Description of the brand's tone and voice",
    "value_propositions": ["List of 3-5 key value propositions"],
    "products_services": ["List of main products or services offered"],
    "target_audience": "Description of the target audience based on messaging",
    "key_messages": ["List of 3-5 key marketing messages found across pages"],
    "unique_selling_points": ["List of 3-5 differentiators and USPs"],
    "call_to_actions": ["List of CTAs used across the pages"],
    "industry": "The industry or sector this brand operates in",
    "pricing_model": "Pricing approach if mentioned",
    "geographic_focus": "Geographic markets mentioned or implied",
    "seed_keywords": ["10-15 seed keywords extracted from the content that describe what this business does"]
}}

Focus on information useful for creating compelling paid search campaigns. Be thorough but concise.
"""

COMPETITOR_ANALYSIS_PROMPT = """
You are a competitive intelligence analyst for paid search campaigns.

Our Brand Context:
{our_brand}

Competitor Website Content:
{content}

Analyze the competitor and return a JSON object with:
{{
    "brand_name": "Competitor brand name",
    "positioning": "How they position themselves in the market",
    "key_messages": ["Their 3-5 main marketing messages"],
    "strengths": ["Their 3-5 apparent strengths"],
    "weaknesses": ["Their 3-5 apparent weaknesses or gaps"],
    "pricing_approach": "Their pricing strategy if visible",
    "unique_features": ["Features or benefits they emphasize"],
    "cta_approach": "Their call-to-action strategy",
    "ad_copy_angles": ["Messaging angles they likely use in ads"]
}}

Focus on insights that can help differentiate our brand in paid search ads.
"""

COMPETITOR_DISCOVERY_PROMPT = """
You are a competitive intelligence analyst. Based on the following brand analysis, identify likely competitors.

Brand Analysis:
{brand_analysis}

Return a JSON object with:
{{
    "likely_competitors": [
        {{
            "name": "Competitor name",
            "url": "Their website URL",
            "reasoning": "Why they are a competitor"
        }}
    ]
}}

List 3-5 likely competitors with their website URLs. Focus on direct competitors in the same market.
"""

PERSONA_RESEARCH_PROMPT = """
You are a market research specialist creating audience personas for paid search campaigns.

Brand Name: {brand_name}
Industry: {industry}
Products/Services: {products_services}
Initial Audience Description: {initial_audience}
Target Market: {market}

Multi-Platform Research:
{research_content}

Create detailed target audience personas as JSON:
{{
    "personas": [
        {{
            "name": "Persona name (e.g., 'Budget-Conscious Sarah')",
            "age_range": "e.g., 28-35",
            "occupation": "Typical occupation",
            "description": "2-3 sentence persona story",
            "goals": ["What they want to achieve"],
            "frustrations": ["What annoys or blocks them"],
            "search_behavior": ["Types of searches they perform"],
            "purchase_triggers": ["Events or situations that trigger a purchase"],
            "preferred_messaging": "What kind of ad messaging resonates with them",
            "sample_search_queries": ["5-7 actual search queries this persona might type"]
        }}
    ],
    "audience_insights": {{
        "primary_motivations": ["Top 3-5 purchase motivations"],
        "common_objections": ["Top 3-5 purchase objections"],
        "emotional_triggers": ["3-5 emotional triggers"],
        "decision_factors": ["What factors drive the final purchase decision"]
    }}
}}

Create 3-5 distinct personas. Use the actual language consumers use based on the research. Focus on insights that directly inform ad targeting and messaging.
"""

KEYWORD_CLUSTERING_PROMPT = """
You are a paid search keyword strategist. Organize the following keywords into themed clusters for ad group creation.

Keywords with data:
{keyword_data}

Brand Context:
{brand_context}

Market: {market}
Currency: {currency}

Organize keywords into clusters and return JSON:
{{
    "clusters": [
        {{
            "cluster_name": "Descriptive cluster name (suitable as ad group name)",
            "theme": "Brief description of the search intent theme",
            "keywords": [
                {{
                    "keyword": "the keyword",
                    "search_volume": 1000,
                    "cpc": 2.50,
                    "recommended_match_type": "broad|phrase|exact",
                    "intent": "informational|commercial|transactional|navigational"
                }}
            ]
        }}
    ],
    "negative_keywords": ["Keywords to exclude from campaigns"],
    "keyword_gaps": ["Keyword opportunities not yet covered"]
}}

Group by search intent and theme. Prioritize commercial and transactional keywords. Each cluster should be a viable ad group with 5-15 keywords.
"""

SYNTHESIS_PROMPT = """
You are a senior marketing strategist synthesizing comprehensive research for a paid search campaign.

Brand Research:
{brand}

Competitor Research:
{competitors}

Persona Research:
{personas}

Keyword Research:
{keywords}

Market: {market}

Synthesize all findings into a comprehensive summary as JSON:
{{
    "executive_summary": "3-4 paragraph summary of key findings and recommended approach",
    "key_insights": ["7-10 most important actionable insights"],
    "competitive_positioning": "How to position against competitors in paid search",
    "messaging_framework": {{
        "primary_message": "The core message for the campaign",
        "supporting_messages": ["3-5 supporting messages"],
        "proof_points": ["Evidence and trust signals to use"],
        "tone_guidelines": "Specific tone and voice guidelines for ad copy"
    }},
    "audience_priority": [
        {{
            "persona": "Persona name",
            "priority": "high|medium|low",
            "recommended_approach": "How to reach this persona"
        }}
    ],
    "keyword_strategy": {{
        "focus_themes": ["Top 3-5 keyword themes to prioritize"],
        "budget_allocation": "How to distribute budget across themes",
        "match_type_strategy": "Recommended match type approach"
    }}
}}
"""

STRATEGY_PROMPT = """
You are an expert paid search strategist. Create a detailed Google Ads campaign strategy.

Research Synthesis:
{synthesis}

Keyword Clusters:
{keyword_clusters}

Personas:
{personas}

Market: {market}
Currency: {currency}

Create a detailed paid search strategy as JSON:
{{
    "campaign_name": "Recommended campaign name",
    "objective": "Campaign objective",
    "budget_recommendation": "Recommended daily/monthly budget with reasoning",
    "bidding_strategy": "Recommended bidding strategy (e.g., Target CPA, Maximize Conversions)",
    "ad_groups": [
        {{
            "name": "Ad group name",
            "theme": "Ad group theme/intent",
            "keywords": ["keyword1", "keyword2"],
            "match_types": {{"keyword1": "phrase", "keyword2": "exact"}},
            "target_persona": "Which persona this targets",
            "messaging_angle": "What messaging angle to use",
            "priority": "high|medium|low",
            "suggested_bid": 2.50
        }}
    ],
    "negative_keywords": ["List of negative keywords"],
    "targeting_notes": "Additional targeting recommendations",
    "optimization_tips": ["5-7 tips for campaign optimization"],
    "kpis": ["Key metrics to track"]
}}

Create 3-8 ad groups. Each should have a clear theme, target persona, and messaging angle. Prioritize by expected ROI.
"""

RSA_GENERATION_PROMPT = """
You are an elite Google Ads copywriter. Write HIGH-CONVERTING RSA headlines and descriptions.

=== CONTEXT ===
Ad Group: {ad_group_name}
Theme: {ad_group_theme}
Target Keywords: {keywords}
Target Persona: {target_persona}
Messaging Angle: {messaging_angle}
Brand Voice: {brand_voice}
Value Props: {value_props}
CTAs: {ctas}

Strategy Context:
{strategy_context}

=== CRITICAL RULES ===

**HEADLINES: Max 30 characters. MUST be COMPLETE thoughts.**
**DESCRIPTIONS: Max 90 characters. MUST be COMPLETE sentences.**

=== HEADLINE FORMULAS ===

1. [Benefit] + [Timeframe]: "Clean Office Tomorrow"
2. [Credential]: "NEA Licensed Cleaners"
3. [Number] + [Proof]: "500+ Happy Clients"
4. [Action] + [Benefit]: "Get Spotless Offices"
5. [Service] + [Location]: "Office Cleaning in SG"
6. [Differentiator]: "Same-Day Availability"
7. [Offer]: "First Clean 20% Off"
8. [Question Hook]: "Need Office Cleaning?"
9. [Command CTA]: "Request Free Quote"
10. [Trust Signal]: "Insured & Bonded Team"

NEVER write incomplete headlines like:
- "Singapore's Leading" (leading WHAT?)
- "Professional Cleaning:" (ends with colon)
- "Your Trusted Partner For" (cut off)

=== DESCRIPTION RULES ===

1-2 SHORT sentences that expand on value and include a CTA.

=== OUTPUT FORMAT ===

Return JSON with EXACTLY 15 headlines and 4 descriptions:
{{
    "headlines": [
        {{"text": "Headline here"}},
        ... (15 total, each <= 30 chars)
    ],
    "descriptions": [
        {{"text": "Description here"}},
        ... (4 total, each <= 90 chars)
    ]
}}

Before outputting, verify EACH headline:
- Is it 30 characters or less?
- Is it a COMPLETE thought?
- Does it NOT end with "the", "a", "in", "for", "and", "of", "to", "with"?
- Does it NOT end with a colon or ellipsis?

Write copy that SELLS. Be specific, be punchy, be complete.
"""
