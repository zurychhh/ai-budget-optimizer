"""AI Optimization Engine - Claude integration for campaign analysis and optimization"""

import json
import uuid
from datetime import datetime
from enum import Enum
from typing import Any

import anthropic

from app.core.config import settings


class AutomationLevel(str, Enum):
    """Automation levels for AI actions"""

    FULL_AUTONOMOUS = "full_autonomous"  # AI executes automatically (confidence >85%)
    SEMI_AUTONOMOUS = "semi_autonomous"  # AI proposes, human approves
    ADVISORY_ONLY = "advisory_only"  # AI only suggests, no execution


class ActionType(str, Enum):
    """Types of optimization actions"""

    BUDGET_INCREASE = "budget_increase"
    BUDGET_DECREASE = "budget_decrease"
    PAUSE_CAMPAIGN = "pause_campaign"
    RESUME_CAMPAIGN = "resume_campaign"
    REALLOCATE_BUDGET = "reallocate_budget"


class AIOptimizationEngine:
    """
    AI-powered campaign optimization using Claude.

    Handles:
    - Campaign performance analysis
    - Budget optimization recommendations
    - Anomaly detection
    - Autonomous action execution
    - Natural language queries
    """

    CONFIDENCE_THRESHOLD = 0.85  # Minimum confidence for autonomous action
    MAX_BUDGET_CHANGE_PCT = 0.30  # Maximum 30% budget change per action

    def __init__(
        self,
        api_key: str | None = None,
        automation_level: AutomationLevel = AutomationLevel.SEMI_AUTONOMOUS,
    ):
        self.api_key = api_key or settings.anthropic_api_key
        self.model = settings.anthropic_model
        self.automation_level = automation_level
        self.client = None

        if self.api_key:
            self.client = anthropic.Anthropic(api_key=self.api_key)

    def _ensure_client(self):
        """Ensure Claude client is initialized"""
        if not self.client:
            raise ValueError("Anthropic API key not configured")

    def _parse_json_response(self, text: str, default: dict = None) -> dict:
        """Safely parse JSON from Claude's response"""
        # Try to extract JSON from markdown code blocks
        if "```json" in text:
            start = text.find("```json") + 7
            end = text.find("```", start)
            text = text[start:end].strip()
        elif "```" in text:
            start = text.find("```") + 3
            end = text.find("```", start)
            text = text[start:end].strip()

        try:
            return json.loads(text)
        except json.JSONDecodeError:
            return default or {"raw_response": text}

    async def analyze_performance(
        self,
        campaign_data: list[dict[str, Any]],
    ) -> dict[str, Any]:
        """
        Analyze campaign performance and generate insights.
        """
        self._ensure_client()

        prompt = f"""You are an expert marketing analyst. Analyze the following campaign performance data.

Campaign Data:
{json.dumps(campaign_data, indent=2)}

Analyze and provide:
1. Overall health assessment across all platforms
2. Top 3 performing campaigns with reasoning
3. Bottom 3 underperforming campaigns with specific issues
4. Cross-platform trends and patterns
5. Immediate action recommendations with priority

Return a JSON object with this exact structure:
{{
  "overall_health": "EXCELLENT" | "GOOD" | "FAIR" | "POOR" | "CRITICAL",
  "health_score": <number 0-100>,
  "summary": "<brief summary>",
  "top_performers": [
    {{"campaign_id": "<id>", "platform": "<platform>", "roas": <number>, "reason": "<why performing well>"}}
  ],
  "underperformers": [
    {{"campaign_id": "<id>", "platform": "<platform>", "issue": "<specific issue>", "severity": "HIGH" | "MEDIUM" | "LOW"}}
  ],
  "trends": [
    {{"type": "<trend type>", "description": "<description>", "impact": "POSITIVE" | "NEGATIVE" | "NEUTRAL"}}
  ],
  "recommendations": [
    {{
      "id": "<uuid>",
      "action_type": "budget_increase" | "budget_decrease" | "pause_campaign" | "resume_campaign",
      "campaign_id": "<id>",
      "platform": "<platform>",
      "description": "<what to do>",
      "reasoning": "<why>",
      "confidence": <0.0-1.0>,
      "estimated_impact": {{"metric": "<metric>", "change_percent": <number>}},
      "priority": "HIGH" | "MEDIUM" | "LOW"
    }}
  ]
}}

Only return valid JSON, no additional text."""

        response = self.client.messages.create(
            model=self.model,
            max_tokens=4000,
            temperature=0.2,
            messages=[{"role": "user", "content": prompt}],
        )

        result = self._parse_json_response(
            response.content[0].text,
            {
                "overall_health": "UNKNOWN",
                "health_score": 0,
                "summary": "Analysis failed",
                "top_performers": [],
                "underperformers": [],
                "trends": [],
                "recommendations": [],
            },
        )

        # Add UUIDs to recommendations if missing
        for rec in result.get("recommendations", []):
            if "id" not in rec or rec["id"] == "<uuid>":
                rec["id"] = str(uuid.uuid4())

        result["analyzed_at"] = datetime.utcnow().isoformat()
        result["campaign_count"] = len(campaign_data)
        return result

    async def recommend_budget_allocation(
        self,
        campaigns: list[dict[str, Any]],
        total_budget: float,
        optimization_goal: str = "maximize_roas",
        constraints: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """
        Generate AI-powered budget allocation recommendations.
        """
        self._ensure_client()

        constraints = constraints or {}
        max_change = constraints.get("max_change_percent", self.MAX_BUDGET_CHANGE_PCT * 100)

        prompt = f"""You are an expert marketing budget optimizer. Optimize budget allocation across campaigns.

Current Campaigns:
{json.dumps(campaigns, indent=2)}

Total Available Budget: ${total_budget:,.2f}
Optimization Goal: {optimization_goal}

Constraints:
- Maximum budget change per campaign: {max_change}%
- Minimum campaign budget: $10/day
- Never pause campaigns with ROAS > 2.0
{json.dumps(constraints, indent=2) if constraints else "None additional"}

Analyze each campaign's efficiency and recommend optimal allocation.

Return JSON:
{{
  "current_metrics": {{
    "total_spend": <number>,
    "total_revenue": <number>,
    "overall_roas": <number>,
    "total_conversions": <number>
  }},
  "recommendations": [
    {{
      "campaign_id": "<id>",
      "campaign_name": "<name>",
      "platform": "<platform>",
      "current_budget": <number>,
      "recommended_budget": <number>,
      "change_amount": <number>,
      "change_percent": <number>,
      "reasoning": "<detailed reasoning>",
      "confidence": <0.0-1.0>,
      "expected_roas_impact": <number>
    }}
  ],
  "projected_improvement": {{
    "new_overall_roas": <number>,
    "roas_improvement_percent": <number>,
    "additional_revenue": <number>,
    "additional_conversions": <number>
  }},
  "risks": ["<potential risks>"],
  "execution_order": ["<campaign_id in order of execution>"]
}}"""

        response = self.client.messages.create(
            model=self.model,
            max_tokens=4000,
            temperature=0.2,
            messages=[{"role": "user", "content": prompt}],
        )

        result = self._parse_json_response(response.content[0].text)
        result["generated_at"] = datetime.utcnow().isoformat()
        result["total_budget"] = total_budget
        result["optimization_goal"] = optimization_goal
        return result

    async def detect_anomalies(
        self,
        current_metrics: list[dict[str, Any]],
        historical_metrics: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        """
        Detect anomalies in campaign metrics.
        """
        self._ensure_client()

        prompt = f"""You are an anomaly detection specialist for digital marketing.

Current Metrics (last 24 hours):
{json.dumps(current_metrics, indent=2)}

Historical Metrics (previous 7 days average):
{json.dumps(historical_metrics or [], indent=2)}

Identify anomalies by comparing current to historical performance. Look for:
1. Sudden drops in CTR, conversions, or ROAS (>20% change)
2. Unusual spikes in CPC or CPM (>30% increase)
3. Budget pacing issues (spend rate too fast/slow)
4. Conversion rate changes
5. Platform-specific issues

Return JSON:
{{
  "anomalies": [
    {{
      "id": "<uuid>",
      "campaign_id": "<id>",
      "platform": "<platform>",
      "metric": "<affected metric>",
      "anomaly_type": "SPIKE" | "DROP" | "TREND_CHANGE" | "PACING_ISSUE",
      "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
      "current_value": <number>,
      "expected_value": <number>,
      "deviation_percent": <number>,
      "description": "<what's happening>",
      "possible_causes": ["<cause1>", "<cause2>"],
      "recommended_action": "<what to do>",
      "auto_actionable": <true if can be fixed automatically>,
      "urgency_hours": <hours before significant impact>
    }}
  ],
  "overall_status": "NORMAL" | "MONITORING" | "ATTENTION_NEEDED" | "ACTION_REQUIRED" | "CRITICAL",
  "summary": "<brief summary>",
  "healthy_campaigns": <count>,
  "anomalous_campaigns": <count>
}}"""

        response = self.client.messages.create(
            model=self.model,
            max_tokens=3000,
            temperature=0.3,
            messages=[{"role": "user", "content": prompt}],
        )

        result = self._parse_json_response(
            response.content[0].text,
            {
                "anomalies": [],
                "overall_status": "UNKNOWN",
                "summary": "Check failed",
            },
        )

        # Add UUIDs to anomalies if missing
        for anomaly in result.get("anomalies", []):
            if "id" not in anomaly:
                anomaly["id"] = str(uuid.uuid4())

        result["checked_at"] = datetime.utcnow().isoformat()
        return result

    async def generate_action_plan(
        self,
        analysis: dict[str, Any],
        anomalies: dict[str, Any],
        budget_recommendations: dict[str, Any],
    ) -> dict[str, Any]:
        """
        Generate a unified action plan from all analyses.
        """
        self._ensure_client()

        prompt = f"""You are an AI marketing operations manager. Create a prioritized action plan.

Performance Analysis:
{json.dumps(analysis, indent=2)}

Detected Anomalies:
{json.dumps(anomalies, indent=2)}

Budget Recommendations:
{json.dumps(budget_recommendations, indent=2)}

Create a unified, prioritized action plan. Consider:
1. Critical anomalies need immediate action
2. High-confidence budget changes can be batched
3. Avoid conflicting actions on the same campaign
4. Respect maximum 30% budget change per day

Return JSON:
{{
  "action_plan": [
    {{
      "id": "<uuid>",
      "priority": 1,
      "action_type": "pause_campaign" | "resume_campaign" | "budget_increase" | "budget_decrease",
      "campaign_id": "<id>",
      "platform": "<platform>",
      "description": "<action description>",
      "parameters": {{"new_budget": <number>}},
      "reasoning": "<why this action, why this priority>",
      "confidence": <0.0-1.0>,
      "auto_execute": <true if confidence > 0.85 and safe>,
      "requires_approval": <true if risky or low confidence>,
      "estimated_impact": "<expected outcome>",
      "rollback_plan": "<how to undo if needed>"
    }}
  ],
  "summary": {{
    "total_actions": <count>,
    "auto_executable": <count>,
    "requires_approval": <count>,
    "estimated_budget_impact": <total $ change>,
    "estimated_roas_improvement": <percent>
  }},
  "execution_window": "<recommended time to execute>",
  "next_review": "<when to review results>"
}}"""

        response = self.client.messages.create(
            model=self.model,
            max_tokens=4000,
            temperature=0.2,
            messages=[{"role": "user", "content": prompt}],
        )

        result = self._parse_json_response(response.content[0].text)

        # Add UUIDs and ensure structure
        for action in result.get("action_plan", []):
            if "id" not in action:
                action["id"] = str(uuid.uuid4())

        result["generated_at"] = datetime.utcnow().isoformat()
        result["automation_level"] = self.automation_level.value
        return result

    def should_auto_execute(self, action: dict[str, Any]) -> bool:
        """
        Determine if an action should be automatically executed.
        """
        if self.automation_level != AutomationLevel.FULL_AUTONOMOUS:
            return False

        confidence = action.get("confidence", 0)
        if confidence < self.CONFIDENCE_THRESHOLD:
            return False

        # Additional safety checks
        action_type = action.get("action_type", "")
        parameters = action.get("parameters", {})

        # Check budget change limits
        if action_type in ["budget_increase", "budget_decrease"]:
            change_pct = abs(parameters.get("change_percent", 100))
            if change_pct > self.MAX_BUDGET_CHANGE_PCT * 100:
                return False

        # Never auto-pause high-performing campaigns
        if action_type == "pause_campaign":
            # This would need actual ROAS data
            pass

        return action.get("auto_execute", False)

    async def natural_language_query(
        self,
        query: str,
        context: dict[str, Any],
    ) -> str:
        """
        Answer natural language questions about campaigns.
        """
        self._ensure_client()

        prompt = f"""You are a helpful marketing analytics assistant for a budget optimization platform.

Available Data:
{json.dumps(context, indent=2)}

User Question: {query}

Provide a clear, actionable answer. Include specific numbers and recommendations where relevant.
If the data doesn't support a complete answer, explain what additional data would help.
Keep the response concise but informative."""

        response = self.client.messages.create(
            model=self.model,
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}],
        )

        return response.content[0].text

    async def explain_recommendation(
        self,
        recommendation: dict[str, Any],
        campaign_data: dict[str, Any],
    ) -> str:
        """
        Generate a detailed explanation for a recommendation.
        """
        self._ensure_client()

        prompt = f"""Explain this AI recommendation in simple terms for a marketing manager.

Recommendation:
{json.dumps(recommendation, indent=2)}

Campaign Data:
{json.dumps(campaign_data, indent=2)}

Provide:
1. What the recommendation is
2. Why the AI is suggesting this
3. What data supports this decision
4. Expected outcome if implemented
5. Risks if not implemented
6. Any caveats or conditions

Use clear, non-technical language."""

        response = self.client.messages.create(
            model=self.model,
            max_tokens=1500,
            messages=[{"role": "user", "content": prompt}],
        )

        return response.content[0].text


# Singleton instance
_ai_engine: AIOptimizationEngine | None = None


def get_ai_engine(
    automation_level: AutomationLevel = AutomationLevel.SEMI_AUTONOMOUS,
) -> AIOptimizationEngine:
    """Get or create AI engine instance"""
    global _ai_engine
    if _ai_engine is None:
        _ai_engine = AIOptimizationEngine(automation_level=automation_level)
    return _ai_engine
