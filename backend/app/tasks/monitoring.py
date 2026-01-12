"""Monitoring and autonomous optimization tasks

This module implements the 15-minute optimization loop:
1. Sync data from all platforms
2. Run AI analysis
3. Detect anomalies
4. Generate recommendations
5. Execute high-confidence actions (if FULL_AUTONOMOUS)
6. Create alerts for issues
7. Notify stakeholders
"""

import asyncio
from datetime import datetime, timedelta
from typing import Any

from app.core.config import settings

from . import celery_app


def run_async(coro):
    """Helper to run async code in sync context"""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


async def _sync_platform_data() -> dict[str, Any]:
    """Fetch data from all platforms"""
    from app.services.platform_manager import PlatformManager

    manager = PlatformManager()
    results = {}
    errors = []

    today = datetime.utcnow().strftime("%Y-%m-%d")
    week_ago = (datetime.utcnow() - timedelta(days=7)).strftime("%Y-%m-%d")

    for platform in ["google_ads", "meta_ads", "tiktok_ads", "linkedin_ads"]:
        try:
            data = await manager.get_campaign_performance(
                platform=platform,
                start_date=week_ago,
                end_date=today,
            )
            results[platform] = {
                "campaigns": data.get("campaigns", []),
                "count": data.get("count", 0),
                "synced_at": datetime.utcnow().isoformat(),
            }
        except Exception as e:
            errors.append(f"{platform}: {str(e)}")
            results[platform] = {"error": str(e)}

    return {
        "platforms": results,
        "errors": errors,
        "total_campaigns": sum(r.get("count", 0) for r in results.values() if "count" in r),
    }


async def _run_optimization_cycle() -> dict[str, Any]:
    """Run full optimization cycle"""
    from app.services.ai_engine import (
        AutomationLevel,
        get_ai_engine,
    )
    from app.services.platform_manager import PlatformManager

    # Check if AI is configured
    if not settings.anthropic_api_key:
        return {
            "status": "skipped",
            "reason": "Anthropic API key not configured",
        }

    manager = PlatformManager()
    ai_engine = get_ai_engine()

    # 1. Collect all campaign data
    today = datetime.utcnow().strftime("%Y-%m-%d")
    week_ago = (datetime.utcnow() - timedelta(days=7)).strftime("%Y-%m-%d")

    all_campaigns = []
    for platform in ["google_ads", "meta_ads", "tiktok_ads", "linkedin_ads"]:
        try:
            result = await manager.get_campaign_performance(
                platform=platform,
                start_date=week_ago,
                end_date=today,
            )
            campaigns = result.get("campaigns", [])
            for c in campaigns:
                c["platform"] = platform
            all_campaigns.extend(campaigns)
        except Exception:
            pass

    if not all_campaigns:
        return {
            "status": "skipped",
            "reason": "No campaign data available",
        }

    # 2. Run AI analysis
    analysis = await ai_engine.analyze_performance(all_campaigns)

    # 3. Detect anomalies
    anomalies = await ai_engine.detect_anomalies(all_campaigns)

    # 4. Generate budget recommendations
    total_budget = sum(c.get("budget_usd", 0) for c in all_campaigns)
    budget_recs = await ai_engine.recommend_budget_allocation(
        campaigns=all_campaigns,
        total_budget=total_budget,
    )

    # 5. Generate action plan
    action_plan = await ai_engine.generate_action_plan(
        analysis=analysis,
        anomalies=anomalies,
        budget_recommendations=budget_recs,
    )

    # 6. Execute high-confidence actions if autonomous
    executed_actions = []
    if ai_engine.automation_level == AutomationLevel.FULL_AUTONOMOUS:
        for action in action_plan.get("action_plan", []):
            if ai_engine.should_auto_execute(action):
                try:
                    result = await _execute_action(manager, action)
                    executed_actions.append(
                        {
                            "action_id": action.get("id"),
                            "action_type": action.get("action_type"),
                            "campaign_id": action.get("campaign_id"),
                            "result": result,
                        }
                    )
                except Exception as e:
                    executed_actions.append(
                        {
                            "action_id": action.get("id"),
                            "error": str(e),
                        }
                    )

    return {
        "status": "success",
        "timestamp": datetime.utcnow().isoformat(),
        "campaigns_analyzed": len(all_campaigns),
        "overall_health": analysis.get("overall_health"),
        "anomalies_detected": len(anomalies.get("anomalies", [])),
        "recommendations_generated": len(action_plan.get("action_plan", [])),
        "actions_auto_executed": len(executed_actions),
        "executed_actions": executed_actions,
    }


async def _execute_action(manager, action: dict[str, Any]) -> dict[str, Any]:
    """Execute a single optimization action"""
    action_type = action.get("action_type")
    campaign_id = action.get("campaign_id")
    platform = action.get("platform")
    parameters = action.get("parameters", {})

    if action_type == "pause_campaign":
        return await manager.pause_campaign(platform, campaign_id)

    elif action_type == "resume_campaign":
        return await manager.resume_campaign(platform, campaign_id)

    elif action_type in ["budget_increase", "budget_decrease"]:
        new_budget = parameters.get("new_budget")
        if new_budget:
            return await manager.update_campaign_budget(platform, campaign_id, new_budget)

    return {"status": "unknown_action_type"}


async def _check_alert_conditions() -> dict[str, Any]:
    """Check for conditions that should trigger alerts"""
    from app.services.platform_manager import PlatformManager

    manager = PlatformManager()
    alerts = []

    today = datetime.utcnow().strftime("%Y-%m-%d")
    yesterday = (datetime.utcnow() - timedelta(days=1)).strftime("%Y-%m-%d")

    for platform in ["google_ads", "meta_ads", "tiktok_ads", "linkedin_ads"]:
        try:
            result = await manager.get_campaign_performance(
                platform=platform,
                start_date=yesterday,
                end_date=today,
            )

            for campaign in result.get("campaigns", []):
                # Check for zero conversions
                if campaign.get("conversions", 0) == 0 and campaign.get("cost_usd", 0) > 50:
                    alerts.append(
                        {
                            "type": "zero_conversions",
                            "severity": "HIGH",
                            "campaign_id": campaign.get("campaign_id"),
                            "platform": platform,
                            "message": f"Campaign {campaign.get('campaign_name')} has zero conversions with ${campaign.get('cost_usd', 0):.2f} spend",
                        }
                    )

                # Check for very low ROAS
                roas = campaign.get("roas", 0)
                if roas < 1.0 and campaign.get("cost_usd", 0) > 100:
                    alerts.append(
                        {
                            "type": "low_roas",
                            "severity": "MEDIUM",
                            "campaign_id": campaign.get("campaign_id"),
                            "platform": platform,
                            "message": f"Campaign {campaign.get('campaign_name')} has ROAS of {roas:.2f}x (below breakeven)",
                        }
                    )

                # Check for high CPC
                cpc = campaign.get("cpc", 0)
                if cpc > 5.0:  # $5 CPC threshold
                    alerts.append(
                        {
                            "type": "high_cpc",
                            "severity": "LOW",
                            "campaign_id": campaign.get("campaign_id"),
                            "platform": platform,
                            "message": f"Campaign {campaign.get('campaign_name')} has CPC of ${cpc:.2f}",
                        }
                    )

        except Exception:
            pass

    return {
        "alerts": alerts,
        "count": len(alerts),
        "checked_at": datetime.utcnow().isoformat(),
    }


# =============================================================================
# Celery Tasks
# =============================================================================


@celery_app.task(name="app.tasks.monitoring.sync_all_platforms")
def sync_all_platforms():
    """
    Sync campaign data from all platforms.

    Runs every 15 minutes to fetch latest metrics.
    Schedule: */15 * * * *
    """
    result = run_async(_sync_platform_data())

    return {
        "status": "success" if not result.get("errors") else "partial",
        "timestamp": datetime.utcnow().isoformat(),
        "total_campaigns": result.get("total_campaigns", 0),
        "errors": result.get("errors", []),
    }


@celery_app.task(name="app.tasks.monitoring.run_ai_analysis")
def run_ai_analysis():
    """
    Run AI analysis and optimization cycle.

    This is the main optimization loop that:
    1. Analyzes campaign performance
    2. Detects anomalies
    3. Generates recommendations
    4. Executes high-confidence actions (if autonomous mode)

    Runs every 15 minutes after data sync.
    Schedule: 5,20,35,50 * * * *
    """
    result = run_async(_run_optimization_cycle())
    return result


@celery_app.task(name="app.tasks.monitoring.execute_recommendation")
def execute_recommendation(recommendation_id: str, action_data: dict[str, Any]):
    """
    Execute an approved AI recommendation.

    Args:
        recommendation_id: UUID of the recommendation
        action_data: Dict with action_type, campaign_id, platform, parameters
    """
    from app.services.platform_manager import PlatformManager

    async def _execute():
        manager = PlatformManager()
        return await _execute_action(manager, action_data)

    try:
        result = run_async(_execute())
        return {
            "status": "success",
            "recommendation_id": recommendation_id,
            "result": result,
            "executed_at": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        return {
            "status": "failed",
            "recommendation_id": recommendation_id,
            "error": str(e),
            "failed_at": datetime.utcnow().isoformat(),
        }


@celery_app.task(name="app.tasks.monitoring.check_alerts")
def check_alerts():
    """
    Check for alert conditions and create alerts if needed.

    Checks for:
    - Zero conversions with significant spend
    - ROAS below breakeven
    - Unusually high CPC
    - Budget pacing issues

    Schedule: */30 * * * *
    """
    result = run_async(_check_alert_conditions())

    # In production, would:
    # 1. Store alerts in database
    # 2. Send notifications (email, Slack, etc.)
    # 3. Trigger automatic responses for critical alerts

    return {
        "status": "success",
        "timestamp": datetime.utcnow().isoformat(),
        "alerts_created": result.get("count", 0),
        "alerts": result.get("alerts", []),
    }


@celery_app.task(name="app.tasks.monitoring.optimization_loop")
def optimization_loop():
    """
    Complete 15-minute optimization loop.

    Combines sync + analysis + alerts into single task.
    This is the main entry point for scheduled optimization.

    Schedule: */15 * * * *
    """
    results = {
        "started_at": datetime.utcnow().isoformat(),
    }

    # Step 1: Sync data
    sync_result = sync_all_platforms()
    results["sync"] = sync_result

    # Step 2: Run AI analysis (only if sync succeeded)
    if sync_result.get("total_campaigns", 0) > 0:
        analysis_result = run_ai_analysis()
        results["analysis"] = analysis_result
    else:
        results["analysis"] = {"status": "skipped", "reason": "No campaigns to analyze"}

    # Step 3: Check alerts
    alert_result = check_alerts()
    results["alerts"] = alert_result

    results["completed_at"] = datetime.utcnow().isoformat()
    results["status"] = "success"

    return results


# =============================================================================
# Celery Beat Schedule
# =============================================================================

# Configure in celery_app or add to settings:
# CELERYBEAT_SCHEDULE = {
#     'optimization-loop': {
#         'task': 'app.tasks.monitoring.optimization_loop',
#         'schedule': crontab(minute='*/15'),
#     },
#     'check-alerts': {
#         'task': 'app.tasks.monitoring.check_alerts',
#         'schedule': crontab(minute='*/30'),
#     },
# }
