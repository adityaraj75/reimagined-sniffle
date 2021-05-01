"""facade URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
	https://docs.djangoproject.com/en/3.1/topics/http/urls/
Examples:
Function views
	1. Add an import:  from my_app import views
	2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
	1. Add an import:  from other_app.views import Home
	2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
	1. Import the include() function: from django.urls import include, path
	2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.urls import path
from . import views
from django.conf.urls.static import static
from django.conf import settings

app_name = "main"

urlpatterns = [
	path("home", views.landingpage, name = "landingpage"),
	path("", views.homepage, name = "homepage"),
	path("login", views.login_user, name = "login"),
	path("logout", views.logout_user, name = "logout"),
	path("register", views.register_user, name = "register"),
	path("video_feed", views.video_feed, name = "video_feed"),
	path("emotion-change", views.change_emotion, name = "change-emotion"),
	path("emotion-tracker-status-change", views.change_emotion_tracker_status, name = "emotion-tracker-status-change"),
]+ static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
