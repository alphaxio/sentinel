"""
Scan Processing Tasks
"""
from app.celery_app import celery_app


@celery_app.task(queue="scan_parsing_queue")
def parse_scan_result(scan_result_id: str):
    """Parse scan result and create findings"""
    # Will be implemented
    pass



