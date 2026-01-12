"""Celery async tasks"""

from celery import Celery

from app.core.config import settings

# Initialize Celery app
celery_app = Celery(
    "mbo_tasks",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
)

# Celery configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,  # 5 minutes max per task
    worker_prefetch_multiplier=1,
    # Beat schedule for periodic tasks
    beat_schedule={
        "sync-campaign-data": {
            "task": "app.tasks.monitoring.sync_all_platforms",
            "schedule": 900.0,  # Every 15 minutes
        },
        "run-ai-analysis": {
            "task": "app.tasks.monitoring.run_ai_analysis",
            "schedule": 900.0,  # Every 15 minutes (after sync)
        },
    },
)

# Import tasks to register them
from . import monitoring  # noqa: E402, F401
