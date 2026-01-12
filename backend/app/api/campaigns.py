"""Campaign management API endpoints"""

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.platform_manager import PlatformManager

# =============================================================================
# Pydantic Models
# =============================================================================


class DateRange(BaseModel):
    start_date: date
    end_date: date


class BudgetUpdate(BaseModel):
    new_budget: float


class CampaignPerformance(BaseModel):
    campaign_id: str
    campaign_name: str
    platform: str
    status: str
    budget_usd: float
    cost_usd: float
    impressions: int
    clicks: int
    conversions: float
    revenue_usd: float
    roas: float
    cpc: float
    ctr: float

    class Config:
        from_attributes = True


class CampaignResponse(BaseModel):
    campaigns: list[CampaignPerformance]
    count: int
    platforms_queried: list[str]


class BudgetUpdateResponse(BaseModel):
    success: bool
    campaign_id: str
    platform: str
    old_budget_usd: float | None = None
    new_budget_usd: float
    message: str


class CampaignActionResponse(BaseModel):
    success: bool
    campaign_id: str
    platform: str
    action: str


# =============================================================================
# Dependencies
# =============================================================================

# Global PlatformManager instance
_platform_manager: PlatformManager | None = None


def get_platform_manager() -> PlatformManager:
    """Dependency that provides a PlatformManager instance"""
    global _platform_manager
    if _platform_manager is None:
        _platform_manager = PlatformManager()
    return _platform_manager


# =============================================================================
# Router
# =============================================================================

router = APIRouter()


@router.get("/campaigns/performance", response_model=CampaignResponse)
async def get_campaign_performance(
    platforms: list[str] | None = Query(
        default=None,
        description="Filter by platforms (google_ads, meta_ads, tiktok_ads, linkedin_ads). If not specified, queries all platforms.",
    ),
    start_date: date = Query(..., description="Start date for metrics (YYYY-MM-DD)"),
    end_date: date = Query(..., description="End date for metrics (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    manager: PlatformManager = Depends(get_platform_manager),
):
    """
    Get campaign performance across all or selected platforms.

    Fetches data from MCP servers and returns normalized metrics.
    """
    # Default to all platforms if none specified
    if platforms is None:
        platforms = ["google_ads", "meta_ads", "tiktok_ads", "linkedin_ads"]

    all_campaigns: list[CampaignPerformance] = []
    errors: list[str] = []

    # Fetch from each platform
    for platform in platforms:
        try:
            result = await manager.get_campaign_performance(
                platform=platform,
                start_date=start_date.isoformat(),
                end_date=end_date.isoformat(),
            )

            # Parse MCP response
            if isinstance(result, dict):
                campaigns_data = result.get("campaigns", [])
                for c in campaigns_data:
                    all_campaigns.append(
                        CampaignPerformance(
                            campaign_id=str(c.get("campaign_id", "")),
                            campaign_name=c.get("campaign_name", ""),
                            platform=platform,
                            status=c.get("status", "UNKNOWN"),
                            budget_usd=float(c.get("budget_usd", 0)),
                            cost_usd=float(c.get("cost_usd", 0)),
                            impressions=int(c.get("impressions", 0)),
                            clicks=int(c.get("clicks", 0)),
                            conversions=float(c.get("conversions", 0)),
                            revenue_usd=float(c.get("revenue_usd", 0)),
                            roas=float(c.get("roas", 0)),
                            cpc=float(c.get("cpc", 0)),
                            ctr=float(c.get("ctr", 0)),
                        )
                    )

        except Exception as e:
            errors.append(f"{platform}: {str(e)}")

    # Log errors but don't fail the request
    if errors:
        print(f"[API] Errors fetching campaigns: {errors}")

    return CampaignResponse(
        campaigns=all_campaigns,
        count=len(all_campaigns),
        platforms_queried=platforms,
    )


@router.get("/campaigns/{platform}/performance")
async def get_platform_campaign_performance(
    platform: str,
    start_date: date = Query(..., description="Start date for metrics"),
    end_date: date = Query(..., description="End date for metrics"),
    campaign_ids: list[str] | None = Query(default=None, description="Filter by campaign IDs"),
    manager: PlatformManager = Depends(get_platform_manager),
):
    """
    Get campaign performance for a specific platform.

    Returns raw MCP response data.
    """
    valid_platforms = ["google_ads", "meta_ads", "tiktok_ads", "linkedin_ads"]
    if platform not in valid_platforms:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid platform. Must be one of: {valid_platforms}",
        )

    try:
        result = await manager.get_campaign_performance(
            platform=platform,
            start_date=start_date.isoformat(),
            end_date=end_date.isoformat(),
            campaign_ids=campaign_ids,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Failed to fetch from {platform}: {str(e)}")


@router.put("/campaigns/{campaign_id}/budget", response_model=BudgetUpdateResponse)
async def update_campaign_budget(
    campaign_id: str,
    platform: str = Query(..., description="Platform of the campaign"),
    budget_update: BudgetUpdate = ...,
    db: Session = Depends(get_db),
    manager: PlatformManager = Depends(get_platform_manager),
):
    """
    Update the budget for a specific campaign.

    Sends the update through the appropriate MCP server.
    """
    if budget_update.new_budget <= 0:
        raise HTTPException(status_code=400, detail="Budget must be positive")

    try:
        result = await manager.update_campaign_budget(
            platform=platform,
            campaign_id=campaign_id,
            new_budget=budget_update.new_budget,
        )

        # Parse MCP response
        if isinstance(result, dict):
            return BudgetUpdateResponse(
                success=result.get("success", False),
                campaign_id=campaign_id,
                platform=platform,
                old_budget_usd=result.get("old_budget_usd"),
                new_budget_usd=budget_update.new_budget,
                message="Budget updated successfully",
            )

        raise HTTPException(status_code=503, detail="Invalid response from MCP server")

    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Failed to update budget: {str(e)}",
        )


@router.post("/campaigns/{campaign_id}/pause", response_model=CampaignActionResponse)
async def pause_campaign(
    campaign_id: str,
    platform: str = Query(..., description="Platform of the campaign"),
    db: Session = Depends(get_db),
    manager: PlatformManager = Depends(get_platform_manager),
):
    """Pause a campaign on the specified platform"""
    try:
        result = await manager.pause_campaign(
            platform=platform,
            campaign_id=campaign_id,
        )

        if isinstance(result, dict) and result.get("success"):
            return CampaignActionResponse(
                success=True,
                campaign_id=campaign_id,
                platform=platform,
                action="paused",
            )

        raise HTTPException(status_code=503, detail="Failed to pause campaign")

    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Failed to pause campaign: {str(e)}",
        )


@router.post("/campaigns/{campaign_id}/resume", response_model=CampaignActionResponse)
async def resume_campaign(
    campaign_id: str,
    platform: str = Query(..., description="Platform of the campaign"),
    db: Session = Depends(get_db),
    manager: PlatformManager = Depends(get_platform_manager),
):
    """Resume a paused campaign on the specified platform"""
    try:
        result = await manager.resume_campaign(
            platform=platform,
            campaign_id=campaign_id,
        )

        if isinstance(result, dict) and result.get("success"):
            return CampaignActionResponse(
                success=True,
                campaign_id=campaign_id,
                platform=platform,
                action="resumed",
            )

        raise HTTPException(status_code=503, detail="Failed to resume campaign")

    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Failed to resume campaign: {str(e)}",
        )


@router.get("/platforms/health")
async def check_platform_health(
    manager: PlatformManager = Depends(get_platform_manager),
):
    """Check health status of all MCP servers"""
    health = await manager.health_check()
    return {
        "status": "ok" if all(health.values()) else "degraded",
        "platforms": health,
    }
