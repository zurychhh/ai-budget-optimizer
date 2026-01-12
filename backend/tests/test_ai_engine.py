"""Tests for AI Optimization Engine"""

from unittest.mock import MagicMock, patch

import pytest
from app.services.ai_engine import (
    ActionType,
    AIOptimizationEngine,
    AutomationLevel,
    get_ai_engine,
)


class TestAIOptimizationEngine:
    """Tests for AIOptimizationEngine"""

    @pytest.fixture
    def mock_anthropic_response(self):
        """Create a mock Anthropic response"""
        mock_response = MagicMock()
        mock_response.content = [MagicMock()]
        mock_response.content[0].text = '{"overall_health": "GOOD", "health_score": 75}'
        return mock_response

    @pytest.fixture
    def sample_campaign_data(self):
        """Sample campaign data for testing"""
        return [
            {
                "campaign_id": "123",
                "campaign_name": "Test Campaign 1",
                "platform": "google_ads",
                "status": "ENABLED",
                "budget_usd": 100.0,
                "cost_usd": 85.0,
                "impressions": 10000,
                "clicks": 500,
                "conversions": 25,
                "revenue_usd": 500.0,
                "roas": 5.88,
                "cpc": 0.17,
                "ctr": 0.05,
            },
            {
                "campaign_id": "456",
                "campaign_name": "Test Campaign 2",
                "platform": "meta_ads",
                "status": "ENABLED",
                "budget_usd": 200.0,
                "cost_usd": 180.0,
                "impressions": 25000,
                "clicks": 1200,
                "conversions": 15,
                "revenue_usd": 300.0,
                "roas": 1.67,
                "cpc": 0.15,
                "ctr": 0.048,
            },
        ]

    def test_initialization_without_api_key(self):
        """Test engine initializes without API key"""
        with patch("app.services.ai_engine.settings") as mock_settings:
            mock_settings.anthropic_api_key = None
            mock_settings.anthropic_model = "claude-sonnet-4-20250514"

            engine = AIOptimizationEngine(api_key=None)

            assert engine.client is None
            assert engine.automation_level == AutomationLevel.SEMI_AUTONOMOUS

    def test_initialization_with_api_key(self):
        """Test engine initializes with API key"""
        with patch("app.services.ai_engine.settings") as mock_settings:
            mock_settings.anthropic_api_key = "test-key"
            mock_settings.anthropic_model = "claude-sonnet-4-20250514"

            engine = AIOptimizationEngine(api_key="test-key")

            assert engine.client is not None
            assert engine.api_key == "test-key"

    def test_automation_levels(self):
        """Test different automation levels"""
        with patch("app.services.ai_engine.settings") as mock_settings:
            mock_settings.anthropic_api_key = "test-key"
            mock_settings.anthropic_model = "claude-sonnet-4-20250514"

            # Test each automation level
            for level in AutomationLevel:
                engine = AIOptimizationEngine(
                    api_key="test-key",
                    automation_level=level,
                )
                assert engine.automation_level == level

    def test_ensure_client_raises_without_key(self):
        """Test _ensure_client raises error without API key"""
        with patch("app.services.ai_engine.settings") as mock_settings:
            mock_settings.anthropic_api_key = None
            mock_settings.anthropic_model = "claude-sonnet-4-20250514"

            engine = AIOptimizationEngine(api_key=None)

            with pytest.raises(ValueError, match="Anthropic API key not configured"):
                engine._ensure_client()

    def test_parse_json_response_valid_json(self):
        """Test parsing valid JSON response"""
        engine = AIOptimizationEngine.__new__(AIOptimizationEngine)

        result = engine._parse_json_response('{"key": "value"}')
        assert result == {"key": "value"}

    def test_parse_json_response_with_code_blocks(self):
        """Test parsing JSON from markdown code blocks"""
        engine = AIOptimizationEngine.__new__(AIOptimizationEngine)

        text = '```json\n{"key": "value"}\n```'
        result = engine._parse_json_response(text)
        assert result == {"key": "value"}

    def test_parse_json_response_invalid_json(self):
        """Test parsing invalid JSON returns default"""
        engine = AIOptimizationEngine.__new__(AIOptimizationEngine)

        result = engine._parse_json_response("not valid json", {"default": True})
        assert result == {"default": True}

    def test_should_auto_execute_non_autonomous(self):
        """Test should_auto_execute returns False for non-autonomous modes"""
        with patch("app.services.ai_engine.settings") as mock_settings:
            mock_settings.anthropic_api_key = "test-key"
            mock_settings.anthropic_model = "claude-sonnet-4-20250514"

            engine = AIOptimizationEngine(
                api_key="test-key",
                automation_level=AutomationLevel.SEMI_AUTONOMOUS,
            )

            action = {
                "confidence": 0.95,
                "auto_execute": True,
                "action_type": "budget_increase",
            }

            assert engine.should_auto_execute(action) is False

    def test_should_auto_execute_low_confidence(self):
        """Test should_auto_execute returns False for low confidence"""
        with patch("app.services.ai_engine.settings") as mock_settings:
            mock_settings.anthropic_api_key = "test-key"
            mock_settings.anthropic_model = "claude-sonnet-4-20250514"

            engine = AIOptimizationEngine(
                api_key="test-key",
                automation_level=AutomationLevel.FULL_AUTONOMOUS,
            )

            action = {
                "confidence": 0.50,  # Below 0.85 threshold
                "auto_execute": True,
                "action_type": "budget_increase",
            }

            assert engine.should_auto_execute(action) is False

    def test_should_auto_execute_high_confidence_autonomous(self):
        """Test should_auto_execute returns True for high confidence in autonomous mode"""
        with patch("app.services.ai_engine.settings") as mock_settings:
            mock_settings.anthropic_api_key = "test-key"
            mock_settings.anthropic_model = "claude-sonnet-4-20250514"

            engine = AIOptimizationEngine(
                api_key="test-key",
                automation_level=AutomationLevel.FULL_AUTONOMOUS,
            )

            action = {
                "confidence": 0.90,  # Above 0.85 threshold
                "auto_execute": True,
                "action_type": "budget_increase",
                "parameters": {"change_percent": 20},  # Within 30% limit
            }

            assert engine.should_auto_execute(action) is True

    def test_should_auto_execute_exceeds_budget_change(self):
        """Test should_auto_execute returns False when budget change exceeds limit"""
        with patch("app.services.ai_engine.settings") as mock_settings:
            mock_settings.anthropic_api_key = "test-key"
            mock_settings.anthropic_model = "claude-sonnet-4-20250514"

            engine = AIOptimizationEngine(
                api_key="test-key",
                automation_level=AutomationLevel.FULL_AUTONOMOUS,
            )

            action = {
                "confidence": 0.95,
                "auto_execute": True,
                "action_type": "budget_increase",
                "parameters": {"change_percent": 50},  # Exceeds 30% limit
            }

            assert engine.should_auto_execute(action) is False

    @pytest.mark.asyncio
    async def test_analyze_performance(self, sample_campaign_data, mock_anthropic_response):
        """Test analyze_performance method"""
        with patch("app.services.ai_engine.settings") as mock_settings:
            mock_settings.anthropic_api_key = "test-key"
            mock_settings.anthropic_model = "claude-sonnet-4-20250514"

            engine = AIOptimizationEngine(api_key="test-key")

            # Mock the client
            engine.client = MagicMock()
            engine.client.messages.create.return_value = mock_anthropic_response

            result = await engine.analyze_performance(sample_campaign_data)

            assert "overall_health" in result
            assert "analyzed_at" in result
            assert result["campaign_count"] == 2
            engine.client.messages.create.assert_called_once()

    @pytest.mark.asyncio
    async def test_recommend_budget_allocation(self, sample_campaign_data, mock_anthropic_response):
        """Test recommend_budget_allocation method"""
        mock_anthropic_response.content[0].text = """
        {
            "current_metrics": {"total_spend": 265, "total_revenue": 800},
            "recommendations": [],
            "projected_improvement": {"roas_improvement_percent": 15}
        }
        """

        with patch("app.services.ai_engine.settings") as mock_settings:
            mock_settings.anthropic_api_key = "test-key"
            mock_settings.anthropic_model = "claude-sonnet-4-20250514"

            engine = AIOptimizationEngine(api_key="test-key")
            engine.client = MagicMock()
            engine.client.messages.create.return_value = mock_anthropic_response

            result = await engine.recommend_budget_allocation(
                campaigns=sample_campaign_data,
                total_budget=300.0,
                optimization_goal="maximize_roas",
            )

            assert "generated_at" in result
            assert result["total_budget"] == 300.0
            assert result["optimization_goal"] == "maximize_roas"

    @pytest.mark.asyncio
    async def test_detect_anomalies(self, sample_campaign_data, mock_anthropic_response):
        """Test detect_anomalies method"""
        mock_anthropic_response.content[0].text = """
        {
            "anomalies": [],
            "overall_status": "NORMAL",
            "summary": "No anomalies detected"
        }
        """

        with patch("app.services.ai_engine.settings") as mock_settings:
            mock_settings.anthropic_api_key = "test-key"
            mock_settings.anthropic_model = "claude-sonnet-4-20250514"

            engine = AIOptimizationEngine(api_key="test-key")
            engine.client = MagicMock()
            engine.client.messages.create.return_value = mock_anthropic_response

            result = await engine.detect_anomalies(
                current_metrics=sample_campaign_data,
            )

            assert "checked_at" in result
            assert "overall_status" in result

    @pytest.mark.asyncio
    async def test_natural_language_query(self, sample_campaign_data, mock_anthropic_response):
        """Test natural_language_query method"""
        mock_anthropic_response.content[
            0
        ].text = "The best performing campaign is Test Campaign 1 with 5.88x ROAS."

        with patch("app.services.ai_engine.settings") as mock_settings:
            mock_settings.anthropic_api_key = "test-key"
            mock_settings.anthropic_model = "claude-sonnet-4-20250514"

            engine = AIOptimizationEngine(api_key="test-key")
            engine.client = MagicMock()
            engine.client.messages.create.return_value = mock_anthropic_response

            result = await engine.natural_language_query(
                query="Which campaign has the best ROAS?",
                context={"campaigns": sample_campaign_data},
            )

            assert "best performing" in result.lower() or "Test Campaign 1" in result

    def test_get_ai_engine_singleton(self):
        """Test get_ai_engine returns singleton instance"""
        with patch("app.services.ai_engine.settings") as mock_settings:
            mock_settings.anthropic_api_key = "test-key"
            mock_settings.anthropic_model = "claude-sonnet-4-20250514"

            # Reset singleton
            import app.services.ai_engine as ai_module

            ai_module._ai_engine = None

            engine1 = get_ai_engine()
            engine2 = get_ai_engine()

            assert engine1 is engine2


class TestAutomationLevel:
    """Tests for AutomationLevel enum"""

    def test_automation_level_values(self):
        """Test automation level enum values"""
        assert AutomationLevel.FULL_AUTONOMOUS.value == "full_autonomous"
        assert AutomationLevel.SEMI_AUTONOMOUS.value == "semi_autonomous"
        assert AutomationLevel.ADVISORY_ONLY.value == "advisory_only"


class TestActionType:
    """Tests for ActionType enum"""

    def test_action_type_values(self):
        """Test action type enum values"""
        assert ActionType.BUDGET_INCREASE.value == "budget_increase"
        assert ActionType.BUDGET_DECREASE.value == "budget_decrease"
        assert ActionType.PAUSE_CAMPAIGN.value == "pause_campaign"
        assert ActionType.RESUME_CAMPAIGN.value == "resume_campaign"
        assert ActionType.REALLOCATE_BUDGET.value == "reallocate_budget"
