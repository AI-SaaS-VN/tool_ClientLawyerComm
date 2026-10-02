-- T10: 'urgent_failed_alert' is the content-free REQ-NTF-05 notice sent to
-- can_review coordinators when a peer_urgent task reaches its final failure.
ALTER TABLE "notification_tasks" DROP CONSTRAINT "notification_tasks_kind_check";
ALTER TABLE "notification_tasks" ADD CONSTRAINT "notification_tasks_kind_check"
    CHECK ("kind" IN ('review_alert', 'peer_urgent', 'check_failed_alert', 'urgent_failed_alert'));
