# Register all models so Base.metadata knows about them
from app.models.user import User, UserPreference  # noqa
from app.models.scheme import Scheme, Update, CrawlSource  # noqa
from app.models.alert import Alert  # noqa
from app.models.subscription import SchemeSubscription, Notification, PushSubscription  # noqa
