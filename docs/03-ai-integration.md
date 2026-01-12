# AI/LLM Integration

## Wykorzystanie Claude Sonnet

### Wybór Modelu: Claude Sonnet

**Dlaczego Claude Sonnet:**
- Najlepszy balans między ceną a wydajnością
- Doskonała analiza danych
- Długi context window (200K tokens)
- Ethical AI z guardrails
- Świetny w coding tasks

**Model ID:** `claude-sonnet-4-20250514`

## Use Cases dla Claude

### A. Budget Optimization

```python
async def optimize_budget_with_claude(campaign_data: dict) -> dict:
    """
    Wykorzystanie Claude do optymalizacji budżetu
    """
    prompt = f"""
    Jesteś ekspertem od optymalizacji budżetów marketingowych.

    Dane kampanii:
    {json.dumps(campaign_data, indent=2)}

    Zadanie:
    1. Przeanalizuj wydajność każdej kampanii (ROI, ROAS, CPA)
    2. Zidentyfikuj kampanie z najwyższym i najniższym ROI
    3. Zaproponuj realokację budżetu między kampanie
    4. Uwzględnij: seasonality, trendy, competition
    5. Podaj konkretne kwoty do przesunięcia

    Format odpowiedzi: JSON
    """

    response = await claude_client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=4000,
        messages=[{"role": "user", "content": prompt}]
    )

    return json.loads(response.content[0].text)
```

### B. Anomaly Detection & Alerts

```python
async def detect_anomalies_with_claude(metrics_timeseries: pd.DataFrame):
    """
    Detekcja anomalii w metrykach kampanii
    """
    prompt = f"""
    Przeanalizuj poniższe time-series data z kampanii marketingowych:

    {metrics_timeseries.to_markdown()}

    Zidentyfikuj:
    1. Nietypowe spadki/wzrosty wydajności
    2. Możliwe przyczyny (ad fatigue, competition, seasonality)
    3. Czy to wymaga natychmiastowej akcji
    4. Rekomendowane działania
    """

    response = await claude_client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}]
    )

    return response.content[0].text
```

### C. Multi-Platform Performance Analysis

```python
async def cross_platform_analysis(all_platforms_data: dict):
    """
    Analiza wydajności cross-platform
    """
    prompt = f"""
    Masz dane z następujących platform:
    - Google Ads: {all_platforms_data['google']}
    - Meta Ads: {all_platforms_data['meta']}
    - TikTok Ads: {all_platforms_data['tiktok']}

    Przeprowadź analizę comparative:
    1. Która platforma daje najlepszy ROAS?
    2. Gdzie są najniższe CPA?
    3. Które kanały najlepiej się uzupełniają?
    4. Jak powinna wyglądać optimalna alokacja budżetu?
    5. Jakie są quick wins do wdrożenia?

    Odpowiedź w formacie structured markdown.
    """

    response = await claude_client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=5000,
        messages=[{"role": "user", "content": prompt}]
    )

    return response.content[0].text
```

## AI-Powered Features

### Feature 1: Intelligent Budget Allocator
- AI analizuje historical performance
- Proponuje optymalne podziały budżetu
- Uwzględnia external factors (seasonality, competition)
- Real-time adjustments

### Feature 2: Predictive ROI Modeling
- Machine learning models przewidują ROI
- Scenario planning ("what-if" analysis)
- Risk assessment

### Feature 3: Automated Campaign Management
- Auto-pause underperforming campaigns
- Auto-scale winners
- Smart bid adjustments

### Feature 4: Natural Language Queries

```
User: "Które kampanie TikTok mają najlepszy ROAS w ostatnim miesiącu?"
AI: [Queries data] "Top 3 kampanie to: Campaign A (ROAS 4.2), ..."

User: "Zwiększ budget Campaign A o 20%"
AI: [Executes] "Budget increased from $1000 to $1200. Changes live."
```

## Complete BudgetOptimizer Class

```python
import anthropic
import json
from typing import Dict, List

class BudgetOptimizer:
    def __init__(self, api_key: str):
        self.client = anthropic.Anthropic(api_key=api_key)
        self.model = "claude-sonnet-4-20250514"

    async def optimize_budget(
        self,
        campaigns: List[Dict],
        total_budget: float,
        constraints: Dict = None
    ) -> Dict:
        """
        Optimize budget allocation across campaigns using Claude
        """

        # Prepare campaign data for Claude
        campaign_summary = self._summarize_campaigns(campaigns)

        prompt = f"""
You are an expert marketing budget optimizer. Analyze the following campaigns and recommend optimal budget allocation.

Current Campaigns:
{json.dumps(campaign_summary, indent=2)}

Total Available Budget: ${total_budget:,.2f}

Constraints:
{json.dumps(constraints or {}, indent=2)}

Tasks:
1. Calculate current performance (ROI, ROAS, CPA) for each campaign
2. Identify top performers and underperformers
3. Recommend new budget allocation to maximize overall ROI
4. Explain reasoning for each recommendation
5. Estimate expected improvement in overall ROAS

Return response as JSON with this structure:
{{
  "current_metrics": {{
    "total_spend": float,
    "total_revenue": float,
    "overall_roas": float
  }},
  "recommendations": [
    {{
      "campaign_id": "string",
      "campaign_name": "string",
      "current_budget": float,
      "recommended_budget": float,
      "change_amount": float,
      "change_percentage": float,
      "reasoning": "string"
    }}
  ],
  "expected_improvement": {{
    "new_overall_roas": float,
    "improvement_percentage": float,
    "additional_revenue": float
  }},
  "quick_wins": ["string"],
  "risks": ["string"]
}}
"""

        response = await self.client.messages.create(
            model=self.model,
            max_tokens=4000,
            temperature=0.2,  # Lower temperature for more consistent outputs
            messages=[{
                "role": "user",
                "content": prompt
            }]
        )

        # Parse Claude's response
        result = json.loads(response.content[0].text)

        return result

    def _summarize_campaigns(self, campaigns: List[Dict]) -> List[Dict]:
        """Prepare campaign data for Claude analysis"""
        return [
            {
                "id": c["id"],
                "name": c["name"],
                "platform": c["platform"],
                "current_budget": c["budget"],
                "spend": c["metrics"]["spend"],
                "revenue": c["metrics"]["revenue"],
                "conversions": c["metrics"]["conversions"],
                "roas": c["metrics"]["roas"],
                "cpa": c["metrics"]["cpa"]
            }
            for c in campaigns
        ]
```

## Usage Example

```python
async def main():
    optimizer = BudgetOptimizer(api_key="your-claude-api-key")

    campaigns = [
        {
            "id": "g001",
            "name": "Google - Brand Search",
            "platform": "google_ads",
            "budget": 5000,
            "metrics": {
                "spend": 4850,
                "revenue": 16900,
                "conversions": 145,
                "roas": 3.5,
                "cpa": 33.45
            }
        },
        {
            "id": "m001",
            "name": "Meta - Prospecting",
            "platform": "meta_ads",
            "budget": 3000,
            "metrics": {
                "spend": 2980,
                "revenue": 7450,
                "conversions": 89,
                "roas": 2.5,
                "cpa": 33.48
            }
        },
        {
            "id": "t001",
            "name": "TikTok - Video Ads",
            "platform": "tiktok_ads",
            "budget": 2000,
            "metrics": {
                "spend": 1950,
                "revenue": 8775,
                "conversions": 112,
                "roas": 4.5,
                "cpa": 17.41
            }
        }
    ]

    result = await optimizer.optimize_budget(
        campaigns=campaigns,
        total_budget=10000,
        constraints={
            "min_budget_per_campaign": 500,
            "max_budget_change_percentage": 50
        }
    )

    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

## Related Documents

- [Autonomous Optimization](./04-autonomous-optimization.md) - Pełna pętla autonomiczna
- [Architecture](./02-architecture.md) - Architektura systemu
