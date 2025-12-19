"""
Celery Application Configuration
"""
from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "sentinel_irm",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_routes={
        "app.tasks.parse_scan_result": {"queue": "scan_parsing_queue"},
        "app.tasks.generate_compliance_report": {"queue": "report_generation_queue"},
        "app.tasks.sync_nvd_cves": {"queue": "intelligence_sync_queue"},
        "app.tasks.send_notification": {"queue": "notification_queue"},
    },
)



