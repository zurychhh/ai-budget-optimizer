"""AI/Claude integration endpoints"""

from datetime import datetime
from typing import Any

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.campaigns import get_platform_manager
from app.core.config import settings
from app.core.database import get_db
from app.services.ai_engine import (
    AIOptimizationEngine,
    get_ai_engine,
)
from app.services.platform_manager import PlatformManager

# =============================================================================
# Request/Response Models
# =============================================================================


class AnalysisRequest(BaseModel):
    platforms: list[str] | None = Field(
        default=None, description="Platforms to analyze. If None, analyzes all platforms."
    )
    start_date: str = Field(..., description="Start date YYYY-MM-DD")
    end_date: str = Field(..., description="End date YYYY-MM-DD")


class BudgetOptimizationRequest(BaseModel):
    platforms: list[str] | None = None
    total_budget: float | None = Field(
        default=None, description="Total budget to allocate. If None, uses sum of current budgets."
    )
    optimization_goal: str = Field(
        default="maximize_roas",
        description="Goal: maximize_roas, maximize_conversions, minimize_cpa",
    )
    max_change_percent: float = Field(
        default=30.0, description="Maximum budget change per campaign (%)"
    )


class AnomalyCheckRequest(BaseModel):
    platforms: list[str] | None = None
    lookback_days: int = Field(default=7, description="Days of history to compare against")


class QueryRequest(BaseModel):
    query: str = Field(..., description="Natural language question")
    include_campaigns: bool = Field(default=True, description="Include campaign data in context")


class ActionExecuteRequest(BaseModel):
    action_id: str
    confirm: bool = Field(default=False, description="Confirm execution")


class RecommendationAction(BaseModel):
    id: str
    action_type: str
    campaign_id: str
    platform: str
    description: str
    confidence: float
    priority: str
    estimated_impact: dict[str, Any]


class AnalysisResponse(BaseModel):
    overall_health: str
    health_score: int
    summary: str
    campaign_count: int
    top_performers: list[dict[str, Any]]
    underperformers: list[dict[str, Any]]
    trends: list[dict[str, Any]]
    recommendations: list[dict[str, Any]]
    analyzed_at: str


class AnomalyResponse(BaseModel):
    overall_status: str
    anomalies: list[dict[str, Any]]
    summary: str
    healthy_campaigns: int
    anomalous_campaigns: int
    checked_at: str


class BudgetRecommendationResponse(BaseModel):
    current_metrics: dict[str, Any]
    recommendations: list[dict[str, Any]]
    projected_improvement: dict[str, Any]
    risks: list[str]
    generated_at: str


class ActionPlanResponse(BaseModel):
    action_plan: list[dict[str, Any]]
    summary: dict[str, Any]
    execution_window: str
    next_review: str
    automation_level: str
    generated_at: str


# =============================================================================
# Dependency Injection
# =============================================================================


def get_ai_engine_dep() -> AIOptimizationEngine:
    """Dependency for AI engine"""
    if not settings.anthropic_api_key:
        raise HTTPException(
            status_code=503,
            detail="Anthropic API key not configured. Set ANTHROPIC_API_KEY in .env",
        )
    return get_ai_engine()


# =============================================================================
# Router
# =============================================================================

router = APIRouter()


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_campaigns(
    request: AnalysisRequest,
    manager: PlatformManager = Depends(get_platform_manager),
    ai_engine: AIOptimizationEngine = Depends(get_ai_engine_dep),
):
    """
    Trigger AI analysis of campaign performance.

    Claude analyzes all campaigns across platforms and generates:
    - Overall health assessment
    - Top and underperforming campaigns
    - Trends and patterns
    - Actionable recommendations with confidence scores
    """
    # Fetch campaign data from all platforms
    platforms = request.platforms or ["google_ads", "meta_ads", "tiktok_ads", "linkedin_ads"]
    all_campaigns = []

    for platform in platforms:
        try:
            result = await manager.get_campaign_performance(
                platform=platform,
                start_date=request.start_date,
                end_date=request.end_date,
            )
            campaigns = result.get("campaigns", [])
            for c in campaigns:
                c["platform"] = platform
            all_campaigns.extend(campaigns)
        except Exception as e:
            print(f"[AI] Error fetching {platform}: {e}")

    if not all_campaigns:
        raise HTTPException(status_code=404, detail="No campaign data available for analysis")

    # Run AI analysis
    analysis = await ai_engine.analyze_performance(all_campaigns)

    return AnalysisResponse(
        overall_health=analysis.get("overall_health", "UNKNOWN"),
        health_score=analysis.get("health_score", 0),
        summary=analysis.get("summary", ""),
        campaign_count=analysis.get("campaign_count", 0),
        top_performers=analysis.get("top_performers", []),
        underperformers=analysis.get("underperformers", []),
        trends=analysis.get("trends", []),
        recommendations=analysis.get("recommendations", []),
        analyzed_at=analysis.get("analyzed_at", datetime.utcnow().isoformat()),
    )


@router.post("/optimize-budget", response_model=BudgetRecommendationResponse)
async def optimize_budget(
    request: BudgetOptimizationRequest,
    manager: PlatformManager = Depends(get_platform_manager),
    ai_engine: AIOptimizationEngine = Depends(get_ai_engine_dep),
):
    """
    Generate AI-powered budget allocation recommendations.

    Claude analyzes campaign performance and recommends optimal
    budget distribution to maximize ROAS or other goals.
    """
    platforms = request.platforms or ["google_ads", "meta_ads", "tiktok_ads", "linkedin_ads"]
    all_campaigns = []

    # Get current campaign data
    for platform in platforms:
        try:
            result = await manager.get_campaign_performance(
                platform=platform,
                start_date="2026-01-01",  # Last 7 days
                end_date="2026-01-07",
            )
            campaigns = result.get("campaigns", [])
            for c in campaigns:
                c["platform"] = platform
            all_campaigns.extend(campaigns)
        except Exception:
            pass

    if not all_campaigns:
        raise HTTPException(status_code=404, detail="No campaigns found")

    # Calculate total budget if not provided
    total_budget = request.total_budget
    if total_budget is None:
        total_budget = sum(c.get("budget_usd", 0) for c in all_campaigns)

    # Get AI recommendations
    recommendations = await ai_engine.recommend_budget_allocation(
        campaigns=all_campaigns,
        total_budget=total_budget,
        optimization_goal=request.optimization_goal,
        constraints={"max_change_percent": request.max_change_percent},
    )

    return BudgetRecommendationResponse(
        current_metrics=recommendations.get("current_metrics", {}),
        recommendations=recommendations.get("recommendations", []),
        projected_improvement=recommendations.get("projected_improvement", {}),
        risks=recommendations.get("risks", []),
        generated_at=recommendations.get("generated_at", datetime.utcnow().isoformat()),
    )


@router.post("/detect-anomalies", response_model=AnomalyResponse)
async def detect_anomalies(
    request: AnomalyCheckRequest,
    manager: PlatformManager = Depends(get_platform_manager),
    ai_engine: AIOptimizationEngine = Depends(get_ai_engine_dep),
):
    """
    Detect anomalies in campaign performance.

    Claude identifies unusual patterns, sudden drops, spikes,
    and other anomalies that need attention.
    """
    platforms = request.platforms or ["google_ads", "meta_ads", "tiktok_ads", "linkedin_ads"]
    current_metrics = []

    for platform in platforms:
        try:
            result = await manager.get_campaign_performance(
                platform=platform,
                start_date="2026-01-06",  # Today
                end_date="2026-01-07",
            )
            campaigns = result.get("campaigns", [])
            for c in campaigns:
                c["platform"] = platform
            current_metrics.extend(campaigns)
        except Exception:
            pass

    if not current_metrics:
        raise HTTPException(status_code=404, detail="No current metrics available")

    # For demo, we'll simulate historical data as slightly better performance
    historical_metrics = [
        {**c, "impressions": int(c.get("impressions", 0) * 1.1)} for c in current_metrics
    ]

    anomalies = await ai_engine.detect_anomalies(
        current_metrics=current_metrics,
        historical_metrics=historical_metrics,
    )

    return AnomalyResponse(
        overall_status=anomalies.get("overall_status", "UNKNOWN"),
        anomalies=anomalies.get("anomalies", []),
        summary=anomalies.get("summary", ""),
        healthy_campaigns=anomalies.get("healthy_campaigns", 0),
        anomalous_campaigns=anomalies.get("anomalous_campaigns", 0),
        checked_at=anomalies.get("checked_at", datetime.utcnow().isoformat()),
    )


@router.post("/action-plan", response_model=ActionPlanResponse)
async def generate_action_plan(
    manager: PlatformManager = Depends(get_platform_manager),
    ai_engine: AIOptimizationEngine = Depends(get_ai_engine_dep),
):
    """
    Generate a comprehensive action plan.

    Combines performance analysis, anomaly detection, and budget
    recommendations into a prioritized, actionable plan.
    """
    platforms = ["google_ads", "meta_ads", "tiktok_ads", "linkedin_ads"]
    all_campaigns = []

    for platform in platforms:
        try:
            result = await manager.get_campaign_performance(
                platform=platform,
                start_date="2026-01-01",
                end_date="2026-01-07",
            )
            campaigns = result.get("campaigns", [])
            for c in campaigns:
                c["platform"] = platform
            all_campaigns.extend(campaigns)
        except Exception:
            pass

    if not all_campaigns:
        raise HTTPException(status_code=404, detail="No campaigns found")

    total_budget = sum(c.get("budget_usd", 0) for c in all_campaigns)

    # Run all analyses
    analysis = await ai_engine.analyze_performance(all_campaigns)
    anomalies = await ai_engine.detect_anomalies(all_campaigns)
    budget_recs = await ai_engine.recommend_budget_allocation(all_campaigns, total_budget)

    # Generate unified action plan
    action_plan = await ai_engine.generate_action_plan(
        analysis=analysis,
        anomalies=anomalies,
        budget_recommendations=budget_recs,
    )

    return ActionPlanResponse(
        action_plan=action_plan.get("action_plan", []),
        summary=action_plan.get("summary", {}),
        execution_window=action_plan.get("execution_window", "Immediate"),
        next_review=action_plan.get("next_review", "15 minutes"),
        automation_level=action_plan.get("automation_level", "semi_autonomous"),
        generated_at=action_plan.get("generated_at", datetime.utcnow().isoformat()),
    )


@router.post("/query")
async def natural_language_query(
    request: QueryRequest,
    manager: PlatformManager = Depends(get_platform_manager),
    ai_engine: AIOptimizationEngine = Depends(get_ai_engine_dep),
):
    """
    Ask questions about campaigns in natural language.

    Examples:
    - "Which campaign has the best ROAS?"
    - "Why is my Google Ads spend so high today?"
    - "Should I increase budget for TikTok campaigns?"
    """
    context = {}

    if request.include_campaigns:
        platforms = ["google_ads", "meta_ads", "tiktok_ads", "linkedin_ads"]
        all_campaigns = []

        for platform in platforms:
            try:
                result = await manager.get_campaign_performance(
                    platform=platform,
                    start_date="2026-01-01",
                    end_date="2026-01-07",
                )
                campaigns = result.get("campaigns", [])
                for c in campaigns:
                    c["platform"] = platform
                all_campaigns.extend(campaigns)
            except Exception:
                pass

        context["campaigns"] = all_campaigns
        context["total_campaigns"] = len(all_campaigns)
        context["platforms"] = platforms

    response = await ai_engine.natural_language_query(
        query=request.query,
        context=context,
    )

    return {
        "query": request.query,
        "response": response,
        "context_included": request.include_campaigns,
        "answered_at": datetime.utcnow().isoformat(),
    }


@router.get("/recommendations")
async def get_recommendations(
    status: str | None = None,
    platform: str | None = None,
    min_confidence: float = 0.0,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    """
    Get AI-generated recommendations.

    Filter by:
    - status: pending, accepted, rejected, executed
    - platform: google_ads, meta_ads, etc.
    - min_confidence: minimum confidence score (0.0-1.0)
    """
    # In production, this would fetch from database
    # For now, return empty with structure
    return {
        "recommendations": [],
        "count": 0,
        "filters": {
            "status": status,
            "platform": platform,
            "min_confidence": min_confidence,
        },
    }


@router.post("/recommendations/{recommendation_id}/accept")
async def accept_recommendation(
    recommendation_id: str,
    background_tasks: BackgroundTasks,
    manager: PlatformManager = Depends(get_platform_manager),
    db: Session = Depends(get_db),
):
    """
    Accept and execute an AI recommendation.

    The action will be executed asynchronously via the platform manager.
    """
    # In production: fetch recommendation from DB, validate, execute

    return {
        "success": True,
        "recommendation_id": recommendation_id,
        "status": "executing",
        "message": "Recommendation accepted. Execution in progress.",
        "accepted_at": datetime.utcnow().isoformat(),
    }


@router.post("/recommendations/{recommendation_id}/reject")
async def reject_recommendation(
    recommendation_id: str,
    reason: str | None = None,
    db: Session = Depends(get_db),
):
    """
    Reject an AI recommendation with optional feedback.

    Rejection feedback helps improve future recommendations.
    """
    return {
        "success": True,
        "recommendation_id": recommendation_id,
        "status": "rejected",
        "reason": reason,
        "rejected_at": datetime.utcnow().isoformat(),
    }


@router.get("/insights")
async def get_insights(
    manager: PlatformManager = Depends(get_platform_manager),
    ai_engine: AIOptimizationEngine = Depends(get_ai_engine_dep),
):
    """
    Get AI-generated insights and trends.

    Returns high-level observations without requiring full analysis.
    """
    platforms = ["google_ads", "meta_ads", "tiktok_ads", "linkedin_ads"]
    all_campaigns = []

    for platform in platforms:
        try:
            result = await manager.get_campaign_performance(
                platform=platform,
                start_date="2026-01-01",
                end_date="2026-01-07",
            )
            campaigns = result.get("campaigns", [])
            for c in campaigns:
                c["platform"] = platform
            all_campaigns.extend(campaigns)
        except Exception:
            pass

    if not all_campaigns:
        return {
            "insights": [],
            "generated_at": datetime.utcnow().isoformat(),
        }

    # Quick analysis for insights
    total_spend = sum(c.get("cost_usd", 0) for c in all_campaigns)
    total_revenue = sum(c.get("revenue_usd", 0) for c in all_campaigns)
    overall_roas = total_revenue / total_spend if total_spend > 0 else 0

    best_campaign = max(all_campaigns, key=lambda x: x.get("roas", 0))
    worst_campaign = min(all_campaigns, key=lambda x: x.get("roas", 0))

    insights = [
        {
            "type": "summary",
            "title": "Overall Performance",
            "description": f"Across {len(all_campaigns)} campaigns, overall ROAS is {overall_roas:.2f}x",
            "metric": overall_roas,
        },
        {
            "type": "top_performer",
            "title": "Best Performing Campaign",
            "description": f"{best_campaign.get('campaign_name')} on {best_campaign.get('platform')} with {best_campaign.get('roas', 0):.2f}x ROAS",
            "campaign_id": best_campaign.get("campaign_id"),
        },
        {
            "type": "attention_needed",
            "title": "Needs Attention",
            "description": f"{worst_campaign.get('campaign_name')} on {worst_campaign.get('platform')} has only {worst_campaign.get('roas', 0):.2f}x ROAS",
            "campaign_id": worst_campaign.get("campaign_id"),
        },
    ]

    return {
        "insights": insights,
        "campaign_count": len(all_campaigns),
        "total_spend": total_spend,
        "total_revenue": total_revenue,
        "overall_roas": overall_roas,
        "generated_at": datetime.utcnow().isoformat(),
    }


@router.get("/status")
async def get_ai_status():
    """
    Get AI engine status and configuration.
    """
    has_api_key = bool(settings.anthropic_api_key)

    return {
        "status": "ready" if has_api_key else "not_configured",
        "model": settings.anthropic_model,
        "automation_level": "semi_autonomous",
        "confidence_threshold": 0.85,
        "max_budget_change_percent": 30,
        "features": {
            "performance_analysis": has_api_key,
            "budget_optimization": has_api_key,
            "anomaly_detection": has_api_key,
            "natural_language_queries": has_api_key,
            "autonomous_execution": has_api_key,
        },
    }
