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
from django.contrib import admin
from django.conf.urls.static import static
from django.conf import settings
from django.views.generic.base import TemplateView
from chat.views import index

app_name = "main"

urlpatterns = [
	path('chat', index, name = "chat"),
	path("", views.landingpage, name = "landingpage"),
	path("stream", views.start_stream, name = "stream"),
	path('accounts/login/', views.login_user),
    path('accounts/logout/', views.logout_user),
	path("login", views.login_user, name = "login"),
	path("logout", views.logout_user, name = "logout"),
	path("register", views.register_user, name = "register"),
	path("admin/", admin.site.urls, name = "admin"),
	path("video_feed", views.video_feed, name = "video_feed"),
	path("emotion-change", views.change_emotion, name = "change-emotion"),
	path("emotion-tracker-status-change", views.change_emotion_tracker_status, name = "emotion-tracker-status-change"),
	path("join", views.join_stream, name = "join_stream"),
	path("viewstream", views.send_stream, name = "viewstream"),
]+ static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
